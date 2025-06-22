// benchmarks/example.bench.ts

describe('String Matching', () => {
  beforeAll(() => {
    console.log('\n--- Starting String Matching Benchmarks ---');
  });

  afterAll(() => {
    console.log('--- Finished String Matching Benchmarks ---\n');
  });

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

  describe('Nested Suite', () => {
    bench('Nested Benchmark', () => {
      // This benchmark should run because the suite is focused
    });
  });
});

describe('Array Sorting', () => {
  const unsorted = Array.from({ length: 1000 }, () => Math.random());

  bench('Array.prototype.sort()', () => {
    const arr = [...unsorted];
    arr.sort((a, b) => a - b);
  });

  bench.skip('Bubble Sort (skipped)', () => {
    const arr = [...unsorted];
    // A classic, but inefficient, sorting algorithm
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        }
      }
    }
  });

  bench.todo('Implement Quick Sort');
});

describe('Focused Suite', () => {
    bench('A benchmark in a focused suite', () => {
        // This benchmark should run because the suite is focused
    });

    bench('Another benchmark in a focused suite', () => {
        // This one should also run
    })
})

describe('Unfocused Suite', () => {
    bench('A benchmark in an unfocused suite', () => {
        // This benchmark should be skipped
    })
}) 