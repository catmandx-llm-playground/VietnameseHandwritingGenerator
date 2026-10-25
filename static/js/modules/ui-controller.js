import { model } from './model.js';
import { dottingManager } from './dotting-manager.js';
import { boardRenderer } from './board-renderer.js';
import { dragStretchHandler } from './drag-stretch-handler.js';
import { storageManager } from './storage-manager.js';
import { exportEngine } from './export-engine.js';
import { APP_CONFIG } from './config.js';

/**
 * UI Controller Module
 * Handles toolbar actions, preset sample loading, font downloads, and UI event bindings.
 */
export const uiController = {
    sampleTexts: {
        "sample1": "Nét chữ nết người",
        "sample2": "Công cha như núi Thái Sơn\nNghĩa mẹ như nước trong nguồn chảy ra\nMột lòng thờ mẹ kính cha\nCho tròn chữ hiếu mới là đạo con",
        "sample3": "Học ăn, học nói, học gói, học mở",
        "sample4": "Trường của em be bé\nNằm ở giữa rừng cây\nCô giáo em tre trẻ\nDạy em hát rất hay",
        "sample5": "a ă â b c d đ e ê g h i k l m n o ô ơ p q r s t u ư v x y\nA Ă Â B C D Đ E Ê G H I K L M N O Ô Ơ P Q R S T U Ư V X Y"
    }
};

uiController.changeFontSize = function (fontSize) {
    const $results = $('.result-text, #result');
    if (fontSize === "37" || fontSize === "36") {
        $results.addClass('small');
    } else {
        $results.removeClass('small');
    }
    const layout = $('#board-color-select').val();
    const isBlackboard = layout ? (layout === 'blackboard') : $('.board').hasClass('blackboard');
    const isWhite11x14 = layout ? (layout === 'white_11x14' || layout === 'white_10x14') : ($('.board').hasClass('white_11x14') || $('.board').hasClass('white_10x14'));

    if (isBlackboard) {
        boardRenderer.adjustBlackboardFontSize();
    } else if (isWhite11x14) {
        boardRenderer.render();
    } else {
        $results.css({ 'font-size': '', 'top': '' });
    }
    if (dottingManager.isDottingActive()) {
        boardRenderer.render();
    }
};

uiController.changeColorText = function (color) {
    if (!color) {
        color = document.getElementById("font-color-input").value;
    }
    $('.result-text, #result').css('color', color);
    $("#font-color-input").val(color);
};

uiController.changeBoardColor = function (boardColor) {
    const $colorInput = $("#font-color-input");

    if (boardColor === "white") {
        boardRenderer.syncNormalBoard();
        const $board = $(".board");
        $board.removeClass('blackboard black white_11x14 white_10x14').addClass('white');
        const paperInk = "#2b1055";
        $colorInput.val(paperInk);
        $('.result-text, #result').css({ 'color': paperInk, 'font-size': '', 'top': '', 'left': '', 'position': '', 'width': '', 'min-width': '', 'white-space': '' });
    } else if (boardColor === "white_11x14" || boardColor === "white_10x14") {
        const paperInk = "#2b1055";
        $colorInput.val(paperInk);
    } else if (boardColor === "blackboard") {
        $('#font-size-select').val('37');
        $('#weight-checkbox').prop('checked', false);
        const chalkYellow = "#ffd700";
        $colorInput.val(chalkYellow);
    } else {
        boardRenderer.syncNormalBoard();
        const $board = $(".board");
        $board.removeClass('blackboard white white_11x14 white_10x14').addClass('black');
        const chalkWhite = "#ffffff";
        $colorInput.val(chalkWhite);
        $('.result-text, #result').css({ 'color': chalkWhite, 'font-size': '', 'top': '', 'left': '', 'position': '', 'width': '', 'min-width': '', 'white-space': '' });
    }
    dottingManager.updateDottingControlsState();
    boardRenderer.render();
};

uiController.changeWeight = function (isBold) {
    if (isBold) {
        $('.result-text, #result').addClass('bold');
    } else {
        $('.result-text, #result').removeClass('bold');
    }
    $('.word').each(function () {
        const $w = $(this);
        const weight = $w.attr('data-weight');
        const $btn = $w.find('.btn-word-bold');
        if (!$btn.length) return;
        if (weight) {
            $btn.addClass('is-override');
            $btn.attr('title', weight === 'bold' ? 'Đang ép chữ đậm (Nhấp để đổi)' : 'Đang ép chữ thanh (Nhấp để đổi)');
        } else {
            $btn.removeClass('is-override');
            $btn.attr('title', isBold ? 'Đang theo mẫu đậm (Nhấp để đổi sang thanh)' : 'Đang theo mẫu thanh (Nhấp để đổi sang đậm)');
        }
    });
};

uiController.changeStyle = function (isItalics) {
    if (isItalics) {
        $(".grid, .board").addClass('italics');
    } else {
        $(".grid, .board").removeClass('italics');
    }
};

uiController.changeAutoStretch = function (enabled) {
    const cfg = APP_CONFIG.wordStretch || { stretchTargetPercent: 121.89 };
    const optimalScale = cfg.stretchTargetPercent / 100;
    const $words = $('#result, .result-text').find('.word');

    if (enabled) {
        $words.each(function () {
            const $w = $(this);
            if (!$w.attr('data-manual-stretch')) {
                dragStretchHandler.applyWordStretch($w, optimalScale, false);
            }
        });
    } else {
        $words.each(function () {
            const $w = $(this);
            if ($w.attr('data-auto-stretch') && !$w.attr('data-manual-stretch')) {
                dragStretchHandler.applyWordStretch($w, 1.0);
            }
        });
    }

    if (dottingManager.isDottingActive()) {
        $('#result, .result-text').find('p.line').each(function () {
            dottingManager.renderDotsForLineAndPracticeLines($(this));
        });
    }
};

uiController.loadSample = function (sampleKey) {
    if (uiController.sampleTexts[sampleKey]) {
        dottingManager.resetLineDotConfigs();
        $('#input').val(uiController.sampleTexts[sampleKey]);
        if (model && typeof model.getFirstCharUnit === 'function') {
            dottingManager.prevLineFirstChars = uiController.sampleTexts[sampleKey].split('\n').map(l => model.getFirstCharUnit(l));
        }
        boardRenderer.render();
        storageManager.triggerAutoSave(true);
    }
};

uiController.downloadFont = function (fontType) {
    const fontFiles = {
        'normal': { file: 'HP001N30.ttf', name: 'HP001_Thuong_N30.ttf' },
        'bold': { file: 'HP001B30.ttf', name: 'HP001_Dam_B30.ttf' }
    };

    const target = fontFiles[fontType] || fontFiles['normal'];
    const link = document.createElement('a');
    link.href = '/static/font/' + target.file;
    link.download = target.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

uiController.initEvents = function () {
    const $input = $('#input');

    if (!$input.val().trim()) {
        $input.val("Nét chữ nết người");
    }

    if (model && typeof model.getFirstCharUnit === 'function') {
        dottingManager.prevLineFirstChars = ($input.val() || '').split('\n').map(l => model.getFirstCharUnit(l));
    }

    $input.on('input propertychange', function () {
        dottingManager.syncLineDotConfigs();
        boardRenderer.render();
        storageManager.triggerAutoSave();
    });

    $input.on('click keyup', function () {
        if (!dottingManager.isDottingActive() || !$('#dotting-line-select').length) return;
        const cursorPos = this.selectionStart;
        if (cursorPos === undefined || cursorPos === null) return;
        const textBefore = this.value.substring(0, cursorPos);
        const lineIdx = textBefore.split('\n').length - 1;
        const currentVal = $('#dotting-line-select').val();
        if (currentVal !== 'all' && currentVal != lineIdx && $(`#dotting-line-select option[value="${lineIdx}"]`).length) {
            $('#dotting-line-select').val(lineIdx).trigger('change');
        }
    });

    $('#font-size-select').on('change', function () {
        uiController.changeFontSize(this.value);
        storageManager.triggerAutoSave(true);
    });

    $('#font-color-input').on('input change', function () {
        uiController.changeColorText(this.value);
        storageManager.triggerAutoSave(true);
    });

    $('#board-color-select').on('change', function () {
        uiController.changeBoardColor(this.value);
        storageManager.triggerAutoSave(true);
    });

    $('#weight-checkbox').on('change', function () {
        uiController.changeWeight(this.checked);
        storageManager.triggerAutoSave(true);
    });

    $('#style-checkbox').on('change', function () {
        uiController.changeStyle(this.checked);
        storageManager.triggerAutoSave(true);
    });

    $('#autostretch-checkbox').on('change', function () {
        uiController.changeAutoStretch(this.checked);
        storageManager.triggerAutoSave(true);
    });

    dragStretchHandler.setupDragInteractions();

    $('#dotting-checkbox').on('change', function () {
        if (this.checked) {
            $('#dotting-options').show();
            dottingManager.updateDottingLineSelect();
            dottingManager.updateDottingControlsState();
        } else {
            $('#dotting-options').hide();
        }
        boardRenderer.render();
        storageManager.triggerAutoSave(true);
    });

    $('#dotting-line-select').on('change', function () {
        const val = this.value;
        if (val === 'all') {
            const globalCfg = dottingManager.getDottingConfig();
            $('#dotting-spaces-input').val(globalCfg.spaces);
            $('#dotting-reps-input').val(globalCfg.repetitions);
            $('#dotting-lines-input').val(globalCfg.linesCount);
            $('#dotting-fulldot-checkbox').prop('checked', globalCfg.fullDot);
            $('#dotting-outline-select').val(globalCfg.outline);
            $('#btn-reset-line-dotting').hide();
        } else {
            const lineIdx = parseInt(val, 10);
            const cfg = dottingManager.getDottingConfig(lineIdx);
            $('#dotting-spaces-input').val(cfg.spaces);
            $('#dotting-reps-input').val(cfg.repetitions);
            $('#dotting-lines-input').val(cfg.linesCount);
            $('#dotting-fulldot-checkbox').prop('checked', cfg.fullDot);
            $('#dotting-outline-select').val(cfg.outline);
            if (dottingManager.lineDotConfigs[lineIdx] && dottingManager.lineDotConfigs[lineIdx].isCustom) {
                $('#btn-reset-line-dotting').show();
            } else {
                $('#btn-reset-line-dotting').hide();
            }
        }
        dottingManager.updateDottingControlsState();
    });

    $('#btn-reset-line-dotting').on('click', function () {
        const val = $('#dotting-line-select').val();
        if (val !== 'all') {
            const lineIdx = parseInt(val, 10);
            delete dottingManager.lineDotConfigs[lineIdx];
            dottingManager.updateDottingLineSelect();
            $('#dotting-line-select').val(val).trigger('change');
            boardRenderer.render();
        } else {
            dottingManager.userCustomGlobalSpaces = null;
            dottingManager.userCustomGlobalLinesCount = null;
            dottingManager.userCustomGlobalFullDot = null;
            dottingManager.userCustomGlobalOutline = null;
            dottingManager.lineDotConfigs = {};
            dottingManager.updateDottingLineSelect();
            boardRenderer.render();
        }
        storageManager.triggerAutoSave(true);
    });

    $('#dotting-spaces-input').on('input change', function () {
        let val = parseInt(this.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 30) val = 30;
        this.value = val;

        const selectedLine = $('#dotting-line-select').val();
        if (selectedLine && selectedLine !== 'all') {
            const lineIdx = parseInt(selectedLine, 10);
            if (!dottingManager.lineDotConfigs[lineIdx]) dottingManager.lineDotConfigs[lineIdx] = {};
            dottingManager.lineDotConfigs[lineIdx].spaces = val;
            dottingManager.lineDotConfigs[lineIdx].isCustom = true;
            $('#btn-reset-line-dotting').show();
        } else {
            dottingManager.userCustomGlobalSpaces = val;
            $('#btn-reset-line-dotting').show();
        }
        dottingManager.updateDottingControlsState();
        boardRenderer.render();
        dottingManager.updateDottingLineSelect();
        storageManager.triggerAutoSave(true);
    });

    $('#dotting-reps-input').on('input change', function () {
        let val = parseInt(this.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 50) val = 50;
        this.value = val;

        const selectedLine = $('#dotting-line-select').val();
        if (selectedLine && selectedLine !== 'all') {
            const lineIdx = parseInt(selectedLine, 10);
            if (!dottingManager.lineDotConfigs[lineIdx]) dottingManager.lineDotConfigs[lineIdx] = {};
            dottingManager.lineDotConfigs[lineIdx].repetitions = val;
            dottingManager.lineDotConfigs[lineIdx].isCustom = true;
            $('#btn-reset-line-dotting').show();
        }
        boardRenderer.render();
        storageManager.triggerAutoSave(true);
    });

    $('#dotting-lines-input').on('input change', function () {
        let val = parseInt(this.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 30) val = 30;
        this.value = val;

        const selectedLine = $('#dotting-line-select').val();
        if (selectedLine && selectedLine !== 'all') {
            const lineIdx = parseInt(selectedLine, 10);
            if (!dottingManager.lineDotConfigs[lineIdx]) dottingManager.lineDotConfigs[lineIdx] = {};
            dottingManager.lineDotConfigs[lineIdx].linesCount = val;
            dottingManager.lineDotConfigs[lineIdx].isCustom = true;
            $('#btn-reset-line-dotting').show();
        } else {
            dottingManager.userCustomGlobalLinesCount = val;
            $('#btn-reset-line-dotting').show();
        }
        boardRenderer.render();
        dottingManager.updateDottingLineSelect();
        storageManager.triggerAutoSave(true);
    });

    $('#dotting-fulldot-checkbox').on('change', function () {
        const selectedLine = $('#dotting-line-select').val();
        if (selectedLine && selectedLine !== 'all') {
            const lineIdx = parseInt(selectedLine, 10);
            if (!dottingManager.lineDotConfigs[lineIdx]) dottingManager.lineDotConfigs[lineIdx] = {};
            dottingManager.lineDotConfigs[lineIdx].fullDot = this.checked;
            dottingManager.lineDotConfigs[lineIdx].isCustom = true;
            $('#btn-reset-line-dotting').show();
        } else {
            dottingManager.userCustomGlobalFullDot = this.checked;
            $('#btn-reset-line-dotting').show();
        }
        boardRenderer.render();
        storageManager.triggerAutoSave(true);
    });

    $('#dotting-outline-select').on('change', function () {
        const val = this.value;
        const selectedLine = $('#dotting-line-select').val();
        if (selectedLine && selectedLine !== 'all') {
            const lineIdx = parseInt(selectedLine, 10);
            if (!dottingManager.lineDotConfigs[lineIdx]) dottingManager.lineDotConfigs[lineIdx] = {};
            dottingManager.lineDotConfigs[lineIdx].outline = val;
            dottingManager.lineDotConfigs[lineIdx].isCustom = true;
            $('#btn-reset-line-dotting').show();
        } else {
            dottingManager.userCustomGlobalOutline = val;
            $('#btn-reset-line-dotting').show();
        }
        boardRenderer.render();
        dottingManager.updateDottingLineSelect();
        storageManager.triggerAutoSave(true);
    });

    $('#dotting-color-input').on('input change', function () {
        boardRenderer.render();
        storageManager.triggerAutoSave(true);
    });

    dottingManager.updateDottingControlsState();
    dottingManager.updateDottingLineSelect();

    boardRenderer.render();
    storageManager.setupProjectDragAndDrop();
    exportEngine.initExportControls();
};
