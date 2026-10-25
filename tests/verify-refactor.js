import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message) {
    totalChecks++;
    if (condition) {
        passedChecks++;
        console.log(`  \x1b[32m✔\x1b[0m ${message}`);
    } else {
        failedChecks++;
        console.error(`  \x1b[31m✖\x1b[0m ${message}`);
    }
}

async function runTests() {
    console.log('\n======================================================');
    console.log(' Vietnamese Handwriting Generator - Verification Suite');
    console.log('======================================================\n');

    // -------------------------------------------------------------------------
    // TEST SUITE 1: ES Module Import & Interface Integrity
    // -------------------------------------------------------------------------
    console.log('[Suite 1] Validating ES Modules & Public Interfaces...');

    const { APP_CONFIG } = await import('../static/js/modules/config.js');
    assert(APP_CONFIG && APP_CONFIG.wordStretch && APP_CONFIG.wordStretch.stretchTargetPercent === 121.89, 'config.js exports valid APP_CONFIG with 121.89% threshold');

    const { utils } = await import('../static/js/modules/utils.js');
    assert(typeof utils.getAccent === 'function', 'utils.js exports getAccent');
    assert(typeof utils.removeAccents === 'function', 'utils.js exports removeAccents');
    assert(typeof utils.isUpperCase === 'function', 'utils.js exports isUpperCase');
    assert(utils.getAccent('việt') === 'heavy', 'utils.getAccent classifies "việt" as heavy');
    assert(utils.removeAccents('Tiếng') === 'Tiêng', 'utils.removeAccents strips tone marks to base letter ("Tiếng" -> "Tiêng")');

    const { model } = await import('../static/js/modules/model.js');
    assert(typeof model.getUnicodeStr === 'function', 'model.js exports getUnicodeStr');
    assert(typeof model.getFirstCharUnit === 'function', 'model.js exports getFirstCharUnit');
    assert(typeof model.getWordFirstGlyph === 'function', 'model.js exports getWordFirstGlyph');
    assert(typeof model.getGlyphDotConfigs === 'function', 'model.js exports getGlyphDotConfigs');

    const { dottingManager } = await import('../static/js/modules/dotting-manager.js');
    assert(typeof dottingManager.getActiveDotConfig === 'function', 'dotting-manager exports getActiveDotConfig');
    assert(typeof dottingManager.getDottingConfig === 'function', 'dotting-manager exports getDottingConfig');
    assert(typeof dottingManager.calculateAutoSpaces === 'function', 'dotting-manager exports calculateAutoSpaces');

    const { boardRenderer } = await import('../static/js/modules/board-renderer.js');
    assert(typeof boardRenderer.render === 'function', 'board-renderer exports render');
    assert(typeof boardRenderer.syncBlackboards === 'function', 'board-renderer exports syncBlackboards');
    assert(typeof boardRenderer.syncWhite11x14 === 'function', 'board-renderer exports syncWhite11x14');

    const { dragStretchHandler } = await import('../static/js/modules/drag-stretch-handler.js');
    assert(typeof dragStretchHandler.applyWordStretch === 'function', 'drag-stretch-handler exports applyWordStretch');
    assert(typeof dragStretchHandler.setupDragInteractions === 'function', 'drag-stretch-handler exports setupDragInteractions');

    const { freestyleDottingModal } = await import('../static/js/modules/freestyle-dotting-modal.js');
    assert(typeof freestyleDottingModal.openFreestyleDottingModal === 'function', 'freestyle-dotting-modal exports openFreestyleDottingModal');

    const { storageManager } = await import('../static/js/modules/storage-manager.js');
    assert(typeof storageManager.captureWorkspaceState === 'function', 'storage-manager exports captureWorkspaceState');
    assert(typeof storageManager.applyWorkspaceState === 'function', 'storage-manager exports applyWorkspaceState');
    assert(typeof storageManager.exportProjectFile === 'function', 'storage-manager exports exportProjectFile');

    const { exportEngine } = await import('../static/js/modules/export-engine.js');
    assert(typeof exportEngine.exportFile === 'function', 'export-engine exports exportFile');
    assert(typeof exportEngine.renderBlackboardToCanvas === 'function', 'export-engine exports renderBlackboardToCanvas');
    assert(typeof exportEngine.renderWhite11x14PageToCanvas === 'function', 'export-engine exports renderWhite11x14PageToCanvas');

    const { uiController } = await import('../static/js/modules/ui-controller.js');
    assert(typeof uiController.changeFontSize === 'function', 'ui-controller exports changeFontSize');
    assert(typeof uiController.changeBoardColor === 'function', 'ui-controller exports changeBoardColor');

    const { view } = await import('../static/js/view.js');
    assert(typeof view.render === 'function', 'view facade exposes render');
    assert(typeof view.exportFile === 'function', 'view facade exposes exportFile');
    assert(typeof view.loadSample === 'function', 'view facade exposes loadSample');

    // -------------------------------------------------------------------------
    // TEST SUITE 2: Linguistic Glyph Mapping & Unicode Conversion
    // -------------------------------------------------------------------------
    console.log('\n[Suite 2] Validating Linguistic Glyph Mapping Engine...');

    const allJsonRaw = fs.readFileSync(path.join(projectRoot, 'data/all.json'), 'utf-8');
    const glyphData = JSON.parse(allJsonRaw);
    model.glyphs = glyphData;
    model.isLoaded = true;
    model.buildGlyphCodeMap();
    assert(model.glyphCodeMap && Object.keys(model.glyphCodeMap).length > 0, `Glyph code map built successfully (${Object.keys(model.glyphCodeMap).length} mappings)`);

    // Verify first char unit for compound consonants
    assert(model.getFirstCharUnit('khánh') === 'kh', 'model.getFirstCharUnit recognizes "kh"');
    assert(model.getFirstCharUnit('nhà') === 'nh', 'model.getFirstCharUnit recognizes "nh"');
    assert(model.getFirstCharUnit('cháu') === 'ch', 'model.getFirstCharUnit recognizes "ch"');
    assert(model.getFirstCharUnit('ghế') === 'gh', 'model.getFirstCharUnit recognizes "gh"');
    assert(model.getFirstCharUnit('phố') === 'ph', 'model.getFirstCharUnit recognizes "ph"');
    assert(model.getFirstCharUnit('thuyền') === 'th', 'model.getFirstCharUnit recognizes "th"');
    assert(model.getFirstCharUnit('Ghềnh') === 'Gh', 'model.getFirstCharUnit recognizes "Gh"');

    // Test comprehensive syllable dataset
    const testText = fs.readFileSync(path.join(projectRoot, 'data/test.txt'), 'utf-8');
    const words = testText.split(/\s+/).filter(w => w && !w.startsWith('#') && w !== '–' && w !== '-');

    let processedCount = 0;
    let corruptedCount = 0;
    for (const word of words) {
        try {
            const converted = model.getUnicodeStr(word);
            if (!converted || typeof converted !== 'string' || converted.length === 0) {
                corruptedCount++;
            }
            processedCount++;
        } catch (err) {
            corruptedCount++;
        }
    }
    assert(corruptedCount === 0 && processedCount >= 500, `Processed ${processedCount} Vietnamese syllables from data/test.txt with zero corruption`);

    // -------------------------------------------------------------------------
    // TEST SUITE 3: Physical Geometry & Invariant Conformance
    // -------------------------------------------------------------------------
    console.log('\n[Suite 3] Verifying Physical Layout & Invariants in AGENTS.md...');

    const boardCss = fs.readFileSync(path.join(projectRoot, 'static/css/board.css'), 'utf-8');

    // 1. 384px Tiling Invariant
    assert(boardCss.includes('calc(var(--grid-unit) * 20)'), '384px integer-period tiling (calc(var(--grid-unit) * 20)) present in board.css');

    // 2. Rigid Line Capping
    assert(boardCss.includes('calc(var(--grid-unit) * 8) !important;'), '72pt rigid line height capping (8 units) enforced with !important');
    assert(boardCss.includes('calc(var(--grid-unit) * 4) !important;'), '37pt rigid line height capping (4 units) enforced with !important');
    assert(boardCss.includes('min-height: 0 !important;'), 'min-height: 0 !important enforced to eliminate GPU leading expansion');

    // 3. Blackboard Single-Line Isolation
    assert(boardCss.includes('left: 96.09px !important;') && boardCss.includes('display: block !important;') && boardCss.includes('position: absolute !important;'), 'Blackboard single-line absolute architecture anchored at x = 96.09px');

    // 4. 11x14 Export Constants in export-engine.js
    const exportJs = fs.readFileSync(path.join(projectRoot, 'static/js/modules/export-engine.js'), 'utf-8');
    assert(exportJs.includes('gridLineWidthMajor = 1.4;'), 'Export gridLineWidthMajor calibrated to 1.4');
    assert(exportJs.includes('gridLineWidthMinor = 0.7;'), 'Export gridLineWidthMinor calibrated to 0.7');
    assert(exportJs.includes("majorColor = 'rgba(60, 75, 115, 0.9)'"), 'Export majorColor calibrated to rgba(60, 75, 115, 0.9)');
    assert(exportJs.includes("minorColor = 'rgba(90, 115, 165, 0.7)'"), 'Export minorColor calibrated to rgba(90, 115, 165, 0.7)');
    assert(exportJs.includes('dotRadius = isSmall ? 1.25 : 1.75;'), 'Export dotRadius calibrated to 1.25 / 1.75');

    // 5. Optimal Stretch Guideline Invariants
    const dragJs = fs.readFileSync(path.join(projectRoot, 'static/js/modules/drag-stretch-handler.js'), 'utf-8');
    assert(boardCss.includes('.snap-guideline') && boardCss.includes('.snap-guideline.is-snapped'), 'Green snap guideline CSS styles present in board.css');
    assert(dragJs.includes('.snap-guideline') && dragJs.includes('targetSnapLeft') && dragJs.includes('is-snapped'), 'Optimal stretch green guideline logic wired in drag-stretch-handler.js');

    // 6. Outline Element Box Expansion Invariant
    assert(boardCss.includes('.guide-outline-word') && boardCss.includes('overflow: visible !important;') && boardCss.includes('padding-right: 0.5em;'), '.guide-outline-word has overflow: visible and padding-right expansion for cursive capital flourishes');

    // -------------------------------------------------------------------------
    // TEST SUITE 4: Live Docker Container (127.0.0.1:8080) Verification
    // -------------------------------------------------------------------------
    console.log('\n[Suite 4] Verifying Live HTTP Service on 127.0.0.1:8080...');

    function checkHttp(urlPath) {
        return new Promise((resolve) => {
            const req = http.get(`http://127.0.0.1:8080${urlPath}`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        contentType: res.headers['content-type'] || '',
                        body: data
                    });
                });
            });
            req.on('error', (err) => {
                resolve({ statusCode: 0, error: err.message, body: '' });
            });
        });
    }

    const indexRes = await checkHttp('/');
    assert(indexRes.statusCode === 200, 'GET / returns HTTP 200');
    assert(indexRes.body.includes('<script type="module" src="/static/js/index.js'), 'index.html serves <script type="module" src="/static/js/index.js');

    const jsRes = await checkHttp('/static/js/index.js');
    assert(jsRes.statusCode === 200 && jsRes.contentType.includes('javascript'), 'GET /static/js/index.js returns HTTP 200 application/javascript');

    const modRes = await checkHttp('/static/js/modules/board-renderer.js');
    assert(modRes.statusCode === 200 && modRes.contentType.includes('javascript'), 'GET /static/js/modules/board-renderer.js returns HTTP 200 application/javascript');

    const exportModRes = await checkHttp('/static/js/modules/export-engine.js');
    assert(exportModRes.statusCode === 200 && exportModRes.contentType.includes('javascript'), 'GET /static/js/modules/export-engine.js returns HTTP 200 application/javascript');

    console.log('\n======================================================');
    console.log(` Summary: ${passedChecks}/${totalChecks} checks passed (${failedChecks} failed)`);
    console.log('======================================================\n');

    if (failedChecks > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
