# Interpolation Algorithm Overview

This document explains the interpolation pipeline implemented in
`packages/web-visualization/src/chart/utils/interpolate/interpolatePath.ts`.

The goal is to interpolate SVG path `d` strings for finance charts in a way that:

- preserves visual continuity
- avoids unnecessary warping
- handles line and area transitions (including gaps and closed paths)
- supports "slide window" updates when most points are shifted

## High-Level Flow

`interpolatePath(a, b, options)` does this:

1. Parse both `d` strings into `PathCommand[]` (`pathCommandsFromString`).
2. If there are multiple sub-paths (`M...M...`), split and interpolate each sub-path independently.
3. For each path pair, run `interpolatePathCommands` and return a function `(t) => interpolatedD`.

## Command-Level Pipeline (`interpolatePathCommands`)

For a single path pair, the algorithm runs in this order:

1. **Normalize closure**
   - If both paths end in `Z`, temporarily remove `Z` and remember to add it back.
2. **Handle empty inputs**
   - If one side is empty, seed it with the other side's move command.
3. **Try slide-window interpolation first**
   - Detect if there is a long matched curve prefix that is mostly a translated run.
   - If yes, use a dedicated sliding interpolator.
4. **General alignment path**
   - Align commands by tolerant anchor matching (LCS-based).
   - Extend shorter side by splitting segments until command counts match.
   - Promote specific vertical line bridges to cubic curves for stable area seams.
   - Convert each command type to match the target command type.
   - Interpolate numeric command fields for each `t`.
5. **Serialize**
   - Convert interpolated commands back to a string (`commandToString`).

## Why There Are Two Branches

### 1) Slide Branch (fast path)

Functions:

- `detectSlideWindowAlignment`
- `interpolateSlideWindowCommands`

This branch is for data-window shifts (for example, drop first point, append new point).

Detection checks:

- command lists are same length
- both start with `M`
- there is a leading run of `C` commands
- interior curve segments are equivalent up to a consistent x-shift within tolerance

Key output:

- `xShift`
- `matchedCurvePrefixCommandCount`

Then interpolation:

- split the leading edge curve from A at `t`
- split the trailing edge curve from B at `t`
- shift those edge pieces in x
- keep the interior matched run aligned
- interpolate any remaining commands after the matched prefix normally

This gives the expected "cut off one side, reveal the other side" slide behavior for both lines and closed areas.

### 2) General Alignment Branch (fallback)

Used when slide detection does not apply.

It performs robust shape matching and extension:

- tolerant anchor matching (`commandsMatchAsAnchors`)
- longest-common-subsequence over commands (`findMatchingCommandPairs`)
- stable-run filtering (`filterStableMatchRuns`)
- slice-by-slice alignment (`alignCommandsByMatches`)
- segment extension (`extend`) with target-aware splitting (`splitCurveToTargetXs`)

The extension logic tries to preserve shape by:

- mapping reference segments into source segment x-ranges when possible
- otherwise distributing splits by segment magnitude
- falling back to ratio-based splitting

## Curve Splitting Details (`split.ts`)

Core splitting uses de Casteljau:

- `splitCurve` for count-based splitting
- `splitCurveAtT` for edge-piece extraction in slide interpolation
- `splitCurveToTargetXs` to align newly inserted points to target x positions

Special handling:

- collinear cubic segments use adaptive dyadic split points for stable numeric behavior

## Area-Specific Seam Stabilization

Two helpers reduce seam artifacts in closed or dense area paths:

- `promoteSharedLineBridgesToCurves`
- `promoteDenseClosingBridgesToCurves`

They convert certain vertical `L` seam bridges into equivalent cubic `C` commands so line/area interpolation remains smooth and type-compatible.

## Tolerances and Constants

Important constants:

- `MATCH_TOLERANCE`
- `SLIDE_MATCH_TOLERANCE`
- `DENSE_VERTICAL_BRIDGE_X_THRESHOLD`

These control numeric matching, slide detection robustness, and seam promotion sensitivity.

## Practical Debug Order

If an interpolation looks wrong:

1. Check if slide detection should/should not trigger.
2. Inspect matched command pairs and stable runs.
3. Inspect extension split decisions (x-range mapping vs magnitude distribution).
4. Check seam promotion behavior for closed/area paths.
5. Verify command-type conversion before numeric interpolation.

## Source of Truth

Behavior is validated by:

- `packages/web-visualization/src/chart/utils/__tests__/interpolate.test.ts`

When updating algorithm behavior, update or add targeted test scenarios first.
