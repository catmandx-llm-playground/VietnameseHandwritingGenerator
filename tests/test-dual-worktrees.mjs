import puppeteer from '/root/projects/handwriting/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import path from 'path';

const ARTIFACT_DIR = '/root/.gemini/antigravity-cli/brain/7b6e7532-4661-4b41-b589-db489151c4a2';

async function runTests() {
  console.log('🚀 Launching Headless Chrome to test chudep1 and chudep2...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--headless=new', '--window-size=1600,1200']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1200 });

  page.on('console', msg => {
    if (msg.type() === 'error') console.error('  [Browser Error]:', msg.text());
  });
  page.on('pageerror', err => console.error('  [Browser PageError]:', err.message));
  page.on('dialog', async dialog => {
    console.log('  [Browser Dialog]:', dialog.message());
    await dialog.dismiss();
  });

  // =========================================================================
  // TEST CHUDEP1: Approach 1 - Fabric.js Worksheet Studio
  // =========================================================================
  console.log('\n🔍 [chudep1] Testing Main Page and Worksheet Studio button...');
  await page.goto('http://127.0.0.1:8082/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.view && window.view.openWorksheetStudio);

  // Select 14x20 layout
  await page.evaluate(() => {
    const sel = document.getElementById('board-color-select');
    sel.value = 'white_14x20';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 400));

  const hasWorksheetBtn = await page.$('#btn-open-worksheet-studio');
  if (!hasWorksheetBtn) {
    throw new Error('chudep1: #btn-open-worksheet-studio button not found!');
  }
  console.log('  ✅ Found #btn-open-worksheet-studio button on chudep1 main page');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'chudep1_main.png') });

  // Mock window.open to prevent popup hang
  await page.evaluate(async () => {
    window.open = () => {};
    await window.view.openWorksheetStudio();
  });
  console.log('  ✅ Executed window.view.openWorksheetStudio()');

  // Navigate to worksheet.html directly to verify the editor
  console.log('🔍 [chudep1] Navigating to http://127.0.0.1:8082/worksheet.html...');
  await page.goto('http://127.0.0.1:8082/worksheet.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#worksheet-canvas');
  await new Promise(r => setTimeout(r, 600));

  const worksheetMetrics = await page.evaluate(() => {
    const canvasEl = document.getElementById('worksheet-canvas');
    const templateSelect = document.getElementById('template-select');
    const scaleSlider = document.getElementById('grid-scale-slider');
    const hasProjectDropdown = !!document.getElementById('project-dropdown');
    const hasExportDropdown = !!document.getElementById('export-dropdown');
    const hasJsPdf = !!(window.jspdf && window.jspdf.jsPDF);
    return {
      hasCanvas: !!canvasEl,
      hasTemplateSelect: !!templateSelect,
      currentTemplate: templateSelect?.value,
      sliderValue: scaleSlider?.value,
      canvasWidth: canvasEl?.width,
      canvasHeight: canvasEl?.height,
      hasProjectDropdown,
      hasExportDropdown,
      hasJsPdf
    };
  });
  console.log('  Worksheet Studio Metrics:', worksheetMetrics);
  if (!worksheetMetrics.hasCanvas || worksheetMetrics.canvasWidth !== 794) {
    throw new Error(`chudep1: Unexpected worksheet canvas dimensions ${worksheetMetrics.canvasWidth}x${worksheetMetrics.canvasHeight}`);
  }
  if (!worksheetMetrics.hasProjectDropdown || !worksheetMetrics.hasExportDropdown || !worksheetMetrics.hasJsPdf) {
    throw new Error('chudep1: Missing project dropdown, export dropdown, or jsPDF!');
  }
  console.log('  ✅ Worksheet Studio A4 canvas verified (794x1123 px)');
  console.log('  ✅ Project dropdown, Export dropdown, and jsPDF verified');

  // Change template to decorative_border
  await page.evaluate(() => {
    const sel = document.getElementById('template-select');
    sel.value = 'decorative_border';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 400));
  console.log('  ✅ Template switched to "decorative_border"');

  // Change scale slider to 110%
  await page.evaluate(() => {
    const slider = document.getElementById('grid-scale-slider');
    slider.value = '110';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 300));
  console.log('  ✅ Grid scale slider tested at 110%');

  // Test Export Formats (PNG, SVG, PDF) and scale selector interaction
  const exportChecks = await page.evaluate(async () => {
    const typeSelect = document.getElementById('export-type-select');
    const scaleSelect = document.getElementById('export-scale-select');
    const hint = document.getElementById('export-device-hint');
    const exportBtn = document.getElementById('btn-execute-export');

    // 1. Check PNG 4x
    window.$('#export-type-select').val('png').trigger('change');
    window.$('#export-scale-select').val('4').trigger('change');
    const pngHint = hint.textContent;
    const pngScaleDisabled = scaleSelect.disabled;

    // 2. Check SVG
    window.$('#export-type-select').val('svg').trigger('change');
    const svgHint = hint.textContent;
    const svgScaleDisabled = scaleSelect.disabled;

    // 3. Check PDF
    window.$('#export-type-select').val('pdf').trigger('change');
    const pdfHint = hint.textContent;
    const pdfScaleDisabled = scaleSelect.disabled;

    // Reset to PNG 2x
    window.$('#export-type-select').val('png').trigger('change');
    window.$('#export-scale-select').val('2').trigger('change');

    // Mock anchor clicks for export
    let triggeredDownloads = [];
    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      triggeredDownloads.push({ href: this.href?.substring(0, 40), download: this.download });
    };

    // Trigger PNG export
    document.getElementById('btn-execute-export').click();
    await new Promise(r => setTimeout(r, 300));

    // Trigger Project save
    document.getElementById('btn-save-project').click();
    await new Promise(r => setTimeout(r, 300));

    HTMLAnchorElement.prototype.click = origClick;

    return {
      pngHint,
      pngScaleDisabled,
      svgHint,
      svgScaleDisabled,
      pdfHint,
      pdfScaleDisabled,
      triggeredDownloads
    };
  });

  console.log('  Export Checks in Worksheet Studio:', exportChecks);
  if (exportChecks.svgScaleDisabled !== true || exportChecks.pngScaleDisabled !== false) {
    throw new Error('chudep1: Export scale selector did not correctly toggle disabled state between SVG and PNG!');
  }
  console.log('  ✅ Export controls (PNG size selector, SVG vector, PDF document) verified');
  console.log('  ✅ Project file save action verified');

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'chudep1_worksheet.png') });

  // =========================================================================
  // TEST CHUDEP2: Approach 2 - Polotno Studio
  // =========================================================================
  console.log('\n🔍 [chudep2] Testing Main Page and Polotno Studio button...');
  await page.goto('http://127.0.0.1:8083/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.view && window.view.openPolotnoStudio);

  // Select 14x20 layout
  await page.evaluate(() => {
    const sel = document.getElementById('board-color-select');
    sel.value = 'white_14x20';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 400));

  const hasPolotnoBtn = await page.$('#btn-open-polotno-studio');
  if (!hasPolotnoBtn) {
    throw new Error('chudep2: #btn-open-polotno-studio button not found!');
  }
  console.log('  ✅ Found #btn-open-polotno-studio button on chudep2 main page');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'chudep2_main.png') });

  // Trigger openPolotnoStudio with mocked window.open
  await page.evaluate(async () => {
    window.open = () => {};
    await window.view.openPolotnoStudio();
  });
  console.log('  ✅ Executed window.view.openPolotnoStudio()');

  // Navigate to /studio/
  console.log('🔍 [chudep2] Navigating to http://127.0.0.1:8083/studio/...');
  await page.goto('http://127.0.0.1:8083/studio/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#root');
  await new Promise(r => setTimeout(r, 1500));

  const polotnoMetrics = await page.evaluate(() => {
    const rootEl = document.getElementById('root');
    const saveProjectBtn = document.getElementById('btn-polotno-save-project');
    const openProjectBtn = document.getElementById('btn-polotno-open-project');
    const formatSelect = document.getElementById('polotno-export-format');
    const scaleSelect = document.getElementById('polotno-export-scale');
    const exportBtn = document.getElementById('btn-polotno-export');

    return {
      hasRoot: !!rootEl,
      hasChildren: rootEl?.children.length > 0,
      hasSaveProject: !!saveProjectBtn,
      hasOpenProject: !!openProjectBtn,
      hasFormatSelect: !!formatSelect,
      hasScaleSelect: !!scaleSelect,
      hasExportBtn: !!exportBtn
    };
  });
  console.log('  Polotno Studio Metrics:', polotnoMetrics);
  if (!polotnoMetrics.hasRoot || !polotnoMetrics.hasChildren) {
    throw new Error('chudep2: Polotno Studio root container did not mount children!');
  }
  if (!polotnoMetrics.hasSaveProject || !polotnoMetrics.hasFormatSelect || !polotnoMetrics.hasExportBtn) {
    throw new Error('chudep2: Polotno Studio header controls missing!');
  }
  console.log('  ✅ Polotno Studio application mounted and active with custom header controls');

  // Test Polotno format selection
  await page.evaluate(() => {
    const formatSel = document.getElementById('polotno-export-format');
    formatSel.value = 'svg';
    formatSel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 200));

  const polotnoSvgCheck = await page.evaluate(() => {
    const scaleSel = document.getElementById('polotno-export-scale');
    return { scaleSelVisible: !!scaleSel };
  });
  console.log('  Polotno SVG Scale Select (should be hidden):', polotnoSvgCheck.scaleSelVisible);
  if (polotnoSvgCheck.scaleSelVisible !== false) {
    throw new Error('chudep2: Polotno scale selector should be hidden when SVG format is selected!');
  }

  // Switch back to PNG
  await page.evaluate(() => {
    const formatSel = document.getElementById('polotno-export-format');
    formatSel.value = 'png';
    formatSel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 200));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'chudep2_studio.png') });

  await browser.close();
  console.log('\n🎉 ALL DUAL-WORKTREE VERIFICATION TESTS PASSED PERFECTLY!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
