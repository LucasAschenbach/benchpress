import { Command } from 'commander';
import fg from 'fast-glob';
import { pathToFileURL } from 'node:url';
import { run } from './core/runner.js';
import { GlobalCollector } from './core/collector.js';
import { resolve } from 'pathe';
import './api/globals.js';

export async function createInterface() {
  const program = new Command()
    .option('-r, --reporter <pretty|json>', 'output format', 'pretty')
    .option('-o, --output <file>', 'json output path')
    .option('-p, --pattern <glob>', 'glob pattern', 'benchmarks/**/*.bench.ts')
    .option('-w, --watch', 're-run on file change')
    .option('-g, --grep <pattern>', 'run only benchmarks with matching names')
    .parse(process.argv);

  const { reporter, output, pattern, watch, grep } = program.opts();

  if (reporter === 'json' && !output) {
    console.error('Error: --output <file> is required for json reporter');
    process.exit(1);
  }

  async function runOnce() {
    GlobalCollector.current = new GlobalCollector(); // reset
    const files = await fg(pattern);
    // Dynamically import each benchmark file so its describe/bench calls register.
    for (const file of files) {
      GlobalCollector.current.currentFile = file;
      await import(pathToFileURL(resolve(file)).href);
    }
    await run(GlobalCollector.current.tree, {
      reporter,
      jsonOut: output,
      grep,
    }, files);
  }

  if (watch) {
    const { watch } = await import('node:fs');
    await runOnce();
    const watcher = watch('.', { recursive: true }, (evt, filename) => {
      if (filename && filename.endsWith('.bench.ts')) runOnce();
    });
    process.on('SIGINT', () => watcher.close());
  } else {
    await runOnce();
  }
}
