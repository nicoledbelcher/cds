import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LiveError, LivePreview } from 'react-live';
import { SandpackCodeEditor, SandpackProvider, useSandpack } from '@codesandbox/sandpack-react';
import { useTabsContext } from '@coinbase/cds-common/tabs/TabsContext';
import type { TabValue } from '@coinbase/cds-common/tabs/useTabs';
import { IconButton, type IconButtonProps } from '@coinbase/cds-web/buttons/IconButton';
import { Dropdown } from '@coinbase/cds-web/dropdown/Dropdown';
import { MenuItem } from '@coinbase/cds-web/dropdown/MenuItem';
import { Icon } from '@coinbase/cds-web/icons/Icon';
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
import { AnimatePresence, m as motion } from 'framer-motion';
import * as estreePlugin from 'prettier/plugins/estree.js';
import * as typescriptPlugin from 'prettier/plugins/typescript.js';
import { format } from 'prettier/standalone';

import { usePlaygroundTheme } from '../Layout/Provider/UnifiedThemeContext';

import {
  type CodeDisplayMode,
  extractSnippetFromCode,
  getCodeDisplayInfo,
  spliceSnippetIntoCode,
} from './codeDisplayMode';
import { useOpenInCodeSandbox } from './CodePlaygroundExport';
import { SandpackBridge } from './SandpackBridge';
import { sandpackGithubLight, sandpackNightOwl } from './sandpackTheme';
import styles from './styles.module.css';

// --- Utilities ---

const isHeader = (element: HTMLElement): boolean =>
  ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName);

const useGetHeadingText = () => {
  const [headingText, setHeadingText] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current?.parentElement) return;
    let el = editorRef.current.parentElement;
    if (isHeader(el) && el.classList.contains('anchor')) {
      setHeadingText(el.textContent?.toLowerCase() || '');
      return;
    }
    while (el.previousElementSibling) {
      el = el.previousElementSibling as HTMLElement;
      if (isHeader(el) && el.classList.contains('anchor')) {
        setHeadingText(el.textContent?.toLowerCase() || '');
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

// --- Shared sub-components ---

type ToolbarIconButtonProps = IconButtonProps<'button'> & {
  tooltip?: string;
};

export const ToolbarIconButton = memo(({ tooltip, ...props }: ToolbarIconButtonProps) => {
  if (tooltip) {
    return (
      <Tooltip content={tooltip}>
        <IconButton
          compact
          transparent
          height="auto"
          padding={1}
          variant="foregroundMuted"
          width="auto"
          {...props}
        />
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

const FileTabComponent = ({ id, label }: TabValue) => {
  const { activeTab, updateActiveTab } = useTabsContext();
  const isActive = activeTab?.id === id;
  return (
    <Pressable
      color={isActive ? 'fgPrimary' : 'fgMuted'}
      font="label2"
      onClick={() => updateActiveTab(id)}
      paddingY={1}
    >
      {label}
    </Pressable>
  );
};

const FileTabsIndicator = (props: TabsActiveIndicatorProps) => {
  return <TabsActiveIndicator {...props} background="bgPrimary" bottom={0} height={2} />;
};

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
      gap={1}
      onChange={handleChange}
      tabs={tabs}
    />
  );
});

// --- MoreMenu (Format Code / Reset Code) ---

const MoreMenuContent = memo(function MoreMenuContent({
  onFormat,
  onResetCode,
}: {
  onFormat: () => void;
  onResetCode: () => void;
}) {
  return (
    <VStack gap={0} paddingY={0.5}>
      <MenuItem onClick={onFormat} paddingX={2} paddingY={1} value="format">
        <HStack alignItems="center" gap={1}>
          <Icon color="fgMuted" name="sparkle" size="s" />
          <Text font="body">Format code</Text>
        </HStack>
      </MenuItem>
      <MenuItem onClick={onResetCode} paddingX={2} paddingY={1} value="reset">
        <HStack alignItems="center" gap={1}>
          <Icon color="fgNegative" name="trashCan" size="s" />
          <Text color="fgNegative" font="body">
            Reset code
          </Text>
        </HStack>
      </MenuItem>
    </VStack>
  );
});

// --- PlaygroundHeader ---

type PlaygroundHeaderProps = {
  displayMode: CodeDisplayMode;
  expanded: boolean;
  headingText: string;
  onToggle: () => void;
  onRerender: () => void;
  isMultiFile: boolean;
  /** Whether the snippet is clipped (i.e. not showing the full code). When false, no toggle needed. */
  isClipped: boolean;
  /** Original unmodified files for export (before snippet-mode replacements). */
  originalFiles?: Record<string, string>;
};

const PlaygroundHeader = memo(function PlaygroundHeader({
  displayMode,
  expanded,
  headingText,
  onToggle,
  onRerender,
  isMultiFile,
  isClipped,
  originalFiles,
}: PlaygroundHeaderProps) {
  const toast = useToast();
  const { sandpack } = useSandpack();
  const handleOpenInCodeSandbox = useOpenInCodeSandbox(isMultiFile, originalFiles);

  const handleCopyToClipboard = useCallback(() => {
    const code = sandpack.files[sandpack.activeFile]?.code ?? '';
    navigator.clipboard
      .writeText(code)
      .then(() => toast.show('Copied to clipboard'))
      .catch(() => toast.show('Failed to copy to clipboard'));
  }, [sandpack, toast]);

  const handleResetCode = useCallback(() => {
    sandpack.resetAllFiles();
    toast.show('Code reset to original');
  }, [sandpack, toast]);

  const handleFormat = useCallback(() => {
    const activeFile = sandpack.activeFile;
    const code = sandpack.files[activeFile]?.code ?? '';
    format(code, prettierOptions).then((formatted) => {
      sandpack.updateFile(activeFile, formatted);
      toast.show('Code formatted');
    });
  }, [sandpack, toast]);

  const toggleLabel = useMemo(() => {
    // Snippet mode with no clipping: full code is already visible, no toggle needed
    if (displayMode === 'snippet' && !isClipped && !expanded) return null;
    if (displayMode === 'snippet') return expanded ? 'Collapse code' : 'Expand code';
    return expanded ? 'Hide code' : 'Show code';
  }, [displayMode, expanded, isClipped]);

  const toggleIcon = expanded ? 'caretUp' : 'caretDown';

  const moreMenuContent = useMemo(
    () => <MoreMenuContent onFormat={handleFormat} onResetCode={handleResetCode} />,
    [handleFormat, handleResetCode],
  );

  return (
    <VStack>
      {/* Main toolbar row */}
      <HStack
        borderedTop
        alignItems="center"
        borderedBottom={displayMode === 'snippet' || expanded}
        justifyContent="space-between"
        paddingX={1.5}
        paddingY={0.5}
      >
        {/* Left: always show "Live Code" label */}
        <HStack alignItems="center" minWidth={0}>
          <Text alignItems="center" color="fgMuted" display="flex" font="label1" userSelect="none">
            <Icon active color="fgMuted" name="pencil" paddingEnd={0.5} size="xs" />
            Live Code
          </Text>
        </HStack>

        {/* Right: toggle + icon buttons */}
        <HStack alignItems="center" gap={1}>
          {toggleLabel && (
            <Pressable
              noScaleOnPress
              accessibilityLabel={`${toggleLabel}${headingText ? ` for ${headingText} example` : ''}`}
              onClick={onToggle}
            >
              <HStack alignItems="center">
                <Icon color="fgMuted" name={toggleIcon} paddingEnd={0.5} size="xs" />
                <Text color="fgMuted" font="label1">
                  {toggleLabel}
                </Text>
              </HStack>
            </Pressable>
          )}

          <HStack alignItems="center" gap={0.5}>
            <ToolbarIconButton name="copy" onClick={handleCopyToClipboard} tooltip="Copy code" />
            <ToolbarIconButton name="refresh" onClick={onRerender} tooltip="Reset demo" />
            <ToolbarIconButton
              name="pencil"
              onClick={handleOpenInCodeSandbox}
              tooltip="Open in StackBlitz"
            />
            <Dropdown
              content={moreMenuContent}
              contentPosition={{ placement: 'bottom-end' }}
              width="auto"
            >
              <ToolbarIconButton accessibilityLabel="More actions" name="more" tooltip="More" />
            </Dropdown>
          </HStack>
        </HStack>
      </HStack>

      {/* File tabs row — only shown for multi-file examples when code is expanded */}
      {isMultiFile && expanded && (
        <HStack borderedBottom alignItems="center" paddingX={1.5}>
          <FileTabBar />
        </HStack>
      )}
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

// --- CodeSection: manages display mode per-file ---

type CodeSectionProps = {
  headingText: string;
  isMultiFile: boolean;
  hideControls?: boolean;
  editorStartsExpanded?: boolean;
  onRerender: () => void;
  /**
   * Called to set the execution code override for the bridge.
   * Pass a string when the editor is showing a snippet (bridge needs the full code).
   * Pass undefined when the editor has the real code (bridge reads from Sandpack directly).
   */
  onFullCodeChange: (code: string | undefined) => void;
  /** Original unmodified files for export (before snippet-mode replacements). */
  originalFiles?: Record<string, string>;
};

const CodeSection = memo(function CodeSection({
  headingText,
  isMultiFile,
  hideControls,
  editorStartsExpanded,
  onRerender,
  onFullCodeChange,
  originalFiles,
}: CodeSectionProps) {
  const { sandpack } = useSandpack();
  const [expanded, setExpanded] = useState(editorStartsExpanded ?? false);

  // Store the full code per file so we can restore it after showing a snippet.
  // Key: file path, Value: full code
  const fullCodeMap = useRef<Record<string, string>>({});

  // Helper: get or initialize the full code for the active file
  const getFullCode = useCallback(() => {
    const file = sandpack.activeFile;
    if (!fullCodeMap.current[file]) {
      fullCodeMap.current[file] = sandpack.files[file]?.code ?? '';
    }
    return fullCodeMap.current[file];
  }, [sandpack]);

  // Helper: swap editor content to snippet, set override for bridge
  const showSnippet = useCallback(() => {
    const file = sandpack.activeFile;
    const full = sandpack.files[file]?.code ?? '';
    fullCodeMap.current[file] = full;
    onFullCodeChange(full); // bridge uses this full code for execution
    const snippet = extractSnippetFromCode(full);
    if (snippet) {
      sandpack.updateFile(file, snippet);
    }
  }, [sandpack, onFullCodeChange]);

  // Helper: restore editor content to full code, clear override so bridge reads live
  const showFullCode = useCallback(() => {
    const file = sandpack.activeFile;
    const full = fullCodeMap.current[file];
    if (full) {
      sandpack.updateFile(file, full);
    }
    onFullCodeChange(undefined); // bridge reads directly from Sandpack now
  }, [sandpack, onFullCodeChange]);

  // Compute display info from the FULL code (always).
  // Multi-file examples skip snippet mode — replacing the active file's content
  // with a snippet would break execution since the bridge reads from Sandpack directly.
  const fullCode = getFullCode();
  const displayInfo = useMemo(
    () => (isMultiFile ? { mode: 'full' as const, collapsedHeightPx: null, scrollOffsetPx: null } : getCodeDisplayInfo(fullCode)),
    [fullCode, isMultiFile],
  );
  const isSnippetMode = displayInfo.mode === 'snippet' && displayInfo.collapsedHeightPx != null;

  // When expanded, keep fullCodeMap in sync with edits (for later collapse)
  // and ensure bridge reads directly from Sandpack (no override)
  useEffect(() => {
    if (expanded) {
      const code = sandpack.files[sandpack.activeFile]?.code ?? '';
      fullCodeMap.current[sandpack.activeFile] = code;
    }
  }, [sandpack.files, sandpack.activeFile, expanded]);

  // Initialize on mount: show snippet if applicable
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      if (!editorStartsExpanded && isSnippetMode) {
        showSnippet();
      } else {
        onFullCodeChange(undefined); // no override needed, bridge reads from Sandpack
      }
    }
  }); // intentionally no deps -- run once after first render

  const handleToggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      if (isSnippetMode) {
        if (next) {
          showFullCode();
        } else {
          showSnippet();
        }
      }
      return next;
    });
  }, [isSnippetMode, showFullCode, showSnippet]);

  // Editor visible: snippet (always), full (only when expanded)
  const showEditor = displayInfo.mode === 'snippet' || expanded;

  // When collapsed in snippet mode and user edits, splice edits back into full code
  useEffect(() => {
    if (isSnippetMode && !expanded) {
      const editedSnippet = sandpack.files[sandpack.activeFile]?.code ?? '';
      const full = fullCodeMap.current[sandpack.activeFile];
      if (full) {
        const updatedFull = spliceSnippetIntoCode(full, editedSnippet);
        if (updatedFull !== full) {
          fullCodeMap.current[sandpack.activeFile] = updatedFull;
          onFullCodeChange(updatedFull);
        }
      }
    }
  }, [sandpack.files, sandpack.activeFile, isSnippetMode, expanded, onFullCodeChange]);

  return (
    <>
      {/* Header bar */}
      {!hideControls && (
        <PlaygroundHeader
          displayMode={displayInfo.mode}
          expanded={expanded}
          headingText={headingText}
          isClipped={displayInfo.collapsedHeightPx != null}
          isMultiFile={isMultiFile}
          onRerender={onRerender}
          onToggle={handleToggle}
          originalFiles={originalFiles}
        />
      )}

      {/* Sandpack editor with animated expand/collapse */}
      <AnimatePresence initial={false}>
        {showEditor && (
          <motion.div
            key="editor"
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <SandpackCodeEditor
              className={styles.sandpackEditor}
              showLineNumbers={false}
              showTabs={false}
              wrapContent={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
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
  const { colorScheme, theme } = usePlaygroundTheme();
  const { editorRef, headingText } = useGetHeadingText();

  // Rerender key: incrementing this unmounts and remounts the preview
  const [rerenderKey, setRerenderKey] = useState(0);
  const handleRerender = useCallback(() => setRerenderKey((k) => k + 1), []);

  // Full code for execution: the bridge uses this instead of reading from Sandpack
  // (because Sandpack's file might contain just the snippet when collapsed)
  const [executionCode, setExecutionCode] = useState<string | undefined>(undefined);
  const handleFullCodeChange = useCallback(
    (code: string | undefined) => setExecutionCode(code),
    [],
  );

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
          theme={colorScheme === 'dark' ? sandpackNightOwl : sandpackGithubLight}
        >
          <PrettierHandler />

          <VStack
            background="bg"
            borderRadius={400}
            color="fg"
            font="body"
            maxWidth="100%"
            overflow="hidden"
          >
            {/* Preview (keyed for rerender/remount) */}
            <SandpackBridge
              key={rerenderKey}
              executionCode={isMultiFile ? undefined : executionCode}
              isMultiFile={isMultiFile}
              noInline={noInline}
              scope={scope}
            >
              {!hidePreview && (
                <VStack padding={3}>
                  <BrowserOnly fallback={<div>Loading...</div>}>{previewContent}</BrowserOnly>
                </VStack>
              )}
            </SandpackBridge>

            {/* Code section: header + editor */}
            <CodeSection
              editorStartsExpanded={editorStartsExpanded}
              headingText={headingText}
              hideControls={hideControls}
              isMultiFile={isMultiFile}
              onFullCodeChange={handleFullCodeChange}
              onRerender={handleRerender}
              originalFiles={sandpackFiles}
            />
          </VStack>
        </SandpackProvider>
      </ThemeProvider>
    </VStack>
  );
});

export default Playground;
