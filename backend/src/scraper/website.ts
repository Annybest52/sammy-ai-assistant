// @ts-nocheck
import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { v4 as uuid } from 'uuid';
import { KnowledgeBase } from '../knowledge/base.js';

interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  services: string[];
  prices: string[];
  faqs: Array<{ question: string; answer: string }>;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

interface ScrapingOptions {
  maxPages?: number;
  includeLinks?: boolean;
  waitForJs?: boolean;
}

export class WebsiteScraper {
  private browser: Browser | null = null;
  private knowledgeBase: KnowledgeBase;

  constructor() {
    this.knowledgeBase = new KnowledgeBase();
  }

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeWebsite(
    url: string,
    options: ScrapingOptions = {}
  ): Promise<ScrapedContent[]> {
    const { maxPages = 10, waitForJs = true } = options;
    await this.initialize();

    const visited = new Set<string>();
    const toVisit = [url];
    const results: ScrapedContent[] = [];
    const baseUrl = new URL(url).origin;

    while (toVisit.length > 0 && visited.size < maxPages) {
      const currentUrl = toVisit.shift()!;
      
      if (visited.has(currentUrl)) continue;
      visited.add(currentUrl);

      try {
        console.log(`🕷️ Scraping: ${currentUrl}`);
        const content = await this.scrapePage(currentUrl, waitForJs);
        results.push(content);

        // Store in knowledge base
        await this.storeInKnowledgeBase(content);

        // Find more links on the same domain
        const page = await this.browser!.newPage();
        await page.goto(currentUrl, { waitUntil: 'networkidle0', timeout: 30000 });
        
        const links = await page.evaluate((baseUrl) => {
          return Array.from(document.querySelectorAll('a[href]'))
            .map(a => a.getAttribute('href'))
            .filter(href => href && !href.startsWith('#') && !href.startsWith('mailto:'))
            .map(href => {
              if (href!.startsWith('/')) return baseUrl + href;
              if (href!.startsWith('http')) return href;
              return null;
            })
            .filter(href => href && href.startsWith(baseUrl)) as string[];
        }, baseUrl);

        await page.close();

        for (const link of links) {
          if (!visited.has(link) && !toVisit.includes(link)) {
            toVisit.push(link);
          }
        }
      } catch (error) {
        console.error(`Error scraping ${currentUrl}:`, error);
      }
    }

    return results;
  }

  private async scrapePage(url: string, waitForJs: boolean): Promise<ScrapedContent> {
    const page = await this.browser!.newPage();
    
    try {
      await page.goto(url, {
        waitUntil: waitForJs ? 'networkidle0' : 'domcontentloaded',
        timeout: 30000,
      });

      const html = await page.content();
      const $ = cheerio.load(html);

      // Remove unwanted elements
      $('script, style, nav, footer, header, iframe, noscript').remove();

      const title = $('title').text().trim() || $('h1').first().text().trim();
      
      // Extract main content
      const content = this.extractContent($);
      
      // Extract services
      const services = this.extractServices($);
      
      // Extract prices
      const prices = this.extractPrices($);
      
      // Extract FAQs
      const faqs = this.extractFaqs($);
      
      // Extract contact info
      const contactInfo = this.extractContactInfo($, html);

      return {
        url,
        title,
        content,
        services,
        prices,
        faqs,
        contactInfo,
      };
    } finally {
      await page.close();
    }
  }

  private extractContent($: cheerio.CheerioAPI): string {
    // Try to find main content areas
    const selectors = ['main', 'article', '.content', '#content', '.main-content', 'body'];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.text().replace(/\s+/g, ' ').trim();
        if (text.length > 100) {
          return text.substring(0, 5000); // Limit content length
        }
      }
    }

    return $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);
  }

  private extractServices($: cheerio.CheerioAPI): string[] {
    const services: string[] = [];
    const serviceKeywords = ['service', 'offer', 'solution', 'product', 'what we do'];

    // Look for service sections
    $('h2, h3, h4').each((_, el) => {
      const text = $(el).text().toLowerCase();
      if (serviceKeywords.some(kw => text.includes(kw))) {
        const nextItems = $(el).nextAll('ul, ol').first().find('li');
        nextItems.each((_, li) => {
          services.push($(li).text().trim());
        });
      }
    });

    // Also look for lists that might be services
    $('.services li, .service-list li, [class*="service"] li').each((_, el) => {
      services.push($(el).text().trim());
    });

    return [...new Set(services)].slice(0, 20);
  }

  private extractPrices($: cheerio.CheerioAPI): string[] {
    const prices: string[] = [];
    const priceRegex = /\$[\d,]+(?:\.\d{2})?|\d+\s*(?:USD|EUR|GBP|CAD)/gi;

    // Look for price sections
    $('*').each((_, el) => {
      const text = $(el).text();
      const matches = text.match(priceRegex);
      if (matches) {
        const context = text.substring(0, 200).trim();
        prices.push(context);
      }
    });

    // Look for pricing tables
    $('.pricing, .price, [class*="price"]').each((_, el) => {
      prices.push($(el).text().replace(/\s+/g, ' ').trim());
    });

    return [...new Set(prices)].slice(0, 10);
  }

  private extractFaqs($: cheerio.CheerioAPI): Array<{ question: string; answer: string }> {
    const faqs: Array<{ question: string; answer: string }> = [];

    // Look for FAQ sections
    $('.faq, #faq, [class*="faq"]').find('dt, .question, h3, h4').each((_, el) => {
      const question = $(el).text().trim();
      const answer = $(el).next('dd, .answer, p').text().trim();
      if (question && answer) {
        faqs.push({ question, answer });
      }
    });

    // Look for accordion-style FAQs
    $('[data-toggle="collapse"], .accordion-header, .accordion-button').each((_, el) => {
      const question = $(el).text().trim();
      const answer = $(el).closest('.accordion-item, .faq-item')
        .find('.accordion-body, .accordion-content, .collapse')
        .text().trim();
      if (question && answer) {
        faqs.push({ question, answer });
      }
    });

    return faqs.slice(0, 20);
  }

  private extractContactInfo($: cheerio.CheerioAPI, html: string): ScrapedContent['contactInfo'] {
    const contactInfo: ScrapedContent['contactInfo'] = {};

    // Extract email
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = html.match(emailRegex);
    if (emails && emails.length > 0) {
      // Filter out common false positives
      contactInfo.email = emails.find(e => 
        !e.includes('example') && 
        !e.includes('test') &&
        !e.includes('webpack')
      );
    }

    // Extract phone
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
    const phones = html.match(phoneRegex);
    if (phones && phones.length > 0) {
      contactInfo.phone = phones[0];
    }

    // Extract address
    const addressSelectors = ['.address', '[class*="address"]', '[itemprop="address"]'];
    for (const selector of addressSelectors) {
      const address = $(selector).first().text().trim();
      if (address) {
        contactInfo.address = address;
        break;
      }
    }

    return contactInfo;
  }

  private async storeInKnowledgeBase(content: ScrapedContent): Promise<void> {
    const documents = [];

    // Store main page content
    documents.push({
      id: uuid(),
      title: content.title,
      content: content.content,
      source: content.url,
      category: 'page_content',
    });

    // Store services
    if (content.services.length > 0) {
      documents.push({
        id: uuid(),
        title: `Services from ${content.title}`,
        content: content.services.join('\n'),
        source: content.url,
        category: 'services',
      });
    }

    // Store prices
    if (content.prices.length > 0) {
      documents.push({
        id: uuid(),
        title: `Pricing from ${content.title}`,
        content: content.prices.join('\n'),
        source: content.url,
        category: 'pricing',
      });
    }

    // Store FAQs
    for (const faq of content.faqs) {
      documents.push({
        id: uuid(),
        title: faq.question,
        content: faq.answer,
        source: content.url,
        category: 'faq',
      });
    }

    // Store contact info
    if (content.contactInfo.email || content.contactInfo.phone) {
      documents.push({
        id: uuid(),
        title: `Contact Info - ${content.title}`,
        content: JSON.stringify(content.contactInfo, null, 2),
        source: content.url,
        category: 'contact',
      });
    }

    await this.knowledgeBase.addDocuments(documents);
    console.log(`✅ Stored ${documents.length} documents from ${content.url}`);
  }
}


