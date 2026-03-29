import '@testing-library/jest-dom'
import { fn, spyOn, mock } from '@jest/globals'

// Shim vitest's vi for compatibility with existing test files
global.vi = {
  fn,
  spyOn,
  mock,
} as any
