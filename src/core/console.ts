let originalStdoutWrite: typeof process.stdout.write | null = null;
let originalStderrWrite: typeof process.stderr.write | null = null;

const noop = () => true;

/**
 * Silences console output by redirecting stdout and stderr to a no-op function.
 */
export function silenceConsole() {
  originalStdoutWrite = process.stdout.write;
  originalStderrWrite = process.stderr.write;

  process.stdout.write = noop as any;
  process.stderr.write = noop as any;
}

/**
 * Restores the original console output functions.
 */
export function restoreConsole() {
  if (originalStdoutWrite) {
    process.stdout.write = originalStdoutWrite;
    originalStdoutWrite = null;
  }
  if (originalStderrWrite) {
    process.stderr.write = originalStderrWrite;
    originalStderrWrite = null;
  }
} 