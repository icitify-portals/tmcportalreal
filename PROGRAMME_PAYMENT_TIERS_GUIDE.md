# Programme Fee & Payment Tiers — User Guide

This guide explains how programme fees and **payment tiers** work on the TMC Portal, and exactly how members vs non-members pay their registration fees.

---

## 1. How Admins Set Up Payment Levels

When creating or editing a programme, the admin fills in:

- **Amount (₦)** — the normal/standard fee.
- **Early Bird Amount (₦) + Deadline** — optional discounted fee for payments made before the deadline.
- **Allow Installments + Minimum Installment (₦)** — optional; allows the balance to be spread over multiple payments.
- **Pricing Tiers** — optional list of *category → price* rows, e.g.:

  | Category | Fee (₦) |
  |---|---|
  | NEC (National Executive Council) | 2,000 |
  | State Executive | 1,600 |
  | Local Government Officials | 1,000 |
  | Branch Executive | 800 |
  | Ordinary Member | 600 |
  | Non-Member | 1,200 |

> Tip: Always include a **"Non-Member"** tier and an **"Ordinary Member"** tier if you want tiered pricing for members and a set minimum for guests. If no tiers are added, everyone simply pays the standard/early-bird amount.

---

## 2. How the System Assigns a Fee to Each Person

The fee is decided automatically by the server based on **who the user is**. Nobody can pick a cheaper tier than their own.

| Who is registering | Fee assigned |
|---|---|
| **NEC / National official** | The tier whose name contains **National** or **NEC** |
| **State official** | The tier whose name contains **State** |
| **Local Government official** | The tier whose name contains **LGA**, **Local**, or **Government** |
| **Branch official** | The tier whose name contains **Branch** |
| **Ordinary member** (no office) | The tier whose name contains **Ordinary** |
| **Signed-in user who has no applicable tier** | The **standard/early-bird amount** |
| **Guest (not signed in)** | The **Non-Member** tier, or the **standard amount** if no Non-Member tier exists |

### Example
A profile marked **National** and a programme with the table above → fee is locked to ₦2,000 (NEC). A guest → ₦1,200 (Non-Member). A regular member → ₦600 (Ordinary Member).

---

## 3. Registering as a Member (Signed In)

1. Open the programme and click **Register**.
2. Your name and email are pre-filled automatically from your profile.
3. The form shows a **"Your Registration Category"** box with your locked tier and its fee (read-only — you cannot change it).
4. Enter an amount in **Amount to Pay (₦)** — the minimum shown is your category fee. You **may pay more** if you wish.
5. Choose a payment method:
   - **Pay with Wallet** — deducted instantly from your wallet balance.
   - **Direct Paystack** — you are redirected to Paystack to pay by card/bank transfer.
6. You receive a registration record; when your payment completes, your status becomes **Paid**.

If you try to submit an amount below your category fee, the form blocks it and shows the correct minimum.

---

## 4. Registering as a Guest (Not Signed In)

1. Open the programme and click **Register**.
2. Fill in your **name, email, phone, gender, address, country/state/LGA**.
3. The form shows **"Guest (Non-Member)"** as your category with the minimum Non-Member fee.
4. Enter an amount — the minimum is the assigned fee. You **may pay more**.
5. Pay **via Paystack** (card, bank transfer, or USSD).
6. After payment you receive a **payment slip** containing the amount paid and your registration reference.

> Guests cannot register for tiered member rates — the minimum Non-Member fee always applies and cannot be changed. This prevents a guest from selecting "Ordinary Member" or "NEC" pricing.

---

## 5. Installments (Partial Payments)

- The **first payment at registration must be at least your full assigned fee**.
- After that, if **Allow Installments** is enabled, you can pay the remaining balance in chunks on the payment continuation screen — each later payment must be at least the **Minimum Installment (₦)** set by the admin.
- If you lock in an **Early Bird** price, you must complete the balance **before the early-bird deadline** or the price re-prices to the normal amount.

---

## 6. Waivers & Offline Payments

- If the admin shares a programme link with a **waiver code** (`?waiver=CODE`), the form shows **"Priority Registration Active"** and no payment is required.
- Otherwise, all online payments go to the organisation's Paystack account (or the programme's dedicated sub-account), and transaction references are logged automatically in the finance module.

---

## 7. Common Questions

**Q: I'm a National/NEC official but I was charged the standard amount.**
A: The tier label must contain the word **"National"** or **"NEC"**. Ask the admin to check the Pricing Tiers list on the programme.

**Q: A guest wants to pay a member price.**
A: Not possible — guests are locked to the Non-Member (or standard) minimum. They should register/login as a member first.

**Q: No tier rows but members should pay less than guests.**
A: Add tier rows including **"Ordinary Member"** and **"Non-Member"**. Without tiers everyone pays the standard/early-bird amount.