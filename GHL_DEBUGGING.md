# 🔧 GHL Booking Debugging Guide

## Step-by-Step Fix Process

### Step 1: Verify Environment Variables ✅

**Check in Railway:**
- [ ] `GHL_API_KEY` is set and correct
- [ ] `GHL_LOCATION_ID` is set and correct (this is your Sub-Account ID)

**How to verify:**
1. Go to Railway Dashboard → Your backend service
2. Click "Variables" tab
3. Check both variables exist

**If missing:**
- Get API key from GHL: Settings → Integrations → API Keys
- Get Location ID: Settings → General → Sub-Account ID (or Location ID)

---

### Step 2: Check GHL Service Initialization ✅

**What to look for in logs:**
```
⚠️ GHL not configured: GHL_API_KEY and GHL_LOCATION_ID required
```

**If you see this:**
- One or both environment variables are missing
- Fix: Add them to Railway and redeploy

---

### Step 3: Verify Calendar Exists in GHL ✅

**What to look for in logs:**
```
❌ No calendar found. Please configure a calendar in GHL.
```

**If you see this:**
- You need to create a calendar in GHL first
- Steps:
  1. Log into GHL
  2. Go to Calendar
  3. Create a new calendar (if none exists)
  4. Make sure it's active

**The code looks for calendars automatically, but if none exist, booking will fail.**

---

### Step 4: Check Contact Creation ✅

**What to look for in logs:**
```
🔵 Creating/getting contact...
✅ Contact ID: xxx
```

**If you see "Failed to create or find contact":**
- GHL API might be rejecting the contact
- Check: API key permissions
- Check: Location ID is correct

---

### Step 5: Check Date/Time Parsing ✅

**What to look for in logs:**
```
🔵 Parsing date/time...
✅ Parsed start time: 2024-01-15T10:00:00.000Z
```

**If you see "Invalid date or time format":**
- The date/time string from the conversation isn't being parsed correctly
- Common issues:
  - "tomorrow" should work
  - "10 AM" should work
  - But "next week" might not work

---

### Step 6: Check Availability ✅

**What to look for in logs:**
```
🔵 Checking availability...
   Availability: ✅ Available (or ❌ Not available)
```

**If time slot is not available:**
- There's already an appointment at that time
- This is expected behavior - booking will be rejected

---

### Step 7: Check API Request/Response ✅

**What to look for in logs:**
```
🔵 Sending appointment to GHL API...
   Response status: 200 (or error code)
```

**Common error codes:**
- `400` - Bad request (check request body format)
- `401` - Unauthorized (API key invalid)
- `403` - Forbidden (API key doesn't have permission)
- `404` - Not found (calendar ID or location ID wrong)
- `500` - Server error (GHL issue)

---

## Quick Test Checklist

After making a booking, check Railway logs for:

1. ✅ **GHL Service initialized?**
   - Look for: `GHL Service: ✅ Initialized`

2. ✅ **Booking data collected?**
   - Look for: `Booking data: { name, email, service, date, time }`

3. ✅ **Contact created?**
   - Look for: `✅ Contact ID: xxx`

4. ✅ **Calendar found?**
   - Look for: `✅ Calendar ID: xxx`

5. ✅ **Date/time parsed?**
   - Look for: `✅ Parsed start time: ...`

6. ✅ **Appointment created?**
   - Look for: `✅✅✅ Appointment created successfully!`

---

## Most Common Issues

### Issue 1: GHL Not Configured
**Symptom:** `⚠️ GHL not configured`
**Fix:** Add `GHL_API_KEY` and `GHL_LOCATION_ID` to Railway

### Issue 2: No Calendar
**Symptom:** `❌ No calendar found`
**Fix:** Create a calendar in GHL dashboard

### Issue 3: API Key Invalid
**Symptom:** `Response status: 401`
**Fix:** Regenerate API key in GHL

### Issue 4: Location ID Wrong
**Symptom:** `Response status: 404`
**Fix:** Verify Location ID matches your Sub-Account ID

### Issue 5: Date/Time Format
**Symptom:** `Invalid date or time format`
**Fix:** Check what date/time string was sent, improve parsing

---

## Next Steps

1. **Make a test booking**
2. **Check Railway logs immediately**
3. **Identify which step fails**
4. **Fix that specific issue**
5. **Test again**

Let's start with Step 1 - checking if GHL is configured!

