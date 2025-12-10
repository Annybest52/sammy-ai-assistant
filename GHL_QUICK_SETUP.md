# 🚀 GHL Quick Setup Checklist

## ✅ What's Already Done
- ✅ GHL integration code is implemented
- ✅ Bot can answer questions using scraped content
- ✅ Booking flow works (without GHL sync)

## 📋 What You Need to Do

### Step 1: Get GHL API Credentials (5 minutes)

1. **Log in to GoHighLevel**
2. **Go to:** Settings → Integrations → API
3. **Create API Key:**
   - Click "Create API Key" or "Generate New Key"
   - Name it: "Sammy AI Bot"
   - **Copy the key immediately** (you won't see it again!)

4. **Find Location ID (same as Sub-Account ID):**
   - **Yes, Location ID = Sub-Account ID** (they're the same!)
   - **Easiest way:** Look at your GHL URL when logged in:
     - `https://app.gohighlevel.com/location/[LOCATION_ID]/...`
     - Copy the long string after `/location/`
   - **Or:** Settings → Locations → Click your location → See the ID
   - **Or:** If you see "Sub-Accounts" menu, that's the same thing

---

### Step 2: Add to Railway (2 minutes)

1. **Open Railway** → Your backend service
2. **Go to:** Variables tab
3. **Add these 2 variables:**

   ```
   GHL_API_KEY = [paste your API key]
   GHL_LOCATION_ID = [paste your location ID]
   ```

4. **Save** (Railway will auto-redeploy)

---

### Step 3: Verify (1 minute)

1. **Check Railway logs** after redeploy
2. **Look for:** `✅ GoHighLevel service initialized.`
3. **If you see:** `⚠️ GHL not configured` → Check variable names/spelling

---

### Step 4: Test (2 minutes)

1. **Open your bot** (Vercel frontend)
2. **Book an appointment:**
   - "I want to book an appointment"
   - Provide: Name, Email, Service, Date, Time
3. **Check GHL calendar:**
   - Log in to GoHighLevel
   - Go to Calendar
   - **You should see the appointment!** 🎉

---

## ✅ Success Checklist

- [ ] API key created in GHL
- [ ] Location ID found
- [ ] `GHL_API_KEY` added to Railway
- [ ] `GHL_LOCATION_ID` added to Railway
- [ ] Railway redeployed successfully
- [ ] Logs show: `✅ GoHighLevel service initialized.`
- [ ] Test booking works
- [ ] Appointment appears in GHL calendar

---

## ❌ Troubleshooting

**"GHL not configured" warning:**
- ✅ Check variable names are exactly: `GHL_API_KEY` and `GHL_LOCATION_ID`
- ✅ No extra spaces before/after values
- ✅ Redeploy after adding variables

**Appointment not appearing in GHL:**
- ✅ Check Railway logs for errors
- ✅ Verify calendar exists and is active in GHL
- ✅ Check API key has correct permissions

**"No calendar found" error:**
- ✅ Create at least one calendar in GHL
- ✅ Make sure calendar is active (not archived)

---

## 🎉 Once Complete

Your bot will:
- ✅ Answer questions using scraped website content
- ✅ Book appointments directly in GoHighLevel
- ✅ Check availability before booking
- ✅ Create contacts in GHL automatically
- ✅ Send email/SMS confirmations

**Everything is ready! Just add the API credentials!** 🚀

