export const logger = {
  info: (message: string, data?: Record<string, unknown>): void => {
    const entry = data ? `${message} ${JSON.stringify(data)}` : message;
    process.stdout.write(`[INFO] ${entry}\n`);
  },

  warn: (message: string, data?: Record<string, unknown>): void => {
    const entry = data ? `${message} ${JSON.stringify(data)}` : message;
    process.stderr.write(`[WARN] ${entry}\n`);
  },

  error: (message: string, data?: Record<string, unknown>): void => {
    const entry = data ? `${message} ${JSON.stringify(data)}` : message;
    process.stderr.write(`[ERROR] ${entry}\n`);
  },
};
