# GoHighLevel (GHL) Integration Setup

## Overview
This integration allows Sammy to automatically book appointments directly in your GoHighLevel calendar when customers make bookings.

## Setup Steps

### 1. Get Your GHL API Credentials

1. Log in to your GoHighLevel account
2. Go to **Settings** → **Integrations** → **API**
3. Create a new API key or use an existing one
4. Copy your **API Key**
5. Find your **Location ID** (usually in the URL or Settings → Locations)

### 2. Add Environment Variables

Add these to your `backend/.env` file:

```env
GHL_API_KEY=your_api_key_here
GHL_LOCATION_ID=your_location_id_here
```

### 3. Configure on Railway

1. Go to your Railway project
2. Navigate to **Variables** tab
3. Add:
   - `GHL_API_KEY` = Your GHL API key
   - `GHL_LOCATION_ID` = Your GHL location ID
4. Save and redeploy

### 4. Set Up Calendar in GHL

1. Make sure you have at least one calendar set up in GHL
2. The integration will automatically use the first available calendar
3. You can specify a calendar name in the code if needed

## How It Works

When a customer books an appointment through Sammy:

1. **Contact Creation**: Creates or finds the contact in GHL by email
2. **Appointment Booking**: Creates the appointment in your GHL calendar
3. **Notifications**: Still sends email/SMS confirmations as before
4. **All in GHL**: The appointment appears in your GHL dashboard

## API Endpoints Used

- `POST /contacts/` - Create or find contact
- `GET /contacts/search` - Search for existing contact
- `GET /calendars/` - Get calendar list
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
1. Starting a conversation with Sammy
2. Booking an appointment
3. Checking your GHL calendar for the new appointment

