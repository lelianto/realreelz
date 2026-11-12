// Automate uploading reel to YouTube Studio via Chrome Remote Debugging (port 9222)
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import {existsSync} from 'node:fs';

const VIDEO_PATH = path.resolve('out/reel-curie.mp4');
const TITLE = 'Wanita Ini Dilarang Kuliah Tapi Raih 2 Nobel! | Kisah Marie Curie #Shorts';
const DESCRIPTION = `Wanita ini dilarang kuliah di tanah airnya, tapi berhasil meraih dua Hadiah Nobel. Kisah inspiratif perjuangan Marie Curie dari loteng dingin Paris hingga menemukan Radium dan Polonium.

#MarieCurie #Sains #Inspirasi #Sejarah #Shorts #CeritaStik`;

if (!existsSync(VIDEO_PATH)) {
  console.error(`Error: Video not found at ${VIDEO_PATH}`);
  process.exit(1);
}

async function upload() {
  console.log('Connecting to Chrome on port 9222…');
  let browser;
  try {
    browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null,
    });
  } catch (err) {
    console.error('Failed to connect to Chrome at http://localhost:9222');
    console.error('Make sure Chrome is running with flag: --remote-debugging-port=9222');
    process.exit(1);
  }

  console.log('Finding YouTube Studio tab…');
  const pages = await browser.pages();
  let page = pages.find((p) => p.url().includes('studio.youtube.com'));

  if (!page) {
    console.log('YouTube Studio tab not found, opening new tab…');
    page = await browser.newPage();
    await page.goto('https://studio.youtube.com', {waitUntil: 'networkidle2'});
  } else {
    console.log(`Found YouTube Studio tab: ${page.url()}`);
    await page.bringToFront();
  }

  // Ensure page is ready
  await page.waitForTimeout(2000).catch(() => new Promise((r) => setTimeout(r, 2000)));

  console.log('Opening upload dialog…');
  // Look for Create button or Upload button
  const createBtnSelector = '#create-icon, ytcp-button#create-icon, #upload-button';
  const createBtn = await page.$(createBtnSelector);

  let fileInput;
  // Trigger file chooser
  const [fileChooser] = await Promise.all([
    page.waitForFileChooser({timeout: 10000}).catch(() => null),
    (async () => {
      if (createBtn) {
        await createBtn.click();
        await new Promise((r) => setTimeout(r, 800));
        // Click Upload videos item
        const uploadItem = await page.$('ytcp-text-menu #text-item-0, paper-item#text-item-0');
        if (uploadItem) {
          await uploadItem.click();
        }
      }
      // Or click select files button directly if dialog is already open
      const selectBtn = await page.$('#select-files-button');
      if (selectBtn) {
        await selectBtn.click();
      }
    })(),
  ]);

  if (fileChooser) {
    console.log(`Selecting file: ${VIDEO_PATH}`);
    await fileChooser.accept([VIDEO_PATH]);
  } else {
    // Fallback: direct input[type="file"]
    console.log('Waiting for file input element…');
    const inputHandle = await page.waitForSelector('input[type="file"]', {timeout: 10000});
    await inputHandle.uploadFile(VIDEO_PATH);
  }

  console.log('Waiting for video metadata form to load…');
  // Wait for title input
  const titleInputSelector = '#textbox[aria-label*="title" i], #textbox[contenteditable="true"]';
  await page.waitForSelector(titleInputSelector, {timeout: 30000});
  await new Promise((r) => setTimeout(r, 2000));

  console.log('Filling title & description…');
  const textboxes = await page.$$(titleInputSelector);
  if (textboxes.length > 0) {
    // Title
    await textboxes[0].click({clickCount: 3});
    await page.keyboard.press('Backspace');
    await textboxes[0].type(TITLE, {delay: 20});
  }

  if (textboxes.length > 1) {
    // Description
    await textboxes[1].click();
    await textboxes[1].type(DESCRIPTION, {delay: 15});
  }

  // Select "No, it's not made for kids"
  console.log('Selecting "Not made for kids"…');
  const notKidsRadio = await page.$(
    'tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"], tp-yt-paper-radio-button[name*="NOT_MFK"]'
  );
  if (notKidsRadio) {
    await notKidsRadio.click();
  }

  await new Promise((r) => setTimeout(r, 1500));

  // Click Next buttons through Elements, Checks, to Visibility
  console.log('Navigating through steps…');
  for (let i = 0; i < 3; i++) {
    const nextBtn = await page.$('#next-button');
    if (nextBtn) {
      await nextBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // On Visibility tab: select Public
  console.log('Setting visibility to Public…');
  const publicRadio = await page.$(
    'tp-yt-paper-radio-button[name="PUBLIC"], #radioContainer[name="PUBLIC"]'
  );
  if (publicRadio) {
    await publicRadio.click();
  }

  await new Promise((r) => setTimeout(r, 1500));

  // Click Publish
  console.log('Publishing video…');
  const publishBtn = await page.$('#done-button');
  if (publishBtn) {
    await publishBtn.click();
    console.log('✓ Clicked Publish button!');
  } else {
    console.log('Publish button not found, please check the open dialog.');
  }

  await new Promise((r) => setTimeout(r, 3000));
  console.log('Done! Video has been submitted to YouTube Studio.');
  await browser.disconnect();
}

upload().catch((err) => {
  console.error('Error during upload:', err);
  process.exit(1);
});
