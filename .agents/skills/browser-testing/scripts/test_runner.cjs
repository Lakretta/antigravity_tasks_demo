const puppeteer = require('puppeteer');

// Parse arguments manually to avoid extra CLI library dependencies
const getArg = (flag) => {
  const index = process.argv.indexOf(flag);
  return (index > -1 && process.argv[index + 1]) ? process.argv[index + 1] : null;
};

const headless = process.argv.includes('--headless');
const url = getArg('--url') || 'http://localhost:5173';
const screenshotPath = getArg('--screenshot') || 'screenshot.png';

(async () => {
  const isHeadless = headless;
  console.log(`Launching ${isHeadless ? 'headless' : 'visual (headful)'} browser...`);
  
  let browser;
  const launchOptions = {
    headless: isHeadless,
    slowMo: isHeadless ? 0 : 150, // slow down actions in visual mode so they can be observed
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };

  // Try to use system Google Chrome first, fallback to Puppeteer's bundle if it fails
  try {
    browser = await puppeteer.launch({
      ...launchOptions,
      executablePath: '/usr/bin/google-chrome'
    });
    console.log("Using system Google Chrome browser.");
  } catch (error) {
    console.log("System Google Chrome not found at /usr/bin/google-chrome, launching with default Puppeteer Chromium...");
    try {
      browser = await puppeteer.launch(launchOptions);
    } catch (fallbackError) {
      console.error("Failed to launch browser:", fallbackError);
      process.exit(1);
    }
  }
  
  try {
    const page = await browser.newPage();
    
    // Disable cache
    await page.setCacheEnabled(false);
    
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'load' });
    
    // Set viewport width/height
    await page.setViewport({ width: 1280, height: 800 });
    
    // Ensure the main layout exists
    console.log("Waiting for application container...");
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Listen for console logs and page errors
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER PAGE ERROR:', err));
    
    // Wait for data load
    console.log("Waiting 2 seconds for initial database load...");
    await new Promise(r => setTimeout(r, 2000));
    
    console.log(`Page title detected: ${await page.title()}`);

    // --- Interactive Visual Test Steps ---
    console.log("1. Locating task input...");
    await page.waitForSelector('input[placeholder="Add a task"]', { timeout: 5000 });
    
    console.log("2. Typing a new test task...");
    await page.type('input[placeholder="Add a task"]', 'Verify visual testing with Puppeteer');
    await new Promise(r => setTimeout(r, 500));
    
    console.log("3. Submitting task by pressing Enter...");
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1500)); // wait for list to update

    console.log("4. Toggling the task to completed...");
    const toggled = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const targetSpan = spans.find(span => span.textContent.includes('Verify visual testing with Puppeteer'));
      if (targetSpan) {
        const row = targetSpan.parentElement;
        const buttons = row.querySelectorAll('button');
        if (buttons.length > 0) {
          buttons[0].click(); // Click the circle checkbox
          return true;
        }
      }
      return false;
    });
    
    if (toggled) {
      console.log("Successfully toggled task state.");
    } else {
      console.warn("Could not find the created task to toggle.");
    }
    await new Promise(r => setTimeout(r, 1500)); // wait for transition

    console.log("5. Cleaning up and deleting the task...");
    const deleted = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const targetSpan = spans.find(span => span.textContent.includes('Verify visual testing with Puppeteer'));
      if (targetSpan) {
        const row = targetSpan.parentElement;
        const buttons = row.querySelectorAll('button');
        if (buttons.length > 1) {
          buttons[1].click(); // Click the trash delete button
          return true;
        }
      }
      return false;
    });

    if (deleted) {
      console.log("Successfully deleted task.");
    } else {
      console.warn("Could not find the task to delete.");
    }
    await new Promise(r => setTimeout(r, 1500)); // wait for transition
    
    // Capture verification screenshot
    console.log(`Saving verification screenshot to ${screenshotPath}...`);
    await page.screenshot({ path: screenshotPath });
    
    console.log(`Browser verification completed successfully.`);
  } catch (error) {
    console.error(`Browser verification failed:`, error);
    process.exit(1);
  } finally {
    if (!isHeadless) {
      console.log("Holding browser open for 3 seconds so you can see final state...");
      await new Promise(r => setTimeout(r, 3000));
    }
    await browser.close();
  }
})();
