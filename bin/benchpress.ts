#!/usr/bin/env -S node --import tsx
/**
 * Thin CLI wrapper:
 *  1. Registers commander & parses flags
 *  2. Hands off to the core runner in src/
 */
import { createInterface } from '../src/cli';
import '../src/api/globals.js';

createInterface().catch(err => {
  console.error(err);
  process.exit(1);
});
