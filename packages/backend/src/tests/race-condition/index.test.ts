// "index.test.ts"
// Race Condition Test Suite Entry Point
// Run: bun test src/tests/race-condition/

import { describe } from "bun:test";

// Import all test suites
import './basic-race-condition.test';
import './payment-rollback.test';
import './multiple-products.test';

describe("🏁 Race Condition Test Suite", () => {
  console.log(`
🏁 Race Condition Test Suite
============================

Running comprehensive tests for:
✅ Basic stock race condition prevention
✅ Payment failure and stock rollback
✅ Multiple products concurrent operations

🔒 Testing database-level race condition handling
🎯 Ensuring stock integrity under concurrent load
🔄 Validating rollback mechanisms
  `);
});