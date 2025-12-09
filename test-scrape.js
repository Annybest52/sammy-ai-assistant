// Quick script to test website scraping
// Run this in your browser console or Node.js

const RAILWAY_BACKEND_URL = 'YOUR_RAILWAY_BACKEND_URL_HERE'; // Replace with your Railway URL

async function scrapeWebsite() {
  try {
    console.log('🕷️ Starting website scrape...');
    
    const response = await fetch(`${RAILWAY_BACKEND_URL}/api/scrape/website`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://dealeymediainternational.com',
        maxPages: 10
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Scraping successful!');
      console.log(`📄 Pages scraped: ${data.pagesScraped}`);
      console.log('📊 Results:', data.results);
      console.log('\n✅ Website content is now in Pinecone knowledge base!');
      console.log('🎉 You can now test the bot - it will use this content to answer questions.');
    } else {
      console.error('❌ Scraping failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the scrape
scrapeWebsite();

