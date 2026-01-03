# How Rates Are Managed for Different Customers and Within Same Month

## Scenario 1: Different Rates for Different Customers ✅

**Current System:**
- Each customer has their own monthly rates
- Stored as: `monthlyRates[customerId_year_month]`
- Example:
  - Customer "ABC" in November: 500/200
  - Customer "XYZ" in November: 400/180
  - Customer "DEF" in November: 600/250

**How It Works:**
```
When creating purchase for Customer "ABC":
├─ System checks: monthlyRates["ABC_2025_10"]
├─ Finds: {milkRate: 500, yogurtRate: 200}
└─ Uses: 500/200 ✅

When creating purchase for Customer "XYZ":
├─ System checks: monthlyRates["XYZ_2025_10"]
├─ Finds: {milkRate: 400, yogurtRate: 180}
└─ Uses: 400/180 ✅
```

**This already works perfectly!** Each customer has their own rates.

---

## Scenario 2: Different Rates Within Same Month ⚠️

**The Problem:**
- Customer "ABC" in November:
  - Nov 1-15: Rate was 500/200
  - Nov 16-30: Rate changed to 550/220
- Current system uses ONE rate for entire month

**Current Behavior:**
```
Purchase on Nov 5:
├─ Uses: monthlyRates["ABC_2025_10"] = 500/200 ✅
└─ Stores: purchase.milkRate = 500, purchase.yogurtRate = 200 ✅

Purchase on Nov 20:
├─ Uses: monthlyRates["ABC_2025_10"] = 500/200 ❌ (should be 550/220)
└─ Stores: purchase.milkRate = 500, purchase.yogurtRate = 200 ❌
```

**The Solution:**
Each purchase stores its own rates when created, so:
- ✅ Historical purchases are accurate (they stored the rate used)
- ⚠️ New purchases use the monthly rate (which might be outdated)

---

## How Export Handles This ✅

**Export Function:**
- Reads actual rates from each purchase: `purchase.milkRate`, `purchase.yogurtRate`
- Groups by month
- Calculates **average** of all rates in that month
- Example:
  - Nov 1-15 purchases: average 500/200
  - Nov 16-30 purchases: average 550/220
  - Month average: 525/210

**This preserves accuracy!** Export shows what actually happened.

---

## Recommended Solutions

### Option 1: Manual Rate Override (Best for Flexibility)
Allow user to manually enter rates when creating purchase:
- Default: Use monthly rate
- Override: User can change rates before saving
- Store: The actual rates used in purchase

### Option 2: Use Most Recent Purchase Rate
When creating new purchase:
- Check: Most recent purchase for this customer
- Use: That purchase's rates (if within same month)
- Fallback: Monthly rate if no recent purchase

### Option 3: Date-Based Rate Lookup
Store rates with date ranges:
- Nov 1-15: 500/200
- Nov 16-30: 550/220
- System picks rate based on purchase date

---

## Current System Status

✅ **What Works:**
- Different customers have different rates
- Each purchase stores its own rates (preserves accuracy)
- Export calculates from actual purchase rates
- Reports use stored purchase rates (accurate)

⚠️ **What Needs Improvement:**
- New purchases always use monthly rate (even if rate changed during month)
- No way to override rate for specific purchase
- Monthly rate is single value (can't handle rate changes within month)

---

## Recommendation

**Best Approach:** Option 1 (Manual Override)
- Simple to implement
- Gives user full control
- Preserves accuracy
- Works for all scenarios


