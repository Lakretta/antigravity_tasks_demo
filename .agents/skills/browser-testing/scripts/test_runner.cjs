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

    // 1. Add Task
    console.log("Adding a new task...");
    await page.waitForSelector('input[placeholder="Add a task"]', { timeout: 5000 });
    await page.type('input[placeholder="Add a task"]', 'Verify reminders and alerts');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1500));

    // 2. Open Edit Details panel
    console.log("Opening edit details panel...");
    await page.waitForSelector('button[data-testid="edit-details-btn"]', { timeout: 5000 });
    await page.click('button[data-testid="edit-details-btn"]');
    
    // 3. Set due date/time to a past timestamp to immediately trigger overdue reminder
    console.log("Configuring task due date and time to the past...");
    await page.waitForSelector('input[data-testid="due-date-input"]', { timeout: 5000 });
    
    // Set inputs using the React Native Setter hack
    await page.$eval('input[data-testid="due-date-input"]', el => {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeSetter.call(el, '2026-06-20');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.$eval('input[data-testid="due-time-input"]', el => {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeSetter.call(el, '12:00');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    await new Promise(r => setTimeout(r, 2000));

    const screenshot1 = path.join(artifactsDir, 'test_step_1_task_added.png');
    console.log(`Saving Step 1 screenshot: ${screenshot1}`);
    await page.screenshot({ path: screenshot1 });

    // 4. Wait for background interval to detect overdue task and display the pop-up alert
    console.log("Waiting for reminder popup alert to trigger...");
    await page.waitForSelector('div[data-testid="reminder-popup"]', { timeout: 8000 });
    
    const screenshot2 = path.join(artifactsDir, 'test_step_2_reminder_triggered.png');
    console.log(`Saving Step 2 screenshot: ${screenshot2}`);
    await page.screenshot({ path: screenshot2 });

    // 5. Dismiss the reminder popup alert
    console.log("Dismissing the reminder alert...");
    await page.click('button[data-testid="dismiss-reminder-btn"]');
    await new Promise(r => setTimeout(r, 1500));

    const screenshot3 = path.join(artifactsDir, 'test_step_3_reminder_dismissed.png');
    console.log(`Saving Step 3 screenshot: ${screenshot3}`);
    await page.screenshot({ path: screenshot3 });

    // 6. Complete and cleanup task
    console.log("Completing and deleting task...");
    await page.evaluate(() => {
      const taskRows = document.querySelectorAll('div[data-testid="task-row"]');
      if (taskRows.length > 0) {
        // Click checkbox
        taskRows[0].querySelector('button').click();
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    // Delete task
    await page.evaluate(() => {
      const deleteButtons = document.querySelectorAll('button[data-testid="delete-task-btn"]');
      for (const btn of deleteButtons) {
        btn.click();
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    const screenshot4 = path.join(artifactsDir, 'test_step_4_cleanup.png');
    console.log(`Saving Step 4 screenshot: ${screenshot4}`);
    await page.screenshot({ path: screenshot4 });

    console.log("Browser testing for Reminders & Alerts completed successfully.");
  } catch (error) {
    console.error("Browser testing failed:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
