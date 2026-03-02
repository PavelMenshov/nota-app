'use client';

import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  LinkIcon,
} from 'lucide-react';
import { defaultDoc, isProseMirrorDoc } from '@/lib/editor-utils';

export { defaultDoc, isProseMirrorDoc };

export interface RichTextEditorProps {
  /** Initial content (ProseMirror JSON). Use defaultDoc(plainText) for plain text. */
  content: JSONContent | null;
  /** Called when content changes. Passes ProseMirror JSON and plain text for search/indexing. */
  onChange?: (json: JSONContent, plainText: string) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  content,
  onChange,
  editable = true,
  placeholder = 'Start writing...',
  className = '',
}: Readonly<RichTextEditorProps>) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
    ],
    content: content ?? undefined,
    editable,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getJSON(), ed.getText());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base max-w-none min-h-[300px] focus:outline-none px-4 py-3',
      },
    },
  });

  // When content prop changes (e.g. new page loaded), set content in editor
  useEffect(() => {
    if (!editor) return;
    const next = content ?? { type: 'doc', content: [] };
    const current = editor.getJSON();
    if (JSON.stringify(current) !== JSON.stringify(next)) {
      editor.commands.setContent(next, false);
    }
  }, [editor, content]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInputValue, setLinkInputValue] = useState('');

  const openLinkDialog = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href ?? '';
    setLinkInputValue(previousUrl);
    setShowLinkInput(true);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    const url = linkInputValue.trim();
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setShowLinkInput(false);
  }, [editor, linkInputValue]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setShowLinkInput(false);
  }, [editor]);

  if (!editor) {
    return (
      <div className={`min-h-[200px] animate-pulse rounded-lg bg-muted/50 ${className}`} />
    );
  }

  return (
    <div className={`rounded-lg border bg-background ${className}`}>
      {editable && (
        <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 px-2 py-1.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleBold().run()}
            data-active={editor.isActive('bold')}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            data-active={editor.isActive('italic')}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <span className="mx-1 h-5 w-px bg-border" />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            data-active={editor.isActive('heading', { level: 1 })}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            data-active={editor.isActive('heading', { level: 2 })}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            data-active={editor.isActive('heading', { level: 3 })}
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <span className="mx-1 h-5 w-px bg-border" />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            data-active={editor.isActive('bulletList')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            data-active={editor.isActive('orderedList')}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <span className="mx-1 h-5 w-px bg-border" />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={openLinkDialog}
            data-active={editor.isActive('link')}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          {showLinkInput && (
            <span className="flex items-center gap-1 ml-1 pl-1 border-l border-border">
              <Input
                type="url"
                placeholder="https://..."
                value={linkInputValue}
                onChange={(e) => setLinkInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyLink();
                  if (e.key === 'Escape') setShowLinkInput(false);
                }}
                className="h-8 w-40 text-sm"
                autoFocus
              />
              <Button type="button" size="sm" variant="ghost" className="h-8 px-2" onClick={applyLink}>
                OK
              </Button>
              {editor.isActive('link') && (
                <Button type="button" size="sm" variant="ghost" className="h-8 px-2" onClick={removeLink}>
                  Remove
                </Button>
              )}
              <Button type="button" size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowLinkInput(false)}>
                Cancel
              </Button>
            </span>
          )}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
