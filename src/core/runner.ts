import { Bench, type BenchOptions, type Task } from 'tinybench';
import { PrettyReporter } from './reporter/pretty.js';
import { json as jsonReporter, type BenchResult } from './reporter/json.js';
import type { Suite } from '../api/globals.js';
import chalk from 'chalk';
import { restoreConsole, silenceConsole } from './console.js';

interface RunOpts {
  reporter: 'pretty' | 'json';
  jsonOut?: string;
  grep?: string;
}

export async function run(tree: Suite, opts: RunOpts, files: string[]) {
  const jsonResults: BenchResult[] = [];
  const prettyReporter = opts.reporter === 'pretty' ? new PrettyReporter() : null;
  const todoBenches: string[] = [];
  const grepRegex = opts.grep ? new RegExp(opts.grep) : null;
  const onlyMode = hasOnly(tree);

  const stats = {
    runCount: 0,
    skipCount: 0,
    todoCount: 0,
    suiteRunCount: 0,
    suiteSkipCount: 0,
  }

  async function execute(suite: Suite, ancestors = [] as Suite[]): Promise<boolean> {
    if (suite.mode === 'skip') {
      stats.skipCount += countBenches(suite);
      if (suite.name !== '[root]') {
        stats.suiteSkipCount += countSuites(suite);
      }
      return false;
    };

    if (grepRegex && !grepMatches(suite, grepRegex)) {
      stats.skipCount += countBenches(suite);
      if (suite.name !== '[root]') {
        stats.suiteSkipCount += countSuites(suite);
      }
      return false;
    }
    
    const isSuiteActive =
      !onlyMode ||
      suite.mode === 'only' ||
      ancestors.some((a) => a.mode === 'only');

    if (onlyMode && !isSuiteActive && !hasOnly(suite)) {
      stats.skipCount += countBenches(suite);
      if (suite.name !== '[root]') {
        stats.suiteSkipCount += countSuites(suite);
      }
      return false;
    }

    const suiteAndAncestors = [...ancestors, suite];
    const suitePathMatches = grepRegex && suiteAndAncestors.some(s => grepRegex.test(s.name));

    const benchesToRun = suite.benches.filter(b => {
      if (b.mode === 'skip') {
        stats.skipCount++;
        return false;
      }
      if (b.mode === 'todo') {
        stats.todoCount++;
        todoBenches.push(b.name);
        return false;
      }
      if (onlyMode && b.mode !== 'only' && !isSuiteActive) {
        stats.skipCount++;
        return false;
      }
      if (grepRegex && !suitePathMatches && !grepRegex.test(b.name)) {
        stats.skipCount++;
        return false;
      }
      stats.runCount++;
      return true;
    });

    let ranSomething = benchesToRun.length > 0;

    if (benchesToRun.length > 0) {
      for (const fn of suite.hooks.beforeAll) await fn();

      const bench = new Bench(suite.benchOptions);

      for (const t of benchesToRun) {
        const taskFn = async () => {
          for (const fn of suite.hooks.beforeEach) await fn();
          await t.fn();
          for (const fn of suite.hooks.afterEach) await fn();
        };
        bench.add(t.name, taskFn);
      }

      silenceConsole();
      try {
        await bench.run();
      } finally {
        restoreConsole();
      }
      
      for (const fn of suite.hooks.afterAll) await fn();

      // reporting
      if (prettyReporter) {
        const suitePath = [...ancestors, suite].map(s => s.name).filter(n => n !== '[root]');
        prettyReporter.update({ suitePath, bench, filepath: suite.filepath });
      } else if (opts.reporter === 'json') {
        const tasks = bench.tasks.filter(t => t.result);
        if (tasks.length > 0) {
          jsonResults.push({
            suite: suite.name,
            env: { 'node-version': process.version, ...process.versions },
            tasks: tasks as BenchResult['tasks'],
          });
        }
      }
    }

    for (const child of suite.children) {
      const childRan = await execute(child, [...ancestors, suite]);
      if (childRan) {
        ranSomething = true;
      }
    }

    if (suite.name !== '[root]') {
      if (ranSomething) {
        stats.suiteRunCount++;
      } else {
        stats.suiteSkipCount++;
      }
    }
    
    return ranSomething;
  }

  const startTime = performance.now();
  await execute(tree);
  const totalTime = performance.now() - startTime;

  if (opts.reporter === 'json') {
    if(opts.jsonOut) jsonReporter(opts.jsonOut, jsonResults);
  } else {
    const { runCount, skipCount, todoCount, suiteRunCount, suiteSkipCount } = stats;
    const totalBenches = runCount + skipCount + todoCount;
    const benchesSummary = [
      runCount > 0 ? `${runCount} run` : '',
      skipCount > 0 ? `${skipCount} skip` : '',
      todoCount > 0 ? `${todoCount} todo` : '',
      `${totalBenches} total`,
    ].filter(Boolean).join(', ');
    const totalSuites = suiteRunCount + suiteSkipCount;
    const suitesSummary = [
      suiteRunCount > 0 ? `${suiteRunCount} run` : '',
      suiteSkipCount > 0 ? `${suiteSkipCount} skip` : '',
      `${totalSuites} total`,
    ].filter(Boolean).join(', ');
    const fileSummary = `${files.length} file${files.length > 1 ? 's' : ''}`;
    const time = `${(totalTime / 1000).toFixed(2)}s`;
    console.log(
      chalk.bold('\n  Suites:   ') + suitesSummary,
      chalk.bold('\n  Benches:  ') + benchesSummary,
      chalk.bold('\n  Files:    ') + fileSummary,
      chalk.bold('\n  Time:     ') + time
    );
  }
}

function hasOnly(node: Suite): boolean {
  if (node.mode === 'only') return true;
  if (node.benches.some(b => b.mode === 'only')) return true;
  return node.children.some(hasOnly);
}

function grepMatches(suite: Suite, grep: RegExp): boolean {
  if (grep.test(suite.name)) return true;
  if (suite.benches.some(b => grep.test(b.name))) return true;
  return suite.children.some(child => grepMatches(child, grep));
}

function countBenches(suite: Suite): number {
  return suite.benches.length + suite.children.reduce((acc, child) => acc + countBenches(child), 0);
}

function countSuites(suite: Suite): number {
  return 1 + suite.children.reduce((acc, child) => acc + countSuites(child), 0);
}
