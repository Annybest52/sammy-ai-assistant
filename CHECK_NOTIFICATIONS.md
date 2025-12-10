# 🔍 How to Check if Notifications Are Working

## Step 1: Check Railway Logs

After a booking is made, check your Railway logs:

1. Go to **Railway Dashboard** → Your backend service
2. Click **"Deployments"** → Latest deployment
3. Click **"View Logs"**
4. Look for these messages right after booking:

```
📧 Customer email: SENT ✅  (or FAILED ❌)
📧 Business email: SENT ✅  (or FAILED ❌)
📱 Customer SMS: SENT ✅    (or SKIPPED ⏭️)
📱 Business SMS: SENT ✅    (or SKIPPED ⏭️)
✅ GHL Appointment created: [appointment-id]
```

## Step 2: Check What's Missing

### If you see "FAILED ❌" for emails:
- ❌ `RESEND_API_KEY` is not set in Railway
- ❌ Email service is not configured

### If you see "SKIPPED ⏭️" for SMS:
- ⚠️ This is normal - SMS is optional
- SMS only sends if Twilio is configured

### If you see "✅ GHL Appointment created":
- ✅ Appointment IS saved in GoHighLevel!
- Check your GHL dashboard to see it

## Step 3: Where to Find Notifications

### Email Notifications:
- **Customer email**: Sent to the email address provided during booking
- **Business email**: Sent to `BUSINESS_EMAIL` (or default: info@dealeymediainternational.com)
- **Check spam folder** if you don't see them!

### SMS Notifications:
- Only sent if Twilio is configured
- Customer SMS: Sent to phone number provided
- Business SMS: Sent to `BUSINESS_PHONE` environment variable

### GHL Appointment:
- **Always saved** in GoHighLevel calendar
- Check your GHL dashboard → Calendar → Appointments
- This works even if emails/SMS fail!

## Quick Fix: Set Up Email Notifications

1. **Get Resend API Key:**
   - Go to https://resend.com
   - Sign up/login
   - Create API key
   - Copy the key

2. **Add to Railway:**
   - Railway Dashboard → Your backend service
   - Go to "Variables" tab
   - Add: `RESEND_API_KEY` = `re_xxxxxxxxxxxxx`
   - Add: `BUSINESS_EMAIL` = `your-email@dealeymediainternational.com`

3. **Redeploy:**
   - Railway will auto-redeploy
   - Or manually trigger redeploy

4. **Test:**
   - Make a test booking
   - Check Railway logs
   - Check your email (including spam)

## What You Should See

### ✅ Working Setup:
```
📧 Customer email: SENT ✅
📧 Business email: SENT ✅
📱 Customer SMS: SKIPPED ⏭️  (normal if Twilio not set)
📱 Business SMS: SKIPPED ⏭️  (normal if Twilio not set)
✅ GHL Appointment created: abc123
```

### ❌ Missing Email Setup:
```
📧 Customer email: FAILED ❌
📧 Business email: FAILED ❌
⚠️ RESEND_API_KEY not configured - skipping email
```

## Most Important: GHL Appointment

**Even if emails fail, the appointment IS saved in GoHighLevel!**

To verify:
1. Log into your GoHighLevel account
2. Go to Calendar
3. Look for the appointment with the customer's name
4. You should see it there!

---

**Next Steps:**
1. Check Railway logs to see what's happening
2. Set up `RESEND_API_KEY` if emails are failing
3. Check GHL dashboard to confirm appointment is there
4. Check email spam folder

