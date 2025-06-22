import { writeFileSync } from 'node:fs';
import type { Bench, Task } from 'tinybench';

export interface BenchResult {
  suite: string;
  env: Record<string, unknown>;
  tasks: (Task & { result: NonNullable<Task['result']> })[];
}

export function json(path: string, results: BenchResult[]) {
  writeFileSync(path, JSON.stringify(results, null, 2));
}
