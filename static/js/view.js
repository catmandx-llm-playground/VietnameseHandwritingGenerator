import { APP_CONFIG } from './modules/config.js';
import { utils } from './modules/utils.js';
import { model } from './modules/model.js';
import { dottingManager, escapeHtml } from './modules/dotting-manager.js';
import { boardRenderer } from './modules/board-renderer.js';
import { dragStretchHandler } from './modules/drag-stretch-handler.js';
import { freestyleDottingModal } from './modules/freestyle-dotting-modal.js';
import { storageManager } from './modules/storage-manager.js';
import { exportEngine } from './modules/export-engine.js';
import { uiController } from './modules/ui-controller.js';

/**
 * View Facade
 * Unifies all specialized modules into a coherent API and provides full
 * backward compatibility for inline DOM event handlers and external scripts.
 */
export const view = {
    // Module References
    config: APP_CONFIG,
    utils,
    model,
    boardRenderer,
    dottingManager,
    dragStretchHandler,
    freestyleDottingModal,
    storageManager,
    exportEngine,
    uiController,

    escapeHtml,

    // Lifecycle
    init: function () {
        view.blackboardImg = typeof Image !== 'undefined' ? new Image() : null;
        if (view.blackboardImg) {
            view.blackboardImg.crossOrigin = 'anonymous';
            view.blackboardImg.src = '/static/img/blackboard.png';
            exportEngine.blackboardImg = view.blackboardImg;
        }
        uiController.initEvents();
    },

    // Dotting Manager
    getActiveDotConfig: dottingManager.getActiveDotConfig,
    resetLineDotConfigs: dottingManager.resetLineDotConfigs,
    syncLineDotConfigs: dottingManager.syncLineDotConfigs,
    isDottingActive: dottingManager.isDottingActive,
    calculateAutoSpaces: dottingManager.calculateAutoSpaces,
    parseOutlineOption: dottingManager.parseOutlineOption,
    getDottingConfig: dottingManager.getDottingConfig,
    updateDottingControlsState: dottingManager.updateDottingControlsState,
    updateDottingLineSelect: dottingManager.updateDottingLineSelect,
    renderDotsForLine: dottingManager.renderDotsForLine,
    renderDotsForLineAndPracticeLines: dottingManager.renderDotsForLineAndPracticeLines,

    // Board Renderer
    render: boardRenderer.render,
    syncInfiniteCanvasWidth: boardRenderer.syncInfiniteCanvasWidth,
    syncBlackboards: boardRenderer.syncBlackboards,
    syncNormalBoard: boardRenderer.syncNormalBoard,
    syncWhite11x14: boardRenderer.syncWhite11x14,
    syncWhite10x14: boardRenderer.syncWhite11x14,
    syncWhite14x20: boardRenderer.syncWhite14x20,
    adjustBlackboardFontSize: boardRenderer.adjustBlackboardFontSize,
    renderLineElement: boardRenderer.renderLineElement,
    updateLines: boardRenderer.updateLines,

    // Drag and Stretch
    applyWordStretch: dragStretchHandler.applyWordStretch,
    setupDragInteractions: dragStretchHandler.setupDragInteractions,

    // Freestyle Dotting Modal
    openFreestyleDottingModal: freestyleDottingModal.openFreestyleDottingModal,

    // Storage & Persistence
    generateFileName: storageManager.generateFileName,
    downloadSvg: storageManager.downloadSvg,
    downloadCanvasAsPng: storageManager.downloadCanvasAsPng,
    captureWorkspaceState: storageManager.captureWorkspaceState,
    applyWorkspaceState: storageManager.applyWorkspaceState,
    triggerAutoSave: storageManager.triggerAutoSave,
    saveWorkspaceToLocalStorage: storageManager.saveWorkspaceToLocalStorage,
    formatDraftTime: storageManager.formatDraftTime,
    checkDraftOnLoad: storageManager.checkDraftOnLoad,
    dismissDraftNotification: storageManager.dismissDraftNotification,
    restoreSavedDraft: storageManager.restoreSavedDraft,
    resetToDefault: storageManager.resetToDefault,
    generateProjectFileName: storageManager.generateProjectFileName,
    exportProjectFile: storageManager.exportProjectFile,
    importProjectFile: storageManager.importProjectFile,
    setupProjectDragAndDrop: storageManager.setupProjectDragAndDrop,

    // UI Controller
    sampleTexts: uiController.sampleTexts,
    changeFontSize: uiController.changeFontSize,
    changeColorText: uiController.changeColorText,
    changeBoardColor: uiController.changeBoardColor,
    changeWeight: uiController.changeWeight,
    changeStyle: uiController.changeStyle,
    changeAutoStretch: uiController.changeAutoStretch,
    loadSample: uiController.loadSample,
    downloadFont: uiController.downloadFont,

    // Export Engine
    escapeXml: exportEngine.escapeXml,
    isMobileDevice: exportEngine.isMobileDevice,
    getExportScale: exportEngine.getExportScale,
    initExportControls: exportEngine.initExportControls,
    updateExportUI: exportEngine.updateExportUI,
    loadFontBase64: exportEngine.loadFontBase64,
    buildSvgFontDefs: exportEngine.buildSvgFontDefs,
    getBlackboardDataUrl: exportEngine.getBlackboardDataUrl,
    renderBlackboardToCanvas: exportEngine.renderBlackboardToCanvas,
    renderBlackboardToSvg: exportEngine.renderBlackboardToSvg,
    exportBlackboardToPng: exportEngine.exportBlackboardToPng,
    exportBlackboardToPdf: exportEngine.exportBlackboardToPdf,
    exportBlackboardToSvg: exportEngine.exportBlackboardToSvg,
    renderWhite11x14PageToCanvas: exportEngine.renderWhite11x14PageToCanvas,
    renderWhite11x14PageToSvg: exportEngine.renderWhite11x14PageToSvg,
    exportWhite11x14ToPng: exportEngine.exportWhite11x14ToPng,
    exportWhite11x14ToPdf: exportEngine.exportWhite11x14ToPdf,
    exportWhite11x14ToSvg: exportEngine.exportWhite11x14ToSvg,
    renderWhite14x20PageToCanvas: exportEngine.renderWhite14x20PageToCanvas,
    renderWhite14x20PageToSvg: exportEngine.renderWhite14x20PageToSvg,
    exportWhite14x20ToPng: exportEngine.exportWhite14x20ToPng,
    exportWhite14x20ToPdf: exportEngine.exportWhite14x20ToPdf,
    exportWhite14x20ToSvg: exportEngine.exportWhite14x20ToSvg,
    renderStandardBoardToCanvas: exportEngine.renderStandardBoardToCanvas,
    renderStandardBoardToSvg: exportEngine.renderStandardBoardToSvg,
    exportStandardToPng: exportEngine.exportStandardToPng,
    exportStandardToPdf: exportEngine.exportStandardToPdf,
    exportStandardToSvg: exportEngine.exportStandardToSvg,
    exportToPng: exportEngine.exportToPng,
    exportToPdf: exportEngine.exportToPdf,
    exportToSvg: exportEngine.exportToSvg,
    exportFile: exportEngine.exportFile
};

// Bind dynamic property accessors
Object.defineProperty(view, 'lineDotConfigs', {
    get() { return dottingManager.lineDotConfigs; },
    set(v) { dottingManager.lineDotConfigs = v; }
});
Object.defineProperty(view, 'wordDotConfigs', {
    get() { return dottingManager.wordDotConfigs; },
    set(v) { dottingManager.wordDotConfigs = v; }
});
Object.defineProperty(view, 'userCustomGlobalSpaces', {
    get() { return dottingManager.userCustomGlobalSpaces; },
    set(v) { dottingManager.userCustomGlobalSpaces = v; }
});
Object.defineProperty(view, 'userCustomGlobalLinesCount', {
    get() { return dottingManager.userCustomGlobalLinesCount; },
    set(v) { dottingManager.userCustomGlobalLinesCount = v; }
});
Object.defineProperty(view, 'userCustomGlobalFullDot', {
    get() { return dottingManager.userCustomGlobalFullDot; },
    set(v) { dottingManager.userCustomGlobalFullDot = v; }
});
Object.defineProperty(view, 'userCustomGlobalOutline', {
    get() { return dottingManager.userCustomGlobalOutline; },
    set(v) { dottingManager.userCustomGlobalOutline = v; }
});
Object.defineProperty(view, 'prevLineFirstChars', {
    get() { return dottingManager.prevLineFirstChars; },
    set(v) { dottingManager.prevLineFirstChars = v; }
});

if (typeof window !== 'undefined') {
    window.view = view;
}
