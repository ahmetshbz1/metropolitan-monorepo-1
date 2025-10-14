//  "run-all-tests.ts"
//  metropolitan backend
//  Test runner script to execute all critical tests

import { $ } from "bun";

console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         METROPOLITAN PLATFORM - TEST SUITE                ║
║         Production Readiness Validation                   ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

const testSuites = [
  {
    name: "Critical Features",
    file: "src/tests/critical-features.test.ts",
    description: "Admin locks, Redis sync, rollback strategies",
  },
  {
    name: "Payment Webhook Flow",
    file: "src/tests/payment-webhook-flow.test.ts",
    description: "Payment success/failure, stock rollback, idempotency",
  },
  {
    name: "Redis Stock Management",
    file: "src/tests/redis-stock/index.test.ts",
    description: "Stock reservation, distributed locking",
  },
  {
    name: "Race Conditions",
    file: "src/tests/race-condition/index.test.ts",
    description: "Concurrent operations, data consistency",
  },
  {
    name: "Webhook Idempotency",
    file: "src/tests/webhook-idempotency.test.ts",
    description: "Duplicate webhook handling",
  },
];

async function runTests() {
  console.log("🔍 Running test suites...\n");

  let totalPassed = 0;
  let totalFailed = 0;

  for (const suite of testSuites) {
    console.log(`\n📋 ${suite.name}`);
    console.log(`   ${suite.description}`);
    console.log(`   File: ${suite.file}`);
    console.log("   " + "─".repeat(50));

    try {
      await $`bun test ${suite.file}`.quiet();
      console.log(`   ✅ PASSED\n`);
      totalPassed++;
    } catch (error) {
      console.log(`   ❌ FAILED\n`);
      totalFailed++;
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log("\n📊 TEST SUMMARY");
  console.log("═".repeat(60));
  console.log(`Total Test Suites: ${testSuites.length}`);
  console.log(`Passed: ${totalPassed} ✅`);
  console.log(`Failed: ${totalFailed} ❌`);

  if (totalFailed === 0) {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║                  🎉 ALL TESTS PASSED! 🎉                  ║
║                                                            ║
║           Platform is PRODUCTION READY ✅                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);
    process.exit(0);
  } else {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║              ⚠️  SOME TESTS FAILED  ⚠️                    ║
║                                                            ║
║        Please fix failing tests before deployment         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);
    process.exit(1);
  }
}

runTests();
