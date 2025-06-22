/* eslint-disable @typescript-eslint/ban-types */
import { GlobalCollector } from '../core/collector.js';
import type { BenchOptions } from 'tinybench';

export type Fn = () => void | Promise<void>;
type Mode = 'run' | 'skip' | 'only' | 'todo';

export interface BenchCase {
  name: string;
  fn: Fn;
  options?: BenchOptions;
  mode: Mode;
  filepath?: string;
}

export interface Suite {
  name: string;
  benches: BenchCase[];
  children: Suite[];
  hooks: Record<'beforeAll' | 'afterAll' | 'beforeEach' | 'afterEach', Fn[]>;
  mode: 'run' | 'skip' | 'only';
  benchOptions?: BenchOptions;
  filepath?: string;
}

/* ---------- DSL helpers ---------- */

export function describe(name: string, factory: () => void): void;
export function describe(
  name: string,
  options: BenchOptions,
  factory: () => void
): void;
export function describe(name: string, ...args: any[]): void {
  const [factory, options] =
    args.length === 1 ? [args[0], undefined] : [args[1], args[0]];
  GlobalCollector.current.pushSuite(name, 'run', factory, options);
}
describe.skip = (name: string, factory: () => void) => {
  GlobalCollector.current.pushSuite(name, 'skip', factory);
};
describe.only = (name: string, factory: () => void) => {
  GlobalCollector.current.pushSuite(name, 'only', factory);
};

export function bench(name: string, fn: Fn, options?: BenchOptions) {
  GlobalCollector.current.pushBench({ name, fn, options, mode: 'run' });
}
bench.skip = (name: string, fn: Fn, options?: BenchOptions) =>
  GlobalCollector.current.pushBench({ name, fn, options, mode: 'skip' });
bench.only = (name: string, fn: Fn, options?: BenchOptions) =>
  GlobalCollector.current.pushBench({ name, fn, options, mode: 'only' });
bench.todo = (name: string) =>
  GlobalCollector.current.pushBench({ name, fn: () => void 0, mode: 'todo' });

export const beforeAll  = (fn: Fn) => GlobalCollector.current.pushHook('beforeAll', fn);
export const afterAll   = (fn: Fn) => GlobalCollector.current.pushHook('afterAll', fn);
export const beforeEach = (fn: Fn) => GlobalCollector.current.pushHook('beforeEach', fn);
export const afterEach  = (fn: Fn) => GlobalCollector.current.pushHook('afterEach', fn);

Object.assign(globalThis, {
  describe,
  bench,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
});
