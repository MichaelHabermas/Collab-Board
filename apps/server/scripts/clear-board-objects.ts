/**
 * One-time script: deletes all board objects for the default board.
 * Run from repo root: bun run --cwd apps/server scripts/clear-board-objects.ts
 * Requires MONGODB_URI in env (e.g. from .env).
 */
/// <reference types="node" />
import { connectDatabase, disconnectDatabase } from '../src/modules/board/db';
import { BoardObjectModel } from '../src/modules/board/object.model';

const DEFAULT_BOARD_ID = 'default-board';

async function main(): Promise<void> {
  await connectDatabase();
  const result = await BoardObjectModel.deleteMany({ boardId: DEFAULT_BOARD_ID });
  await disconnectDatabase();
  process.stdout.write(
    `Deleted ${result.deletedCount} object(s) from board "${DEFAULT_BOARD_ID}".\n`
  );
}

main().catch((err) => {
  process.stderr.write(String(err));
  process.exit(1);
});
