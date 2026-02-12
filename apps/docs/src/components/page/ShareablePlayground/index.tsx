import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SandpackCodeEditor, SandpackProvider, useSandpack } from '@codesandbox/sandpack-react';
import { LiveError, LivePreview } from 'react-live';
import { IconButton } from '@coinbase/cds-web/buttons/IconButton';
import { Box } from '@coinbase/cds-web/layout';
import { HStack } from '@coinbase/cds-web/layout/HStack';
import { VStack } from '@coinbase/cds-web/layout/VStack';
import { useToast } from '@coinbase/cds-web/overlays/useToast';
import { Pressable } from '@coinbase/cds-web/system';
import { ThemeProvider } from '@coinbase/cds-web/system/ThemeProvider';
import { Icon } from '@coinbase/cds-web/icons/Icon';
import { Text } from '@coinbase/cds-web/typography/Text';
import BrowserOnly from '@docusaurus/BrowserOnly';
import ErrorBoundary from '@docusaurus/ErrorBoundary';
import { ErrorBoundaryErrorMessageFallback } from '@docusaurus/theme-common';
import debounce from 'lodash/debounce';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import * as estreePlugin from 'prettier/plugins/estree.js';
import * as typescriptPlugin from 'prettier/plugins/typescript.js';
import { format } from 'prettier/standalone';

import { usePlaygroundTheme } from '../../../theme/Layout/Provider/UnifiedThemeContext';
import { useOpenInCodeSandbox } from '../../../theme/Playground/CodeSandboxExport';
import { ToolbarIconButton } from '../../../theme/Playground';
import { SandpackBridge } from '../../../theme/Playground/SandpackBridge';

import styles from './styles.module.css';

const renderErrorFallback = (params: any) => <ErrorBoundaryErrorMessageFallback {...params} />;

const previewContent = () => (
  <>
    <ErrorBoundary fallback={renderErrorFallback}>
      <LivePreview />
    </ErrorBoundary>
    <LiveError />
  </>
);

const getSharedCode = () => {
  if (typeof window === 'undefined') return;
  const urlParams = new URLSearchParams(window.location.search);
  const sharedCode = urlParams.get('code');
  if (sharedCode) return decompressFromEncodedURIComponent(sharedCode);
};

const defaultCodeExample = `// Create your own example components and hooks, then call render() to render them

const Example = () => {
  return (
    <Text>Place your example code here</Text>
  );
};

// You must call render() to render your code
render(<Example />);
`;

const prettierOptions = {
  parser: 'typescript',
  plugins: [estreePlugin, typescriptPlugin] as any,
  arrowParens: 'always',
  bracketSameLine: false,
  jsxSingleQuote: false,
  printWidth: 100,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
} as const;

const PlaygroundEditorHeader = memo(function PlaygroundEditorHeader() {
  return (
    <Box borderedBottom paddingBottom={0.5} paddingTop={0.75} paddingX={1} width="100%">
      <Text alignItems="center" color="fgMuted" display="flex" font="label1" userSelect="none">
        <Icon active color="fgMuted" name="pencil" paddingEnd={0.5} size="xs" /> Live Code
      </Text>
    </Box>
  );
});

/** Controls: handles URL sync and Prettier formatting inside SandpackProvider. */
const ShareablePlaygroundInner = memo(function ShareablePlaygroundInner({
  defaultInitialCode,
}: {
  defaultInitialCode: string;
}) {
  const toast = useToast();
  const { sandpack } = useSandpack();
  const codeRef = useRef(defaultInitialCode);
  const handleOpenInCodeSandbox = useOpenInCodeSandbox(false);

  // Sync code changes to URL
  const handleUrlUpdate = useMemo(
    () =>
      debounce((code: string) => {
        const compressedCode = compressToEncodedURIComponent(code);
        const url = new URL(window.location.href);
        url.searchParams.set('code', compressedCode);
        window.history.replaceState({}, '', url.toString());
      }, 500),
    [],
  );

  // Watch for Sandpack code changes and sync to URL
  useEffect(() => {
    const code = sandpack.files[sandpack.activeFile]?.code ?? '';
    if (code !== codeRef.current) {
      codeRef.current = code;
      handleUrlUpdate(code);
    }
  }, [sandpack.files, sandpack.activeFile, handleUrlUpdate]);

  // Prettier formatting (Cmd/Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyS' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        const activeFile = sandpack.activeFile;
        const code = sandpack.files[activeFile]?.code ?? '';
        format(code, prettierOptions).then((formatted) => {
          sandpack.updateFile(activeFile, formatted);
        });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sandpack]);

  const handleCopyToClipboard = useCallback(() => {
    const code = sandpack.files[sandpack.activeFile]?.code ?? '';
    navigator.clipboard
      .writeText(code)
      .then(() => toast.show('Copied to clipboard'))
      .catch(() => toast.show('Failed to copy to clipboard'));
  }, [sandpack, toast]);

  const handleShareCode = useCallback(() => {
    try {
      const code = sandpack.files[sandpack.activeFile]?.code ?? '';
      const compressedCode = compressToEncodedURIComponent(code);
      const url = new URL(window.location.href);
      if (code !== defaultInitialCode) url.searchParams.set('code', compressedCode);

      navigator.clipboard
        .writeText(url.toString())
        .then(() => toast.show('Share link copied to clipboard'));
    } catch {
      toast.show('Failed to copy share link');
    }
  }, [sandpack, defaultInitialCode, toast]);

  return (
    <>
      {/* Preview */}
      <SandpackBridge noInline>
        <VStack background="bg" borderRadius={400} color="fg" font="body" padding={3}>
          <BrowserOnly fallback={<div>Loading...</div>}>{previewContent}</BrowserOnly>
        </VStack>
      </SandpackBridge>

      {/* Editor (always expanded for shareable playground) */}
      <VStack paddingBottom={0.5} paddingTop={1}>
        <VStack background="bg" borderRadius={400} overflow="hidden" width="100%">
          <PlaygroundEditorHeader />
          <SandpackCodeEditor
            className={styles.sandpackEditor}
            showLineNumbers={false}
            showTabs={false}
            wrapContent={false}
          />
        </VStack>
      </VStack>

      {/* Controls */}
      <HStack alignItems="center" gap={2} paddingTop={0.5}>
        <Pressable noScaleOnPress accessibilityLabel="Copy code" onClick={handleCopyToClipboard}>
          <HStack alignItems="center">
            <Icon name="copy" paddingEnd={0.5} size="xs" />
            <Text color="fgPrimary" font="label1">
              Copy code
            </Text>
          </HStack>
        </Pressable>
        <Pressable noScaleOnPress accessibilityLabel="Share code" onClick={handleShareCode}>
          <HStack alignItems="center">
            <Icon name="share" paddingEnd={0.5} size="xs" />
            <Text color="fgPrimary" font="label1">
              Share code
            </Text>
          </HStack>
        </Pressable>
        <ToolbarIconButton
          accessibilityLabel="Open in CodeSandbox"
          name="pencil"
          onClick={handleOpenInCodeSandbox}
        />
      </HStack>
    </>
  );
});

type ShareablePlaygroundProps = {
  /** The default initial code to display in the playground if no code was provided via the URL. */
  defaultInitialCode?: string;
};

export const ShareablePlayground = memo(function ShareablePlayground({
  defaultInitialCode: defaultInitialCodeProp = defaultCodeExample,
}: ShareablePlaygroundProps): JSX.Element {
  const defaultInitialCode = useMemo(
    () => defaultInitialCodeProp.replace(/\n$/, ''),
    [defaultInitialCodeProp],
  );
  const initialCode = useMemo(() => getSharedCode() ?? defaultInitialCode, [defaultInitialCode]);
  const { colorScheme, theme } = usePlaygroundTheme();

  return (
    <VStack paddingBottom={3}>
      <ThemeProvider activeColorScheme={colorScheme} theme={theme}>
        <SandpackProvider
          files={{ '/App.tsx': initialCode }}
          options={{ activeFile: '/App.tsx', visibleFiles: ['/App.tsx'] }}
          theme={colorScheme === 'dark' ? 'dark' : 'light'}
        >
          <ShareablePlaygroundInner defaultInitialCode={defaultInitialCode} />
        </SandpackProvider>
      </ThemeProvider>
    </VStack>
  );
});
