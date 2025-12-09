# How to Scrape Website & Test Bot

## Step 1: Scrape Your Website (Add to Pinecone)

### Option A: Using Browser (Easiest)

1. **Get your Railway backend URL**
   - Go to Railway dashboard
   - Click on your backend service
   - Copy the URL (e.g., `https://your-app.railway.app`)

2. **Open a new browser tab** and go to:
   ```
   https://your-railway-backend-url/api/scrape/website
   ```
   (Replace with your actual Railway URL)

3. **Use a tool like Postman, Thunder Client, or browser console:**

   **In Browser Console (F12):**
   ```javascript
   fetch('https://your-railway-backend-url/api/scrape/website', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       url: 'https://dealeymediainternational.com',
       maxPages: 10
     })
   })
   .then(res => res.json())
   .then(data => console.log(data));
   ```

### Option B: Using curl (Terminal)

```bash
curl -X POST https://your-railway-backend-url/api/scrape/website \
  -H "Content-Type: application/json" \
  -d '{"url": "https://dealeymediainternational.com", "maxPages": 10}'
```

### Option C: Using Postman/Thunder Client

1. **Method:** POST
2. **URL:** `https://your-railway-backend-url/api/scrape/website`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (JSON):**
   ```json
   {
     "url": "https://dealeymediainternational.com",
     "maxPages": 10
   }
   ```

### What Happens:
- ✅ Scraper crawls your website (up to 10 pages)
- ✅ Extracts: services, prices, FAQs, contact info, content
- ✅ Stores everything in Pinecone knowledge base
- ⏱️ Takes 2-5 minutes (check Railway logs for progress)

### Check if it worked:
- Look at Railway logs - you should see:
  - `🕷️ Scraping: https://...`
  - `✅ Stored X documents from ...`
  - `✅ Added batch X of documents`

---

## Step 2: Test the Bot

### Get Your Frontend URL:
1. Go to Vercel dashboard
2. Find your deployed frontend
3. Copy the URL (e.g., `https://sammy-ai-assistant.vercel.app`)

### Test the Bot:

1. **Open your frontend URL in Chrome browser**
2. **Click the glowing orb** (bottom right)
3. **Sammy will introduce itself** and start listening
4. **Test questions to ask:**
   - "What services do you offer?"
   - "Tell me about your SEO services"
   - "What are your prices?"
   - "How can I contact you?"

### What to Expect:
- ✅ Sammy should answer using information from your scraped website
- ✅ Answers should be accurate and specific to your company
- ✅ If knowledge base is working, answers will reference your website content

---

## Step 3: Test Booking Flow

1. **Say:** "I want to book an appointment"
2. **Sammy will ask for:**
   - Your name
   - Your email
   - Service you're interested in
   - Date and time
3. **After providing all info:**
   - Sammy will check GHL calendar availability
   - Book if time slot is free
   - Send confirmation

---

## Troubleshooting

### Scraping not working?
- Check Railway logs for errors
- Verify Railway backend URL is correct
- Make sure Pinecone is connected (`✅ Pinecone connected` in logs)

### Bot not using scraped content?
- Verify website was scraped successfully (check Railway logs)
- Check Pinecone has documents (should see "Added batch" messages)
- Try asking very specific questions about your services

### Bot not responding?
- Check browser console (F12) for errors
- Verify backend URL is set in Vercel (`VITE_BACKEND_URL`)
- Check Railway backend is running

---

## Quick Test Checklist

- [ ] Website scraped successfully
- [ ] Pinecone has documents (check Railway logs)
- [ ] Frontend URL opens
- [ ] Orb clicks and Sammy starts talking
- [ ] Bot answers questions about services
- [ ] Answers reference website content
- [ ] Booking flow works (if GHL configured)

