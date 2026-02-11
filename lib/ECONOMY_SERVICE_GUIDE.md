# Economy Service Usage Guide

## Overview
The economy service (`@d:\Under work now\2025\Programming\Projects\projects\codengo_v2\lib\economy.ts`) is the **single source of truth** for all hearts/xp/coins changes in the application.

## ⚠️ Critical Rules

1. **NEVER** directly update `userProgress.hearts`, `userProgress.points`, or `userProgress.coins`
2. **ALWAYS** use the economy service functions
3. **ALWAYS** provide an idempotency key for user-triggered actions
4. **ALWAYS** use appropriate source enums

## Functions

### `grantReward(userId, payload, source, meta)`

Adds hearts/xp/coins to a user's balance.

```typescript
import { grantReward } from "@/lib/economy";

// Example: Reward for completing a challenge
await grantReward(
  userId,
  { 
    hearts: 1,  // optional
    xp: 10,     // optional
    coins: 5    // optional
  },
  "CHALLENGE_SUCCESS",
  {
    challengeId: 123,
    lessonId: 456,
    idempotencyKey: `challenge:${challengeId}:complete:${userId}`,
  }
);
```

**When to use:**
- Challenge completion (first time or practice)
- Lesson completion rewards
- Shop purchases (granting items)
- Any operation that increases economy values

**Clamping:**
- Hearts: clamped to 0-5
- XP: clamped to minimum 0
- Coins: clamped to minimum 0

---

### `spendCoins(userId, amount, source, meta)`

Deducts coins from a user's balance.

```typescript
import { spendCoins } from "@/lib/economy";

// Example: Purchase hearts from shop
await spendCoins(
  userId,
  50, // amount to spend
  "SHOP_PURCHASE",
  {
    itemId: "hearts:5",
    orderId: `${userId}:${Date.now()}`,
    idempotencyKey: `shop:hearts:${orderId}:spend`,
  }
);
```

**When to use:**
- Shop purchases
- Spending coins on any feature

**Validation:**
- Throws error if insufficient coins
- Atomic transaction ensures safety

---

### `setEconomy(userId, nextValues, source, meta)`

Sets absolute values for hearts/xp/coins (admin/system use).

```typescript
import { setEconomy } from "@/lib/economy";

// Example: Admin adjustment or migration
await setEconomy(
  userId,
  { 
    hearts: 5,
    xp: 100,
    coins: 50
  },
  "SYSTEM_ADJUST",
  {
    reason: "Manual correction",
    idempotencyKey: `admin:adjust:${userId}:${timestamp}`,
  }
);
```

**When to use:**
- Admin manual adjustments
- Data migrations
- System corrections

**Note:** Computes deltas automatically (next - before)

---

## Source Enums

| Source | Usage |
|--------|-------|
| `CHALLENGE_SUCCESS` | First-time challenge completion |
| `CHALLENGE_FAIL` | Wrong answer (reduce hearts) |
| `PRACTICE` | Practice mode completion |
| `SHOP_PURCHASE` | Any shop transaction |
| `SYSTEM_ADJUST` | Admin/system adjustments |
| `MIGRATION` | Data migrations |
| `LESSON_COMPLETE` | Lesson completion (future) |

---

## Idempotency Keys

### Static Keys (One-Time Operations)
Use for operations that should only happen once:

```typescript
// Challenge completion (per user)
`challenge:${challengeId}:complete:${userId}`

// Lesson completion (per user)
`lesson:${lessonId}:complete:${userId}`
```

### Dynamic Keys (Repeatable Operations)
Use timestamp for operations that can happen multiple times:

```typescript
// Wrong answer (can happen multiple times)
`challenge:${challengeId}:fail:${userId}:${Date.now()}`

// Shop purchase (each purchase is unique)
`shop:${itemId}:${orderId}:${Date.now()}`

// Practice completion (can repeat)
`practice:${challengeId}:${userId}:${Date.now()}`
```

### Compound Operations
For operations with multiple steps, use different suffixes:

```typescript
// Shop purchase: spend coins
`shop:hearts:${orderId}:spend`

// Shop purchase: grant hearts
`shop:hearts:${orderId}:grant`
```

---

## Meta Field

The `meta` parameter accepts:

```typescript
interface RewardMeta {
  courseId?: number;
  lessonId?: number;
  unitId?: number;
  challengeId?: number;
  reason?: string;
  idempotencyKey?: string;
  itemId?: string;
  orderId?: string;
  attemptId?: string;
}
```

**Best Practices:**
- Include relevant IDs for debugging
- Add `reason` for SYSTEM_ADJUST operations
- Always include `idempotencyKey` for user actions

---

## Examples

### Challenge Completion (First Time)
```typescript
await grantReward(
  userId,
  { 
    hearts: shouldAddHeart ? 1 : 0,
    xp: 10 
  },
  "CHALLENGE_SUCCESS",
  {
    challengeId,
    lessonId,
    idempotencyKey: `challenge:${challengeId}:complete:${userId}`,
  }
);
```

### Wrong Answer
```typescript
await grantReward(
  userId,
  { hearts: -1 },
  "CHALLENGE_FAIL",
  {
    challengeId,
    lessonId,
    idempotencyKey: `challenge:${challengeId}:fail:${userId}:${Date.now()}`,
  }
);
```

### Practice Mode
```typescript
await grantReward(
  userId,
  { 
    hearts: 1,
    xp: 10 
  },
  "PRACTICE",
  {
    challengeId,
    lessonId,
    idempotencyKey: `practice:${challengeId}:${userId}:${Date.now()}`,
  }
);
```

### Shop Purchase
```typescript
const orderId = `${userId}:${Date.now()}`;

// Step 1: Spend coins
await spendCoins(userId, price, "SHOP_PURCHASE", {
  itemId: `hearts:${amount}`,
  orderId,
  idempotencyKey: `shop:hearts:${orderId}:spend`,
});

// Step 2: Grant hearts
await grantReward(userId, { hearts: amount }, "SHOP_PURCHASE", {
  itemId: `hearts:${amount}`,
  orderId,
  idempotencyKey: `shop:hearts:${orderId}:grant`,
});
```

---

## Debugging

### View Economy Events
```typescript
import { rewardEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

// Get all events for a user
const events = await db
  .select()
  .from(rewardEvents)
  .where(eq(rewardEvents.userId, userId))
  .orderBy(rewardEvents.createdAt);
```

### Development Logs
In development mode, all economy operations log:
```
[ECONOMY] source=CHALLENGE_SUCCESS userId=user123 deltaHearts=1 deltaXp=10 deltaCoins=0
```

---

## Transaction Safety

All economy functions use database transactions:
- Read current state
- Compute changes
- Write updates + event record
- Commit or rollback atomically

This prevents:
- Race conditions
- Partial updates
- Inconsistent state

---

## Testing

Run the verification script:
```bash
npx tsx scripts/verify-economy.ts
```

Tests:
- Idempotency for all functions
- Clamping rules
- Before/after snapshots
- Event audit trail
