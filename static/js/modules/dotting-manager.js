import { model } from './model.js';
import { utils } from './utils.js';

/**
 * Dotting Manager Module
 * Handles guide dot placement, spacing calculation, dot configurations, and faint/dotted/curve outlines.
 */
export const dottingManager = {
    lineDotConfigs: {},
    wordDotConfigs: {},
    prevLineFirstChars: [],
    userCustomGlobalSpaces: null,
    userCustomGlobalLinesCount: null,
    userCustomGlobalFullDot: null,
    userCustomGlobalOutline: null,
    globalDefaultLinesCount: null
};

export const escapeHtml = function (str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

dottingManager.getActiveDotConfig = function (charUnit, lineIndex, wordIndex) {
    if (!charUnit) {
        charUnit = 'a';
    }
    const wIdx = (wordIndex !== undefined && wordIndex !== null) ? wordIndex : 0;
    const isFirstWord = (wIdx === 0);
    const wordKey = `${lineIndex}_${wIdx}`;
    const wordCfg = dottingManager.wordDotConfigs && dottingManager.wordDotConfigs[wordKey];
    const lineCfg = dottingManager.lineDotConfigs && dottingManager.lineDotConfigs[lineIndex];

    // Explicitly disabled/turned off ('none')
    if (wordCfg && (wordCfg.dotConfigId === 'none' || wordCfg.enabled === false)) {
        return null;
    }
    if (isFirstWord && lineCfg && (lineCfg.dotConfigId === 'none' || lineCfg.enabled === false)) {
        return null;
    }

    // 1. Dynamic dotting check (runtime custom dot coordinates hook)
    if (wordCfg && Array.isArray(wordCfg.customDots) && wordCfg.customDots.length > 0) {
        return model.getGlyphDotConfig(charUnit, null, wordCfg.customDots);
    }
    if (isFirstWord && lineCfg && Array.isArray(lineCfg.customDots) && lineCfg.customDots.length > 0) {
        return model.getGlyphDotConfig(charUnit, null, lineCfg.customDots);
    }

    // 2. Selected dotConfigId check
    const chosenId = (wordCfg && wordCfg.dotConfigId) || (isFirstWord ? (lineCfg && lineCfg.dotConfigId) : null);
    if (chosenId) {
        if (chosenId === 'none') return null;
        return model.getGlyphDotConfig(charUnit, chosenId);
    }

    // 3. Default behavior:
    // Only automatically dot the first word/character of the line!
    // Subsequent words (wIdx > 0) are NOT dotted automatically by default.
    if (!isFirstWord) {
        return null;
    }

    return model.getGlyphDotConfig(charUnit);
};

dottingManager.resetLineDotConfigs = function () {
    dottingManager.lineDotConfigs = {};
    dottingManager.wordDotConfigs = {};
    dottingManager.userCustomGlobalSpaces = null;
    dottingManager.userCustomGlobalLinesCount = null;
    dottingManager.userCustomGlobalFullDot = null;
    dottingManager.userCustomGlobalOutline = null;
    if (model && typeof model.getFirstCharUnit === 'function') {
        dottingManager.prevLineFirstChars = ($('#input').val() || '').split('\n').map(l => model.getFirstCharUnit(l));
    }
    if ($('#dotting-line-select').length) {
        $('#dotting-line-select').val('all');
        $('#btn-reset-line-dotting').hide();
    }
};

dottingManager.syncLineDotConfigs = function (newLines) {
    if (!newLines) {
        newLines = ($('#input').val() || '').split('\n');
    }
    if (!model || typeof model.getFirstCharUnit !== 'function') {
        return;
    }
    dottingManager.userCustomGlobalSpaces = null;
    const newFirstChars = newLines.map(l => model.getFirstCharUnit(l));
    if (!dottingManager.prevLineFirstChars) {
        dottingManager.prevLineFirstChars = [];
    }
    const maxLines = Math.max(newLines.length, dottingManager.prevLineFirstChars.length);
    for (let i = 0; i < maxLines; i++) {
        // If the line was deleted or its first character changed, wipe this line's custom config
        if (i >= newLines.length || newFirstChars[i] !== dottingManager.prevLineFirstChars[i]) {
            if (dottingManager.lineDotConfigs && dottingManager.lineDotConfigs[i]) {
                delete dottingManager.lineDotConfigs[i];
            }
            if (dottingManager.wordDotConfigs) {
                Object.keys(dottingManager.wordDotConfigs).forEach(k => {
                    if (k.startsWith(`${i}_`)) delete dottingManager.wordDotConfigs[k];
                });
            }
        }
    }
    dottingManager.prevLineFirstChars = newFirstChars;
    if ($('#dotting-line-select').length) {
        const currentSelected = $('#dotting-line-select').val();
        if (currentSelected !== 'all') {
            const lineIdx = parseInt(currentSelected, 10);
            if (lineIdx >= newLines.length || !dottingManager.lineDotConfigs[lineIdx] || !dottingManager.lineDotConfigs[lineIdx].isCustom) {
                $('#btn-reset-line-dotting').hide();
            }
        }
    }
};

dottingManager.isDottingActive = function () {
    const rawVal = $('#input').val() || '';
    const hasAnyText = rawVal.trim().length > 0;
    if (!hasAnyText) return false;
    return $('#dotting-checkbox').is(':checked');
};

dottingManager.calculateAutoSpaces = function (lineIndex, $lineEl) {
    let $line = $lineEl;
    if ((!$line || !$line.length) && lineIndex !== undefined && lineIndex !== null) {
        $line = $(`p.line[data-source-line-idx="${lineIndex}"][data-is-practice="false"]`).first();
        if (!$line.length) {
            $line = $(`#line-${lineIndex}`);
        }
    }

    const layout = $('#board-color-select').val();
    const isBlackboard = (layout === 'blackboard') || ($line && $line.closest('.board').hasClass('blackboard'));
    const isSmall = $('#font-size-select').val() === '37' || $('#font-size-select').val() === '36' || ($line && $line.closest('.result-text').hasClass('small')) || $('#result').hasClass('small');

    const blockWidth = isBlackboard ? 225.2 : 76.8;

    let words = [];
    if ($line && $line.length) {
        $line.children('.word').each(function () {
            const $w = $(this);
            words.push({
                offsetLeft: this.offsetLeft,
                offsetWidth: this.offsetWidth,
                stretch: parseFloat($w.attr('data-stretch')) || 1.0
            });
        });
    }

    // If this line has no words (e.g. an empty practice line), borrow from first line with words
    if (words.length === 0) {
        $('p.line').each(function () {
            if (words.length > 0) return;
            const $other = $(this);
            const $wList = $other.children('.word');
            if ($wList.length > 0) {
                $wList.each(function () {
                    const $w = $(this);
                    words.push({
                        offsetLeft: this.offsetLeft,
                        offsetWidth: this.offsetWidth,
                        stretch: parseFloat($w.attr('data-stretch')) || 1.0
                    });
                });
            }
        });
    }

    // Fallback if DOM not yet rendered (e.g. pre-render or headless)
    if (words.length === 0) {
        const rawLines = ($('#input').val() || '').split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const lineText = (lineIndex !== undefined && lineIndex !== null && rawLines[lineIndex]) || rawLines[0];
        if (lineText && lineText.length > 0) {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                let fontSizePx = 72;
                if (isBlackboard) {
                    fontSizePx = isSmall ? 144.66 : 281.5;
                } else {
                    fontSizePx = isSmall ? 36 : 72;
                }
                const isBold = $('#weight-checkbox').is(':checked');
                ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, sans-serif`;
                const converted = model && typeof model.getUnicodeStr === 'function' ? model.getUnicodeStr(lineText) : lineText;
                const measuredWidth = ctx.measureText(converted).width;
                const blocks = measuredWidth / blockWidth;
                return Math.max(1, Math.ceil(blocks - 0.001) + 1);
            } catch (_) {}
        }
        return 2;
    }

    const firstWord = words[0];
    const lastWord = words[words.length - 1];
    const startX = firstWord.offsetLeft;
    const endX = lastWord.offsetLeft + lastWord.offsetWidth;
    const totalWidth = Math.max(0, endX - startX);
    if (totalWidth <= 0) {
        return 2;
    }

    const blocks = totalWidth / blockWidth;
    return Math.max(1, Math.ceil(blocks - 0.001) + 1);
};

dottingManager.parseOutlineOption = function (outlineVal) {
    if (!outlineVal || outlineVal === 'none') {
        return { isEnabled: false, style: 'none', scope: 'none', raw: 'none' };
    }
    let val = outlineVal;
    if (val === 'all') val = 'faint_all';
    if (val === 'first') val = 'faint_first';

    const parts = val.split('_');
    const style = parts[0]; // 'faint', 'dotted', 'curve'
    const scope = parts[1] || 'all'; // 'all', 'first'
    return {
        isEnabled: true,
        style: style,
        scope: scope,
        raw: val
    };
};

dottingManager.getDottingConfig = function (lineIndex, $lineEl) {
    const enabled = dottingManager.isDottingActive();
    const layout = $('#board-color-select').val();
    const isBlackboard = (layout === 'blackboard');
    const isWhite11x14 = (layout === 'white_11x14' || layout === 'white_10x14');
    const isWhite14x20 = (layout === 'white_14x20');

    const isAllSelected = ($('#dotting-line-select').val() === 'all' || !$('#dotting-line-select').val());

    const autoSpacesLine0 = dottingManager.calculateAutoSpaces(0, $lineEl);
    let globalSpaces;
    if (dottingManager.userCustomGlobalSpaces !== undefined && dottingManager.userCustomGlobalSpaces !== null) {
        globalSpaces = dottingManager.userCustomGlobalSpaces;
    } else if (isAllSelected) {
        globalSpaces = parseInt($('#dotting-spaces-input').val(), 10) || autoSpacesLine0;
    } else {
        globalSpaces = autoSpacesLine0;
    }

    let globalLinesCount = 1;
    if (dottingManager.userCustomGlobalLinesCount !== undefined && dottingManager.userCustomGlobalLinesCount !== null) {
        globalLinesCount = dottingManager.userCustomGlobalLinesCount;
    } else if (dottingManager.globalDefaultLinesCount !== undefined && dottingManager.globalDefaultLinesCount !== null) {
        globalLinesCount = dottingManager.globalDefaultLinesCount;
    } else {
        const val = parseInt($('#dotting-lines-input').val(), 10);
        globalLinesCount = (!isNaN(val) && val >= 1) ? val : 1;
        if (isAllSelected) {
            dottingManager.globalDefaultLinesCount = globalLinesCount;
        }
    }
    let globalFullDot = true;
    if (dottingManager.userCustomGlobalFullDot !== undefined && dottingManager.userCustomGlobalFullDot !== null) {
        globalFullDot = dottingManager.userCustomGlobalFullDot;
    } else {
        globalFullDot = $('#dotting-fulldot-checkbox').is(':checked');
    }

    let globalOutline = 'none';
    if (dottingManager.userCustomGlobalOutline !== undefined && dottingManager.userCustomGlobalOutline !== null) {
        globalOutline = dottingManager.userCustomGlobalOutline;
    } else {
        globalOutline = $('#dotting-outline-select').val() || 'none';
    }
    const color = $('#dotting-color-input').val() || '#e53935';

    let globalReps;
    if (isWhite14x20) {
        globalReps = Math.min(14, Math.max(1, Math.floor(15 / globalSpaces)));
    } else if (isWhite11x14) {
        globalReps = Math.min(11, Math.max(1, Math.floor(12 / globalSpaces)));
    } else if (isBlackboard) {
        globalReps = Math.min(3, Math.max(1, Math.floor(4 / globalSpaces)));
    } else if (isAllSelected) {
        globalReps = Math.max(1, parseInt($('#dotting-reps-input').val(), 10) || 5);
    } else {
        globalReps = 5;
    }

    if (lineIndex !== undefined && lineIndex !== null) {
        const lineCfg = (dottingManager.lineDotConfigs && dottingManager.lineDotConfigs[lineIndex]) || {};
        let spaces;
        if (lineCfg.spaces !== undefined) {
            spaces = lineCfg.spaces;
        } else if (dottingManager.userCustomGlobalSpaces !== undefined && dottingManager.userCustomGlobalSpaces !== null) {
            spaces = dottingManager.userCustomGlobalSpaces;
        } else {
            spaces = dottingManager.calculateAutoSpaces(lineIndex, $lineEl);
        }

        let reps;
        if (isWhite14x20) {
            reps = Math.min(14, Math.max(1, Math.floor(15 / spaces)));
        } else if (isWhite11x14) {
            reps = Math.min(11, Math.max(1, Math.floor(12 / spaces)));
        } else if (isBlackboard) {
            reps = Math.min(3, Math.max(1, Math.floor(4 / spaces)));
        } else {
            reps = lineCfg.repetitions !== undefined ? lineCfg.repetitions : globalReps;
        }
        const linesCount = lineCfg.linesCount !== undefined ? lineCfg.linesCount : globalLinesCount;
        const fullDot = lineCfg.fullDot !== undefined ? lineCfg.fullDot : globalFullDot;
        const outline = lineCfg.outline !== undefined ? lineCfg.outline : globalOutline;

        return {
            enabled: enabled,
            spaces: spaces,
            repetitions: reps,
            linesCount: linesCount,
            fullDot: fullDot,
            outline: outline,
            color: color,
            isBlackboard: isBlackboard,
            isWhite11x14: isWhite11x14,
            isWhite14x20: isWhite14x20,
            isCustom: !!lineCfg.isCustom
        };
    }

    return {
        enabled: enabled,
        spaces: globalSpaces,
        repetitions: globalReps,
        linesCount: globalLinesCount,
        fullDot: globalFullDot,
        outline: globalOutline,
        color: color,
        isBlackboard: isBlackboard,
        isWhite11x14: isWhite11x14,
        isWhite14x20: isWhite14x20,
        isCustom: (dottingManager.userCustomGlobalSpaces !== undefined && dottingManager.userCustomGlobalSpaces !== null) || (dottingManager.userCustomGlobalLinesCount !== undefined && dottingManager.userCustomGlobalLinesCount !== null)
    };
};

dottingManager.updateDottingControlsState = function () {
    const layout = $('#board-color-select').val();
    const isBlackboard = (layout === 'blackboard');
    const isWhite11x14 = (layout === 'white_11x14' || layout === 'white_10x14');
    const isWhite14x20 = (layout === 'white_14x20');

    const selectedLine = $('#dotting-line-select').val();
    let spaces, reps, linesCount;

    if (selectedLine && selectedLine !== 'all') {
        const lineIdx = parseInt(selectedLine, 10);
        const cfg = dottingManager.getDottingConfig(lineIdx);
        spaces = cfg.spaces;
        reps = cfg.repetitions;
        linesCount = cfg.linesCount;
        $('#dotting-spaces-input').val(spaces);
        $('#dotting-lines-input').val(linesCount);
        $('#dotting-fulldot-checkbox').prop('checked', cfg.fullDot);
        $('#dotting-outline-select').val(cfg.outline);
        if (dottingManager.lineDotConfigs[lineIdx] && dottingManager.lineDotConfigs[lineIdx].isCustom) {
            $('#btn-reset-line-dotting').show();
        } else {
            $('#btn-reset-line-dotting').hide();
        }
    } else {
        const globalCfg = dottingManager.getDottingConfig();
        spaces = globalCfg.spaces;
        reps = globalCfg.repetitions;
        linesCount = globalCfg.linesCount;
        $('#dotting-spaces-input').val(spaces);
        $('#dotting-lines-input').val(linesCount);
        $('#dotting-fulldot-checkbox').prop('checked', globalCfg.fullDot);
        $('#dotting-outline-select').val(globalCfg.outline);
        if ((dottingManager.userCustomGlobalSpaces !== undefined && dottingManager.userCustomGlobalSpaces !== null) ||
            (dottingManager.userCustomGlobalLinesCount !== undefined && dottingManager.userCustomGlobalLinesCount !== null)) {
            $('#btn-reset-line-dotting').show();
        } else {
            $('#btn-reset-line-dotting').hide();
        }
    }

    const $repsInput = $('#dotting-reps-input');
    const $repsBadge = $('#dotting-reps-badge');

    if (isWhite14x20) {
        const autoReps = Math.min(14, Math.max(1, Math.floor(15 / spaces)));
        $repsInput.val(autoReps).prop('disabled', true);
        $repsBadge.text(`Tự động: ${autoReps}`).attr('title', 'Tính tự động theo chiều rộng 14 ô của trang');
    } else if (isWhite11x14) {
        const autoReps = Math.min(11, Math.max(1, Math.floor(12 / spaces)));
        $repsInput.val(autoReps).prop('disabled', true);
        $repsBadge.text(`Tự động: ${autoReps}`).attr('title', 'Tính tự động theo chiều rộng 11 ô của trang');
    } else if (isBlackboard) {
        const autoReps = Math.min(3, Math.max(1, Math.floor(4 / spaces)));
        $repsInput.val(autoReps).prop('disabled', true);
        $repsBadge.text(`Tự động: ${autoReps}`).attr('title', 'Tính tự động theo chiều rộng 3 ô của bảng con');
    } else {
        $repsInput.prop('disabled', false);
        $repsBadge.text('Tự do').attr('title', 'Tự do chọn số chấm lặp trên dòng vô hạn');
        if (reps !== undefined) {
            $repsInput.val(reps);
        }
    }
};

dottingManager.updateDottingLineSelect = function () {
    const $select = $('#dotting-line-select');
    if (!$select.length) return;
    const currentVal = $select.val() || 'all';

    const rawLines = ($('#input').val() || '').split('\n');
    const hasAnyText = ($('#input').val() || '').trim().length > 0;

    let html = '<option value="all">Tất cả các dòng</option>';
    if (hasAnyText) {
        for (let i = 0; i < rawLines.length; i++) {
            const lineText = (rawLines[i] || '').trim();
            if (!lineText) {
                continue;
            }
            const customCfg = dottingManager.lineDotConfigs[i];
            const cfg = dottingManager.getDottingConfig(i);
            const customBadge = (customCfg && customCfg.isCustom) ? ` [Cách ${cfg.spaces} ô]` : '';
            const preview = ` "${lineText.slice(0, 15)}${lineText.length > 15 ? '...' : ''}"`;
            html += `<option value="${i}">Dòng ${i + 1}${escapeHtml(customBadge)}:${escapeHtml(preview)}</option>`;
        }
    }
    $select.html(html);

    if ($select.find(`option[value="${currentVal}"]`).length) {
        $select.val(currentVal);
    } else {
        $select.val('all');
    }
};

dottingManager.renderDotsForLine = function ($line, lineTokens, lineIndex, config) {
    let srcLineIdx = lineIndex;
    if (lineTokens && lineTokens.sourceLineIndex !== undefined) {
        srcLineIdx = lineTokens.sourceLineIndex;
    } else if ($line && $line.length) {
        const attrSrc = parseInt($line.attr('data-source-line-idx'), 10);
        if (!isNaN(attrSrc)) {
            srcLineIdx = attrSrc;
        }
    }
    if (!config) config = dottingManager.getDottingConfig(srcLineIdx, $line);
    const hasAnyText = ($('#input').val() || '').trim().length > 0;
    if (!config.enabled || !hasAnyText) {
        $line.find('.guide-dots-layer').remove();
        return;
    }

    $line.find('.btn-line-dot-badge')
        .attr('title', `Dòng ${srcLineIdx + 1}: Cách ${config.spaces} ô (Nhấp để chỉnh riêng)`)
        .html(`<i class="fa-solid fa-circle-dot"></i> Cách ${config.spaces} ô`);

    $line.find('.guide-dots-layer').remove();

    // 1. Check if this line has text
    let wordTokens = (lineTokens || []).filter(t => t.type === 'word');
    if (wordTokens.length === 0) {
        const domWords = $line.children('.word');
        if (domWords.length > 0) {
            wordTokens = Array.from(domWords).map(w => ({ type: 'word', text: $(w).find('.word-text').text() || $(w).text() }));
        }
    }
    const hasText = wordTokens.length > 0;

    let wordsInfo = [];
    if (hasText) {
        $line.children('.word').each(function () {
            const $w = $(this);
            wordsInfo.push({
                text: $w.find('.word-text').text() || $w.text(),
                raw: $w.attr('data-raw') || '',
                offsetLeft: this.offsetLeft,
                stretch: parseFloat($w.attr('data-stretch')) || 1.0,
                weight: $w.attr('data-weight') || null
            });
        });
    } else {
        let $sourceLine = $(`p.line[data-source-line-idx="${srcLineIdx}"][data-is-practice="false"]`).first();
        if (!$sourceLine.length) {
            $sourceLine = $line.prevAll('p.line').filter(function () {
                return $(this).children('.word').length > 0;
            }).first();
        }

        if (!$sourceLine.length && config.isBlackboard) {
            const $board = $line.closest('.board.blackboard');
            const $prevBoard = $board.prevAll('.board.blackboard').filter(function () {
                return $(this).find('p.line .word').length > 0;
            }).first();
            if ($prevBoard.length) {
                $sourceLine = $prevBoard.find('p.line');
            }
        }

        if ($sourceLine && $sourceLine.length) {
            $sourceLine.children('.word').each(function () {
                const $w = $(this);
                wordsInfo.push({
                    text: $w.find('.word-text').text() || $w.text(),
                    raw: $w.attr('data-raw') || '',
                    offsetLeft: this.offsetLeft,
                    stretch: parseFloat($w.attr('data-stretch')) || 1.0,
                    weight: $w.attr('data-weight') || null
                });
            });
        }

        if (wordsInfo.length === 0) {
            const rawInputLines = ($('#input').val() || '').split('\n');
            const lineFromInput = (rawInputLines[srcLineIdx] !== undefined ? rawInputLines[srcLineIdx].trim() : '') || rawInputLines.find(l => l.trim().length > 0) || 'a';
            const wordTokensFromInput = lineFromInput.split(/\s+/).filter(w => w.length > 0);
            wordsInfo = (wordTokensFromInput.length > 0 ? wordTokensFromInput : ['a']).map(w => ({
                text: model.getUnicodeStr(w),
                raw: w,
                offsetLeft: 0,
                stretch: 1.0
            }));
        }
    }

    const rawChar = wordsInfo.length > 0 ? (wordsInfo[0].raw || wordsInfo[0].text) : 'a';
    const charUnit = model.getFirstCharUnit(rawChar);

    const activeDotConfig = dottingManager.getActiveDotConfig(charUnit, srcLineIdx, 0);
    let hasDotConfigs = !!(activeDotConfig && activeDotConfig.dots && activeDotConfig.dots.length > 0);
    if (!hasDotConfigs && wordsInfo && wordsInfo.length > 1) {
        for (let wIdx = 1; wIdx < wordsInfo.length; wIdx++) {
            const wInfo = wordsInfo[wIdx];
            const wChar = model.getFirstCharUnit(wInfo.raw || wInfo.text);
            const wDotCfg = dottingManager.getActiveDotConfig(wChar, srcLineIdx, wIdx);
            if (wDotCfg && Array.isArray(wDotCfg.dots) && wDotCfg.dots.length > 0) {
                hasDotConfigs = true;
                break;
            }
        }
    }
    const outlineInfo = dottingManager.parseOutlineOption(config.outline);

    if (!hasDotConfigs && !outlineInfo.isEnabled) {
        $line.find('.guide-dots-layer').remove();
        return;
    }

    // Determine geometry units
    const isSmall = $('#font-size-select').val() === '37' || $('#font-size-select').val() === '36' || $line.closest('.result-text').hasClass('small') || $('#result').hasClass('small');
    const isBlackboard = config.isBlackboard;

    let olyUnitPx, blockWidth, dotSizePx;
    if (isBlackboard) {
        olyUnitPx = isSmall ? 28.932 : 56.3;
        blockWidth = 225.2;
        dotSizePx = isSmall ? 8 : 14;
    } else {
        olyUnitPx = isSmall ? 9.6 : 19.2;
        blockWidth = 76.8;
        dotSizePx = isSmall ? 5 : 7;
    }

    // Measure baseline Y inside $line
    let baselineY = 0;
    const $probe = $('<span style="display:inline-block;vertical-align:baseline;width:0;height:0;visibility:hidden;pointer-events:none;"></span>');
    $line.append($probe);
    baselineY = $probe[0].offsetTop;
    $probe.remove();

    if (baselineY <= 0) {
        if (isBlackboard) {
            baselineY = isSmall ? 108 : 216;
        } else {
            baselineY = isSmall ? 58.2 : 115.95;
        }
    }

    const baseWordX = wordsInfo.length > 0 ? wordsInfo[0].offsetLeft : 0;
    const stretch = wordsInfo.length > 0 ? (wordsInfo[0].stretch || 1.0) : 1.0;

    const $dotsLayer = $('<div class="guide-dots-layer"></div>');
    for (let j = 0; j < config.repetitions; j++) {
        if (hasText || config.fullDot || j === 0) {
            const shiftX = j * blockWidth * config.spaces;

            // Faint / Dotted / Curve outlines
            if (outlineInfo.isEnabled) {
                const isCopy = (!hasText || j > 0);
                if (isCopy) {
                    const outlineClass = `guide-outline-word guide-outline-${outlineInfo.style}`;
                    if (outlineInfo.scope === 'first') {
                        const word0 = wordsInfo[0];
                        const x = word0 ? (word0.offsetLeft + shiftX) : (baseWordX + shiftX);
                        const wStretch = word0 ? (word0.stretch || 1.0) : (stretch || 1.0);
                        const transformStyle = wStretch !== 1.0 ? `transform: scaleX(${wStretch}); transform-origin: 0 0;` : '';
                        let displayText = '';
                        if (outlineInfo.style === 'dotted') {
                            displayText = charUnit;
                        } else {
                            displayText = model.getUnicodeStr(charUnit);
                        }
                        const weightAttr = (word0 && word0.weight) ? ` data-weight="${word0.weight}"` : '';
                        const $span = $(`<span class="${outlineClass}"${weightAttr} style="left: ${x}px; ${transformStyle}">${escapeHtml(displayText)}</span>`);
                        $dotsLayer.append($span);
                    } else if (outlineInfo.scope === 'all') {
                        wordsInfo.forEach(w => {
                            const x = w.offsetLeft + shiftX;
                            const wStretch = w.stretch || 1.0;
                            const transformStyle = wStretch !== 1.0 ? `transform: scaleX(${wStretch}); transform-origin: 0 0;` : '';
                            let displayText = '';
                            if (outlineInfo.style === 'dotted') {
                                displayText = w.raw || w.text;
                            } else {
                                displayText = w.text || model.getUnicodeStr(w.raw);
                            }
                            const weightAttr = (w && w.weight) ? ` data-weight="${w.weight}"` : '';
                            const $span = $(`<span class="${outlineClass}"${weightAttr} style="left: ${x}px; ${transformStyle}">${escapeHtml(displayText)}</span>`);
                            $dotsLayer.append($span);
                        });
                    }
                }
            }

            // Guide dots
            if (hasDotConfigs) {
                if (wordsInfo && wordsInfo.length > 0) {
                    wordsInfo.forEach((wInfo, wIdx) => {
                        const wChar = model.getFirstCharUnit(wInfo.raw || wInfo.text);
                        const wDotCfg = dottingManager.getActiveDotConfig(wChar, srcLineIdx, wIdx);
                        if (wDotCfg && Array.isArray(wDotCfg.dots) && wDotCfg.dots.length > 0) {
                            const wBaseX = wInfo.offsetLeft;
                            const wStretch = wInfo.stretch || 1.0;
                            wDotCfg.dots.forEach((dot, dotIdx) => {
                                const dotX = wBaseX + (dot.x * olyUnitPx * wStretch) + shiftX;
                                const dotY = baselineY - (dot.y * olyUnitPx);
                                const dotTitle = dot.label ? `${dot.label} (${dot.x}, ${dot.y})` : `Chấm ${dotIdx + 1} (${dot.x}, ${dot.y})`;
                                const $dot = $('<span class="guide-dot"></span>').css({
                                    left: dotX + 'px',
                                    top: dotY + 'px',
                                    width: dotSizePx + 'px',
                                    height: dotSizePx + 'px',
                                    backgroundColor: config.color
                                }).attr('title', dotTitle);
                                $dotsLayer.append($dot);
                            });
                        }
                    });
                } else if (activeDotConfig && Array.isArray(activeDotConfig.dots) && activeDotConfig.dots.length > 0) {
                    activeDotConfig.dots.forEach((dot, dotIdx) => {
                        const dotX = baseWordX + (dot.x * olyUnitPx * stretch) + shiftX;
                        const dotY = baselineY - (dot.y * olyUnitPx);
                        const dotTitle = dot.label ? `${dot.label} (${dot.x}, ${dot.y})` : `Chấm ${dotIdx + 1} (${dot.x}, ${dot.y})`;
                        const $dot = $('<span class="guide-dot"></span>').css({
                            left: dotX + 'px',
                            top: dotY + 'px',
                            width: dotSizePx + 'px',
                            height: dotSizePx + 'px',
                            backgroundColor: config.color
                        }).attr('title', dotTitle);
                        $dotsLayer.append($dot);
                    });
                }
            }
        }
    }
    $line.append($dotsLayer);
    if (typeof window !== 'undefined' && window.view && typeof window.view.syncInfiniteCanvasWidth === 'function') {
        window.view.syncInfiniteCanvasWidth();
    }
};

dottingManager.renderDotsForLineAndPracticeLines = function ($line) {
    if (!$line || !$line.length) return;
    const lineIdx = parseInt($line.attr('id').replace('line-', ''), 10) || 0;
    const srcLineIdx = parseInt($line.attr('data-source-line-idx'), 10);
    const targetSrcIdx = !isNaN(srcLineIdx) ? srcLineIdx : lineIdx;

    dottingManager.renderDotsForLine($line, null, targetSrcIdx);

    $('p.line[data-is-practice="true"]').each(function () {
        const pSrcIdx = parseInt($(this).attr('data-source-line-idx'), 10);
        if (pSrcIdx === targetSrcIdx) {
            dottingManager.renderDotsForLine($(this), null, targetSrcIdx);
        }
    });
};
