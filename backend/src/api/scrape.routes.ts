import { Router, Request, Response } from 'express';
import { WebsiteScraper } from '../scraper/website.js';

const router = Router();
const scraper = new WebsiteScraper();

// POST /api/scrape/website - Scrape a website
router.post('/website', async (req: Request, res: Response) => {
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

    const results = await scraper.scrapeWebsite(url, {
      maxPages,
      waitForJs: true,
    });

    await scraper.close();

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
  } catch (error) {
    console.error('Scrape error:', error);
    await scraper.close();
    res.status(500).json({
      success: false,
      error: 'Failed to scrape website',
    });
  }
});

// POST /api/scrape/multiple - Scrape multiple websites
router.post('/multiple', async (req: Request, res: Response) => {
  try {
    const { urls, maxPagesPerSite = 5 } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'URLs array is required' });
    }

    const allResults = [];

    for (const url of urls) {
      try {
        console.log(`🕷️ Scraping: ${url}`);
        const results = await scraper.scrapeWebsite(url, {
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

    await scraper.close();

    res.json({
      success: true,
      results: allResults,
    });
  } catch (error) {
    console.error('Multi-scrape error:', error);
    await scraper.close();
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


