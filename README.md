# benchpress

A simple benchmarking framework for javascript, inspired by Jest.

## Installation

Using npm:
```bash
npm install -D benchpress
```

Using pnpm:
```bash
pnpm add -D benchpress
```

Using yarn:
```bash
yarn add -D benchpress
```

## Getting Started

Create a benchmark file, for example `benchmarks/my-benchmark.bench.ts`:

```typescript
// benchmarks/my-benchmark.bench.ts

describe('My Awesome Feature', () => {
  bench('should be fast', () => {
    // your code to benchmark here
  });
});
```

Then, add a script to your `package.json`:

```json
{
  "scripts": {
    "bench": "benchpress"
  }
}
```

Now you can run your benchmarks:

```bash
npm run bench
```

## CLI

The `benchpress` CLI is the primary way to run your benchmarks.

```bash
npx benchpress [options]
```

By default, it will look for files matching `benchmarks/**/*.bench.ts`.

### Options

| Option                             | Description                                            | Default                       |
| ---------------------------------- | ------------------------------------------------------ | ----------------------------- |
| `-p, --pattern <glob>`             | Glob pattern to find benchmark files.                  | `benchmarks/**/*.bench.ts`    |
| `-r, --reporter <pretty¦json>`     | Output reporter.                                       | `pretty`                      |
| `-o, --output <file>`              | File path for the JSON output reporter.                |                               |
| `-w, --watch`                      | Re-run benchmarks when files change.                   | `false`                       |
| `-g, --grep <pattern>`             | Run only benchmarks with names matching the pattern.   |                               |


## API

The API is designed to be similar to Jest. Your benchmark files will have access to the following global functions.

### `describe(name, fn)`

`describe` creates a block that groups together several related benchmarks.

```typescript
describe('Array', () => {
  // benchmarks for arrays
});
```

### `bench(name, fn, options?)`

`bench` runs a single benchmark. The second argument is the function to be benchmarked.

```typescript
bench('Array.prototype.map', () => {
  [1, 2, 3].map(n => n * 2);
});
```

`options` is an optional object from `tinybench` that you can pass to customize the benchmark behavior.

### `.only`, `.skip`, `.todo`

You can control which benchmarks and suites to run by using `.only` and `.skip`.

*   `describe.only` and `bench.only` will cause only those suites/benchmarks to be run.
*   `describe.skip` and `bench.skip` will cause those suites/benchmarks to be skipped.
*   `bench.todo` will mark a benchmark as not yet implemented. It will be reported as "todo" in the results.

```typescript
describe.only('My focused suite', () => {
  // ...
});

bench.skip('This one is skipped', () => {
  // ...
});

bench.todo('Implement this later');
```

### Hooks

You can use hooks to set up and tear down things for your benchmarks.

*   `beforeAll(fn)`: Runs once before all benchmarks in a suite.
*   `afterAll(fn)`: Runs once after all benchmarks in a suite.
*   `beforeEach(fn)`: Runs before each benchmark in a suite.
*   `afterEach(fn)`: Runs after each benchmark in a suite.

```typescript
describe('My suite', () => {
  let data;

  beforeAll(() => {
    // one-time setup
    data = heavySetup();
  });

  beforeEach(() => {
    // runs before each benchmark
  });
});
```

## Examples

### Example Benchmark File

Here is an example demonstrating various features.

`benchmarks/string-matching.bench.ts`
```typescript
describe('String Matching', () => {
  const text = 'Hello, world! This is a test string.';
  const pattern = 'world';

  bench('String.prototype.includes()', () => {
    text.includes(pattern);
  });

  bench('String.prototype.indexOf()', () => {
    text.indexOf(pattern);
  });

  bench('RegExp.prototype.test()', () => {
    /world/.test(text);
  });
});
```

### JSON Reporter

To use the JSON reporter, specify it with `-r json` and provide an output file with `-o`.

```bash
npx benchpress -r json -o benchmark-results.json
```

This will run the benchmarks and save the results to `benchmark-results.json`.

## Example Output

Here is an example of the output from the `pretty` reporter when running the default `example.bench.ts`:

```
benchmarks/example.bench.ts
  │
  ├─ String Matching
  │  ✓ String.prototype.includes()                  124 ns/op ±0.75%   8,469,732 ops/sec ±0.01% (8054305 samples)
  │  ✓ String.prototype.indexOf()                   122 ns/op ±4.96%   8,866,879 ops/sec ±0.01% (8225248 samples)
  │  ✓ RegExp.prototype.test()                      141 ns/op ±6.67%   7,573,798 ops/sec ±0.01% (7086263 samples)
  │
  ├─ String Matching › Nested Suite
  │  ✓ Nested Benchmark                             120 ns/op ±2.15%   8,902,659 ops/sec ±0.01% (8354770 samples)
  │
  ├─ Array Sorting
  │  ✓ Array.prototype.sort()                   116,022 ns/op ±0.19%       8,646 ops/sec ±0.07% (8620 samples)
  │
  ├─ Focused Suite
  │  ✓ A benchmark in a focused suite             1,592 ns/op ±0.03%     629,446 ops/sec ±0.01% (628172 samples)
  │  ✓ Another benchmark in a focused suite         120 ns/op ±0.18%   8,772,122 ops/sec ±0.01% (8345901 samples)
  │
  └─ Unfocused Suite
     ✓ A benchmark in an unfocused suite            118 ns/op ±0.19%   8,919,095 ops/sec ±0.01% (8458254 samples)
```
