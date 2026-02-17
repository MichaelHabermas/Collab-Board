/**
 * Returns a function that invokes fn at most once per intervalMs.
 * The last call within the interval receives the latest arguments.
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  intervalMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const run = (): void => {
    if (lastArgs === null) return;
    lastCall = Date.now();
    fn(...lastArgs);
    lastArgs = null;
    timeoutId = null;
  };

  return (...args: Parameters<T>): void => {
    lastArgs = args;
    const now = Date.now();
    const elapsed = now - lastCall;
    if (elapsed >= intervalMs && timeoutId === null) {
      run();
      return;
    }
    if (timeoutId === null) {
      timeoutId = setTimeout(run, intervalMs - elapsed);
    }
  };
}
