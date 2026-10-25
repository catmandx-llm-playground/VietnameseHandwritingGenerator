import puppeteer from 'puppeteer-core';
import path from 'path';

const SCREENSHOT_DIR = '/root/.gemini/antigravity-cli/brain/6e783c66-3587-44c7-a970-1e1a91e1ecf7';

async function runHeadlessTests() {
  console.log('🚀 Launching Headless Chrome for Comprehensive E2E Verification...');
  
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--headless=new',
      '--window-size=1600,1200'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 1 });

  const consoleErrors = [];
  const consoleWarnings = [];
  const networkErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') {
      consoleErrors.push(text);
      console.error(`  ❌ [Browser Error]: ${text}`);
    } else if (type === 'warn') {
      consoleWarnings.push(text);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
    console.error(`  ❌ [Browser PageError]: ${err}`);
  });

  page.on('requestfailed', request => {
    // Ignore harmless favicon or external font prefetch if any
    const url = request.url();
    const err = request.failure()?.errorText || 'Unknown failure';
    networkErrors.push({ url, err });
    console.error(`  ❌ [Network Failed]: ${url} (${err})`);
  });

  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (status >= 400) {
      networkErrors.push({ url, status });
      console.error(`  ❌ [HTTP ${status}]: ${url}`);
    }
  });

  // 1. Navigation
  console.log('📡 Navigating to http://127.0.0.1:8080/...');
  const response = await page.goto('http://127.0.0.1:8080/', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  if (response.status() !== 200) {
    throw new Error(`Expected HTTP 200, got ${response.status()}`);
  }
  console.log('  ✅ Page loaded successfully with HTTP 200');

  // Allow a moment for initial render
  await new Promise(r => setTimeout(r, 600));

  // 2. Facade & Sub-Module Integrity Verification
  console.log('\n🔍 Testing window.view Facade & ES Module integrity...');
  const facadeCheck = await page.evaluate(() => {
    const v = window.view;
    return {
      hasWindowView: typeof v !== 'undefined',
      hasConfig: typeof v?.config === 'object',
      hasUtils: typeof v?.utils === 'object',
      hasModel: typeof v?.model === 'object',
      hasBoardRenderer: typeof v?.boardRenderer === 'object',
      hasDottingManager: typeof v?.dottingManager === 'object',
      hasDragStretchHandler: typeof v?.dragStretchHandler === 'object',
      hasFreestyleDottingModal: typeof v?.freestyleDottingModal === 'object',
      hasStorageManager: typeof v?.storageManager === 'object',
      hasExportEngine: typeof v?.exportEngine === 'object',
      hasUiController: typeof v?.uiController === 'object',
      glyphModelLoaded: v?.model?.isLoaded === true && Object.keys(v?.model?.glyphs || {}).length > 0
    };
  });
  console.log('  Facade check result:', facadeCheck);
  for (const [key, val] of Object.entries(facadeCheck)) {
    if (!val) throw new Error(`Facade check failed for property: ${key}`);
  }
  console.log('  ✅ All 10 specialized ES modules loaded and active in window.view facade');

  // 3. Infinite Board & Line Geometry (72pt) Invariant Verification
  console.log('\n🔍 Testing Infinite Board layout and 72pt line geometry invariant...');
  const geom72 = await page.evaluate(() => {
    const firstLine = document.querySelector('#result .line');
    if (!firstLine) return { error: 'No line rendered' };
    const style = window.getComputedStyle(firstLine);
    const rect = firstLine.getBoundingClientRect();
    const words = Array.from(firstLine.querySelectorAll('.word')).map(w => w.textContent.trim());
    return {
      lineHeight: style.height,
      maxHeight: style.maxHeight,
      minHeight: style.minHeight,
      rectHeight: Math.round(rect.height * 10) / 10,
      boxSizing: style.boxSizing,
      words: words
    };
  });
  console.log('  72pt Geometry metrics:', geom72);
  if (Math.abs(geom72.rectHeight - 153.6) > 0.5) {
    throw new Error(`72pt Line height must be ~153.6px, got ${geom72.rectHeight}px`);
  }
  console.log(`  ✅ 72pt line height invariant preserved: ${geom72.rectHeight}px (~153.6px)`);
  console.log(`  ✅ Rendered initial words: [${geom72.words.join(', ')}]`);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_01_infinite_72pt.png') });

  // 4. Test Font Size Switch to 37pt (1 ô ly)
  console.log('\n🔍 Testing Font Size Switch to 37pt (1 ô ly)...');
  await page.evaluate(() => {
    const select = document.getElementById('font-size-select');
    select.value = '37';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 600));

  const geom37 = await page.evaluate(() => {
    const firstLine = document.querySelector('#result .line');
    const style = window.getComputedStyle(firstLine);
    const rect = firstLine.getBoundingClientRect();
    return {
      lineHeight: style.height,
      rectHeight: Math.round(rect.height * 10) / 10
    };
  });
  console.log('  37pt Geometry metrics:', geom37);
  if (Math.abs(geom37.rectHeight - 76.8) > 0.5) {
    throw new Error(`37pt Line height must be ~76.8px, got ${geom37.rectHeight}px`);
  }
  console.log(`  ✅ 37pt line height invariant preserved: ${geom37.rectHeight}px (~76.8px)`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_02_infinite_37pt.png') });

  // Switch back to 72pt
  await page.evaluate(() => {
    const select = document.getElementById('font-size-select');
    select.value = '72';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 300));

  // 5. Blackboard Mode & Single-Line Absolute Architecture Invariant
  console.log('\n🔍 Testing Blackboard mode & isolation invariants...');
  await page.evaluate(() => {
    const select = document.getElementById('board-color-select');
    select.value = 'blackboard';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 600));

  const blackboardCheck = await page.evaluate(() => {
    const board = document.querySelector('.board.blackboard');
    const result = document.querySelector('.board.blackboard #result') || document.querySelector('#result');
    const firstLine = result?.querySelector('.line');
    const resultStyle = result ? window.getComputedStyle(result) : null;
    const lineStyle = firstLine ? window.getComputedStyle(firstLine) : null;
    return {
      hasBlackboardClass: !!board,
      resultDisplay: resultStyle?.display,
      resultPosition: resultStyle?.position,
      resultLeft: resultStyle?.left,
      lineHeight: lineStyle?.height,
      lineMaxHeight: lineStyle?.maxHeight
    };
  });
  console.log('  Blackboard Metrics:', blackboardCheck);
  if (!blackboardCheck.hasBlackboardClass) {
    throw new Error('Board failed to apply .board.blackboard class');
  }
  if (blackboardCheck.resultPosition !== 'absolute') {
    throw new Error(`Blackboard #result must be position: absolute, got ${blackboardCheck.resultPosition}`);
  }
  if (blackboardCheck.resultLeft !== '96.09px') {
    throw new Error(`Blackboard #result must have left: 96.09px, got ${blackboardCheck.resultLeft}`);
  }
  console.log('  ✅ Blackboard single-line absolute architecture verified (position: absolute, left: 96.09px)');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_03_blackboard.png') });

  // 6. 11x14 Notebook Layout Switch
  console.log('\n🔍 Testing 11x14 Notebook layout switch...');
  await page.evaluate(() => {
    const select = document.getElementById('board-color-select');
    select.value = 'white_11x14';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 600));

  const notebookCheck = await page.evaluate(() => {
    const board = document.querySelector('.board.white_11x14');
    return {
      hasWhite11x14Class: !!board,
      boardWidth: board?.offsetWidth,
      boardHeight: board?.offsetHeight
    };
  });
  console.log('  11x14 Notebook Metrics:', notebookCheck);
  if (!notebookCheck.hasWhite11x14Class) {
    throw new Error('Board failed to apply .board.white_11x14 class');
  }
  console.log(`  ✅ 11x14 notebook layout active: ${notebookCheck.boardWidth}px width`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_04_notebook_11x14.png') });

  // Switch back to normal white board
  await page.evaluate(() => {
    const select = document.getElementById('board-color-select');
    select.value = 'white';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 400));

  // 7. Dynamic Text Editing and Multi-line Rendering
  console.log('\n🔍 Testing dynamic Vietnamese text editing & multi-line rendering...');
  const typingResult = await page.evaluate(async () => {
    const input = document.getElementById('input');
    input.value = 'Học thầy không tày học bạn\nUống nước nhớ nguồn';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Allow animation frame
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => setTimeout(r, 400));

    const lines = document.querySelectorAll('#result .line');
    return {
      lineCount: lines.length,
      line1Words: Array.from(lines[0]?.querySelectorAll('.word') || []).map(w => w.textContent.trim()),
      line2Words: Array.from(lines[1]?.querySelectorAll('.word') || []).map(w => w.textContent.trim())
    };
  });
  console.log('  Dynamic typing render result:', typingResult);
  if (typingResult.lineCount !== 2) {
    throw new Error(`Expected 2 rendered lines, got ${typingResult.lineCount}`);
  }
  console.log(`  ✅ Multi-line Vietnamese rendering verified: 2 lines rendered dynamically`);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_05_multiline_editing.png') });

  // 8. Freestyle Dotting Modal Check
  console.log('\n🔍 Testing Freestyle Dotting Modal trigger & grid render...');
  const modalCheck = await page.evaluate(async () => {
    const v = window.view;
    if (v?.openFreestyleDottingModal) {
      v.openFreestyleDottingModal(0, 0);
      await new Promise(r => setTimeout(r, 300));
      const modal = document.getElementById('freestyleDottingModal');
      const isVisible = modal && window.getComputedStyle(modal).display !== 'none';
      const svgGrid = modal?.querySelector('svg');
      
      // Close modal
      const closeBtn = document.getElementById('btn-close-freestyle-modal') || modal?.querySelector('.freestyle-modal-close');
      if (closeBtn) {
        closeBtn.click();
      } else if (modal) {
        modal.style.display = 'none';
      }
      return {
        modalOpened: isVisible,
        hasSvgGrid: !!svgGrid
      };
    }
    return { modalOpened: false, hasSvgGrid: false };
  });
  console.log('  Freestyle modal check:', modalCheck);
  if (!modalCheck.modalOpened) {
    throw new Error('Freestyle dotting modal failed to open');
  }
  console.log('  ✅ Freestyle Dotting Modal interactive trigger verified');

  await browser.close();

  console.log('\n================ FINAL TEST REPORT ================');
  console.log(`  Console Errors: ${consoleErrors.length}`);
  console.log(`  Network Errors: ${networkErrors.length}`);
  console.log(`  Screenshots written to: ${SCREENSHOT_DIR}`);

  if (consoleErrors.length > 0 || networkErrors.length > 0) {
    console.error('❌ Headless test failed due to browser or network errors.');
    return 1;
  }
  console.log('🎉 ALL HEADLESS BROWSER VERIFICATION CHECKS PASSED PERFECTLY!');
  return 0;
}

runHeadlessTests().then(code => process.exit(code)).catch(err => {
  console.error('❌ Fatal error during headless test:', err);
  process.exit(1);
});
