import {
  describe as describeFn,
  bench as benchFn,
  beforeAll as beforeAllFn,
  afterAll as afterAllFn,
  beforeEach as beforeEachFn,
  afterEach as afterEachFn,
} from '../api/globals';

declare global {
  const describe: typeof describeFn;
  const bench: typeof benchFn;
  const beforeAll: typeof beforeAllFn;
  const afterAll: typeof afterAllFn;
  const beforeEach: typeof beforeEachFn;
  const afterEach: typeof afterEachFn;
}

export {};
