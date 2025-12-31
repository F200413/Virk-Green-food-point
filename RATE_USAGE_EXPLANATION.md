# How Rates Are Used in the System

## Rate Hierarchy (Priority Order)

The system uses rates in this order:

### 1. **Monthly Rates (Highest Priority)**
   - Location: `settings/rates.monthlyRates[customerId_year_month]`
   - When: Set for a specific customer for a specific month
   - Example: Customer "ABC" in November 2025 has rates 500/200
   - **This is what you import from JSON**

### 2. **Most Recent Monthly Rate (Cascading)**
   - When: No rate set for current month, but rate exists for previous month
   - Example: If November has 500/200, December will use 500/200 if not set
   - **Note: This is currently enabled in your code**

### 3. **Global Rates (Fallback)**
   - Location: `settings/rates.milk` and `settings/rates.yogurt`
   - When: No monthly rate found
   - Default: Usually 120/140 (but currently showing 220/250 in your system)

---

## How Rates Are Used in Different Scenarios

### Scenario 1: Creating a New Purchase

```
1. User selects customer and date
2. System calls: getMonthlyRates(customerId, month, year)
   ├─ Checks: Does monthly rate exist for this customer/month/year?
   │  ├─ YES → Use that rate (e.g., 500/200)
   │  └─ NO → Check for most recent monthly rate
   │     ├─ YES → Use most recent (cascading)
   │     └─ NO → Use global rates (220/250)
3. Calculate: total = (milkQty × milkRate) + (yogurtQty × yogurtRate)
4. Save purchase with:
   - milkRate: The rate used
   - yogurtRate: The rate used
   - total: Calculated amount
```

### Scenario 2: Viewing Reports/Calculations

```
1. System loads purchases
2. For each purchase:
   ├─ If purchase has stored milkRate/yogurtRate → Use those (most accurate)
   ├─ If not, calculate from purchase.total / quantity
   └─ If can't calculate → Use monthly rates or global rates
3. Display totals using these rates
```

### Scenario 3: Exporting Data

```
1. System fetches all purchases
2. For each customer/month:
   ├─ Calculate actual rates from purchase data:
   │  ├─ Use purchase.milkRate if stored
   │  ├─ Calculate from purchase.total / quantity if not stored
   │  └─ Average all rates for that month
   ├─ Export these calculated rates to JSON
   └─ These become the "monthly rates" in the export
```

### Scenario 4: Importing Rates

```
1. User selects JSON file
2. System reads monthly rates from JSON (the calculated rates)
3. For each customer/month in JSON:
   ├─ Create key: customerId_year_month
   ├─ Set monthlyRates[key] = { milkRate, yogurtRate }
   └─ Save to Firestore
4. Now when creating purchases, these imported rates will be used
```

---

## Current Flow in Your System

### When Adding Purchase:
```
User Input → Check Monthly Rates → Calculate Total → Save Purchase
     ↓              ↓                      ↓              ↓
  Milk: 1L    Found: 500/200        Total: 700    Store: 1L, 1kg, 500, 200, 700
```

### When Viewing Reports:
```
Load Purchases → Use Stored Rates → Calculate Totals → Display
     ↓                ↓                    ↓              ↓
  All data    purchase.milkRate      Sum amounts    Show report
              purchase.yogurtRate
```

### When Exporting:
```
Load Purchases → Calculate Actual Rates → Group by Month → Export JSON
     ↓                    ↓                      ↓              ↓
  All data      From purchase data      Per customer    JSON file
                (500/200, etc.)         Per month
```

### When Importing:
```
Read JSON → Extract Rates → Save to Monthly Rates → Ready to Use
    ↓            ↓                  ↓                      ↓
JSON file   500/200 rates    Firestore update    Next purchase uses these
```

---

## Important Points

1. **Purchase Rates Are Stored**: When you create a purchase, the rates used are stored in the purchase record
2. **Export Uses Actual Rates**: Export calculates rates from actual purchase data, not from monthly rates
3. **Import Sets Monthly Rates**: Import takes the calculated rates and sets them as monthly rates
4. **Cascading Still Works**: If you don't set a rate for a month, it uses the most recent monthly rate

---

## Example Flow

**Before Import:**
- Customer "ABC" in November: No monthly rate set
- System uses: Global rate (220/250)
- Purchase created: 1L milk + 1kg yogurt = 470 (wrong!)

**After Export & Import:**
- Export calculates: Actual rate was 500/200 from purchases
- Import sets: Monthly rate for November = 500/200
- Next purchase: System uses 500/200
- Purchase created: 1L milk + 1kg yogurt = 700 (correct!)

---

## Rate Storage Locations

1. **Global Rates**: `settings/rates` → `milk`, `yogurt`
2. **Monthly Rates**: `settings/rates` → `monthlyRates[customerId_year_month]`
3. **Purchase Rates**: `purchases/[purchaseId]` → `milkRate`, `yogurtRate` (stored when purchase created)

