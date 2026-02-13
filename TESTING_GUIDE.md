# Testing Guide - Signup & Authentication

## Prerequisites

### 1. Environment Setup

Make sure your `.env` file (or `.env.local`) has the following:

```env
# Database
DATABASE_URL="mysql://root@localhost:3306/tmc_portal"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here" # Generate with: openssl rand -base64 32

# Email (Resend)
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="TMC Connect <messages@tmcng.net>"
```

### 2. Generate NEXTAUTH_SECRET

If you don't have a secret, generate one:

```bash
# On Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# On Linux/Mac:
openssl rand -base64 32
```

### 3. Database Setup

Ensure your database is set up:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (if not already done)
npx prisma db push
```

## Step-by-Step Testing

### Step 1: Start Development Server

```bash
npm run dev
```

The server should start on `http://localhost:3000`

### Step 2: Test Signup Flow

1. **Navigate to Signup Page:**
   - Go to: `http://localhost:3000/auth/signup`
   - You should see the green-themed signup form

2. **Test Form Validation:**
   - Try submitting empty form → Should show validation errors
   - Try invalid email → Should show error
   - Try weak password → Should show strength indicator and prevent submission

3. **Test Password Strength:**
   - Enter: `password` → Should show weak (red)
   - Enter: `Password1` → Should show medium (yellow)
   - Enter: `Password1!` → Should show strong (green, ≥70%)
   - Check that all requirements are validated:
     - ✅ At least 8 characters
     - ✅ One uppercase letter
     - ✅ One lowercase letter
     - ✅ One number
     - ✅ One special character

4. **Test Country Selector:**
   - Click country dropdown
   - Verify Nigeria is default
   - Select different country → Phone prefix should update

5. **Test Phone Number:**
   - Verify Nigeria (+234) is default
   - Change country → Phone prefix should change
   - Enter phone number → Should only accept digits

6. **Submit Valid Form:**
   - Fill all fields correctly
   - Use strong password (≥70%)
   - Click "Create Account"
   - Should show success message
   - Should redirect to verification page

### Step 3: Test Email Verification

**Option A: With Resend API (Production-like)**

1. **Check Email:**
   - Open your email inbox (the one you used for signup)
   - Look for email from "TMC Connect <messages@tmcng.net>"
   - Subject: "Verify Your Email - TMC Connect"

2. **Verify Email:**
   - Click the verification button in email
   - OR copy the verification link
   - Should redirect to verification page
   - Should show success message
   - Should redirect to signin after 3 seconds

**Option B: Without Resend API (Development)**

If `RESEND_API_KEY` is not set, emails are logged to console:

1. **Check Console:**
   - Open browser DevTools → Console
   - Look for email log output
   - Copy the verification URL from console

2. **Manual Verification:**
   - Navigate to: `http://localhost:3000/auth/verify-email?token=TOKEN&email=EMAIL`
   - Replace TOKEN and EMAIL with values from console

### Step 4: Test Login

1. **Navigate to Signin:**
   - Go to: `http://localhost:3000/auth/signin`
   - Should see green-themed signin form

2. **Test Unverified Email:**
   - Try logging in with unverified email
   - Should show error: "Please verify your email address..."

3. **Test Invalid Credentials:**
   - Try wrong password
   - Should show: "Invalid email or password"

4. **Test Valid Login:**
   - Enter verified email and correct password
   - Should redirect to dashboard
   - Should show success toast

### Step 5: Test Dashboard

1. **Check Dashboard:**
   - After login, should redirect to dashboard
   - Should see "Welcome, Member!" heading

2. **Check Membership Status:**
   - Should show "You are not yet a member"
   - Should show "Become a Member" button

3. **Check Activity Section:**
   - Should show 3 cards:
     - Events Registered: 0
     - Fees Paid: 0 (or count from payments)
     - Donations Made: 0

4. **Test Navigation:**
   - Click sidebar items
   - Verify role-based access (if roles are assigned)

## Testing Checklist

### Signup Page
- [ ] Form loads correctly
- [ ] All fields are present
- [ ] Country selector works (Nigeria default)
- [ ] Phone prefix updates with country
- [ ] Password strength indicator works
- [ ] Password requirements validated
- [ ] Form validation prevents weak passwords
- [ ] Submit button disabled until password ≥70%
- [ ] Success message on signup
- [ ] Redirects to verification page

### Email Verification
- [ ] Verification email sent (check inbox or console)
- [ ] Email contains verification link
- [ ] Verification link works
- [ ] Success message on verification
- [ ] Redirects to signin after verification
- [ ] Resend verification works

### Login
- [ ] Signin page loads
- [ ] Unverified email blocked
- [ ] Invalid credentials rejected
- [ ] Valid credentials accepted
- [ ] Redirects to dashboard
- [ ] Session persists

### Dashboard
- [ ] Dashboard loads after login
- [ ] Shows "Welcome, Member!"
- [ ] Membership status shows correctly
- [ ] "Become a Member" button visible (if not member)
- [ ] Activity section displays
- [ ] All cards show correct data

## Common Issues & Solutions

### Issue: "Cannot find module '@prisma/client'"

**Solution:**
```bash
npx prisma generate
```

### Issue: Database connection error

**Solution:**
1. Verify MySQL is running
2. Check `DATABASE_URL` in `.env`
3. Verify database `tmc_portal` exists
4. Run: `npx prisma db push`

### Issue: Email not sending

**Solution:**
1. Check `RESEND_API_KEY` in `.env`
2. Verify domain is verified in Resend
3. Check console for errors
4. In development, emails are logged to console

### Issue: "Email already registered"

**Solution:**
- User already exists in database
- Either use different email or delete user from database:
```sql
DELETE FROM users WHERE email = 'test@example.com';
```

### Issue: Verification link expired

**Solution:**
- Tokens expire after 24 hours
- Use resend verification feature
- Or create new account

### Issue: Password strength not calculating

**Solution:**
1. Check browser console for errors
2. Verify `lib/password-strength.ts` is imported correctly
3. Clear browser cache

## Database Testing Queries

### Check User Created
```sql
SELECT id, email, name, emailVerified, createdAt 
FROM users 
ORDER BY createdAt DESC 
LIMIT 5;
```

### Check Verification Token
```sql
SELECT identifier, token, expires 
FROM verification_tokens 
WHERE identifier = 'your-email@example.com';
```

### Check Email Logs
```sql
SELECT to, subject, status, sentAt, error 
FROM email_logs 
ORDER BY createdAt DESC 
LIMIT 10;
```

### Check Audit Logs
```sql
SELECT action, entityType, description, createdAt 
FROM audit_logs 
WHERE action LIKE '%SIGNUP%' OR action LIKE '%VERIFY%'
ORDER BY createdAt DESC 
LIMIT 10;
```

## Manual Testing Script

### Test User 1: Complete Flow
1. Signup with: `test1@example.com`
2. Check email/console for verification link
3. Verify email
4. Login
5. Check dashboard

### Test User 2: Unverified Login Attempt
1. Signup with: `test2@example.com`
2. Try to login immediately (before verification)
3. Should be blocked

### Test User 3: Password Strength
1. Try passwords:
   - `weak` → Should fail
   - `Weak1` → Should fail (no special char)
   - `Weak1!` → Should pass (≥70%)

## Automated Testing (Future)

For production, consider adding:
- Unit tests for password strength
- Integration tests for signup flow
- E2E tests with Playwright/Cypress
- Email testing with Mailtrap

## Next Steps After Testing

Once signup is verified:
1. Test membership application flow
2. Test role assignment
3. Test permission-based access
4. Test payment integration
5. Test document upload

## Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs
3. Verify environment variables
4. Check database connection
5. Review audit logs in database


