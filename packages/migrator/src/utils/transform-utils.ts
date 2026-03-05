/**
 * Utilities for transforms (CommonJS-compatible)
 *
 * This module re-exports utilities in a way that jscodeshift transforms can use.
 * It avoids complex dependencies and ES module issues.
 */

// Re-export just the essential functions transforms need
export { TODO_PREFIX } from './constants';

/**
 * Simple logger for transforms
 * Note: This is a simplified version that just console.logs since
 * the full logger isn't available in jscodeshift workers
 */
export const transformLogger = {
  success: (message: string, file?: string, line?: number) => {
    const location = file ? ` [${file}${line ? `:${line}` : ''}]` : '';
    console.log(`✓ ${message}${location}`);
  },
  warn: (message: string, file?: string, line?: number) => {
    const location = file ? ` [${file}${line ? `:${line}` : ''}]` : '';
    console.warn(`⚠ ${message}${location}`);
  },
  info: (message: string, file?: string, line?: number) => {
    const location = file ? ` [${file}${line ? `:${line}` : ''}]` : '';
    console.log(`ℹ ${message}${location}`);
  },
};

/**
 * Add TODO comment to JSX attribute
 */
export function addTodoComment(j: any, path: any, message: string, context?: string): void {
  const comment = j.commentLine(` TODO(cds-migration): ${message}`, true, false);
  const comments = [comment];

  if (context) {
    const contextComment = j.commentLine(` ${context}`, true, false);
    comments.push(contextComment);
  }

  path.value.comments = [...comments, ...(path.value.comments || [])];
}

/**
 * Check if node has migration TODO
 */
export function hasMigrationTodo(path: any): boolean {
  const comments = path.value.comments || [];
  return comments.some(
    (comment: any) => comment.value && comment.value.includes('TODO(cds-migration)'),
  );
}
