# Pinecone Setup Guide - Step by Step

## Step 1: Create Pinecone Account

1. Go to https://www.pinecone.io/
2. Click "Sign Up" or "Get Started"
3. Sign up with your email (free tier is fine)
4. Verify your email if needed

---

## Step 2: Create Your Index

1. Once logged in, you'll see the Pinecone dashboard
2. Click **"Create Index"** button (usually top right or in the sidebar)

3. Fill in the index details:
   - **Index Name:** `sammy-knowledge-base` (or any name you prefer)
   - **Dimensions:** `1024` (IMPORTANT - must be 1024)
   - **Metric:** `cosine` (default, keep this)
   - **Cloud:** Choose your preferred region (us-east-1, us-west-1, etc.)
   - **Pod Type:** `s1.x1` (free tier) or `p1.x1` (starter)

4. Click **"Create Index"**
5. Wait 1-2 minutes for the index to be created

---

## Step 3: Get Your API Key

1. In Pinecone dashboard, look for **"API Keys"** in the sidebar
2. Click on **"API Keys"**
3. You'll see your API key (starts with something like `pc-xxxxx...`)
4. Click the **copy icon** to copy your API key
5. **Save it somewhere safe** - you'll need it for Railway

---

## Step 4: Add to Railway

1. Go to your Railway dashboard: https://railway.app/dashboard
2. Click on your backend service (the one running Sammy)
3. Click on the **"Variables"** tab
4. Click **"+ New Variable"** or **"+ Add Variable"**

5. Add these two variables:

   **Variable 1:**
   - Name: `PINECONE_API_KEY`
   - Value: Paste your Pinecone API key (the one you copied)
   - Click "Add"

   **Variable 2:**
   - Name: `PINECONE_INDEX`
   - Value: `sammy-knowledge-base` (or whatever you named your index)
   - Click "Add"

6. Railway will automatically redeploy with the new variables

---

## Step 5: Verify Setup

1. Check Railway logs to see if Pinecone connected:
   - Go to Railway → Your service → Logs
   - Look for: `✅ Pinecone connected`

2. If you see an error, double-check:
   - API key is correct (no extra spaces)
   - Index name matches exactly
   - Index dimensions are 1024

---

## Troubleshooting

### "Pinecone connection failed"
- Check API key is correct
- Check index name matches exactly
- Make sure index is created and active

### "Index not found"
- Verify index name in Railway matches Pinecone dashboard
- Check index is created (not just "creating")

### Still having issues?
- Check Railway logs for specific error messages
- Verify Pinecone account is active
- Make sure you're using the correct API key (not environment key)

---

## Next Steps After Pinecone Setup

Once Pinecone is configured:
1. ✅ Scrape your website (populates knowledge base)
2. ✅ Test bot answering questions
3. ✅ Configure GHL for appointments

---

## Quick Checklist

- [ ] Pinecone account created
- [ ] Index created (name: `sammy-knowledge-base`, dimensions: 1024)
- [ ] API key copied
- [ ] `PINECONE_API_KEY` added to Railway
- [ ] `PINECONE_INDEX` added to Railway
- [ ] Railway redeployed
- [ ] Verified connection in logs (`✅ Pinecone connected`)

