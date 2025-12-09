# How to Test the Bot

## 🎯 Quick Test Steps

### 1. Get Your Frontend URL
- Go to **Vercel dashboard**
- Find your deployed frontend project
- Copy the URL (e.g., `https://sammy-ai-assistant.vercel.app`)

### 2. Open in Chrome Browser
- Open the URL in **Chrome** (best compatibility)
- You should see your website with a **glowing orb** in the bottom right

### 3. Click the Orb
- Click the **glowing orb** (bottom right corner)
- Sammy will automatically introduce itself and start listening

### 4. Test Questions

**Ask these questions to test knowledge base:**
- "What services do you offer?"
- "Tell me about your SEO services"
- "What are your prices?"
- "How can I contact you?"
- "What is your company about?"

**What to expect:**
- ✅ Bot should answer using information from your scraped website
- ✅ Answers should be specific to your company
- ✅ If knowledge base is working, answers reference your website content

### 5. Test Booking Flow

**Say:**
- "I want to book an appointment"
- Follow Sammy's questions:
  - Your name
  - Your email
  - Service interested in
  - Date and time

**What happens:**
- ✅ Sammy checks GHL calendar availability
- ✅ Books if time slot is free
- ✅ Sends confirmation email/SMS

---

## 🔍 Verify Knowledge Base is Working

### Good Signs (✅ Working):
- Bot mentions specific services from your website
- Answers include details from your website
- References your company name correctly
- Knows your contact information

### Bad Signs (❌ Not Working):
- Generic answers not specific to your company
- Says "I don't know" about your services
- Doesn't mention your website content

**If not working:**
1. Check if website was scraped (Railway logs)
2. Wait 1-2 minutes after scraping
3. Try re-scraping the website

---

## 🐛 Troubleshooting

### Bot not responding?
- Check browser console (F12) for errors
- Verify `VITE_BACKEND_URL` is set in Vercel
- Check Railway backend is running

### Bot not using scraped content?
- Verify scraping completed (check Railway logs)
- Wait a few minutes after scraping
- Try asking very specific questions

### Can't hear Sammy?
- Check microphone permissions
- Use Chrome browser
- Check Windows microphone settings

---

## 📝 Test Checklist

- [ ] Frontend URL opens
- [ ] Glowing orb visible
- [ ] Orb clicks and Sammy starts talking
- [ ] Bot answers questions about services
- [ ] Answers reference website content
- [ ] Booking flow works (if GHL configured)

