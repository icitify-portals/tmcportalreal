# Quick Testing Guide

## 🚀 Quick Start

### 1. Start the Server
```bash
npm run dev
```

### 2. Test Signup
1. Go to: http://localhost:3000/auth/signup
2. Fill the form:
   - Surname: `Test`
   - Other Names: `User`
   - Email: `test@example.com`
   - Country: `Nigeria` (default)
   - Phone: `1234567890`
   - Address: `123 Test Street`
   - Password: `Test123!@#` (strong password)
   - Confirm: `Test123!@#`
3. Click "Create Account"
4. Check email or console for verification link

### 3. Verify Email
- Click link in email, OR
- Go to: http://localhost:3000/auth/verify-email?token=TOKEN&email=test@example.com
- Replace TOKEN with token from console/email

### 4. Login
1. Go to: http://localhost:3000/auth/signin
2. Enter: `test@example.com` / `Test123!@#`
3. Should redirect to dashboard

### 5. Check Dashboard
- Should see "Welcome, Member!"
- Should see "You are not yet a member"
- Should see "Become a Member" button

## 🔍 Quick Checks

### Password Strength Test
- `password` → ❌ Weak (fails)
- `Password1` → ⚠️ Medium (fails - no special char)
- `Password1!` → ✅ Strong (passes ≥70%)

### Email Verification Test
- Try login before verification → ❌ Blocked
- Verify email → ✅ Can login

### Dashboard Test
- After login → ✅ Shows membership status
- Non-member → ✅ Shows "Become a Member" button

## 🐛 Common Issues

**Email not sending?**
- Check `.env` for `RESEND_API_KEY`
- In dev mode, check console for email log

**Can't login?**
- Verify email first!
- Check password is correct

**Database error?**
- Run: `npx prisma generate`
- Run: `npx prisma db push`


