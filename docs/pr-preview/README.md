# PR Preview Deployment System

Complete guide for the automated PR preview deployment system that builds and deploys documentation and Storybook for pull requests.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Problem & Solution](#problem--solution)
4. [How It Works](#how-it-works)
5. [Setup Guide](#setup-guide)
6. [Testing](#testing)
7. [Architecture](#architecture)
8. [Customization](#customization)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This system automatically builds and deploys live previews of documentation and Storybook for every pull request that requests them. Previews are deployed to GitHub Pages with a unified selector interface.

**URLs:**

- **Selector:** `https://coinbase.github.io/cds/`
- **Docs Preview:** `https://coinbase.github.io/cds/pr-{number}/docs/`
- **Storybook Preview:** `https://coinbase.github.io/cds/pr-{number}/storybook/`

**Features:**

- ✅ Automatic deployment for every PR
- ✅ Separate docs and Storybook previews
- ✅ Automatic cleanup on PR close
- ✅ Unified selector interface
- ✅ Search and filter functionality
- ✅ Fully automated workflows
- ✅ Zero maintenance required

---

## Quick Start

### For PR Authors

1. Open a PR as usual
2. Wait ~3-5 minutes for previews to deploy
3. Check PR comments for preview links (docs + storybook)
4. Click links to view your changes
5. Previews automatically update on new commits
6. Previews are automatically removed when PR closes

**Fully automatic:** Both docs and storybook previews deploy for every PR.

### For Maintainers

**One-time setup (30-60 minutes):**

1. Enable GitHub Pages (Settings → Pages → gh-pages branch)
2. Create gh-pages branch if needed
3. Test locally: `yarn preview:build-test && yarn preview:serve-test`
4. Test workflows manually via Actions tab
5. Create a test PR to verify end-to-end

See [Setup Guide](#setup-guide) for detailed instructions.

---

## Problem & Solution

### The Problem

**Current pain points:**

- Reviewers must pull branches locally to see documentation changes
- Can't easily share preview links with stakeholders
- Documentation issues only discovered after merge
- Broken links, images, or layout problems reach production
- Slow feedback loop for visual changes

### The Solution

**Automated PR preview deployments** with:

- Live previews for every PR (automatic)
- Separate docs and Storybook previews
- Unified selector interface
- Automatic deployment and cleanup
- Zero manual work for developers

**Benefits:**

- ✅ Visual review before merge
- ✅ Catch issues early
- ✅ Easy sharing with stakeholders
- ✅ Faster iteration cycles
- ✅ Better quality control
- ✅ Fully automated

---

## How It Works

### Workflow

```
PR Opened/Updated
    ↓
GitHub Actions triggered
    ↓
Builds docs and storybook
    ↓
Deploys to gh-pages/pr-{number}/docs/ or /storybook/
    ↓
Updates manifest.json
    ↓
Posts PR comment with links
    ↓
PR Closed
    ↓
Automatic cleanup removes preview
```

### Directory Structure on gh-pages

```
gh-pages branch:
├── index.html              # Selector page
├── assets/                 # Selector assets
├── manifest.json           # PR metadata
├── pr-123/
│   ├── docs/              # Documentation preview
│   └── storybook/         # Storybook preview
├── pr-456/
│   └── docs/              # Docs only
└── pr-789/
    └── storybook/         # Storybook only
```

### Manifest Format

```json
{
  "previews": [
    {
      "pr": 123,
      "title": "Add Button component",
      "branch": "feature/button",
      "author": "octocat",
      "baseUrl": "/cds/pr-123/",
      "previews": {
        "docs": "/cds/pr-123/docs/",
        "storybook": "/cds/pr-123/storybook/"
      },
      "createdAt": "2026-02-12T10:00:00Z",
      "updatedAt": "2026-02-12T15:30:00Z",
      "commit": "abc1234"
    }
  ],
  "lastUpdated": "2026-02-12T15:30:00Z"
}
```

---

## Setup Guide

### Prerequisites

- Repository with GitHub Actions enabled
- Access to repository settings
- Node.js installed locally (for testing)

### Phase 1: Enable GitHub Pages

1. Go to repository Settings → Pages
2. Set source to "Deploy from a branch"
3. Select `gh-pages` branch
4. Click Save
5. Note the URL (e.g., `https://coinbase.github.io/cds/`)

**If gh-pages branch doesn't exist:**

```bash
git checkout --orphan gh-pages
git rm -rf .
echo "# CDS Preview Deployments" > README.md
git add README.md
git commit -m "Initial gh-pages branch"
git push origin gh-pages
git checkout master
```

### Phase 2: Local Testing

Test the system locally before deploying:

```bash
# Build docs with test baseUrl
yarn preview:build-test

# Serve the production build
yarn preview:serve-test

# Visit: http://localhost:8000/pr-test-123/
```

**Verify:**

- ✅ Homepage loads
- ✅ Component card images display
- ✅ Navigation works with baseUrl prefix
- ✅ All links include `/pr-test-123/`
- ✅ No console errors

**Test selector:**

```bash
# Build and test selector with mock data
yarn preview:selector:test

# Visit: http://localhost:8000/cds/
```

### Phase 3: Test Workflows Manually

1. **Test Deploy Workflow:**
   - Go to Actions tab
   - Select "Deploy PR Preview"
   - Click "Run workflow"
   - Enter test PR number (e.g., 9999)
   - Wait for completion
   - Visit `https://coinbase.github.io/cds/` to see it listed
   - Visit `https://coinbase.github.io/cds/pr-9999/docs/` to see preview

2. **Test Cleanup Workflow:**
   - Go to Actions tab
   - Select "Manual Preview Cleanup"
   - Enter test PR number (9999)
   - Run workflow
   - Verify PR is removed from selector

### Phase 4: Test with Real PR

1. Create test branch:

   ```bash
   git checkout -b test-preview-deployment
   echo "# Test" >> apps/docs/docs/test.md
   git add apps/docs/docs/test.md
   git commit -m "Test: Preview deployment"
   git push origin test-preview-deployment
   ```

2. Open PR on GitHub
3. Open PR on GitHub
4. Wait for workflow to run (~3-5 minutes)
5. Verify bot comment with preview links
6. Click links and test both previews
7. Close PR and verify cleanup works

8. Clean up:
   ```bash
   git checkout master
   git branch -D test-preview-deployment
   git push origin --delete test-preview-deployment
   ```

### Phase 5: Go Live

Once testing is complete:

- ✅ System automatically handles all new PRs
- ✅ Monitor first few deployments
- ✅ Gather team feedback
- ✅ Adjust as needed

---

## Testing

### Local Testing Scripts

```bash
# Test docs build with custom baseUrl
yarn preview:build-test

# Serve production build
yarn preview:serve-test
# Visit: http://localhost:8000/pr-test-123/

# Test selector with mock data
yarn preview:selector:test
# Visit: http://localhost:8000/cds/

# Develop selector with hot reload
yarn preview:selector:dev
# Visit: http://localhost:5173
```

### Edge Cases to Test

- **Concurrent PRs** - Multiple PRs deploying simultaneously
- **Rapid updates** - Multiple commits pushed quickly
- **Special characters** - PR titles with quotes, HTML, emoji
- **Large builds** - Full documentation build

### Common Issues

**Images not loading:**

- Use `useBaseUrl` hook for absolute paths
- See `apps/docs/docs/home/Home.tsx` for example

**Permission denied:**

- Go to Settings → Actions → General
- Enable "Read and write permissions"

**Preview not deploying:**

- Check workflow logs in Actions tab for errors
- Try manual trigger

**Manifest corrupted:**

```bash
cd gh-pages
echo '{"previews":[],"lastUpdated":"'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"}' > manifest.json
git add manifest.json
git commit -m "Reset manifest"
git push origin gh-pages
```

---

## Architecture

### Components

**1. GitHub Actions Workflows**

- **`preview-deploy.yml`** - Deploys previews
  - Triggers: PR opened, synchronized, reopened
  - Builds docs and storybook
  - Deploys to gh-pages
  - Updates manifest
  - Posts PR comment

- **`preview-cleanup.yml`** - Cleans up previews
  - Triggers: PR closed
  - Removes preview directories
  - Updates manifest
  - Posts cleanup comment

- **`preview-manual-cleanup.yml`** - Manual cleanup
  - Triggers: Manual workflow dispatch
  - For maintenance and troubleshooting

**2. Selector App** (`apps/preview-selector`)

React + TypeScript app deployed to gh-pages root:

- Fetches manifest.json
- Displays all active previews
- Search and filter functionality
- Separate buttons for docs and storybook
- Responsive design

**3. Helper Scripts** (`.github/scripts/`)

- `update-manifest.mjs` - Adds/updates PR in manifest
- `remove-from-manifest.mjs` - Removes PR from manifest
- `test-selector-locally.mjs` - Local testing helper

**4. Configuration**

- `apps/docs/docusaurus.config.ts` - Supports `BASE_URL` environment variable
- `apps/docs/docs/home/Home.tsx` - Uses `useBaseUrl` for images
- `.github/pull_request_template.md` - PR template

### Build Configuration

Docs build with custom baseUrl:

```typescript
// apps/docs/docusaurus.config.ts
export default {
  baseUrl: process.env.BASE_URL || '/',
  // ...
};
```

Workflow sets BASE_URL:

```bash
BASE_URL=/cds/pr-123/docs/ yarn nx run docs:build
```

**Important:** All absolute image paths must use `useBaseUrl`:

```typescript
import useBaseUrl from '@docusaurus/useBaseUrl';

const baseUrl = useBaseUrl('/');
<img src={`${baseUrl}img/logo.svg`} />
```

### Security

- Minimal permissions: `contents: write`, `pull-requests: write`
- XSS prevention in selector UI (escapes HTML)
- No custom secrets required (uses `GITHUB_TOKEN`)
- Hardened runner for GitHub Actions

---

## Customization

### Change Repository Name

If deploying to a different repository, update:

**1. Workflows** (`.github/workflows/preview-deploy.yml`):

```yaml
BASE_URL=/your-repo/pr-${PR_NUMBER}/docs/
```

**2. Selector** (`apps/preview-selector/vite.config.ts`):

```typescript
base: '/your-repo/',
```

**3. Selector** (`apps/preview-selector/src/App.tsx`):

```typescript
fetch('/your-repo/manifest.json');
```

**4. Manifest Script** (`.github/scripts/update-manifest.mjs`):

```javascript
baseUrl: `/your-repo/pr-${prNum}/`,
```

### Customize Selector Styling

**Colors and theme** (`apps/preview-selector/src/index.css`):

```css
:root {
  --bg-primary: #0a0f1e;
  --accent: #0052ff;
  /* Customize colors here */
}
```

**Component styles** (`apps/preview-selector/src/App.css`):
Edit component-specific styles.

**Develop with hot reload:**

```bash
yarn preview:selector:dev
```

### Add Features

Since the selector is a React app, you can easily add:

- Additional metadata display
- Preview screenshots
- Side-by-side PR comparison
- Filtering by author or date range
- Keyboard shortcuts
- Dark/light mode toggle
- History tracking

---

## Troubleshooting

### Preview Not Deploying

**Checklist:**

1. ✅ Check Actions tab for workflow status
2. ✅ Verify workflow completed successfully
3. ✅ Check for errors in workflow logs
4. ✅ Look for workflow errors in logs

**Manual trigger:**

- Actions → "Deploy PR Preview" → "Run workflow"

### Images Not Loading

**Cause:** Hardcoded absolute paths like `/img/...`

**Solution:** Use `useBaseUrl` hook:

```typescript
import useBaseUrl from '@docusaurus/useBaseUrl';

export default function MyComponent() {
  const baseUrl = useBaseUrl('/');
  return <img src={`${baseUrl}img/my-image.svg`} />;
}
```

**Example:** See `apps/docs/docs/home/Home.tsx`

### Preview Not Showing in Selector

**Checklist:**

1. Wait 2-3 minutes for GitHub Pages to rebuild
2. Clear browser cache (Ctrl+Shift+R)
3. Check gh-pages branch has the files
4. Verify manifest.json includes the PR

### Workflow Permission Error

**Fix:**

- Go to Settings → Actions → General
- Enable "Read and write permissions" for workflows

### Manifest Corrupted

**Reset manifest:**

```bash
git checkout gh-pages
git pull origin gh-pages
echo '{"previews":[],"lastUpdated":"'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"}' > manifest.json
git add manifest.json
git commit -m "Reset manifest"
git push origin gh-pages
```

### Clean Up All Previews

```bash
git checkout gh-pages
git pull origin gh-pages
rm -rf pr-*
echo '{"previews":[],"lastUpdated":"'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"}' > manifest.json
git add .
git commit -m "Clean up all previews"
git push origin gh-pages
```

### Build Failures

**Check:**

- Node version matches `.nvmrc`
- Dependencies are installed: `yarn install`
- No TypeScript errors: `yarn nx run preview-selector:typecheck`
- Docusaurus config is valid

**Debug:**

- Run build locally: `yarn preview:build-test`
- Check workflow logs for specific errors
- Verify `BASE_URL` is set correctly

---

## File Structure

```
.github/
├── pull_request_template.md     # PR template
├── workflows/
│   ├── preview-deploy.yml       # Auto-deploy on PR
│   ├── preview-cleanup.yml      # Auto-cleanup on close
│   └── preview-manual-cleanup.yml  # Manual cleanup
└── scripts/
    ├── update-manifest.mjs      # Update manifest
    ├── remove-from-manifest.mjs # Remove from manifest
    └── test-selector-locally.mjs # Local testing

apps/
├── preview-selector/            # React selector app
│   ├── src/
│   │   ├── App.tsx             # Main component
│   │   ├── App.css             # Styles
│   │   ├── main.tsx            # Entry point
│   │   ├── types.ts            # TypeScript types
│   │   ├── utils.ts            # Helper functions
│   │   └── vite-env.d.ts       # Vite types
│   ├── vite.config.ts          # Vite config
│   ├── project.json            # Nx config
│   └── package.json            # Dependencies
└── docs/
    ├── docusaurus.config.ts    # BASE_URL support
    └── docs/home/Home.tsx      # useBaseUrl for images

docs/preview/
└── README.md                    # This file
```

---

## Scripts Reference

```bash
# Docs testing
yarn preview:build-test          # Build docs with test baseUrl
yarn preview:serve-test          # Serve production build locally

# Selector development
yarn preview:selector:dev        # Dev server with hot reload
yarn preview:selector:build      # Build for production
yarn preview:selector:test       # Test locally with mock data

# Nx commands
yarn nx run preview-selector:dev        # Dev server
yarn nx run preview-selector:build      # Build
yarn nx run preview-selector:typecheck  # Type check
yarn nx run preview-selector:test-local # Local test
```

---

## Technical Details

### Technology Stack

- **Hosting:** GitHub Pages (free)
- **Build Tool:** Nx + Vite
- **Selector:** React 18 + TypeScript
- **Documentation:** Docusaurus
- **CI/CD:** GitHub Actions

### Performance

- **Deployment time:** ~3-5 minutes (docs + storybook)
- **Cleanup time:** ~30 seconds
- **Selector load:** ~49KB gzipped
- **Bundle size:** Optimized with Vite

### Storage

- Each docs preview: ~5-10 MB
- Each storybook preview: ~10-20 MB
- Selector app: ~150 KB
- Automatic cleanup prevents bloat

### Cost

- **GitHub Pages:** Free for public repos
- **GitHub Actions:** Free minutes for public repos
- **Storage:** Generous limits (1GB+)
- **Bandwidth:** Unlimited for public repos

**Total cost: $0** 🎉

---

## Success Metrics

Track these to ensure system health:

- **Deployment time:** < 5 minutes (target)
- **Cleanup time:** < 1 minute (target)
- **Success rate:** > 95% (target)
- **Developer satisfaction:** Positive feedback
- **Storage usage:** Monitor gh-pages branch size

---

## Future Enhancements

Possible improvements:

- **Conditional deployment** - Only deploy if docs/storybook files changed
- **Preview screenshots** - Show thumbnail previews in selector
- **Comparison view** - Side-by-side diff between PRs
- **History tracking** - Keep deployment history
- **Analytics** - Track preview usage
- **Branch previews** - Deploy non-PR branches
- **Access control** - Private previews with authentication
- **Stale cleanup** - Auto-remove previews after N days
- **Notification** - Slack/Discord notifications
- **API endpoint** - Programmatic preview management

---

## Support

**Need help?**

1. Check this documentation
2. Review workflow logs in Actions tab
3. Try manual workflow triggers
4. Test locally first
5. Open an issue if problems persist

**Quick links:**

- [GitHub Actions workflows](../../.github/workflows/)
- [Selector app source](../../apps/preview-selector/)
- [Helper scripts](../../.github/scripts/)

---

## Summary

### What's Included

- ✅ 3 GitHub Actions workflows
- ✅ React selector app (Nx-integrated)
- ✅ 3 helper scripts
- ✅ PR template
- ✅ Complete documentation (this file)
- ✅ Local testing tools

### What Happens Automatically

- ✅ Build and deploy on PR open/update (if checked)
- ✅ Update manifest with PR metadata
- ✅ Post preview links in PR comments
- ✅ Clean up on PR close
- ✅ Remove from manifest

### What PR Authors Do

- ✅ Open a PR
- ✅ That's it! (Previews deploy automatically)

### Estimated Times

- **Setup:** 30-60 minutes (one-time)
- **Deployment:** 3-5 minutes per PR
- **Maintenance:** ~30 minutes/month

**Status:** ✅ Implementation complete, ready for production

---

**Questions?** Open an issue in the repository or check the workflow logs in the Actions tab.
