import type { ReactElement } from 'react';
import { Circle, Group, Rect, Text } from 'react-konva';
import { useRemoteCursors, useCurrentUserId } from '@/hooks/useRemoteCursors';
import { getCursorColorForUserId } from '@/lib/cursor-color';
import type { IRemoteCursor } from '@/hooks/useRemoteCursors';

const CURSOR_DOT_RADIUS = 6;
const LABEL_OFFSET_Y = 12;
const LABEL_FONT_SIZE = 12;
const LABEL_PADDING_H = 6;
const LABEL_PADDING_V = 2;
const LABEL_MAX_WIDTH = 120;

export interface ICursorOverlayProps {
  stageScale: number;
}

/**
 * Renders remote user cursors on the cursor layer. Excludes current user.
 * Simple dot + label with background so the cursor is clear and the name does not clip.
 */
export const CursorOverlay = ({ stageScale }: ICursorOverlayProps): ReactElement => {
  const cursors = useRemoteCursors();
  const currentUserId = useCurrentUserId();
  const entries = Array.from(cursors.entries()).filter(([userId]) => userId !== currentUserId);

  return (
    <>
      {entries.map(([userId, cursor]) => (
        <CursorShape key={userId} cursor={cursor} stageScale={stageScale} />
      ))}
    </>
  );
};

interface ICursorShapeProps {
  cursor: IRemoteCursor;
  stageScale: number;
}

function CursorShape({ cursor, stageScale }: ICursorShapeProps): ReactElement {
  const { x, y, name, color } = cursor;
  const fillColor = color ?? getCursorColorForUserId(cursor.userId);
  const label = (name ?? cursor.userId.slice(0, 12)).slice(0, 20);
  const scaledFontSize = Math.max(10, LABEL_FONT_SIZE / stageScale);
  const labelWidth = Math.min(
    LABEL_MAX_WIDTH,
    label.length * scaledFontSize * 0.6 + LABEL_PADDING_H * 2
  );
  const labelHeight = scaledFontSize + LABEL_PADDING_V * 2;
  const labelX = x - labelWidth / 2;
  const labelY = y + LABEL_OFFSET_Y;

  return (
    <Group listening={false}>
      <Circle
        x={x}
        y={y}
        radius={CURSOR_DOT_RADIUS}
        fill={fillColor}
        stroke='#fff'
        strokeWidth={1.5}
      />
      <Rect
        x={labelX}
        y={labelY}
        width={labelWidth}
        height={labelHeight}
        fill='rgba(255,255,255,0.9)'
        cornerRadius={4}
        shadowColor='#000'
        shadowBlur={2}
        shadowOpacity={0.15}
      />
      <Text
        x={labelX + LABEL_PADDING_H}
        y={labelY + LABEL_PADDING_V}
        width={labelWidth - LABEL_PADDING_H * 2}
        text={label}
        fontSize={scaledFontSize}
        fill='#374151'
        align='center'
        ellipsis
      />
    </Group>
  );
}
