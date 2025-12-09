# Sammy AI Assistant - Setup Guide

## Step 1: Configure Pinecone (Knowledge Base) 🔴 CRITICAL

### Why?
Pinecone stores all the scraped website content so Sammy can answer questions about your services.

### How to Set Up:

1. **Create Pinecone Account**
   - Go to https://www.pinecone.io/
   - Sign up for free account
   - Free tier includes 1 index (enough for this project)

2. **Create an Index**
   - In Pinecone dashboard, click "Create Index"
   - Name: `sammy-knowledge-base` (or any name)
   - Dimensions: `1024` (for text-embedding-3-small)
   - Metric: `cosine`
   - Click "Create Index"

3. **Get API Key**
   - Go to "API Keys" in Pinecone dashboard
   - Copy your API key

4. **Add to Railway**
   - Go to Railway → Your backend service → Variables
   - Add:
     - `PINECONE_API_KEY` = Your Pinecone API key
     - `PINECONE_INDEX` = `sammy-knowledge-base` (or your index name)

---

## Step 2: Configure GoHighLevel (Appointments) 🔴 CRITICAL

### Why?
GHL integration books appointments directly in your calendar and checks availability.

### How to Set Up:

1. **Get GHL API Credentials**
   - Log in to GoHighLevel
   - Go to **Settings** → **Integrations** → **API**
   - Create or copy your **API Key**
   - Find your **Location ID** (in Settings → Locations or URL)

2. **Add to Railway**
   - Go to Railway → Your backend service → Variables
   - Add:
     - `GHL_API_KEY` = Your GHL API key
     - `GHL_LOCATION_ID` = Your GHL location ID

3. **Set Up Calendar in GHL**
   - Make sure you have at least one active calendar in GHL
   - The integration will use the first available calendar

---

## Step 3: Scrape Your Website 🟡 IMPORTANT

### Why?
This populates the knowledge base with your company information.

### How to Do It:

**Option A: Using API (Recommended)**
```bash
curl -X POST https://your-railway-backend-url/api/scrape/website \
  -H "Content-Type: application/json" \
  -d '{"url": "https://dealeymediainternational.com", "maxPages": 10}'
```

**Option B: Using Postman/Thunder Client**
- Method: POST
- URL: `https://your-railway-backend-url/api/scrape/website`
- Body (JSON):
```json
{
  "url": "https://dealeymediainternational.com",
  "maxPages": 10
}
```

**What Happens:**
- Scraper crawls your website (up to 10 pages)
- Extracts: services, prices, FAQs, contact info, content
- Stores everything in Pinecone knowledge base
- Takes 2-5 minutes depending on website size

---

## Step 4: Test Everything ✅

### Test 1: Knowledge Base
Ask Sammy: "What services do you offer?"
- Should answer using scraped website content

### Test 2: Booking with Availability
1. Book an appointment for a time slot
2. Try booking the same time slot again
3. Should say "time slot is not available"

### Test 3: GHL Integration
1. Book an appointment
2. Check your GHL calendar
3. Appointment should appear there

---

## Quick Checklist

- [ ] Pinecone account created
- [ ] Pinecone index created (1024 dimensions)
- [ ] Pinecone API key added to Railway
- [ ] GHL API key added to Railway
- [ ] GHL Location ID added to Railway
- [ ] Website scraped (knowledge base populated)
- [ ] Tested: Bot answers questions about services
- [ ] Tested: Booking checks availability
- [ ] Tested: Appointments appear in GHL

---

## Troubleshooting

### Bot doesn't answer questions about services?
- Check if website was scraped successfully
- Check Pinecone credentials in Railway
- Check Railway logs for errors

### Appointments not appearing in GHL?
- Check GHL API key and Location ID
- Verify calendar exists in GHL
- Check Railway logs for GHL errors

### Availability check not working?
- Verify GHL API has calendar read permissions
- Check Railway logs for API errors

---

## Need Help?

Check Railway logs:
```bash
# In Railway dashboard → Your service → Logs
```

Common issues:
1. Missing environment variables → Add to Railway
2. API keys incorrect → Double-check credentials
3. Website not scraped → Run scrape endpoint first

