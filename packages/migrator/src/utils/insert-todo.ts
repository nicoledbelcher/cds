/**
 * Utilities for inserting TODO comments when automatic migration is not possible
 */

import type { API, Collection } from 'jscodeshift';
import { TODO_PREFIX } from './constants.js';

export interface InsertTodoOptions {
  /**
   * The message to include in the TODO comment
   */
  message: string;
  /**
   * Additional context or instructions
   */
  context?: string;
  /**
   * Whether to insert before or after the node
   */
  position?: 'before' | 'after';
}

/**
 * Insert a TODO comment near a JSX element
 *
 * @example
 * // Before
 * <Button variant="old" />
 *
 * // After
 * // TODO(cds-migration): The 'variant' prop has been removed. Use 'appearance' instead.
 * // See: https://docs.coinbase.com/cds/migration-guide
 * <Button variant="old" />
 */
export function insertTodoComment(
  j: API['jscodeshift'],
  path: any,
  options: InsertTodoOptions,
): void {
  const { message, context, position = 'before' } = options;

  // Build the comment text
  let commentText = `${TODO_PREFIX}: ${message}`;
  if (context) {
    commentText += `\n${context}`;
  }

  // Create comment nodes
  const comment = j.commentLine(` ${TODO_PREFIX}: ${message}`, true, false);

  // Add context as a separate comment if provided
  const comments = [comment];
  if (context) {
    const contextComment = j.commentLine(` ${context}`, true, false);
    comments.push(contextComment);
  }

  // Insert comments
  if (position === 'before') {
    path.value.comments = [...comments, ...(path.value.comments || [])];
  } else {
    path.value.comments = [...(path.value.comments || []), ...comments];
  }
}

/**
 * Add a TODO comment to a JSX attribute when it cannot be automatically migrated
 *
 * @example
 * j(file.source)
 *   .find(j.JSXAttribute, { name: { name: 'oldProp' } })
 *   .forEach((path) => {
 *     addTodoToAttribute(j, path, {
 *       message: 'This prop needs manual migration',
 *       context: 'See migration guide: https://...'
 *     });
 *   });
 */
export function addTodoToAttribute(
  j: API['jscodeshift'],
  attributePath: any,
  options: InsertTodoOptions,
): void {
  const jsxElement = attributePath.parent;
  if (jsxElement) {
    insertTodoComment(j, jsxElement, options);
  }
}

/**
 * Add a TODO comment to an import statement
 *
 * @example
 * j(file.source)
 *   .find(j.ImportDeclaration)
 *   .forEach((path) => {
 *     addTodoToImport(j, path, {
 *       message: 'This import needs to be updated manually'
 *     });
 *   });
 */
export function addTodoToImport(
  j: API['jscodeshift'],
  importPath: any,
  options: InsertTodoOptions,
): void {
  insertTodoComment(j, importPath, options);
}

/**
 * Create a standalone TODO comment block
 *
 * @example
 * const todoBlock = createTodoBlock({
 *   message: 'Manual migration required',
 *   context: 'This component uses deprecated APIs that cannot be automatically migrated.'
 * });
 * // Returns formatted comment block as string
 */
export function createTodoBlock(options: InsertTodoOptions): string {
  const { message, context } = options;
  let block = `// ${TODO_PREFIX}: ${message}\n`;
  if (context) {
    block += `// ${context}\n`;
  }
  return block;
}

/**
 * Check if a node already has a migration TODO comment
 */
export function hasMigrationTodo(path: any): boolean {
  const comments = path.value.comments || [];
  return comments.some((comment: any) => comment.value && comment.value.includes(TODO_PREFIX));
}
