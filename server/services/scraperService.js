const puppeteer = require('puppeteer');

/**
 * Scrapes the content of a given URL.
 * @param {string} url - The URL to scrape.
 * @returns {Promise<{title: string, description: string, content: string}>}
 */
async function scrapeWebsite(url) {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
    });
    const page = await browser.newPage();

    // Set user agent to avoid basic bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const data = await page.evaluate(() => {
      const title = document.title;
      const description = document.querySelector('meta[name="description"]')?.content || '';

      // Get visible text content
      // Remove scripts, styles, etc.
      const scripts = document.querySelectorAll('script, style, noscript');
      scripts.forEach(script => script.remove());

      const content = document.body.innerText;
      return { title, description, content };
    });

    return data;
  } catch (error) {
    console.error('Error scraping website:', error);
    throw new Error(`Failed to scrape website: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { scrapeWebsite };
