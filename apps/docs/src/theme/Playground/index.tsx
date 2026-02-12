import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LiveError, LivePreview } from 'react-live';
import { SandpackCodeEditor, SandpackProvider, useSandpack } from '@codesandbox/sandpack-react';
import { useTabsContext } from '@coinbase/cds-common/tabs/TabsContext';
import type { TabValue } from '@coinbase/cds-common/tabs/useTabs';
import { IconButton, type IconButtonProps } from '@coinbase/cds-web/buttons/IconButton';
import { Icon } from '@coinbase/cds-web/icons/Icon';
import { Box } from '@coinbase/cds-web/layout';
import { HStack } from '@coinbase/cds-web/layout/HStack';
import { VStack } from '@coinbase/cds-web/layout/VStack';
import { Tooltip } from '@coinbase/cds-web/overlays';
import { useToast } from '@coinbase/cds-web/overlays/useToast';
import { Pressable } from '@coinbase/cds-web/system';
import { ThemeProvider } from '@coinbase/cds-web/system/ThemeProvider';
import { Tabs, TabsActiveIndicator, type TabsActiveIndicatorProps } from '@coinbase/cds-web/tabs';
import { Text } from '@coinbase/cds-web/typography/Text';
import BrowserOnly from '@docusaurus/BrowserOnly';
import ErrorBoundary from '@docusaurus/ErrorBoundary';
import { ErrorBoundaryErrorMessageFallback } from '@docusaurus/theme-common';
import * as estreePlugin from 'prettier/plugins/estree.js';
import * as typescriptPlugin from 'prettier/plugins/typescript.js';
import { format } from 'prettier/standalone';

import { generateImports } from '../importMap';
import { usePlaygroundTheme } from '../Layout/Provider/UnifiedThemeContext';

import { useOpenInCodeSandbox } from './CodeSandboxExport';
import { extractPreviewSnippet, hasPreviewMarkers } from './previewSnippet';
import { SandpackBridge } from './SandpackBridge';
import styles from './styles.module.css';

// --- Utilities ---

const isHeader = (element: HTMLElement): boolean => {
  return (
    element.tagName === 'H1' ||
    element.tagName === 'H2' ||
    element.tagName === 'H3' ||
    element.tagName === 'H4' ||
    element.tagName === 'H5' ||
    element.tagName === 'H6'
  );
};

const useGetHeadingText = () => {
  const [headingText, setHeadingText] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current?.parentElement) return;

    let currentElement = editorRef.current.parentElement;
    if (isHeader(currentElement) && currentElement.classList.contains('anchor')) {
      setHeadingText(currentElement.textContent?.toLowerCase() || '');
      return;
    }

    while (currentElement.previousElementSibling) {
      currentElement = currentElement.previousElementSibling as HTMLElement;
      if (isHeader(currentElement) && currentElement.classList.contains('anchor')) {
        setHeadingText(currentElement.textContent?.toLowerCase() || '');
        return;
      }
    }

    setHeadingText('');
  }, []);

  return { editorRef, headingText };
};

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

const renderErrorFallback = (params: any) => <ErrorBoundaryErrorMessageFallback {...params} />;

const previewContent = () => (
  <>
    <ErrorBoundary fallback={renderErrorFallback}>
      <LivePreview />
    </ErrorBoundary>
    <LiveError />
  </>
);

/** Get a short snippet of code for the collapsed preview. */
const getCollapsedSnippet = (code: string): string => {
  if (hasPreviewMarkers(code)) {
    const snippet = extractPreviewSnippet(code);
    if (snippet) return snippet;
  }
  // Fall back to first ~5 lines
  return code.split('\n').slice(0, 5).join('\n');
};

// --- Shared sub-components ---

type ToolbarIconButtonProps = IconButtonProps<'button'> & {
  tooltip?: string;
};

export const ToolbarIconButton = memo(({ tooltip, ...props }: ToolbarIconButtonProps) => {
  if (tooltip) {
    return (
      <Tooltip content={tooltip}>
        <ToolbarIconButton {...props} />
      </Tooltip>
    );
  }
  return (
    <IconButton
      compact
      transparent
      height="auto"
      padding={1}
      variant="foregroundMuted"
      width="auto"
      {...props}
    />
  );
});

// --- Sub-components inside SandpackProvider context ---

// File tab component following the pattern from HookTabsContainer
const FileTabComponent = ({ id, label }: TabValue) => {
  const { activeTab, updateActiveTab } = useTabsContext();
  const isActive = activeTab?.id === id;
  return (
    <Pressable
      color={isActive ? 'fgPrimary' : 'fgMuted'}
      font="label2"
      onClick={() => updateActiveTab(id)}
      paddingBottom={0.5}
      paddingTop={0.25}
    >
      {label}
    </Pressable>
  );
};

const FileTabsIndicator = (props: TabsActiveIndicatorProps) => {
  return <TabsActiveIndicator {...props} background="bgPrimary" bottom={0} height={2} />;
};

/** Renders CDS Tabs for switching between files in a multi-file example. */
const FileTabBar = memo(function FileTabBar() {
  const { sandpack } = useSandpack();

  const tabs: TabValue[] = useMemo(() => {
    return Object.keys(sandpack.files)
      .filter((f) => sandpack.visibleFiles.includes(f))
      .map((filePath) => ({
        id: filePath,
        label: filePath.replace(/^\//, ''),
      }));
  }, [sandpack.files, sandpack.visibleFiles]);

  const activeTab: TabValue | null = useMemo(
    () => tabs.find((t) => t.id === sandpack.activeFile) ?? tabs[0] ?? null,
    [tabs, sandpack.activeFile],
  );

  const handleChange = useCallback(
    (tab: TabValue | null) => {
      if (tab) {
        sandpack.setActiveFile(tab.id);
      }
    },
    [sandpack],
  );

  if (tabs.length <= 1) return null;

  return (
    <Tabs
      TabComponent={FileTabComponent}
      TabsActiveIndicatorComponent={FileTabsIndicator}
      activeBackground="bgPrimary"
      activeTab={activeTab}
      gap={2}
      onChange={handleChange}
      tabs={tabs}
    />
  );
});

// --- PlaygroundHeader: unified header between preview and code ---

type PlaygroundHeaderProps = {
  collapsed: boolean;
  headingText: string;
  onToggleCollapsed: () => void;
  isMultiFile: boolean;
};

const PlaygroundHeader = memo(function PlaygroundHeader({
  collapsed,
  headingText,
  onToggleCollapsed,
  isMultiFile,
}: PlaygroundHeaderProps) {
  const toast = useToast();
  const { sandpack } = useSandpack();
  const handleOpenInCodeSandbox = useOpenInCodeSandbox(isMultiFile);

  const handleCopyToClipboard = useCallback(() => {
    const activeFile = sandpack.activeFile;
    const code = sandpack.files[activeFile]?.code ?? '';

    if (collapsed && hasPreviewMarkers(code)) {
      const snippet = extractPreviewSnippet(code);
      if (snippet) {
        const imports = generateImports(snippet);
        const copyText = imports ? `${imports}\n\n${snippet}` : snippet;
        navigator.clipboard
          .writeText(copyText)
          .then(() => toast.show('Copied to clipboard'))
          .catch(() => toast.show('Failed to copy to clipboard'));
        return;
      }
    }

    navigator.clipboard
      .writeText(code)
      .then(() => toast.show('Copied to clipboard'))
      .catch(() => toast.show('Failed to copy to clipboard'));
  }, [sandpack, toast, collapsed]);

  const handleReset = useCallback(() => {
    sandpack.resetAllFiles();
    toast.show('Code reset');
  }, [sandpack, toast]);

  return (
    <HStack
      borderedBottom
      borderedTop
      alignItems="center"
      justifyContent="space-between"
      paddingX={1}
      paddingY={0.5}
    >
      {/* Left: file tabs (multi-file) or "Live Code" label (single-file) */}
      <HStack alignItems="center" minWidth={0}>
        {isMultiFile ? (
          <FileTabBar />
        ) : (
          <Text alignItems="center" color="fgMuted" display="flex" font="label1" userSelect="none">
            <Icon active color="fgMuted" name="pencil" paddingEnd={0.5} size="xs" />
            Live Code
          </Text>
        )}
      </HStack>

      {/* Center: collapse/expand toggle (only when expanded) */}
      {!collapsed && (
        <Pressable
          noScaleOnPress
          accessibilityLabel={`Hide code${headingText ? ` for ${headingText} example` : ''}`}
          onClick={onToggleCollapsed}
        >
          <HStack alignItems="center">
            <Icon name="caretUp" paddingEnd={0.5} size="xs" />
            <Text color="fgMuted" font="label1">
              Hide code
            </Text>
          </HStack>
        </Pressable>
      )}

      {/* Right: icon buttons */}
      <HStack alignItems="center" gap={0.5} justifyContent="flex-end">
        <ToolbarIconButton name="copy" onClick={handleCopyToClipboard} tooltip="Copy code" />
        <ToolbarIconButton name="refresh" onClick={handleReset} tooltip="Reset code" />
        <ToolbarIconButton
          name="pencil"
          onClick={handleOpenInCodeSandbox}
          tooltip="Open in CodeSandbox"
        />
      </HStack>
    </HStack>
  );
});

// --- CollapsedCodePreview: faded snippet with "Show code" button ---

type CollapsedCodePreviewProps = {
  headingText: string;
  onExpand: () => void;
};

const CollapsedCodePreview = memo(function CollapsedCodePreview({
  headingText,
  onExpand,
}: CollapsedCodePreviewProps) {
  const { sandpack } = useSandpack();
  const code = sandpack.files[sandpack.activeFile]?.code ?? '';
  const snippet = useMemo(() => getCollapsedSnippet(code), [code]);

  return (
    <VStack>
      {/* Faded code snippet */}
      <div className={styles.collapsedPreview}>
        <pre className={styles.collapsedPreviewCode}>{snippet}</pre>
      </div>

      {/* "Show code" button at the bottom */}
      <Box borderedTop paddingY={0.5}>
        <Pressable
          noScaleOnPress
          accessibilityLabel={`Show code${headingText ? ` for ${headingText} example` : ''}`}
          onClick={onExpand}
        >
          <HStack alignItems="center" justifyContent="center">
            <Icon name="caretDown" paddingEnd={0.5} size="xs" />
            <Text color="fgPrimary" font="label1">
              Show code
            </Text>
          </HStack>
        </Pressable>
      </Box>
    </VStack>
  );
});

// --- PrettierHandler ---

const PrettierHandler = memo(function PrettierHandler() {
  const { sandpack } = useSandpack();

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

  return null;
});

// --- Main Playground ---

type PlaygroundProps = {
  children?: string;
  code?: string;
  hideControls?: boolean;
  hidePreview?: boolean;
  editorStartsExpanded?: boolean;
  metastring?: string;
  files?: Record<string, string>;
  filesJson?: string;
  activeFile?: string;
  scope?: Record<string, unknown>;
  noInline?: boolean;
  [key: string]: any;
};

const Playground = memo(function Playground({
  children,
  code: codeProp,
  hideControls,
  hidePreview,
  editorStartsExpanded,
  metastring,
  files: filesProp,
  filesJson,
  activeFile: activeFileProp,
  scope,
  noInline: noInlineProp,
  ...props
}: PlaygroundProps): JSX.Element {
  const resolvedFiles: Record<string, string> | undefined = useMemo(() => {
    if (filesProp) return filesProp;
    if (filesJson) {
      try {
        return JSON.parse(filesJson) as Record<string, string>;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }, [filesProp, filesJson]);

  const initialCode = useMemo(
    () => (codeProp ?? children ?? '').replace(/\n$/, ''),
    [codeProp, children],
  );
  const [collapsed, setIsCollapsed] = useState(!editorStartsExpanded);
  const toggleCollapsed = useCallback(() => setIsCollapsed((c) => !c), []);
  const { colorScheme, theme } = usePlaygroundTheme();
  const { editorRef, headingText } = useGetHeadingText();

  const noInline = noInlineProp || metastring?.includes('noInline');

  const sandpackFiles = useMemo(() => {
    if (resolvedFiles) {
      const result: Record<string, string> = {};
      for (const [name, code] of Object.entries(resolvedFiles)) {
        const key = name.startsWith('/') ? name : `/${name}`;
        result[key] = code;
      }
      return result;
    }
    return { '/App.tsx': initialCode };
  }, [resolvedFiles, initialCode]);

  const isMultiFile = resolvedFiles != null && Object.keys(resolvedFiles).length > 1;
  const activeFile = activeFileProp
    ? activeFileProp.startsWith('/')
      ? activeFileProp
      : `/${activeFileProp}`
    : isMultiFile
      ? '/Example.tsx'
      : '/App.tsx';

  return (
    <VStack ref={editorRef} paddingBottom={3} position="relative" zIndex={0}>
      <ThemeProvider activeColorScheme={colorScheme} theme={theme}>
        <SandpackProvider
          files={sandpackFiles}
          options={{
            activeFile,
            visibleFiles: isMultiFile ? Object.keys(sandpackFiles) : [activeFile],
          }}
          theme={colorScheme === 'dark' ? 'dark' : 'light'}
        >
          <PrettierHandler />

          {/* Single unified card */}
          <VStack
            background="bg"
            borderRadius={400}
            color="fg"
            font="body"
            maxWidth="100%"
            overflow="hidden"
          >
            {/* Preview */}
            <SandpackBridge isMultiFile={isMultiFile} noInline={noInline} scope={scope}>
              {!hidePreview && (
                <VStack padding={3}>
                  <BrowserOnly fallback={<div>Loading...</div>}>{previewContent}</BrowserOnly>
                </VStack>
              )}
            </SandpackBridge>

            {/* Header bar (always visible) */}
            {!hideControls && (
              <PlaygroundHeader
                collapsed={collapsed}
                headingText={headingText}
                isMultiFile={isMultiFile}
                onToggleCollapsed={toggleCollapsed}
              />
            )}

            {/* Expanded: full editor */}
            {!collapsed && (
              <SandpackCodeEditor
                className={styles.sandpackEditor}
                showLineNumbers={false}
                showTabs={false}
                wrapContent={false}
              />
            )}

            {/* Collapsed: faded snippet + "Show code" */}
            {collapsed && (
              <CollapsedCodePreview headingText={headingText} onExpand={toggleCollapsed} />
            )}
          </VStack>
        </SandpackProvider>
      </ThemeProvider>
    </VStack>
  );
});

export default Playground;
