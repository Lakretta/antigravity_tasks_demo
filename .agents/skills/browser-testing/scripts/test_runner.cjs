const puppeteer = require('puppeteer');
const path = require('path');

const getArg = (flag) => {
  const index = process.argv.indexOf(flag);
  return (index > -1 && process.argv[index + 1]) ? process.argv[index + 1] : null;
};

const headless = process.argv.includes('--headless');
const url = getArg('--url') || 'http://localhost:5173';
const artifactsDir = getArg('--artifacts-dir') || '/home/vlad/.gemini/antigravity/brain/b335e1ae-0815-4cd4-a7a5-d10ed523cc9a';

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

    // 1. Add Parent Task
    console.log("Adding parent task...");
    await page.waitForSelector('input[placeholder="Add a task"]', { timeout: 5000 });
    await page.type('input[placeholder="Add a task"]', 'Parent Task Test');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1500));

    // 2. Open Subtask inline creation input
    console.log("Clicking add subtask button...");
    await page.waitForSelector('button[data-testid="add-subtask-btn"]', { timeout: 5000 });
    await page.click('button[data-testid="add-subtask-btn"]');
    
    // 3. Add Subtask
    console.log("Adding subtask...");
    await page.waitForSelector('input[placeholder="Add a subtask"]', { timeout: 5000 });
    await page.type('input[placeholder="Add a subtask"]', 'Subtask Test');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1500));

    const screenshot1 = path.join(artifactsDir, 'test_step_1_subtask_created.png');
    console.log(`Saving Step 1 screenshot: ${screenshot1}`);
    await page.screenshot({ path: screenshot1 });

    // 4. Try to click parent task complete checkbox (expect warning)
    console.log("Attempting to complete parent task (should block)...");
    await page.evaluate(() => {
      // Find parent task row (first task row) and click its checkbox button
      const taskRows = document.querySelectorAll('div[data-testid="task-row"]');
      for (const row of taskRows) {
        if (row.textContent.includes('Parent Task Test')) {
          row.querySelector('button').click();
          break;
        }
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    // Check if blocker warning is visible
    console.log("Verifying blocker warning banner is displayed...");
    await page.waitForSelector('div[data-testid="blocker-warning"]', { timeout: 5000 });

    const screenshot2 = path.join(artifactsDir, 'test_step_2_blocker_warning.png');
    console.log(`Saving Step 2 screenshot: ${screenshot2}`);
    await page.screenshot({ path: screenshot2 });

    // 5. Complete Subtask first
    console.log("Completing the subtask...");
    await page.evaluate(() => {
      const taskRows = document.querySelectorAll('div[data-testid="task-row"]');
      for (const row of taskRows) {
        if (row.textContent.includes('Subtask Test')) {
          row.querySelector('button').click();
          break;
        }
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    const screenshot3 = path.join(artifactsDir, 'test_step_3_subtask_completed.png');
    console.log(`Saving Step 3 screenshot: ${screenshot3}`);
    await page.screenshot({ path: screenshot3 });

    // 6. Complete Parent Task (should now succeed)
    console.log("Completing the parent task (should now succeed)...");
    await page.evaluate(() => {
      const taskRows = document.querySelectorAll('div[data-testid="task-row"]');
      for (const row of taskRows) {
        if (row.textContent.includes('Parent Task Test')) {
          row.querySelector('button').click();
          break;
        }
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    const screenshot4 = path.join(artifactsDir, 'test_step_4_parent_completed.png');
    console.log(`Saving Step 4 screenshot: ${screenshot4}`);
    await page.screenshot({ path: screenshot4 });

    // Delete tasks to clean up
    console.log("Cleaning up...");
    await page.evaluate(() => {
      const deleteButtons = document.querySelectorAll('button[data-testid="delete-task-btn"]');
      for (const btn of deleteButtons) {
        btn.click();
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    console.log("Browser E2E testing for Subtask dependency completed successfully.");
  } catch (error) {
    console.error("Browser testing failed:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
