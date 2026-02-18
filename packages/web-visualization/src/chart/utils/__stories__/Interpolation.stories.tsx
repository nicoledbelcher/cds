import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { interpolatePath, pathCommandsFromString } from '../interpolate';

type InterpolationScenario = {
  id: string;
  label: string;
  description: string;
  start: string;
  end: string;
};

const interpolationScenarios: InterpolationScenario[] = [
  {
    id: 'line-slide-window',
    label: 'Line: Slide Window',
    description: 'Most of the curve matches and should slide left/right instead of warping.',
    start: 'M0,10C10,10,10,20,20,20C30,20,30,30,40,30C50,30,50,20,60,20',
    end: 'M0,20C10,20,10,30,20,30C30,30,30,20,40,20C50,20,50,40,60,40',
  },
  {
    id: 'area-slide-window',
    label: 'Area: Slide Window',
    description: 'Closed area with a matching top-edge run that should slide smoothly.',
    start:
      'M0,10C10,10,10,20,20,20C30,20,30,30,40,30C50,30,50,20,60,20L60,100C60,100,60,100,40,100C40,100,40,100,20,100C20,100,20,100,0,100Z',
    end: 'M0,20C10,20,10,30,20,30C30,30,30,20,40,20C50,20,50,40,60,40L60,100C60,100,60,100,40,100C40,100,40,100,20,100C20,100,20,100,0,100Z',
  },
  {
    id: 'line-extension',
    label: 'Line: End Extension',
    description: 'Adds a new point at the end while preserving the existing run.',
    start: 'M0,30C10,30,10,20,20,20C30,20,30,35,40,35',
    end: 'M0,30C10,30,10,20,20,20C30,20,30,35,40,35C50,35,50,15,60,15',
  },
];

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type ViewBox = {
  minX: number;
  minY: number;
  width: number;
  height: number;
};

type DisplayMode = 'start' | 'interpolated' | 'end';

const defaultBounds: Bounds = { minX: 0, minY: 0, maxX: 100, maxY: 100 };
const viewBoxPadding = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getPathBounds(path: string): Bounds | null {
  const commands = pathCommandsFromString(path);
  if (commands.length === 0) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  const update = (x: unknown, y: unknown) => {
    if (typeof x !== 'number' || typeof y !== 'number' || Number.isNaN(x) || Number.isNaN(y)) {
      return;
    }
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };

  commands.forEach((command) => {
    update(command.x, command.y);
    update(command.x1, command.y1);
    update(command.x2, command.y2);
  });

  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(maxY)
  ) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function getViewBox(paths: string[]): ViewBox {
  const bounds = paths
    .map((path) => getPathBounds(path))
    .filter((bound): bound is Bounds => bound != null);

  if (bounds.length === 0) {
    const defaultWidth = defaultBounds.maxX - defaultBounds.minX;
    const defaultHeight = defaultBounds.maxY - defaultBounds.minY;
    return {
      minX: defaultBounds.minX - viewBoxPadding,
      minY: defaultBounds.minY - viewBoxPadding,
      width: defaultWidth + viewBoxPadding * 2,
      height: defaultHeight + viewBoxPadding * 2,
    };
  }

  const minX = Math.min(...bounds.map((bound) => bound.minX));
  const minY = Math.min(...bounds.map((bound) => bound.minY));
  const maxX = Math.max(...bounds.map((bound) => bound.maxX));
  const maxY = Math.max(...bounds.map((bound) => bound.maxY));

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  return {
    minX: minX - viewBoxPadding,
    minY: minY - viewBoxPadding,
    width: width + viewBoxPadding * 2,
    height: height + viewBoxPadding * 2,
  };
}

function modeButtonStyle(isActive: boolean) {
  return {
    border: `1px solid ${isActive ? '#1d4ed8' : '#d4d4d8'}`,
    borderRadius: 6,
    background: isActive ? '#dbeafe' : '#ffffff',
    color: '#111827',
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: 13,
  };
}

export default {
  title: 'Components/Chart/Utils/Interpolation',
};

export const Playground = () => {
  const [scenarioId, setScenarioId] = useState(interpolationScenarios[0].id);
  const selectedScenario = useMemo(
    () =>
      interpolationScenarios.find((scenario) => scenario.id === scenarioId) ??
      interpolationScenarios[0],
    [scenarioId],
  );

  const [startPath, setStartPath] = useState(selectedScenario.start);
  const [endPath, setEndPath] = useState(selectedScenario.end);
  const [progress, setProgress] = useState(0);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('interpolated');
  const [showStartOverlay, setShowStartOverlay] = useState(true);
  const [showEndOverlay, setShowEndOverlay] = useState(true);

  const pointerDraggingRef = useRef(false);

  useEffect(() => {
    setStartPath(selectedScenario.start);
    setEndPath(selectedScenario.end);
    setProgress(0);
    setDisplayMode('interpolated');
  }, [selectedScenario]);

  const interpolationResult = useMemo(() => {
    try {
      return {
        interpolator: interpolatePath(startPath, endPath, { snapEndsToInput: false }),
        error: null as string | null,
      };
    } catch (error) {
      return {
        interpolator: null as ((t: number) => string) | null,
        error: error instanceof Error ? error.message : 'Failed to build interpolator',
      };
    }
  }, [startPath, endPath]);

  const interpolatedPath = useMemo(() => {
    if (interpolationResult.interpolator == null) {
      return startPath;
    }
    return interpolationResult.interpolator(progress);
  }, [interpolationResult, progress, startPath]);

  const displayedPath =
    displayMode === 'start' ? startPath : displayMode === 'end' ? endPath : interpolatedPath;

  const viewBox = useMemo(
    () => getViewBox([startPath, endPath, displayedPath]),
    [startPath, endPath, displayedPath],
  );
  const viewBoxValue = `${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`;
  const scrubberX = viewBox.minX + viewBox.width * progress;

  const isDisplayedClosed = /z\s*$/i.test(displayedPath);
  const isStartClosed = /z\s*$/i.test(startPath);
  const isEndClosed = /z\s*$/i.test(endPath);

  const updateProgressFromPointer = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    setProgress(ratio);
    setDisplayMode('interpolated');
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      pointerDraggingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      updateProgressFromPointer(event);
    },
    [updateProgressFromPointer],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (!pointerDraggingRef.current) {
        return;
      }
      updateProgressFromPointer(event);
    },
    [updateProgressFromPointer],
  );

  const handlePointerUp = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    pointerDraggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const handlePointerCancel = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    pointerDraggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20, maxWidth: 1200 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 12,
          borderRadius: 8,
          border: '1px solid #e4e4e7',
          background: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label htmlFor="interpolation-scenario" style={{ fontWeight: 600 }}>
            Scenario
          </label>
          <select
            id="interpolation-scenario"
            onChange={(event) => setScenarioId(event.target.value)}
            style={{ minWidth: 240, padding: '6px 8px' }}
            value={scenarioId}
          >
            {interpolationScenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.label}
              </option>
            ))}
          </select>
          <span style={{ color: '#52525b', fontSize: 13 }}>{selectedScenario.description}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600 }}>Display</span>
          <button
            onClick={() => setDisplayMode('start')}
            style={modeButtonStyle(displayMode === 'start')}
            type="button"
          >
            Start
          </button>
          <button
            onClick={() => setDisplayMode('interpolated')}
            style={modeButtonStyle(displayMode === 'interpolated')}
            type="button"
          >
            Interpolated
          </button>
          <button
            onClick={() => setDisplayMode('end')}
            style={modeButtonStyle(displayMode === 'end')}
            type="button"
          >
            End
          </button>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              checked={showStartOverlay}
              onChange={(event) => setShowStartOverlay(event.target.checked)}
              type="checkbox"
            />
            Show start overlay
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              checked={showEndOverlay}
              onChange={(event) => setShowEndOverlay(event.target.checked)}
              type="checkbox"
            />
            Show end overlay
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label htmlFor="interpolation-progress" style={{ fontWeight: 600 }}>
            Progress t
          </label>
          <input
            id="interpolation-progress"
            max={1}
            min={0}
            onChange={(event) => {
              setProgress(Number(event.target.value));
              setDisplayMode('interpolated');
            }}
            step={0.001}
            style={{ width: 320 }}
            type="range"
            value={progress}
          />
          <span style={{ minWidth: 52, fontFamily: 'monospace' }}>{progress.toFixed(3)}</span>
          <span style={{ color: '#52525b', fontSize: 13 }}>
            Tip: drag directly on the SVG preview to scrub.
          </span>
        </div>

        {interpolationResult.error != null && (
          <div style={{ color: '#991b1b', background: '#fee2e2', padding: 8, borderRadius: 6 }}>
            {interpolationResult.error}
          </div>
        )}
      </div>

      <div
        style={{
          border: '1px solid #d4d4d8',
          borderRadius: 8,
          background: '#ffffff',
          padding: 8,
        }}
      >
        <svg
          onPointerCancel={handlePointerCancel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            width: '100%',
            height: 340,
            display: 'block',
            cursor: 'ew-resize',
            touchAction: 'none',
          }}
          viewBox={viewBoxValue}
        >
          <rect
            fill="#fafafa"
            height={viewBox.height}
            width={viewBox.width}
            x={viewBox.minX}
            y={viewBox.minY}
          />

          {showStartOverlay && (
            <path
              d={startPath}
              fill={isStartClosed ? 'rgba(34,197,94,0.08)' : 'none'}
              stroke="#22c55e"
              strokeDasharray="6 4"
              strokeWidth={1}
            />
          )}

          {showEndOverlay && (
            <path
              d={endPath}
              fill={isEndClosed ? 'rgba(239,68,68,0.08)' : 'none'}
              stroke="#ef4444"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          )}

          {displayMode === 'interpolated' && (
            <line
              stroke="#64748b"
              strokeDasharray="4 6"
              strokeWidth={1}
              x1={scrubberX}
              x2={scrubberX}
              y1={viewBox.minY}
              y2={viewBox.minY + viewBox.height}
            />
          )}

          <path
            d={displayedPath}
            fill={isDisplayedClosed ? 'rgba(37,99,235,0.15)' : 'none'}
            stroke="#2563eb"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
          />
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#374151' }}>
        <span>
          <strong style={{ color: '#22c55e' }}>Start</strong> (green dashed)
        </span>
        <span>
          <strong style={{ color: '#ef4444' }}>End</strong> (red dashed)
        </span>
        <span>
          <strong style={{ color: '#2563eb' }}>Current</strong> (blue)
        </span>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
          Start path (editable)
          <textarea
            onChange={(event) => setStartPath(event.target.value)}
            rows={4}
            style={{
              fontFamily: 'monospace',
              fontSize: 12,
              padding: 8,
              border: '1px solid #d4d4d8',
            }}
            value={startPath}
          />
        </label>
        <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
          End path (editable)
          <textarea
            onChange={(event) => setEndPath(event.target.value)}
            rows={4}
            style={{
              fontFamily: 'monospace',
              fontSize: 12,
              padding: 8,
              border: '1px solid #d4d4d8',
            }}
            value={endPath}
          />
        </label>
      </div>
    </div>
  );
};
