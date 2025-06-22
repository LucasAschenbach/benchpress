import type { BenchCase, Suite, Fn } from '../api/globals.js';
import type { BenchOptions } from 'tinybench';

export class GlobalCollector {
  /** root is a virtual suite that never runs */
  private root: Suite = {
    name: '[root]',
    benches: [],
    children: [],
    hooks: { beforeAll: [], afterAll: [], beforeEach: [], afterEach: [] },
    mode: 'run'
  };
  private stack: Suite[] = [this.root];
  public currentFile?: string;

  static current: GlobalCollector;
  /* --------------------------- public API --------------------------- */
  pushSuite(name: string, mode: Suite['mode'], factory: () => void, benchOptions?: BenchOptions) {
    const suite: Suite = {
      name,
      benches: [],
      children: [],
      hooks: { beforeAll: [], afterAll: [], beforeEach: [], afterEach: [] },
      mode,
      benchOptions,
      filepath: this.currentFile,
    };
    this.top.children.push(suite);
    this.stack.push(suite);
    factory();
    this.stack.pop();
  }
  pushBench(b: BenchCase) {
    b.filepath = this.currentFile;
    this.top.benches.push(b);
  }
  pushHook(k: keyof Suite['hooks'], fn: Fn) {
    this.top.hooks[k].push(fn);
  }
  /** snapshot used by runner */
  get tree() { return this.root; }

  private get top() { return this.stack[this.stack.length - 1]; }
}
