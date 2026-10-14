# Programme Fee & Payment Tiers — User Guide

This guide explains how programme fees work on the TMC Portal: **early bird** (a uniform discount by date) versus **tier fees** (different prices by membership level).

---

## 1. Two Different Pricing Tools

| Tool | What it does | Who it applies to |
|---|---|---|
| **Early Bird** (amount + deadline) | Discounted fee for payments made **on or before** the deadline. After the deadline the normal amount applies. | **Everyone** — same price regardless of level. |
| **Pricing Tiers** | Different fee per membership level or category. | Assigned automatically by level (see section 3). |

Early bird is a **uniform fee**, not a level-based one. Tiers are for **different prices per level**. A programme can use either, or none.

### Examples
- **NITP 1448 (2026)** — early bird ₦15,000 until 30 Sep 2026, then ₦20,000. No tiers. Every registrant pays the same amount. After 30 Sep, everyone pays ₦20,000.
- **Annual National Congress (ANC) 1448 (2026)** — no early bird. Tiers:

  | Tier | Fee (₦) | Who gets it |
  |---|---|---|
  | National Executive Council (NEC) Registration | 2,000 | NEC officials |
  | General Member/Delegate Registration | 1,000 | Everyone else: state/LG/branch officials, ordinary members |
  | State Corporate Registration | 20,000 | Chapter registration (manual, see section 4) |
  | LG Corporate Registration | 10,000 | Chapter registration (manual) |
  | Branch Corporate Registration | 5,000 | Chapter registration (manual) |

---

## 2. Admin: Setting Up a Programme

When creating or editing a programme:

- **Amount (₦)** — the standard fee.
- **Early Bird Amount (₦) + Deadline** — optional uniform discount for payments before the deadline.
- **Allow Installments + Minimum Installment (₦)** — optional.
- **Pricing Tiers** — optional rows of *label → fee*. Use these labels so the system matches them correctly:
  - Levels: include **"National"** or **"NEC"** for NEC officials; **"State"** for state officials; **"LGA"**, **"Local Government"** or **"LG"** for LG officials; **"Branch"** for branch officials.
  - General members: **"General Member/Delegate"** or **"Ordinary"**. Non-officials and officials without their own level tier pay this.
  - Guests: **"Non-Member"** (optional). If absent, guests pay the standard/early-bird amount.
  - Chapter bundles: labels containing **"Corporate"** (e.g. "State Corporate Registration"). These are never auto-assigned to individuals.

---

## 3. How the System Assigns a Fee

The server decides the fee from who is registering. Nobody can choose a cheaper level than their own.

| Who is registering | Fee assigned |
|---|---|
| **NEC official** | NEC tier (label contains National/NEC) |
| **State, LG or Branch official** | A non-Corporate tier naming their level (for example "State Executive"), if the programme has one; otherwise the **General Member/Delegate** tier. Corporate tiers are never assigned to individuals. |
| **Ordinary / general member** | General Member/Delegate tier (or "Ordinary" tier) |
| **Signed-in user with no matching tier** | Standard/early-bird amount |
| **Guest (not signed in)** | "Non-Member" tier if present, otherwise the standard/early-bird amount |

Early bird applies only where no tier is assigned. A programme with tiers charges the tier price, not the early-bird price.

---

## 4. Registering (Member or Guest)

1. Open the programme and click **Register**. Signed-in members have name and email pre-filled.
2. The form shows **"Your Registration Category"** with your assigned fee (read-only).
3. If the programme has Corporate tiers, an optional **"Corporate / Chapter Registration"** picker appears. Only choose a Corporate tier if you are registering on behalf of a chapter, branch, LGA or state. Otherwise leave it on "Individual — my category".
4. Enter **Amount to Pay (₦)**. The minimum is the fee shown. You may pay more.
5. Pay:
   - **Members:** Pay with Wallet, or Direct Paystack.
   - **Guests:** Paystack only (card, bank transfer or USSD). You receive a payment slip after payment.

A submitted amount below the minimum is blocked.

---

## 5. Installments and Early Bird Deadlines

- The first payment at registration must be at least the full fee shown.
- If installments are allowed, later balances can be paid in chunks of at least the **Minimum Installment**.
- If your price was locked during early bird, complete the balance before the deadline. Otherwise the price moves to the normal amount.

---

## 6. Waivers

If the admin shares a link with a waiver code (`?waiver=CODE`), the form shows **"Priority Registration Active"** and no payment is required.

---

## 7. Common Questions

**Q: I'm a state official but I was charged ₦1,000.**
A: Correct if the programme has no "State" tier. State officials pay their state tier when one exists. Otherwise they pay the General Member/Delegate fee. Ask the admin if the state tier is missing.

**Q: I'm an NEC official and was charged ₦1,000.**
A: The NEC tier label must contain "National" or "NEC". Ask the admin to check the programme's Pricing Tiers.

**Q: A chapter wants to register at the corporate rate.**
A: Use the Corporate / Chapter picker on the register page. The Corporate fee must be at least your own category fee.

**Q: The early bird ended but I registered during it.**
A: Your locked price stays in force only if you complete payment before the deadline. Otherwise the normal fee applies.
