import "dotenv/config";
import db from "@/db/drizzle";
import { grantReward, spendCoins, setEconomy } from "@/lib/economy";
import { userProgress, rewardEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

async function verifyIdempotency() {
  console.log("🧪 Starting Economy Service Idempotency Tests\n");

  const testUserId = "test-user-" + Date.now();

  try {
    console.log("1️⃣ Creating test user...");
    await db.insert(userProgress).values({
      userId: testUserId,
      userName: "Test User",
      userImageSrc: "/test.png",
      hearts: 5,
      points: 0,
      coins: 100,
    });
    console.log("✅ Test user created\n");

    console.log("2️⃣ Testing grantReward idempotency...");
    const idempotencyKey = "test-grant-" + Date.now();

    const result1 = await grantReward(
      testUserId,
      { xp: 10, hearts: 1 },
      "CHALLENGE_SUCCESS",
      {
        challengeId: 1,
        idempotencyKey,
      },
    );
    console.log("   First call result:", result1);

    const result2 = await grantReward(
      testUserId,
      { xp: 10, hearts: 1 },
      "CHALLENGE_SUCCESS",
      {
        challengeId: 1,
        idempotencyKey,
      },
    );
    console.log("   Second call result:", result2);

    if (
      result1.hearts === result2.hearts &&
      result1.points === result2.points &&
      result1.coins === result2.coins
    ) {
      console.log("✅ Idempotency check passed - values unchanged on retry\n");
    } else {
      console.log("❌ Idempotency check FAILED - values changed on retry\n");
    }

    const events = await db
      .select()
      .from(rewardEvents)
      .where(eq(rewardEvents.userId, testUserId));

    console.log(`   Total reward events created: ${events.length}`);
    if (events.length === 1) {
      console.log("✅ Only one event created (idempotency working)\n");
    } else {
      console.log(
        "❌ Multiple events created (idempotency NOT working)\n",
      );
    }

    console.log("3️⃣ Testing spendCoins idempotency...");
    const spendKey = "test-spend-" + Date.now();

    const spend1 = await spendCoins(testUserId, 20, "SHOP_PURCHASE", {
      itemId: "test-item",
      idempotencyKey: spendKey,
    });
    console.log("   First spend result:", spend1);

    const spend2 = await spendCoins(testUserId, 20, "SHOP_PURCHASE", {
      itemId: "test-item",
      idempotencyKey: spendKey,
    });
    console.log("   Second spend result:", spend2);

    if (spend1.coins === spend2.coins) {
      console.log("✅ Spend idempotency check passed\n");
    } else {
      console.log("❌ Spend idempotency check FAILED\n");
    }

    console.log("4️⃣ Testing setEconomy idempotency...");
    const setKey = "test-set-" + Date.now();

    const set1 = await setEconomy(
      testUserId,
      { hearts: 3, xp: 50, coins: 75 },
      "SYSTEM_ADJUST",
      {
        reason: "test adjustment",
        idempotencyKey: setKey,
      },
    );
    console.log("   First set result:", set1);

    const set2 = await setEconomy(
      testUserId,
      { hearts: 3, xp: 50, coins: 75 },
      "SYSTEM_ADJUST",
      {
        reason: "test adjustment",
        idempotencyKey: setKey,
      },
    );
    console.log("   Second set result:", set2);

    if (
      set1.hearts === set2.hearts &&
      set1.points === set2.points &&
      set1.coins === set2.coins
    ) {
      console.log("✅ SetEconomy idempotency check passed\n");
    } else {
      console.log("❌ SetEconomy idempotency check FAILED\n");
    }

    console.log("5️⃣ Verifying all events have proper before/after snapshots...");
    const allEvents = await db
      .select()
      .from(rewardEvents)
      .where(eq(rewardEvents.userId, testUserId));

    let snapshotsPassed = true;
    for (const event of allEvents) {
      if (
        event.beforeHearts === null ||
        event.afterHearts === null ||
        event.beforeXp === null ||
        event.afterXp === null ||
        event.beforeCoins === null ||
        event.afterCoins === null
      ) {
        console.log(`❌ Event ${event.id} missing snapshots`);
        snapshotsPassed = false;
      }
    }

    if (snapshotsPassed) {
      console.log("✅ All events have complete before/after snapshots\n");
    }

    console.log("6️⃣ Testing clamping rules...");
    await grantReward(
      testUserId,
      { hearts: 100 },
      "SYSTEM_ADJUST",
      {
        reason: "test max hearts",
      },
    );

    const afterMaxHearts = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, testUserId),
    });

    if (afterMaxHearts && afterMaxHearts.hearts <= 5) {
      console.log(
        `✅ Hearts clamped correctly (${afterMaxHearts.hearts} <= 5)\n`,
      );
    } else {
      console.log(
        `❌ Hearts NOT clamped (${afterMaxHearts?.hearts} > 5)\n`,
      );
    }

    await grantReward(
      testUserId,
      { hearts: -100 },
      "SYSTEM_ADJUST",
      {
        reason: "test min hearts",
      },
    );

    const afterMinHearts = await db.query.userProgress.findFirst({
      where: eq(userProgress.userId, testUserId),
    });

    if (afterMinHearts && afterMinHearts.hearts >= 0) {
      console.log(
        `✅ Hearts clamped to minimum correctly (${afterMinHearts.hearts} >= 0)\n`,
      );
    } else {
      console.log(
        `❌ Hearts NOT clamped to minimum (${afterMinHearts?.hearts} < 0)\n`,
      );
    }

    console.log("7️⃣ Final event audit...");
    const finalEvents = await db
      .select()
      .from(rewardEvents)
      .where(eq(rewardEvents.userId, testUserId));

    console.log(`   Total events created: ${finalEvents.length}`);
    console.log("\n   Event Summary:");
    for (const event of finalEvents) {
      console.log(
        `   - ${event.source}: ΔH=${event.deltaHearts} ΔXP=${event.deltaXp} ΔC=${event.deltaCoins}`,
      );
    }

    console.log("\n✅ All tests completed!");
  } catch (error) {
    console.error("\n❌ Test failed with error:", error);
  } finally {
    console.log("\n🧹 Cleaning up test data...");
    await db.delete(rewardEvents).where(eq(rewardEvents.userId, testUserId));
    await db.delete(userProgress).where(eq(userProgress.userId, testUserId));
    console.log("✅ Cleanup complete");
    process.exit(0);
  }
}

verifyIdempotency();
