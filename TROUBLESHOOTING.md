# Troubleshooting Guide

## Backend Not Working / Scraping Failing

### 1. Check Railway Deployment Status

1. Go to Railway dashboard: https://railway.app
2. Check if your service shows:
   - ✅ **Active** (green) = Running
   - ⚠️ **Deploying** (yellow) = Still building
   - ❌ **Crashed** (red) = Failed

### 2. Check Railway Logs

1. In Railway dashboard, click on your service
2. Go to **Logs** tab
3. Look for errors like:
   - `Puppeteer initialization failed`
   - `Chromium not found`
   - `Port already in use`
   - `Module not found`

### 3. Common Issues & Fixes

#### Issue: "Puppeteer initialization failed"
**Fix:** 
- Check if `PUPPETEER_EXECUTABLE_PATH` is set in Railway environment variables
- Should be: `/usr/bin/chromium`

#### Issue: "Chromium not found"
**Fix:**
- The Dockerfile should install Chromium automatically
- If build fails, check Railway build logs
- May need to increase Railway build timeout

#### Issue: Backend crashes immediately
**Possible causes:**
1. Missing environment variables (OPENAI_API_KEY, etc.)
2. Port conflict
3. Memory limit exceeded

**Fix:**
- Check Railway logs for specific error
- Verify all required env vars are set
- Check Railway service settings → Resources

#### Issue: Build fails on Railway
**Possible causes:**
1. Dockerfile syntax error
2. Dependencies installation fails
3. TypeScript compilation errors

**Fix:**
- Check Railway build logs
- Test build locally: `docker build -t test .`
- Check `package.json` for dependency issues

### 4. Test Backend Manually

#### Test Health Endpoint:
```bash
curl https://your-railway-url.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

#### Test Scrape Status:
```bash
curl https://your-railway-url.railway.app/api/scrape/status
```

Should return:
```json
{"success":true,"status":"ready","message":"Scraper is ready to process URLs"}
```

### 5. Railway Environment Variables

Make sure these are set in Railway:
- `OPENAI_API_KEY` ✅
- `PINECONE_API_KEY` (optional)
- `PINECONE_INDEX` (optional)
- `PORT` (usually auto-set by Railway)
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` (optional, auto-set in Dockerfile)

### 6. Rebuild from Scratch

If nothing works:

1. **Delete and recreate Railway service:**
   - Delete current service
   - Create new service
   - Connect to same GitHub repo
   - Set all environment variables again

2. **Or force rebuild:**
   - Railway dashboard → Service → Settings
   - Click "Redeploy" or "Rebuild"

### 7. Check Resource Limits

Railway free tier has limits:
- **Build time:** 20 minutes max
- **Memory:** 512MB default
- **CPU:** Shared

If scraping fails due to memory:
- Reduce `maxPages` in scrape request (try 5 instead of 10)
- Or upgrade Railway plan

### 8. Alternative: Use Simpler Scraper

If Puppeteer keeps failing, we can switch to:
- `cheerio` only (no browser, faster but limited)
- External scraping service
- Manual content upload

---

## Still Having Issues?

1. **Share Railway logs** (copy/paste error messages)
2. **Share build logs** (if build fails)
3. **Test health endpoint** and share response
4. **Check Railway service status** (Active/Crashed/Deploying)

