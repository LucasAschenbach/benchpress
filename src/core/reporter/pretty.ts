import chalk from 'chalk';
import type { Bench, Task } from 'tinybench';
import { basename, dirname } from 'node:path';

type PrettyResult = { suitePath: string[]; bench: Bench; filepath?: string };

export class PrettyReporter {
  private results: PrettyResult[] = [];
  private linesToClear = 0;

  public update(result: PrettyResult) {
    this.results.push(result);
    this.render();
  }

  private render() {
    if (this.linesToClear > 0) {
      process.stdout.moveCursor(0, -this.linesToClear);
      process.stdout.clearScreenDown();
    }

    const allTasks = this.results.flatMap(r => r.bench.tasks);
    const nameColWidth = Math.max(...allTasks.map(t => t.name.length)) + 2;

    const resultsByFile = this.results.reduce(
      (acc, result) => {
        const key = result.filepath ?? 'no-file';
        (acc[key] ??= []).push(result);
        return acc;
      },
      {} as Record<string, PrettyResult[]>,
    );

    let linesRendered = 0;
    for (const [filepath, results] of Object.entries(resultsByFile)) {
      if (filepath !== 'no-file') {
        const formattedPath =
          chalk.dim(dirname(filepath) + '/') + chalk.bold(basename(filepath));
        console.log(`\n${formattedPath}`);
        console.log(`  ${chalk.dim('│')}`);
        linesRendered += 3;
      }
      for (const [i, result] of results.entries()) {
        linesRendered += this.printSuite(
          result,
          nameColWidth,
          i === results.length - 1,
        );
      }
    }
    this.linesToClear = linesRendered;
  }

  private printSuite(
    { suitePath, bench }: PrettyResult,
    nameColWidth: number,
    isLast: boolean,
  ): number {
    let lineCount = 0;
    const suiteName = suitePath.join(chalk.dim(' › '));
    const tasksWithResult = bench.tasks.filter((t): t is Task & { result: NonNullable<Task['result']> } => !!t.result);
    if (tasksWithResult.length === 0) {
      return 0;
    }

    const suitePrefix = isLast ? '└─' : '├─';
    console.log(`  ${chalk.dim(suitePrefix)} ${chalk.bold(suiteName)}`);
    lineCount += 1;

    const taskPrefix = isLast ? '  ' : '│ ';
    for (const task of tasksWithResult) {
      const { result } = task;

      const formatNs = (ns: number) => ns.toLocaleString(undefined, { maximumFractionDigits: 0 });
      const formatOps = (ops: number) => ops.toLocaleString(undefined, { maximumFractionDigits: 0 });

      const name = task.name.padEnd(nameColWidth);
      const avgNs = formatNs(result.latency.mean * 1_000_000).padStart(10);
      const latencyRme = result.latency.rme.toFixed(2);
      const ops = formatOps(result.throughput.mean).padStart(10);
      const throughputRme = result.throughput.rme.toFixed(2);
      const samples = result.latency.samples.length;

      console.log(
        `  ${chalk.dim(taskPrefix)} ${chalk.green('✓')} ${chalk.cyan(name)}${chalk.green(
          avgNs,
        )} ns/op ${chalk.dim(`±${latencyRme}%`)}  ${chalk.yellow(
          ops,
        )} ops/sec ${chalk.dim(`±${throughputRme}%`)} ${chalk.dim(
          `(${samples} samples)`,
        )}`,
      );
      lineCount++;
    }

    if (!isLast) {
      console.log(`  ${chalk.dim('│')}`);
      lineCount++;
    }

    return lineCount;
  }
}
