import mongoose from 'mongoose';
import { logger } from '../../shared/lib/logger';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export const connectDatabase = async (): Promise<void> => {
  const uri = process.env['MONGODB_URI'];
  if (!uri) {
    logger.warn('MONGODB_URI not set — skipping database connection');
    return;
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri);
      logger.info('Connected to MongoDB');
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`MongoDB connection attempt ${String(attempt)} failed`, { error: message });

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  logger.error(`Failed to connect to MongoDB after ${String(MAX_RETRIES)} attempts`);
  process.exit(1);
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB');
};
