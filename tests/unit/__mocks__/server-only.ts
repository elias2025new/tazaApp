// Mock for 'server-only' in Vitest tests.
// In Next.js, this package throws if imported in a client context.
// In Vitest, we run in Node and don't have that restriction.
// This file is a no-op so tests can import server-only modules without errors.
export {};
