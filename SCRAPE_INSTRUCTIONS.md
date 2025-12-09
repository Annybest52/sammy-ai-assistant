# How to Open scrape-website.html

## Method 1: Drag & Drop (Easiest)

1. **Open Chrome browser** (any window)
2. **Find the file** `scrape-website.html` in your project folder
3. **Drag the file** and **drop it** into the Chrome window
4. The page will open!

---

## Method 2: Use Chrome's File Menu

1. **Open Chrome browser**
2. Press **Ctrl + O** (or go to File → Open File)
3. Navigate to: `C:\Users\DE\Desktop\aiagent\scrape-website.html`
4. Click **Open**

---

## Method 3: Use File Explorer Address Bar

1. **Open File Explorer**
2. Navigate to: `C:\Users\DE\Desktop\aiagent`
3. **Click in the address bar** at the top
4. Type: `scrape-website.html`
5. Press **Enter**
6. It should open in your default browser

---

## Method 4: Use the .bat file

1. **Double-click** `scrape-website.bat`
2. It will automatically open Chrome with the HTML file

---

## Method 5: Use Browser Address Bar

1. **Open Chrome**
2. In the address bar, type: `file:///C:/Users/DE/Desktop/aiagent/scrape-website.html`
3. Press **Enter**

---

## Method 6: Use Command Line

1. **Open Command Prompt** (Windows + R, type `cmd`)
2. Type:
```cmd
cd C:\Users\DE\Desktop\aiagent
start chrome scrape-website.html
```

---

## Still Having Issues?

**Use Postman or Thunder Client instead:**

### Postman:
1. Download Postman: https://www.postman.com/downloads/
2. Create new request:
   - Method: **POST**
   - URL: `https://your-railway-backend-url/api/scrape/website`
   - Body → raw → JSON:
   ```json
   {
     "url": "https://dealeymediainternational.com",
     "maxPages": 10
   }
   ```
3. Click **Send**

### Thunder Client (VS Code):
1. Install Thunder Client extension in VS Code
2. Create new request:
   - Method: **POST**
   - URL: `https://your-railway-backend-url/api/scrape/website`
   - Body → JSON:
   ```json
   {
     "url": "https://dealeymediainternational.com",
     "maxPages": 10
   }
   ```
3. Click **Send**

---

## Quick Alternative: Use curl (if you have it)

Open PowerShell and run:
```powershell
$railwayUrl = "YOUR_RAILWAY_BACKEND_URL"
Invoke-RestMethod -Uri "$railwayUrl/api/scrape/website" -Method Post -ContentType "application/json" -Body '{"url":"https://dealeymediainternational.com","maxPages":10}'
```

