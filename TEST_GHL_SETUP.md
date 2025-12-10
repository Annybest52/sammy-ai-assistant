# 🧪 Test GHL Integration

## ✅ Setup Complete!

You've added:
- ✅ `GHL_API_KEY` to Railway
- ✅ `GHL_LOCATION_ID` to Railway
- ✅ Redeployed successfully

---

## Step 1: Verify GHL Service Initialized

### Check Railway Logs

1. **Go to Railway** → Your backend service
2. **Click "Logs" tab**
3. **Look for one of these messages:**

   **✅ Success:**
   ```
   ✅ GoHighLevel service initialized.
   ```

   **❌ If you see this:**
   ```
   ⚠️ GHL not configured: GHL_API_KEY and GHL_LOCATION_ID required
   ```
   - Check variable names are exactly: `GHL_API_KEY` and `GHL_LOCATION_ID`
   - Make sure there are no extra spaces
   - Redeploy again

---

## Step 2: Test the Booking Flow

### 2.1 Open Your Bot

1. **Go to your Vercel frontend URL** (where Sammy is deployed)
2. **Click the glowing orb** to start Sammy
3. **Wait for Sammy to introduce itself**

### 2.2 Book an Appointment

**Say something like:**
- "I want to book an appointment"
- "Book me for a consultation"
- "I need to schedule a meeting"

**Then provide:**
- **Name:** "My name is John Doe"
- **Email:** "My email is john@example.com"
- **Service:** "I want AI consultation" (or any service)
- **Date:** "Tomorrow" or "Next Monday"
- **Time:** "2 PM" or "10 AM"

**Example full conversation:**
```
You: "I want to book an appointment"
Sammy: "Sure! What's your name?"
You: "John Doe"
Sammy: "What's your email?"
You: "john@example.com"
Sammy: "What service do you need?"
You: "AI consultation"
Sammy: "When would you like to schedule?"
You: "Tomorrow at 2 PM"
```

---

## Step 3: Verify in GoHighLevel

### 3.1 Check Calendar

1. **Log in to GoHighLevel**
2. **Go to Calendar** (left sidebar)
3. **Look for the new appointment:**
   - Should show the date/time you booked
   - Title: `[Service] - [Name]` (e.g., "AI consultation - John Doe")
   - Notes should mention "Booked via Sammy AI Assistant"

### 3.2 Check Contacts

1. **Go to Contacts** in GHL
2. **Search for the email** you used
3. **The contact should exist** (created automatically)

---

## Step 4: Check Railway Logs for Success

After booking, check Railway logs for:

**✅ Success messages:**
```
📅 Booking appointment in GoHighLevel...
✅ GHL Appointment created: [appointment-id]
📅 GHL Appointment: [appointment-id] ✅
```

**❌ If you see errors:**
- Check the error message
- Common issues:
  - "No calendar found" → Create a calendar in GHL
  - "Time slot not available" → Try a different time
  - API errors → Check API key and Location ID

---

## ✅ Success Checklist

- [ ] Railway logs show: `✅ GoHighLevel service initialized.`
- [ ] Bot responds to booking requests
- [ ] Appointment appears in GHL calendar
- [ ] Contact created in GHL
- [ ] Railway logs show: `✅ GHL Appointment created: [id]`
- [ ] Bot confirms: "Your appointment has been booked!"

---

## 🎉 If Everything Works

Your bot is now fully functional:
- ✅ Answers questions using scraped website content
- ✅ Books appointments directly in GoHighLevel
- ✅ Checks availability before booking
- ✅ Creates contacts automatically
- ✅ Sends email/SMS confirmations (if configured)

---

## ❌ Troubleshooting

### "No calendar found" error

1. **Go to GHL** → **Calendar** → **Calendars**
2. **Create a calendar** if you don't have one
3. **Make sure it's active** (not archived)
4. **Try booking again**

### "Time slot not available"

- This means the time is already booked
- Try a different time
- The bot will suggest alternatives

### Appointments not appearing in GHL

1. **Check Railway logs** for errors
2. **Verify API key** has correct permissions
3. **Check Location ID** is correct
4. **Make sure calendar exists** and is active

---

## 🚀 Next Steps

Once everything is working:
1. ✅ Test with different services
2. ✅ Test with different dates/times
3. ✅ Verify email/SMS notifications (if configured)
4. ✅ Check conversation storage (admin API)

**You're all set!** 🎉

