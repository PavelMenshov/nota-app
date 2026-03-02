/**
 * Thin helpers for doc content. Import from here to avoid pulling TipTap into the initial workspace chunk.
 * TipTap/editor is loaded dynamically when the user opens a doc.
 */
import type { JSONContent } from '@tiptap/react';

export function defaultDoc(plainText?: string): JSONContent {
  if (!plainText?.trim()) {
    return { type: 'doc', content: [] };
  }
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: plainText }],
      },
    ],
  };
}

/** Returns true if value looks like a ProseMirror doc (has type 'doc' and optional content array). */
export function isProseMirrorDoc(value: unknown): value is JSONContent {
  if (value == null || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return o.type === 'doc' && (Array.isArray(o.content) || o.content === undefined);
}
