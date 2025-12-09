# Simple PowerShell script to scrape website
# Right-click this file → Run with PowerShell

$railwayUrl = Read-Host "Enter your Railway backend URL (e.g., https://your-app.railway.app)"
$websiteUrl = "https://dealeymediainternational.com"
$maxPages = 10

Write-Host "`n🕷️ Starting to scrape website..." -ForegroundColor Cyan
Write-Host "Railway URL: $railwayUrl" -ForegroundColor Gray
Write-Host "Website URL: $websiteUrl" -ForegroundColor Gray
Write-Host "Max Pages: $maxPages`n" -ForegroundColor Gray

try {
    $body = @{
        url = $websiteUrl
        maxPages = $maxPages
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$railwayUrl/api/scrape/website" -Method Post -ContentType "application/json" -Body $body

    if ($response.success) {
        Write-Host "✅ Scraping Successful!" -ForegroundColor Green
        Write-Host "📄 Pages scraped: $($response.pagesScraped)" -ForegroundColor Green
        Write-Host "`n📊 Results:" -ForegroundColor Cyan
        $response.results | ForEach-Object {
            Write-Host "  - $($_.title) ($($_.servicesFound) services, $($_.faqsFound) FAQs)" -ForegroundColor White
        }
        Write-Host "`n✅ Content is now in Pinecone knowledge base!" -ForegroundColor Green
        Write-Host "🎉 You can now test the bot - it will use this content to answer questions.`n" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Scraping failed: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nMake sure:" -ForegroundColor Yellow
    Write-Host "  1. Railway backend URL is correct" -ForegroundColor Yellow
    Write-Host "  2. Railway backend is running" -ForegroundColor Yellow
    Write-Host "  3. You have internet connection`n" -ForegroundColor Yellow
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

