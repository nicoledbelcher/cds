import React, { useMemo, memo, useCallback, useEffect, useRef, useState, useContext, useReducer } from 'react';
import { LiveEditor, LivePreview, LiveProvider } from 'react-live';
import { useRunner } from 'react-runner';
import { Collapsible } from '@coinbase/cds-web/collapsible/Collapsible';
import { Icon } from '@coinbase/cds-web/icons/Icon';
import { Box } from '@coinbase/cds-web/layout';
import { HStack } from '@coinbase/cds-web/layout/HStack';
import { VStack } from '@coinbase/cds-web/layout/VStack';
import { useToast } from '@coinbase/cds-web/overlays/useToast';
import { Pressable } from '@coinbase/cds-web/system';
import { ThemeProvider } from '@coinbase/cds-web/system/ThemeProvider';
import { Text } from '@coinbase/cds-web/typography/Text';
import BrowserOnly from '@docusaurus/BrowserOnly';
import ErrorBoundary from '@docusaurus/ErrorBoundary';
import { ErrorBoundaryErrorMessageFallback } from '@docusaurus/theme-common';
import * as estreePlugin from 'prettier/plugins/estree.js';
import * as typescriptPlugin from 'prettier/plugins/typescript.js';
import { format } from 'prettier/standalone';

import { usePlaygroundTheme } from '../Layout/Provider/UnifiedThemeContext';
import ReactLiveScope from '../ReactLiveScope';

import { FileTabs } from './FileTabs';
import { PlaygroundError } from './PlaygroundError';
import { PlaygroundToolbar } from './PlaygroundToolbar';
import type { NormalizedPlaygroundFile, PlaygroundFiles } from './types';
import { getMainFile, normalizeFiles } from './types';
import { createCombinedScope } from './utils/codeTransformer';
import { createCodeSandboxFiles, extractDependencies, openInCodeSandbox } from './utils/codesandbox';
import { createReactRunnerScope, getMainFileContent } from './utils/reactRunnerScope';
import styles from './styles.module.css';

const PlaygroundEditorHeader = memo(() => {
  return (
    <Box borderedBottom paddingBottom={0.5} paddingTop={0.75} paddingX={1} width="100%">
      <Text alignItems="center" color="fgMuted" display="flex" font="label1" userSelect="none">
        <Icon active color="fgMuted" name="pencil" paddingEnd={0.5} size="xs" /> Live Code
      </Text>
    </Box>
  );
});

const renderErrorFallback = (params: any) => <ErrorBoundaryErrorMessageFallback {...params} />;

const previewComponent = () => (
  <ErrorBoundary fallback={renderErrorFallback}>
    <LivePreview />
  </ErrorBoundary>
);

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
    // Get the heading text from the previous header sibling
    if (!editorRef.current?.parentElement) return;

    let currentElement = editorRef.current.parentElement;
    if (isHeader(currentElement) && currentElement.classList.contains('anchor')) {
      setHeadingText(currentElement.textContent?.toLowerCase() || '');
      return;
    }

    // Look through previous siblings for a header
    while (currentElement.previousElementSibling) {
      currentElement = currentElement.previousElementSibling as HTMLElement;
      if (isHeader(currentElement) && currentElement.classList.contains('anchor')) {
        setHeadingText(currentElement.textContent?.toLowerCase() || '');
        return;
      }
    }

    // No appropriate heading found
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

type PlaygroundToggleProps = {
  collapsed: boolean;
  headingText: string;
  onToggleCollapsed: () => void;
};

const PlaygroundToggle = memo(
  ({ collapsed, headingText, onToggleCollapsed }: PlaygroundToggleProps) => {
    return (
      <Pressable
        noScaleOnPress
        accessibilityLabel={`${collapsed ? 'Show' : 'Hide'} code${
          headingText ? ` for ${headingText} example` : ''
        }`}
        onClick={onToggleCollapsed}
      >
        <HStack alignItems="center">
          <Icon name={collapsed ? 'caretDown' : 'caretUp'} paddingEnd={0.5} size="xs" />
          <Text color="fgPrimary" font="label1">
            {collapsed ? 'Show code' : 'Hide code'}
          </Text>
        </HStack>
      </Pressable>
    );
  },
);

type LiveProviderProps = React.ComponentProps<typeof LiveProvider>;

type PlaygroundProps = Omit<LiveProviderProps, 'transformCode'> & {
  children: string;
  hideControls?: boolean;
  hidePreview?: boolean;
  editorStartsExpanded?: boolean;
  metastring?: string;
  /** Multiple files support. Can be a Record<string, string> or PlaygroundFile[] */
  files?: PlaygroundFiles;
};

const Playground = memo(function Playground({
  children,
  code: codeProp,
  files: filesProp,
  hideControls,
  hidePreview,
  editorStartsExpanded,
  metastring,
  ...props
}: PlaygroundProps): JSX.Element {
  // Normalize files if provided
  const normalizedFiles = useMemo(() => normalizeFiles(filesProp), [filesProp]);
  const hasMultipleFiles = normalizedFiles.length > 1;
  const mainFile = useMemo(() => getMainFile(normalizedFiles), [normalizedFiles]);

  // Determine initial code - use main file if multiple files, otherwise use prop/children
  const initialCode = useMemo(() => {
    if (hasMultipleFiles && mainFile) {
      return mainFile.content.replace(/\n$/, '');
    }
    return (codeProp ?? children ?? '').replace(/\n$/, '');
  }, [hasMultipleFiles, mainFile, codeProp, children]);

  const [code, setCode] = useState(initialCode);
  const codeRef = useRef(code);
  const originalCodeRef = useRef(initialCode);
  
  // Track active file index for multiple files
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  
  // Store original files for reset
  const originalFilesRef = useRef<NormalizedPlaygroundFile[]>(normalizedFiles);
  
  const [collapsed, setIsCollapsed] = useState(!editorStartsExpanded);
  const toggleCollapsed = useCallback(() => setIsCollapsed((collapsed) => !collapsed), []);
  const toast = useToast();
  const { colorScheme, theme, prismTheme } = usePlaygroundTheme();

  const { editorRef, headingText } = useGetHeadingText();

  const noInline = metastring?.includes('noInline');

  // Track file contents separately to avoid mutating normalizedFiles directly
  // This prevents race conditions when typing quickly
  // Declare this FIRST before any code that uses it
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  
  // Initialize file contents from normalizedFiles
  useEffect(() => {
    if (hasMultipleFiles) {
      const contents: Record<string, string> = {};
      normalizedFiles.forEach((file) => {
        contents[file.path] = file.content;
      });
      setFileContents(contents);
    }
  }, [hasMultipleFiles, props.files]); // Only update when files prop changes, not on every edit

  // Update code when active file changes - use fileContents if available
  useEffect(() => {
    if (hasMultipleFiles && normalizedFiles[activeFileIndex]) {
      const activeFile = normalizedFiles[activeFileIndex];
      const filePath = activeFile.path;
      // Use fileContents if it exists (edited content), otherwise use original
      const fileContent = fileContents[filePath] ?? activeFile.content;
      const newCode = fileContent.replace(/\n$/, '');
      codeRef.current = newCode;
      setCode(newCode);
    }
  }, [activeFileIndex, hasMultipleFiles, normalizedFiles, fileContents]);

  // Handle file tab change
  const handleFileChange = useCallback((index: number) => {
    setActiveFileIndex(index);
  }, []);

  // Update file content when code changes (all files are editable)
  const updateActiveFileContent = useCallback(
    (newCode: string) => {
      if (hasMultipleFiles && normalizedFiles[activeFileIndex]) {
        const filePath = normalizedFiles[activeFileIndex].path;
        // Update file contents state (non-blocking)
        setFileContents((prev) => ({
          ...prev,
          [filePath]: newCode,
        }));
      }
    },
    [hasMultipleFiles, normalizedFiles, activeFileIndex],
  );

  const handleCodeChange = useCallback(
    (code: string) => {
      codeRef.current = code;
      setCode(code);
      // Update file content asynchronously to avoid blocking
      updateActiveFileContent(code);
    },
    [updateActiveFileContent],
  );

  const handleCopyToClipboard = useCallback(() => {
    const textToCopy = hasMultipleFiles
      ? (() => {
          const activeFile = normalizedFiles[activeFileIndex];
          if (activeFile) {
            return fileContents[activeFile.path] ?? activeFile.content;
          }
          return codeRef.current;
        })()
      : codeRef.current;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => toast.show('Copied to clipboard'))
      .catch(() => toast.show('Failed to copy to clipboard'));
  }, [toast, hasMultipleFiles, normalizedFiles, activeFileIndex, fileContents]);

  const handleReset = useCallback(() => {
    if (hasMultipleFiles) {
      // Reset all file contents to original
      const resetContents: Record<string, string> = {};
      originalFilesRef.current.forEach((originalFile) => {
        resetContents[originalFile.path] = originalFile.content;
      });
      setFileContents(resetContents);
      
      // Reset active file code
      const originalActiveFile = originalFilesRef.current[activeFileIndex];
      if (originalActiveFile) {
        const newCode = originalActiveFile.content.replace(/\n$/, '');
        codeRef.current = newCode;
        setCode(newCode);
      }
    } else {
      const originalCode = originalCodeRef.current;
      codeRef.current = originalCode;
      setCode(originalCode);
    }
    toast.show('Code reset to original');
  }, [toast, hasMultipleFiles, activeFileIndex]);

  // Create react-runner scope with file modules if multiple files
  // Following Material-UI's approach: scope.import for file modules
  // Create files array with current contents for scope calculation
  // Use fileContents state to get the latest edited content
  // Declare this BEFORE handleOpenCodeSandbox which uses it
  const filesForScope = useMemo(() => {
    if (!hasMultipleFiles) return normalizedFiles;
    return normalizedFiles.map((file) => ({
      ...file,
      content: fileContents[file.path] ?? file.content,
    }));
  }, [hasMultipleFiles, normalizedFiles, fileContents]);

  const handleOpenCodeSandbox = useCallback(() => {
    try {
      if (hasMultipleFiles) {
        // For multiple files, create files object from all files (use fileContents if available)
        const allFiles: Record<string, { content: string }> = {};
        normalizedFiles.forEach((file) => {
          allFiles[file.path] = { content: fileContents[file.path] ?? file.content };
        });
        
        // Extract dependencies from main file (use fileContents if available)
        const mainFileContent = filesForScope[0]?.content ?? '';
        const dependencies = extractDependencies(mainFileContent);
        openInCodeSandbox({ files: allFiles, dependencies });
      } else {
        const dependencies = extractDependencies(codeRef.current);
        const files = createCodeSandboxFiles(codeRef.current);
        openInCodeSandbox({ files, dependencies });
      }
      toast.show('Opening in CodeSandbox...');
    } catch (error) {
      toast.show('Failed to open in CodeSandbox');
      console.error('CodeSandbox error:', error);
    }
  }, [toast, hasMultipleFiles, normalizedFiles, fileContents, filesForScope]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyS' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        format(codeRef.current, prettierOptions).then(handleCodeChange);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleCodeChange]);

  // Use ReactLiveScope as default if scope is not provided
  const reactRunnerScope = useMemo(() => {
    const baseScope = props.scope ?? ReactLiveScope;
    if (hasMultipleFiles) {
      return createReactRunnerScope(baseScope, filesForScope);
    }
    // For single file, return scope with React and hooks
    return { React, useState, useEffect, useCallback, useMemo, useRef, useContext, useReducer, ...baseScope };
  }, [hasMultipleFiles, props.scope, filesForScope]);

  // Create combined scope for react-live (fallback for single file or editor)
  const combinedScope = useMemo(() => {
    if (hasMultipleFiles) {
      const baseScope = props.scope ?? {};
      return createCombinedScope(baseScope, normalizedFiles);
    }
    return props.scope;
  }, [hasMultipleFiles, props.scope, normalizedFiles]);

  // Get main file content for react-runner (no combination needed!)
  // Following Material-UI's approach: pass main file as-is, resolve imports from scope
  // When files are edited, update the main file content
  const mainFileCode = useMemo(() => {
    if (hasMultipleFiles && filesForScope.length > 0) {
      // Get main file content - use current code if we're editing the main file
      // Otherwise use the stored content from fileContents
      const mainFile = filesForScope[0];
      const isEditingMainFile = activeFileIndex === 0;
      const mainFileContent = isEditingMainFile ? code : (fileContents[mainFile.path] ?? mainFile.content);
      return mainFileContent;
    }
    return code;
  }, [hasMultipleFiles, filesForScope, code, activeFileIndex, fileContents]);

  // Use react-runner for execution when multiple files are present
  // react-runner handles imports via scope.import, no file combination needed!
  // Always call useRunner (hooks must be called unconditionally), but only use result when hasMultipleFiles
  const { element: reactRunnerElement, error: reactRunnerError } = useRunner({
    code: hasMultipleFiles ? mainFileCode : '',
    scope: reactRunnerScope, // Always pass scope (includes React)
    type: 'typescript',
  });

  // Fallback execution code for react-live (single file mode)
  const executionCode = useMemo(() => {
    if (!hasMultipleFiles) {
      return code;
    }
    // For multiple files, we use react-runner, but keep this for editor
    return code;
  }, [hasMultipleFiles, code]);

  // Format react-runner error for display
  const runnerErrorString = useMemo(() => {
    if (!reactRunnerError) return null;
    if (reactRunnerError instanceof Error) {
      return reactRunnerError.message;
    }
    return String(reactRunnerError);
  }, [reactRunnerError]);

  return (
    <VStack ref={editorRef} paddingBottom={3} position="relative" zIndex={0}>
      <ThemeProvider activeColorScheme={colorScheme} theme={theme}>
        {hasMultipleFiles ? (
          // Use react-runner for multiple files (Material-UI approach)
          <>
            {!hidePreview && (
              <VStack
                background="bg"
                borderRadius={400}
                color="fg"
                font="body"
                padding={3}
                position="relative"
                zIndex={0}
              >
                <BrowserOnly fallback={<div>Loading...</div>}>
                  {() => (
                    <ErrorBoundary fallback={renderErrorFallback}>
                      {reactRunnerElement || <div>No output</div>}
                    </ErrorBoundary>
                  )}
                </BrowserOnly>
              </VStack>
            )}
            {runnerErrorString && (
              <PlaygroundError error={runnerErrorString} />
            )}
          </>
        ) : (
          // Use react-live for single file (existing behavior)
          <LiveProvider
            code={executionCode}
            noInline={noInline}
            scope={combinedScope}
            theme={prismTheme}
            {...props}
          >
            {!hidePreview && (
              <VStack
                background="bg"
                borderRadius={400}
                color="fg"
                font="body"
                padding={3}
                position="relative"
                zIndex={0}
              >
                <BrowserOnly fallback={<div>Loading...</div>}>{previewComponent}</BrowserOnly>
              </VStack>
            )}
            <PlaygroundError />
          </LiveProvider>
        )}
        
        {/* Editor uses active file's code */}
        <LiveProvider
          code={code}
          noInline={noInline}
          scope={combinedScope}
          theme={prismTheme}
          {...props}
        >
          <Collapsible collapsed={collapsed} paddingBottom={0.5} paddingTop={1}>
            <VStack position="relative" background="bg" borderRadius={400} overflow="hidden" width="100%">
              {hasMultipleFiles && (
                <Box paddingX={1} paddingTop={1}>
                  <FileTabs
                    activeFileIndex={activeFileIndex}
                    files={normalizedFiles}
                    onFileChange={handleFileChange}
                  />
                </Box>
              )}
              <PlaygroundEditorHeader />
              <LiveEditor
                key={hasMultipleFiles ? `file-${activeFileIndex}` : 'single-file'}
                className={styles.playgroundEditor}
                onChange={handleCodeChange}
              />
            </VStack>
          </Collapsible>
        </LiveProvider>
        {!hideControls && (
          <HStack alignItems="center" gap={2} paddingTop={0.5}>
            <PlaygroundToggle
              collapsed={collapsed}
              headingText={headingText}
              onToggleCollapsed={toggleCollapsed}
            />
            <PlaygroundToolbar
              headingText={headingText}
              onCopy={handleCopyToClipboard}
              onOpenCodeSandbox={handleOpenCodeSandbox}
              onReset={handleReset}
            />
          </HStack>
        )}
      </ThemeProvider>
    </VStack>
  );
});

export default Playground;
