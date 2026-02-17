import type { ReactElement } from 'react';
import { useEffect, useRef, useCallback } from 'react';
import type { StickyNote } from '@collab-board/shared-types';
import { boardStore } from '@/store/boardStore';
import { useSocket } from '@/hooks/useSocket';

interface IStickyNoteTextEditProps {
  sticky: StickyNote;
  stageX: number;
  stageY: number;
  scale: number;
  onClose: () => void;
}

export const StickyNoteTextEdit = ({
  sticky,
  stageX,
  stageY,
  scale,
  onClose,
}: IStickyNoteTextEditProps): ReactElement => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { socket } = useSocket();

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, []);

  const handleBlur = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      const content = el.value;
      boardStore.getState().updateObject(sticky.id, { content });
      const boardId = boardStore.getState().boardId;
      if (socket && boardId) {
        socket.emit('object:update', { boardId, objectId: sticky.id, delta: { content } });
      }
    }
    onClose();
  }, [sticky.id, onClose, socket]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (textareaRef.current) textareaRef.current.value = sticky.content;
        onClose();
      }
    },
    [sticky.content, onClose]
  );

  const left = stageX + sticky.x * scale;
  const top = stageY + sticky.y * scale;
  const w = sticky.width * scale;
  const h = sticky.height * scale;

  return (
    <textarea
      ref={textareaRef}
      data-testid={`sticky-textedit-${sticky.id}`}
      className='absolute resize-none rounded border-2 border-primary bg-background p-1 text-foreground outline-none'
      style={{
        left,
        top,
        width: w - 8,
        height: h - 8,
        fontSize: sticky.fontSize * scale,
        zIndex: 1000,
      }}
      defaultValue={sticky.content}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      aria-label='Edit sticky note text'
    />
  );
};
