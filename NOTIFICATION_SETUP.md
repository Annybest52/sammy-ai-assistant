# 📧📱 Notification Setup Guide

## Overview

When an appointment is booked, Sammy sends notifications to:
1. **Customer** - Confirmation email and SMS (if phone provided)
2. **Business** - Notification email and SMS about the new booking
3. **GoHighLevel** - Appointment is saved in GHL calendar

## Required Environment Variables

Add these to your **Railway** backend environment variables:

### Email Notifications (Resend)

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
BUSINESS_EMAIL=your-email@dealeymediainternational.com
```

**How to get Resend API Key:**
1. Go to https://resend.com
2. Sign up/login
3. Go to API Keys section
4. Create a new API key
5. Copy and paste into Railway

### SMS Notifications (Twilio) - Optional

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
BUSINESS_PHONE=+1234567890
```

**How to get Twilio credentials:**
1. Go to https://twilio.com
2. Sign up/login
3. Get Account SID and Auth Token from dashboard
4. Get a phone number from Twilio
5. Add to Railway

## What Happens When Booking

### ✅ If Email is Configured:
- Customer receives confirmation email
- Business receives notification email
- Check Railway logs for: `📧 Customer email: SENT ✅` or `FAILED ❌`

### ✅ If SMS is Configured:
- Customer receives confirmation SMS (if phone provided)
- Business receives notification SMS
- Check Railway logs for: `📱 Customer SMS: SENT ✅` or `SKIPPED ⏭️`

### ✅ GoHighLevel:
- Appointment is always saved in GHL calendar
- Check Railway logs for: `✅ GHL Appointment created: [appointment-id]`
- Check your GHL dashboard to see the appointment

## Checking Railway Logs

1. Go to Railway dashboard
2. Click on your backend service
3. Go to "Deployments" → Latest deployment → "View Logs"
4. Look for these messages after a booking:
   - `📧 Customer email: SENT ✅` or `FAILED ❌`
   - `📧 Business email: SENT ✅` or `FAILED ❌`
   - `📱 Customer SMS: SENT ✅` or `SKIPPED ⏭️`
   - `📱 Business SMS: SENT ✅` or `SKIPPED ⏭️`
   - `✅ GHL Appointment created: [id]`

## Troubleshooting

### No Email Notifications
- ✅ Check if `RESEND_API_KEY` is set in Railway
- ✅ Check Railway logs for email errors
- ✅ Verify `BUSINESS_EMAIL` is set
- ✅ Check spam folder

### No SMS Notifications
- ✅ Check if Twilio credentials are set
- ✅ Check if `BUSINESS_PHONE` is set
- ✅ SMS is optional - emails will still work

### No GHL Appointment
- ✅ Check if `GHL_API_KEY` and `GHL_LOCATION_ID` are set
- ✅ Check Railway logs for GHL errors
- ✅ Verify appointment appears in GHL dashboard

## Quick Setup Checklist

- [ ] Add `RESEND_API_KEY` to Railway
- [ ] Add `BUSINESS_EMAIL` to Railway
- [ ] (Optional) Add Twilio credentials for SMS
- [ ] (Optional) Add `BUSINESS_PHONE` for SMS notifications
- [ ] Redeploy backend on Railway
- [ ] Test booking and check Railway logs
- [ ] Check email inbox/spam folder
- [ ] Check GHL dashboard for appointment

## Current Status

To check what's working:
1. Make a test booking
2. Check Railway logs immediately after
3. Look for the notification status messages
4. Check your email (including spam)
5. Check GHL dashboard

---

**Note:** Even if email/SMS fails, the appointment is still saved in GoHighLevel, so you'll always see it there!

