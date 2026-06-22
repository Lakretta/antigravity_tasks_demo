const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const getArg = (flag) => {
  const index = process.argv.indexOf(flag);
  return (index > -1 && process.argv[index + 1]) ? process.argv[index + 1] : null;
};

const headless = process.argv.includes('--headless');
const url = getArg('--url') || 'http://localhost:5173';
const artifactsDir = getArg('--artifacts-dir') || path.join(process.cwd(), 'scratch');

if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

(async () => {
  const isHeadless = headless;
  console.log(`Launching ${isHeadless ? 'headless' : 'visual (headful)'} browser...`);
  
  let browser;
  const launchOptions = {
    headless: isHeadless,
    slowMo: isHeadless ? 0 : 150,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };

  try {
    browser = await puppeteer.launch({
      ...launchOptions,
      executablePath: '/usr/bin/google-chrome'
    });
  } catch (error) {
    try {
      browser = await puppeteer.launch(launchOptions);
    } catch (fallbackError) {
      console.error("Failed to launch browser:", fallbackError);
      process.exit(1);
    }
  }
  
  try {
    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    await page.goto(url, { waitUntil: 'load' });
    await page.setViewport({ width: 1280, height: 800 });
    
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(r => setTimeout(r, 2000));

    // Cleanup existing tasks
    console.log("Cleaning up existing tasks...");
    await page.evaluate(() => {
      const deleteButtons = document.querySelectorAll('button[data-testid="delete-task-btn"]');
      for (const btn of deleteButtons) {
        btn.click();
      }
    });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Add Task 1
    console.log("Adding first task...");
    await page.waitForSelector('input[placeholder="Add a task"]', { timeout: 5000 });
    await page.type('input[placeholder="Add a task"]', 'Tag Test Task');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1500));

    // 2. Open Edit Details panel for Task 1
    console.log("Opening edit details panel...");
    await page.waitForSelector('button[data-testid="edit-details-btn"]', { timeout: 5000 });
    await page.click('button[data-testid="edit-details-btn"]');
    
    // 3. Add Tag 'Work' and 'Urgent'
    console.log("Adding tag 'Work'...");
    await page.waitForSelector('input[data-testid="tag-input"]', { timeout: 5000 });
    await page.type('input[data-testid="tag-input"]', 'Work');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1000));

    console.log("Adding tag 'Urgent'...");
    await page.type('input[data-testid="tag-input"]', 'Urgent');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1500));

    const screenshot1 = path.join(artifactsDir, 'test_step_1_tags_added.png');
    console.log(`Saving Step 1 screenshot: ${screenshot1}`);
    await page.screenshot({ path: screenshot1 });

    // Close details tray
    await page.click('button[data-testid="edit-details-btn"]');
    await new Promise(r => setTimeout(r, 1000));

    // 4. Add Task 2 (no tags)
    console.log("Adding second task (untagged)...");
    await page.type('input[placeholder="Add a task"]', 'Untagged Task');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1500));

    // 5. Click tag filter button 'Urgent'
    console.log("Clicking 'Urgent' tag filter...");
    await page.waitForSelector('button[data-testid="tag-filter-Urgent"]', { timeout: 5000 });
    await page.click('button[data-testid="tag-filter-Urgent"]');
    await new Promise(r => setTimeout(r, 1500));

    const screenshot2 = path.join(artifactsDir, 'test_step_2_tag_filtered.png');
    console.log(`Saving Step 2 screenshot: ${screenshot2}`);
    await page.screenshot({ path: screenshot2 });

    // 6. Clear tag filter
    console.log("Clearing tag filter...");
    await page.waitForSelector('button[data-testid="tag-filter-All"]', { timeout: 5000 });
    await page.click('button[data-testid="tag-filter-All"]');
    await new Promise(r => setTimeout(r, 1500));

    const screenshot3 = path.join(artifactsDir, 'test_step_3_filter_cleared.png');
    console.log(`Saving Step 3 screenshot: ${screenshot3}`);
    await page.screenshot({ path: screenshot3 });

    // Delete tasks to clean up
    console.log("Cleaning up...");
    await page.evaluate(() => {
      const deleteButtons = document.querySelectorAll('button[data-testid="delete-task-btn"]');
      for (const btn of deleteButtons) {
        btn.click();
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    console.log("Browser E2E testing for Tags completed successfully.");
  } catch (error) {
    console.error("Browser testing failed:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
