import type { ReactElement } from 'react';
import { Circle, Line } from 'react-konva';
import { useRemoteCursors, useCurrentUserId } from '@/hooks/useRemoteCursors';

const CURSOR_SIZE = 8;
const ARROW_LENGTH = 12;

/**
 * Renders remote user cursors on the cursor layer. Excludes current user.
 * Coordinates are in stage/board space.
 */
export const CursorOverlay = (): ReactElement => {
  const cursors = useRemoteCursors();
  const currentUserId = useCurrentUserId();
  const entries = Array.from(cursors.entries()).filter(([userId]) => userId !== currentUserId);

  return (
    <>
      {entries.map(([userId, { x, y }]) => (
        <CursorShape key={userId} x={x} y={y} />
      ))}
    </>
  );
};

interface ICursorShapeProps {
  x: number;
  y: number;
}

function CursorShape({ x, y }: ICursorShapeProps): ReactElement {
  return (
    <>
      <Circle x={x} y={y} radius={CURSOR_SIZE / 2} fill='#2563eb' listening={false} />
      <Line
        points={[x, y, x, y - ARROW_LENGTH]}
        stroke='#2563eb'
        strokeWidth={2}
        listening={false}
      />
    </>
  );
}
