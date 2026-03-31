/**
 * Web Scraper for Real Estate Listings
 * Supports: Zillow, Redfin, Realtor.com
 * Uses Puppeteer for headless browser automation
 */

import puppeteer, { Browser, Page } from 'puppeteer';

interface ScrapedProperty {
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  public_remarks: string;
  source: 'Zillow' | 'Redfin' | 'Realtor.com';
  source_url: string;
  property_type: 'residential' | 'str';
  photos: Array<{
    url: string;
    order: number;
  }>;
}

class WebScraper {
  private browser: Browser | null = null;

  /**
   * Initialize Puppeteer browser
   */
  async initialize(): Promise<void> {
    if (this.browser) return;

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });
  }

  /**
   * Close browser connection
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Scrape property data from URL
   * @param url - URL to scrape (Zillow, Redfin, or Realtor.com)
   * @returns Scraped property data
   */
  async scrapePropertyFromURL(url: string): Promise<ScrapedProperty | null> {
    try {
      await this.initialize();

      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      // Determine source from URL
      let source: 'Zillow' | 'Redfin' | 'Realtor.com';
      if (url.includes('zillow.com')) {
        source = 'Zillow';
        return await this.scrapeZillow(url);
      } else if (url.includes('redfin.com')) {
        source = 'Redfin';
        return await this.scrapeRedfin(url);
      } else if (url.includes('realtor.com')) {
        source = 'Realtor.com';
        return await this.scrapeRealtor(url);
      } else {
        throw new Error(`Unsupported domain: ${new URL(url).hostname}`);
      }

    } catch (error) {
      console.error('Error scraping property:', error);
      return null;
    }
  }

  /**
   * Scrape Zillow listing
   */
  private async scrapeZillow(url: string): Promise<ScrapedProperty | null> {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      await page.waitForTimeout(2000); // Wait for content to load

      // Extract property data
      const data = await page.evaluate(() => {
        // Zillow page structure (may vary)
        const addressEl = document.querySelector('[data-testid="hdp-home-details"] h1');
        const priceEl = document.querySelector('[data-testid="price"] span');
        const bedsEl = document.querySelector('[data-testid="bed"]');
        const bathsEl = document.querySelector('[data-testid="bath"]');
        const sqftEl = document.querySelector('[data-testid="sqft"]');
        const descEl = document.querySelector('[data-testid="home-description"]');

        // Photo gallery
        const photos: Array<{ url: string; order: number }> = [];
        const photoElements = document.querySelectorAll('img[alt*="photo"]');
        photoElements.forEach((el, index) => {
          const src = el.getAttribute('src');
          if (src && !src.includes('placeholder')) {
            photos.push({
              url: src,
              order: index,
            });
          }
        });

        return {
          address: addressEl?.textContent || '',
          price: parseInt(priceEl?.textContent?.replace(/[^0-9]/g, '') || '0'),
          bedrooms: parseInt(bedsEl?.textContent?.match(/\d+/)?.[0] || '0'),
          bathrooms: parseFloat(bathsEl?.textContent?.match(/\d+\.?\d*/)?.[0] || '0'),
          sqft: parseInt(sqftEl?.textContent?.replace(/[^0-9]/g, '') || '0'),
          remarks: descEl?.textContent || '',
          photos,
        };
      });

      // Parse address into components
      const addressParts = this.parseAddress(data.address);

      return {
        ...addressParts,
        price: data.price || 0,
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 0,
        sqft: data.sqft || 0,
        public_remarks: data.remarks || '',
        source: 'Zillow',
        source_url: url,
        property_type: 'residential',
        photos: data.photos || [],
      };

    } catch (error) {
      console.error('Error scraping Zillow:', error);
      return null;
    } finally {
      await page.close();
    }
  }

  /**
   * Scrape Redfin listing
   */
  private async scrapeRedfin(url: string): Promise<ScrapedProperty | null> {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      await page.waitForTimeout(2000);

      const data = await page.evaluate(() => {
        // Redfin page structure
        const addressEl = document.querySelector('[data-testid="address-header"]');
        const priceEl = document.querySelector('[data-testid="price"]');
        const statsEl = document.querySelector('[data-testid="property-stats"]');
        const descEl = document.querySelector('[data-testid="description"]');

        // Extract beds/baths/sqft from stats
        const statsText = statsEl?.textContent || '';
        const beds = parseInt(statsText.match(/(\d+)\s*(?:bed|bd)/i)?.[1] || '0');
        const baths = parseFloat(statsText.match(/(\d+\.?\d*)\s*(?:bath|ba)/i)?.[1] || '0');
        const sqft = parseInt(statsText.match(/(\d+)\s*(?:sqft|sq ft)/i)?.[1] || '0');

        // Photos
        const photos: Array<{ url: string; order: number }> = [];
        const photoElements = document.querySelectorAll('[data-testid="photo-gallery"] img');
        photoElements.forEach((el, index) => {
          const src = el.getAttribute('src');
          if (src && !src.includes('placeholder')) {
            photos.push({
              url: src,
              order: index,
            });
          }
        });

        return {
          address: addressEl?.textContent || '',
          price: parseInt(priceEl?.textContent?.replace(/[^0-9]/g, '') || '0'),
          bedrooms: beds,
          bathrooms: baths,
          sqft,
          remarks: descEl?.textContent || '',
          photos,
        };
      });

      const addressParts = this.parseAddress(data.address);

      return {
        ...addressParts,
        price: data.price || 0,
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 0,
        sqft: data.sqft || 0,
        public_remarks: data.remarks || '',
        source: 'Redfin',
        source_url: url,
        property_type: 'residential',
        photos: data.photos || [],
      };

    } catch (error) {
      console.error('Error scraping Redfin:', error);
      return null;
    } finally {
      await page.close();
    }
  }

  /**
   * Scrape Realtor.com listing
   */
  private async scrapeRealtor(url: string): Promise<ScrapedProperty | null> {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      await page.waitForTimeout(2000);

      const data = await page.evaluate(() => {
        // Realtor.com page structure
        const addressEl = document.querySelector('[data-testid="hero-headline"]');
        const priceEl = document.querySelector('[data-testid="hero-price"]');
        const statsContainer = document.querySelector('[data-testid="hero-section"]');

        // Extract beds/baths/sqft
        const statsText = statsContainer?.textContent || '';
        const beds = parseInt(statsText.match(/(\d+)\s*(?:bed|bd)/i)?.[1] || '0');
        const baths = parseFloat(statsText.match(/(\d+\.?\d*)\s*(?:bath|ba)/i)?.[1] || '0');
        const sqft = parseInt(statsText.match(/(\d+)\s*(?:sqft|sq ft)/i)?.[1] || '0');

        // Description
        const descEl = document.querySelector('[data-testid="description"]');

        // Photos
        const photos: Array<{ url: string; order: number }> = [];
        const photoElements = document.querySelectorAll('[data-testid="photo"] img');
        photoElements.forEach((el, index) => {
          const src = el.getAttribute('src');
          if (src && !src.includes('placeholder')) {
            photos.push({
              url: src,
              order: index,
            });
          }
        });

        return {
          address: addressEl?.textContent || '',
          price: parseInt(priceEl?.textContent?.replace(/[^0-9]/g, '') || '0'),
          bedrooms: beds,
          bathrooms: baths,
          sqft,
          remarks: descEl?.textContent || '',
          photos,
        };
      });

      const addressParts = this.parseAddress(data.address);

      return {
        ...addressParts,
        price: data.price || 0,
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 0,
        sqft: data.sqft || 0,
        public_remarks: data.remarks || '',
        source: 'Realtor.com',
        source_url: url,
        property_type: 'residential',
        photos: data.photos || [],
      };

    } catch (error) {
      console.error('Error scraping Realtor.com:', error);
      return null;
    } finally {
      await page.close();
    }
  }

  /**
   * Parse address string into components
   * Format: "123 Main St, Austin, TX 78701"
   */
  private parseAddress(addressString: string): {
    address: string;
    city: string;
    state: string;
    zip: string;
  } {
    const parts = addressString.split(',').map((part) => part.trim());

    return {
      address: parts[0] || '',
      city: parts[1] || '',
      state: parts[2]?.split(/\s+/)[0] || '',
      zip: parts[2]?.match(/\d{5}(-\d{4})?/)?.[0] || '',
    };
  }
}

// Export singleton instance
export const webScraper = new WebScraper();

// Export type
export type { ScrapedProperty };
