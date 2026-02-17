import type { ReactElement } from 'react';
import { Circle, Line, Text } from 'react-konva';
import { useRemoteCursors, useCurrentUserId } from '@/hooks/useRemoteCursors';
import { getCursorColorForUserId } from '@/lib/cursor-color';
import type { IRemoteCursor } from '@/hooks/useRemoteCursors';

const CURSOR_SIZE = 8;
const ARROW_LENGTH = 12;
const LABEL_OFFSET_Y = 14;
const LABEL_FONT_SIZE = 12;
const LABEL_PADDING = 4;

export interface ICursorOverlayProps {
  stageScale: number;
}

/**
 * Renders remote user cursors on the cursor layer. Excludes current user.
 * Name label scales with zoom so it stays readable.
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
  const label = name ?? cursor.userId.slice(0, 8);
  const scaledFontSize = Math.max(10, LABEL_FONT_SIZE / stageScale);

  return (
    <>
      <Circle x={x} y={y} radius={CURSOR_SIZE / 2} fill={fillColor} listening={false} />
      <Line
        points={[x, y, x, y - ARROW_LENGTH]}
        stroke={fillColor}
        strokeWidth={2}
        listening={false}
      />
      <Text
        x={x - 40}
        y={y + LABEL_OFFSET_Y}
        width={80}
        text={label}
        fontSize={scaledFontSize}
        fill={fillColor}
        listening={false}
        align='center'
        padding={LABEL_PADDING}
      />
    </>
  );
}
