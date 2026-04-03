'use client';

import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Undo2,
} from 'lucide-react';
import React from 'react';
import { plainTextResumeToHtml } from '@/lib/jobs/draft-html';
import { cn } from '@/lib/utils';

const toolBtn =
  'rounded-lg p-2 text-slate-300 transition hover:bg-white/10 disabled:opacity-35 disabled:hover:bg-transparent';

export function ResumeRichEditor({
  initialContent,
  onChange,
  disabled,
  placeholder,
  className,
}: {
  initialContent: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Edit your resume…',
      }),
    ],
    content: plainTextResumeToHtml(initialContent),
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  React.useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          'min-h-[280px] animate-pulse rounded-xl border border-white/10 bg-white/[0.03]',
          className
        )}
      />
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        className={cn(
          'flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#0a0f14]/90 px-2 py-1.5',
          disabled && 'pointer-events-none opacity-45'
        )}
        role="toolbar"
        aria-label="Resume formatting"
      >
        <button
          type="button"
          className={toolBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-pressed={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toolBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-pressed={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toolBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-pressed={editor.isActive('heading', { level: 2 })}
          title="Section heading"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-white/15" />
        <button
          type="button"
          className={toolBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-pressed={editor.isActive('bulletList')}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toolBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-pressed={editor.isActive('orderedList')}
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-white/15" />
        <button
          type="button"
          className={toolBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toolBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
      <EditorContent
        editor={editor}
        className={cn(
          'resume-rich-editor min-h-[280px] rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-slate-100 outline-none focus-within:border-lime-300/40 focus-within:ring-2 focus-within:ring-lime-300/15',
          '[&_.ProseMirror]:min-h-[248px] [&_.ProseMirror]:outline-none',
          '[&_.ProseMirror_p]:my-1.5 [&_.ProseMirror_h2]:mt-4 [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:text-base [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h3]:mt-3 [&_.ProseMirror_h3]:mb-1.5 [&_.ProseMirror_h3]:text-sm [&_.ProseMirror_h3]:font-bold',
          '[&_.ProseMirror_ul]:my-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5',
          '[&_.ProseMirror_ol]:my-2 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5',
          '[&_.ProseMirror_li]:my-0.5'
        )}
      />
    </div>
  );
}
