# GoHighLevel (GHL) Integration Setup

## Overview
This integration allows Sammy to automatically book appointments directly in your GoHighLevel calendar when customers make bookings.

## ✅ Current Status

The GHL integration is **already implemented** in the code! You just need to add your API credentials.

---

## Setup Steps

### 1. Get Your GHL API Credentials

1. **Log in to your GoHighLevel account**
2. **Go to Settings** → **Integrations** → **API** (or **Settings** → **API**)
3. **Create a new API key** or use an existing one
   - Click "Create API Key" or "Generate New Key"
   - Give it a name (e.g., "Sammy AI Bot")
   - Copy the API key immediately (you won't see it again!)
4. **Find your Location ID (also called Sub-Account ID):**
   - **✅ Yes, Location ID = Sub-Account ID** (they're the same thing!)
   - **Method 1 - From URL (Easiest):**
     - When logged into GHL, look at your browser URL
     - It will be: `https://app.gohighlevel.com/location/[LOCATION_ID]/...`
     - Copy the long string after `/location/` - that's your Location ID!
   - **Method 2 - From Business Profile:**
     - Go to **Settings** (lower right corner)
     - Click **Business Profile** (left sidebar)
     - The Location ID is displayed in this section
   - **Method 3 - From Locations Menu:**
     - Go to **Settings** → **Locations**
     - Click on your location/sub-account
     - The Location ID is shown in the location details

### 2. Add Environment Variables to Railway

1. **Go to your Railway project** (where your backend is deployed)
2. **Click on your backend service**
3. **Go to the "Variables" tab**
4. **Click "New Variable"** and add:

   **Variable 1:**
   - **Key:** `GHL_API_KEY`
   - **Value:** Your GHL API key (paste it here)

   **Variable 2:**
   - **Key:** `GHL_LOCATION_ID`
   - **Value:** Your GHL location ID (paste it here)

5. **Click "Save"** or "Deploy" (Railway will automatically redeploy)

### 3. Verify Setup

After adding the variables and redeploying:

1. **Check Railway logs** - You should see:
   ```
   ✅ GoHighLevel service initialized.
   ```

2. **If you see warnings** like:
   ```
   ⚠️ GHL not configured: GHL_API_KEY and GHL_LOCATION_ID required
   ```
   - Double-check the variable names are exactly: `GHL_API_KEY` and `GHL_LOCATION_ID`
   - Make sure there are no extra spaces
   - Redeploy after adding variables

### 4. Set Up Calendar in GHL

1. **Make sure you have at least one calendar set up in GHL**
   - Go to **Calendar** → **Calendars** in GHL
   - Create a calendar if you don't have one
   - Make sure it's **active** (not archived)

2. **The integration will automatically use the first available calendar**
   - It finds calendars automatically
   - Uses the first active calendar it finds

3. **Test the calendar:**
   - Make sure the calendar has available time slots
   - Check that the calendar is not fully booked

## How It Works

When a customer books an appointment through Sammy:

1. **Contact Creation**: Creates or finds the contact in GHL by email
2. **Appointment Booking**: Creates the appointment in your GHL calendar
3. **Notifications**: Still sends email/SMS confirmations as before
4. **All in GHL**: The appointment appears in your GHL dashboard

## How It Works (Technical)

When a customer books an appointment:

1. **Contact Lookup/Creation:**
   - Searches for existing contact by email
   - Creates new contact if not found
   - Returns contact ID

2. **Calendar Discovery:**
   - Fetches all calendars for your location
   - Selects the first active calendar

3. **Availability Check:**
   - Checks if the requested time slot is available
   - Returns error if slot is already booked

4. **Appointment Creation:**
   - Creates appointment in GHL calendar
   - Links it to the contact
   - Returns appointment ID

5. **Confirmation:**
   - Sends email/SMS notifications (if configured)
   - Appointment appears in your GHL dashboard

## API Endpoints Used

- `GET /contacts/search` - Search for existing contact by email
- `POST /contacts/` - Create new contact
- `GET /calendars/` - Get list of calendars
- `GET /calendars/{calendarId}/availability` - Check time slot availability
- `POST /calendars/{calendarId}/appointments` - Create appointment

## Troubleshooting

### Appointments not appearing in GHL?

1. Check API key and location ID are correct
2. Verify you have at least one calendar in GHL
3. Check Railway logs for error messages
4. Ensure the calendar is active and not archived

### Contact not found?

- The integration automatically creates contacts if they don't exist
- Check that the email format is correct

## Testing

After setup, test by:

1. **Start a conversation with Sammy** (on your Vercel frontend)
2. **Book an appointment:**
   - Say: "I want to book an appointment"
   - Provide: Name, Email, Service, Date, Time
   - Example: "Book me for AI consultation tomorrow at 2 PM"
3. **Check your GHL calendar:**
   - Log in to GoHighLevel
   - Go to **Calendar**
   - You should see the new appointment!
4. **Check Railway logs:**
   - Look for: `✅ GHL Appointment created: [appointment-id]`
   - If you see errors, check the troubleshooting section below

## ✅ Success Indicators

You'll know it's working when:
- ✅ Railway logs show: `✅ GHL Appointment created: [id]`
- ✅ Appointment appears in your GHL calendar
- ✅ Contact is created/found in GHL
- ✅ Bot confirms: "Your appointment has been booked!"

