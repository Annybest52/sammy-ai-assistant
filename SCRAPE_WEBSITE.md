# How to Scrape Website & Test Bot

## 🕷️ Step 1: Scrape Your Website (Add to Pinecone)

### Easiest Method: Browser Console

1. **Get your Railway backend URL**
   - Go to Railway dashboard → Your backend service
   - Copy the URL (e.g., `https://sammy-ai-assistant-production-xxxx.up.railway.app`)

2. **Open your Railway backend URL in browser** and add `/api/scrape/website` to test the endpoint first
   - Should show: `{"success":true,"status":"ready",...}`

3. **Open browser console (F12)** on any page and paste this:

```javascript
// Replace YOUR_RAILWAY_URL with your actual Railway backend URL
const RAILWAY_URL = 'YOUR_RAILWAY_URL_HERE';

fetch(`${RAILWAY_URL}/api/scrape/website`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://dealeymediainternational.com',
    maxPages: 10
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Scraping Result:', data);
  if (data.success) {
    console.log(`📄 Scraped ${data.pagesScraped} pages!`);
    console.log('✅ Content is now in Pinecone!');
  }
})
.catch(err => console.error('❌ Error:', err));
```

4. **Press Enter** and wait 2-5 minutes
5. **Check Railway logs** - you should see:
   - `🕷️ Scraping: https://...`
   - `✅ Stored X documents from ...`

---

## 🧪 Step 2: Test the Bot

### Get Your Frontend URL:
- Go to Vercel dashboard
- Find your deployed frontend
- Copy the URL

### Test Questions:

1. **Open your frontend URL** (e.g., `https://sammy-ai-assistant.vercel.app`)
2. **Click the glowing orb** (bottom right)
3. **Sammy will introduce itself**
4. **Ask these questions:**
   - "What services do you offer?"
   - "Tell me about SEO"
   - "What are your prices?"
   - "How can I contact you?"

### What to Expect:
- ✅ Answers should reference your website content
- ✅ Specific details about your services
- ✅ Accurate information from your website

---

## 🔍 Verify It's Working

### Check Pinecone has content:
1. Go to Railway → Logs
2. Look for: `✅ Added batch X of documents`
3. Should see multiple "Stored X documents" messages

### Check bot uses knowledge:
- Ask: "What services do you offer?"
- If bot mentions specific services from your website → ✅ Working!
- If generic answers → Website might not be scraped yet

---

## 🚨 Troubleshooting

### Scraping fails?
- Check Railway logs for errors
- Verify Railway URL is correct
- Make sure Pinecone is connected

### Bot not using scraped content?
- Verify scraping completed (check Railway logs)
- Wait a few minutes after scraping
- Try asking very specific questions

