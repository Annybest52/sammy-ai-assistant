import { Router, Request, Response } from 'express';
import { WebsiteScraper } from '../scraper/website.js';

const router = Router();
// Lazy-load scraper only when needed (not at module load time)
let scraper: WebsiteScraper | null = null;

function getScraper(): WebsiteScraper {
  if (!scraper) {
    scraper = new WebsiteScraper();
  }
  return scraper;
}

// POST /api/scrape/website - Scrape a website
router.post('/website', async (req: Request, res: Response) => {
  let scraperInstance: WebsiteScraper | null = null;
  try {
    const { url, maxPages = 10 } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log(`🕷️ Starting scrape for: ${url}`);

    // Initialize scraper with error handling
    try {
      scraperInstance = getScraper();
      await scraperInstance.initialize();
    } catch (initError: any) {
      console.error('Failed to initialize scraper:', initError);
      return res.status(500).json({
        success: false,
        error: `Failed to initialize browser: ${initError.message}`,
        hint: 'Make sure Chromium is installed and PUPPETEER_EXECUTABLE_PATH is set correctly',
      });
    }

    const results = await scraperInstance.scrapeWebsite(url, {
      maxPages,
      waitForJs: true,
    });

    await scraperInstance.close();

    res.json({
      success: true,
      pagesScraped: results.length,
      results: results.map(r => ({
        url: r.url,
        title: r.title,
        servicesFound: r.services.length,
        faqsFound: r.faqs.length,
        hasContactInfo: !!(r.contactInfo.email || r.contactInfo.phone),
      })),
    });
  } catch (error: any) {
    console.error('Scrape error:', error);
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorStack = error?.stack || '';
    
    // Try to close scraper, but don't fail if it's already closed
    if (scraperInstance) {
      try {
        await scraperInstance.close();
      } catch (closeError) {
        console.error('Error closing scraper:', closeError);
      }
    }
    
    // Return detailed error for debugging
    res.status(500).json({
      success: false,
      error: errorMessage,
      errorType: error?.name || 'Error',
      details: errorStack.substring(0, 500), // Limit stack trace length
    });
  }
});

// POST /api/scrape/multiple - Scrape multiple websites
router.post('/multiple', async (req: Request, res: Response) => {
  const scraperInstance = getScraper();
  try {
    const { urls, maxPagesPerSite = 5 } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'URLs array is required' });
    }

    const allResults = [];

    for (const url of urls) {
      try {
        console.log(`🕷️ Scraping: ${url}`);
        const results = await scraperInstance.scrapeWebsite(url, {
          maxPages: maxPagesPerSite,
          waitForJs: true,
        });
        allResults.push({
          url,
          success: true,
          pagesScraped: results.length,
        });
      } catch (error) {
        allResults.push({
          url,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    await scraperInstance.close();

    res.json({
      success: true,
      results: allResults,
    });
  } catch (error) {
    console.error('Multi-scrape error:', error);
    await scraperInstance.close();
    res.status(500).json({
      success: false,
      error: 'Failed to scrape websites',
    });
  }
});

// GET /api/scrape/status - Get scraper status
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'ready',
    message: 'Scraper is ready to process URLs',
  });
});

export { router as scrapeRouter };
