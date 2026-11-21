import { model } from './model.js';
import { dottingManager, escapeHtml } from './dotting-manager.js';
import { APP_CONFIG } from './config.js';

/**
 * Board Renderer Module
 * Coordinates layout syncing across Standard Infinite board, Blackboard slate, and White 11x14 notebook,
 * and handles DOM line and glyph rendering.
 */
export const boardRenderer = {};

boardRenderer.syncInfiniteCanvasWidth = function () {
    const layout = $('#board-color-select').val();
    const isBlackboard = layout ? (layout === 'blackboard') : $('.board').hasClass('blackboard');
    const isWhite11x14 = layout ? (layout === 'white_11x14' || layout === 'white_10x14') : ($('.board').hasClass('white_11x14') || $('.board').hasClass('white_10x14'));
    const isWhite14x20 = layout ? (layout === 'white_14x20') : $('.board').hasClass('white_14x20');

    if (isBlackboard || isWhite11x14 || isWhite14x20) return;

    const $result = $('#result');
    if (!$result.length) return;

    const dotConfig = dottingManager.getDottingConfig();
    const hasAnyText = ($('#input').val() || '').trim().length > 0;
    const isDotActive = dottingManager.isDottingActive() && dotConfig && dotConfig.enabled && hasAnyText;

    if (!isDotActive) {
        $result.css('min-width', '');
        return;
    }

    const subGridPx = 19.2;
    const bigGridPx = 76.8;
    let maxDotsRight = 0;

    const $lines = $result.children('p.line');
    const totalLinesCount = Math.max($lines.length, dotConfig.linesCount || 0);

    for (let idx = 0; idx < totalLinesCount; idx++) {
        const lineCfg = dottingManager.getDottingConfig(idx);
        const outlineInfo = dottingManager.parseOutlineOption(lineCfg.outline);
        const reps = Math.max(1, lineCfg.repetitions || 1);
        const spaces = Math.max(1, lineCfg.spaces || 1);

        let lineMax = subGridPx + (reps * bigGridPx * spaces);

        const $line = $lines.eq(idx);
        if ($line.length) {
            const $words = $line.children('.word');
            const $lastWord = $words.last();
            if ($lastWord.length) {
                if (outlineInfo.isEnabled && outlineInfo.scope === 'all') {
                    const shiftMax = (reps - 1) * bigGridPx * spaces;
                    const lastWordRight = $lastWord[0].offsetLeft + ($lastWord[0].offsetWidth * (parseFloat($lastWord.attr('data-stretch')) || 1.0)) + shiftMax + subGridPx;
                    if (lastWordRight > lineMax) lineMax = lastWordRight;
                }
            }
        }
        if (lineMax > maxDotsRight) maxDotsRight = lineMax;
    }

    if (maxDotsRight > 0) {
        $result.css('min-width', `${Math.ceil(maxDotsRight)}px`);
    } else {
        $result.css('min-width', '');
    }
};

boardRenderer.syncBlackboards = function (linesData) {
    const $container = $('.board-container');
    let $existingBoards = $container.children('.board.blackboard');

    // If container had normal boards (not blackboard), clean them out
    if ($container.children('.board:not(.blackboard)').length > 0) {
        $container.empty();
        $existingBoards = $();
    }

    // 1. Remove excess blackboards
    if ($existingBoards.length > linesData.length) {
        $existingBoards.slice(linesData.length).remove();
        $existingBoards = $container.children('.board.blackboard');
    }

    // 2. Add missing blackboards
    const isSmall = $('#font-size-select').val() === '37' || $('#font-size-select').val() === '36' || $('#result').hasClass('small');
    const isBold = $('#weight-checkbox').is(':checked');
    const color = $('#font-color-input').val() || '#ffd700';
    const isItalics = $('#style-checkbox').is(':checked');

    if ($existingBoards.length < linesData.length) {
        for (let i = $existingBoards.length; i < linesData.length; i++) {
            const idAttr = i === 0 ? 'id="result"' : `id="result-${i}"`;
            const $newBoard = $(`
                <div class="board blackboard ${isItalics ? 'italics' : ''}" data-board-idx="${i}">
                    <div class="grid ${isItalics ? 'italics' : ''}">
                        <div class="result-text ${isSmall ? 'small' : ''} ${isBold ? 'bold' : ''}" ${idAttr} style="color: ${color};">
                            <p class="line" id="line-${i}"></p>
                        </div>
                    </div>
                </div>
            `);
            $container.append($newBoard);
        }
        $existingBoards = $container.children('.board.blackboard');
    }

    // 3. Update each blackboard's single line
    $existingBoards.each(function (index, boardEl) {
        const $board = $(boardEl);
        $board.attr('data-board-idx', index);
        const $resultText = $board.find('.result-text, #result');
        if (index === 0) {
            $resultText.attr('id', 'result');
        } else {
            $resultText.attr('id', 'result-' + index);
        }

        let $line = $resultText.children('p.line').first();
        if (!$line.length) {
            $line = $(`<p class="line" id="line-${index}"></p>`);
            $resultText.append($line);
        }

        const lineTokens = linesData[index] || [];
        boardRenderer.renderLineElement($line, lineTokens, index);
    });
};

boardRenderer.syncNormalBoard = function () {
    const $container = $('.board-container');
    const $boards = $container.children('.board');

    // If multiple boards exist, or the single board is blackboard or white_11x14 or white_14x20, replace with single normal board
    if ($boards.length !== 1 || $boards.hasClass('blackboard') || $boards.hasClass('white_11x14') || $boards.hasClass('white_10x14') || $boards.hasClass('white_14x20')) {
        $container.empty();
        const currentColor = $('#board-color-select').val() || 'black';
        const isBold = $('#weight-checkbox').is(':checked');
        const color = $('#font-color-input').val() || (currentColor === 'white' ? '#2b1055' : '#ffffff');
        const isSmall = $('#font-size-select').val() === '37' || $('#font-size-select').val() === '36';
        const isItalics = $('#style-checkbox').is(':checked');

        const $normalBoard = $(`
            <div class="board ${currentColor} ${isItalics ? 'italics' : ''}">
                <div class="grid ${isItalics ? 'italics' : ''}">
                    <div id="result" class="result-text ${isBold ? 'bold' : ''} ${isSmall ? 'small' : ''}" style="color: ${color};"></div>
                </div>
            </div>
        `);
        $container.append($normalBoard);
    }
};

boardRenderer.syncWhite11x14 = function (linesData) {
    const $container = $('.board-container');
    let $existingBoards = $container.children('.board.white_11x14, .board.white_10x14');

    if ($container.children('.board:not(.white_11x14):not(.white_10x14)').length > 0) {
        $container.empty();
        $existingBoards = $();
    }

    const isSmall = $('#font-size-select').val() === '37' || $('#font-size-select').val() === '36' || $('#result').hasClass('small');
    const isBold = $('#weight-checkbox').is(':checked');
    const color = $('#font-color-input').val() || '#2b1055';
    const isItalics = $('#style-checkbox').is(':checked');

    const linesPerPage = isSmall ? 14 : 7;
    const totalPages = Math.max(1, Math.ceil(linesData.length / linesPerPage));

    // 1. Remove excess pages
    if ($existingBoards.length > totalPages) {
        $existingBoards.slice(totalPages).remove();
        $existingBoards = $container.children('.board.white_11x14, .board.white_10x14');
    }

    // 2. Add missing pages
    if ($existingBoards.length < totalPages) {
        for (let p = $existingBoards.length; p < totalPages; p++) {
            const idAttr = p === 0 ? 'id="result"' : `id="result-p${p}"`;
            const $newPage = $(`
                <div class="board white white_11x14 white_10x14 ${isItalics ? 'italics' : ''}" data-page-idx="${p}">
                    <div class="grid ${isItalics ? 'italics' : ''}">
                        <div class="result-text ${isSmall ? 'small' : ''} ${isBold ? 'bold' : ''}" ${idAttr} style="color: ${color};"></div>
                    </div>
                </div>
            `);
            $container.append($newPage);
        }
        $existingBoards = $container.children('.board.white_11x14, .board.white_10x14');
    }

    // 3. Populate lines for each page
    $existingBoards.each(function (pIdx, boardEl) {
        const $board = $(boardEl);
        $board.attr('data-page-idx', pIdx);
        if (isItalics) {
            $board.addClass('italics');
            $board.find('.grid').addClass('italics');
        } else {
            $board.removeClass('italics');
            $board.find('.grid').removeClass('italics');
        }

        const $resultText = $board.find('.result-text, #result');
        if (pIdx === 0) {
            $resultText.attr('id', 'result');
        } else {
            $resultText.attr('id', 'result-p' + pIdx);
        }

        if (isSmall) {
            $resultText.addClass('small');
        } else {
            $resultText.removeClass('small');
        }

        if (isBold) {
            $resultText.addClass('bold');
        } else {
            $resultText.removeClass('bold');
        }
        $resultText.css('color', color);

        const startLineIdx = pIdx * linesPerPage;
        const endLineIdx = Math.min(startLineIdx + linesPerPage, linesData.length);
        const pageLinesData = linesData.slice(startLineIdx, endLineIdx);

        let $existingLines = $resultText.children('p.line');
        if ($existingLines.length > pageLinesData.length) {
            $existingLines.slice(pageLinesData.length).remove();
            $existingLines = $resultText.children('p.line');
        }
        if ($existingLines.length < pageLinesData.length) {
            for (let l = $existingLines.length; l < pageLinesData.length; l++) {
                const globalLineIdx = startLineIdx + l;
                const $newLine = $(`<p class="line" id="line-${globalLineIdx}"></p>`);
                $resultText.append($newLine);
            }
            $existingLines = $resultText.children('p.line');
        }

        $existingLines.each(function (lIdx, lineEl) {
            const globalLineIdx = startLineIdx + lIdx;
            const $line = $(lineEl);
            $line.attr('id', 'line-' + globalLineIdx);
            boardRenderer.renderLineElement($line, pageLinesData[lIdx] || [], globalLineIdx);
        });
    });
};

boardRenderer.syncWhite14x20 = function (linesData) {
    const $container = $('.board-container');
    let $existingBoards = $container.children('.board.white_14x20');

    if ($container.children('.board:not(.white_14x20)').length > 0) {
        $container.empty();
        $existingBoards = $();
    }

    const isSmall = $('#font-size-select').val() === '37' || $('#font-size-select').val() === '36' || $('#result').hasClass('small');
    const isBold = $('#weight-checkbox').is(':checked');
    const color = $('#font-color-input').val() || '#2b1055';
    const isItalics = $('#style-checkbox').is(':checked');

    const linesPerPage = isSmall ? 20 : 10;
    const totalPages = Math.max(1, Math.ceil(linesData.length / linesPerPage));

    // 1. Remove excess pages
    if ($existingBoards.length > totalPages) {
        $existingBoards.slice(totalPages).remove();
        $existingBoards = $container.children('.board.white_14x20');
    }

    // 2. Add missing pages
    if ($existingBoards.length < totalPages) {
        for (let p = $existingBoards.length; p < totalPages; p++) {
            const idAttr = p === 0 ? 'id="result"' : `id="result-p${p}"`;
            const $newPage = $(`
                <div class="board white white_14x20 ${isItalics ? 'italics' : ''}" data-page-idx="${p}">
                    <div class="grid ${isItalics ? 'italics' : ''}">
                        <div class="result-text ${isSmall ? 'small' : ''} ${isBold ? 'bold' : ''}" ${idAttr} style="color: ${color};"></div>
                    </div>
                </div>
            `);
            $container.append($newPage);
        }
        $existingBoards = $container.children('.board.white_14x20');
    }

    // 3. Populate lines for each page
    $existingBoards.each(function (pIdx, boardEl) {
        const $board = $(boardEl);
        $board.attr('data-page-idx', pIdx);
        if (isItalics) {
            $board.addClass('italics');
            $board.find('.grid').addClass('italics');
        } else {
            $board.removeClass('italics');
            $board.find('.grid').removeClass('italics');
        }

        const $resultText = $board.find('.result-text, #result');
        if (pIdx === 0) {
            $resultText.attr('id', 'result');
        } else {
            $resultText.attr('id', 'result-p' + pIdx);
        }

        if (isSmall) {
            $resultText.addClass('small');
        } else {
            $resultText.removeClass('small');
        }

        if (isBold) {
            $resultText.addClass('bold');
        } else {
            $resultText.removeClass('bold');
        }
        $resultText.css('color', color);

        const startLineIdx = pIdx * linesPerPage;
        const endLineIdx = Math.min(startLineIdx + linesPerPage, linesData.length);
        const pageLinesData = linesData.slice(startLineIdx, endLineIdx);

        let $existingLines = $resultText.children('p.line');
        if ($existingLines.length > pageLinesData.length) {
            $existingLines.slice(pageLinesData.length).remove();
            $existingLines = $resultText.children('p.line');
        }
        if ($existingLines.length < pageLinesData.length) {
            for (let l = $existingLines.length; l < pageLinesData.length; l++) {
                const globalLineIdx = startLineIdx + l;
                const $newLine = $(`<p class="line" id="line-${globalLineIdx}"></p>`);
                $resultText.append($newLine);
            }
            $existingLines = $resultText.children('p.line');
        }

        $existingLines.each(function (lIdx, lineEl) {
            const globalLineIdx = startLineIdx + lIdx;
            const $line = $(lineEl);
            $line.attr('id', 'line-' + globalLineIdx);
            boardRenderer.renderLineElement($line, pageLinesData[lIdx] || [], globalLineIdx);
        });
    });
};

boardRenderer.adjustBlackboardFontSize = function () {
    const $results = $('.board.blackboard .result-text, .board.blackboard #result');
    if (!$results.length) return;

    const isSmall = $('#font-size-select').val() === '37' || $('#font-size-select').val() === '36' || $results.first().hasClass('small');
    const finalSize = isSmall ? 144.66 : 281.5;

    const topPx = isSmall ? 297 : 192;
    const baselineOffset = 408.05 - topPx;

    $results.each(function () {
        this.style.setProperty('--baseline-offset', baselineOffset + 'px');
        $(this).css({
            'font-size': finalSize + 'px',
            'top': topPx + 'px'
        });
        if (isSmall) {
            $(this).addClass('small');
        } else {
            $(this).removeClass('small');
        }
    });
};

boardRenderer.renderLineElement = function ($line, lineTokens, lineIndex) {
    const srcLineIdx = (lineTokens && lineTokens.sourceLineIndex !== undefined) ? lineTokens.sourceLineIndex : lineIndex;
    const isPractice = !!(lineTokens && lineTokens.isPractice);
    $line.attr('id', 'line-' + lineIndex);
    $line.attr('data-source-line-idx', srcLineIdx);
    $line.attr('data-is-practice', isPractice ? 'true' : 'false');

    const existingMargins = [];
    const existingStretches = [];
    const existingNatWidths = [];
    const existingWeights = [];
    const existingManualStretches = [];
    const existingAutoStretches = [];
    $line.children('.word').each(function () {
        const ml = this.style.marginLeft;
        const stretch = $(this).attr('data-stretch');
        const natW = $(this).attr('data-natural-width');
        const weight = $(this).attr('data-weight');
        const manual = $(this).attr('data-manual-stretch');
        const auto = $(this).attr('data-auto-stretch');
        existingMargins.push(ml || null);
        existingStretches.push(stretch ? parseFloat(stretch) : null);
        existingNatWidths.push(natW ? parseFloat(natW) : null);
        existingWeights.push(weight || null);
        existingManualStretches.push(manual || null);
        existingAutoStretches.push(auto || null);
    });

    const wordTokens = lineTokens.filter(t => t.type === 'word');

    if (wordTokens.length === 0) {
        $line.empty().html('&nbsp;');
        if (dottingManager.isDottingActive()) {
            const lineDotConfig = dottingManager.getDottingConfig(srcLineIdx, $line);
            dottingManager.renderDotsForLine($line, lineTokens, srcLineIdx, lineDotConfig);
        } else {
            $line.find('.guide-dots-layer').remove();
        }
        $line.find('.line-dot-controls, .line-dot-wrapper, .btn-line-dot-badge').remove();
        return;
    }

    let wordIndex = 0;
    let html = '';
    let lineDotConfig = dottingManager.getDottingConfig(srcLineIdx, $line);
    const isDotActive = dottingManager.isDottingActive();
    const isAutoStretchActive = $('#autostretch-checkbox').is(':checked');
    const isGlobalBold = $('#weight-checkbox').is(':checked') || $('.result-text, #result').hasClass('bold');
    const cfg = APP_CONFIG.wordStretch || { stretchTargetPercent: 121.89 };
    const optimalScale = cfg.stretchTargetPercent / 100;

    for (const token of lineTokens) {
        if (token.type === 'space') {
            html += `<span class="word-space">${escapeHtml(token.text)}</span>`;
        } else {
            const preservedMargin = existingMargins[wordIndex];
            const preservedStretch = existingStretches[wordIndex];
            const preservedNatW = existingNatWidths[wordIndex];
            const preservedWeight = existingWeights[wordIndex];
            const preservedManual = existingManualStretches[wordIndex];
            const preservedAuto = existingAutoStretches[wordIndex];

            let effectiveStretch = preservedStretch;
            let isAuto = preservedAuto;
            let isManual = preservedManual;

            if (isAutoStretchActive) {
                if (!isManual) {
                    effectiveStretch = optimalScale;
                    isAuto = true;
                }
            } else {
                if (isAuto && !isManual) {
                    effectiveStretch = 1.0;
                    isAuto = false;
                }
            }

            let wordStyles = [];
            if (preservedMargin) {
                wordStyles.push(`margin-left: ${preservedMargin}`);
            }
            let stretchAttr = '';
            let natWAttr = '';
            let manualAttr = isManual ? ` data-manual-stretch="true"` : '';
            let autoAttr = isAuto ? ` data-auto-stretch="true"` : '';
            let weightAttr = preservedWeight ? ` data-weight="${preservedWeight}"` : '';
            let textStyles = [];
            if (effectiveStretch && Math.abs(effectiveStretch - 1) > 0.005) {
                stretchAttr = ` data-stretch="${effectiveStretch}"`;
                if (preservedNatW) {
                    natWAttr = ` data-natural-width="${preservedNatW}"`;
                    wordStyles.push(`width: ${(preservedNatW * effectiveStretch).toFixed(2)}px`);
                    textStyles.push(`width: ${preservedNatW}px`);
                }
                textStyles.push(`display: inline-block`, `vertical-align: baseline`, `transform: scaleX(${effectiveStretch})`, `transform-origin: 0 0`);
            }
            const styleAttr = wordStyles.length ? ` style="${wordStyles.join('; ')};"` : '';
            const textStyleAttr = textStyles.length ? ` style="${textStyles.join('; ')};"` : '';

            const charUnit = model.getFirstCharUnit(token.raw || token.text);
            const activeDotConfig = dottingManager.getActiveDotConfig(charUnit, srcLineIdx, wordIndex);
            const hasDotConfigs = !!(activeDotConfig && activeDotConfig.dots && activeDotConfig.dots.length > 0);
            const dotsCount = hasDotConfigs ? activeDotConfig.dots.length : 0;
            const isCustomDotCfg = !!(lineDotConfig.dotConfigId || (dottingManager.wordDotConfigs && dottingManager.wordDotConfigs[`${srcLineIdx}_${wordIndex}`]));

            const hasWeightOverride = !!preservedWeight;
            const boldBtnTitle = hasWeightOverride
                ? (preservedWeight === 'bold' ? 'Đang ép chữ đậm (Nhấp để đổi)' : 'Đang ép chữ thanh (Nhấp để đổi)')
                : (isGlobalBold ? 'Đang theo mẫu đậm (Nhấp để đổi sang thanh)' : 'Đang theo mẫu thanh (Nhấp để đổi sang đậm)');
            const boldBtnHtml = `<button type="button" class="btn-word-bold ${hasWeightOverride ? 'is-override' : ''}" title="${boldBtnTitle}"><i class="fa-solid fa-bold"></i></button>`;

            const dotBadgeHtml = (isDotActive && wordIndex === 0) ? `
                <span class="line-dot-wrapper">
                    <button type="button" class="btn-line-dot-badge ${lineDotConfig.isCustom ? 'is-custom' : ''}" data-line-idx="${srcLineIdx}" title="Dòng ${srcLineIdx + 1}: Cách ${lineDotConfig.spaces} ô (Nhấp để chỉnh riêng)">
                        <i class="fa-solid fa-circle-dot"></i> Cách ${lineDotConfig.spaces} ô
                    </button>
                </span>` : '';

            const dotConfigBadgeHtml = isDotActive ? `
                <span class="word-dot-wrapper">
                    <button type="button" class="btn-word-dot-badge ${isCustomDotCfg ? 'is-custom' : ''} ${!hasDotConfigs ? 'is-empty' : ''}" data-line-idx="${srcLineIdx}" data-word-idx="${wordIndex}" data-char="${escapeHtml(charUnit)}" title="Cấu hình chấm chữ '${escapeHtml(charUnit)}'${hasDotConfigs ? `: ${escapeHtml(activeDotConfig.name)} (${dotsCount} chấm)` : ' (Chưa bật chấm)'}">
                        <i class="fa-solid ${hasDotConfigs ? 'fa-braille' : 'fa-circle-dot'}"></i> ${hasDotConfigs ? `${dotsCount} chấm` : 'Chấm'} <i class="fa-solid fa-caret-down" style="font-size: 0.65em; margin-left: 2px;"></i>
                    </button>
                </span>` : '';

            const rawTokenAttr = ` data-raw="${escapeHtml(token.raw || token.text)}"`;
            html += `<span class="word" data-word-idx="${wordIndex}"${rawTokenAttr}${stretchAttr}${natWAttr}${manualAttr}${autoAttr}${weightAttr}${styleAttr}>` +
                `<span class="word-handle no-print">` +
                    `<span class="btn-word-drag" title="Kéo để dịch chuyển (và các từ phía sau)"><i class="fa-solid fa-up-down-left-right"></i></span>` +
                    boldBtnHtml +
                    `<span class="btn-word-reset" title="Đặt lại vị trí ban đầu"><i class="fa-solid fa-arrow-rotate-left"></i></span>` +
                    dotBadgeHtml +
                    dotConfigBadgeHtml +
                `</span>` +
                `<span class="word-text"${textStyleAttr}>${escapeHtml(token.text)}</span>` +
                `<span class="btn-word-stretch no-print" title="Kéo để giãn chữ (Nhấp đúp để giãn chuẩn / đặt lại)"></span>` +
            `</span>`;
            wordIndex++;
        }
    }
    $line.empty().html(html);

    // Measure natural width for any stretched words
    $line.children('.word[data-stretch]').each(function () {
        const $w = $(this);
        if (!$w.attr('data-natural-width')) {
            const scale = parseFloat($w.attr('data-stretch'));
            const $wText = $w.children('.word-text');
            $wText.css({ 'width': '', 'transform': '' });
            const rect = $wText[0].getBoundingClientRect();
            const natW = rect.width;
            if (natW > 0) {
                $w.attr('data-natural-width', natW);
                $w.css('width', (natW * scale).toFixed(2) + 'px');
                $wText.css({
                    'display': 'inline-block',
                    'vertical-align': 'baseline',
                    'width': natW + 'px',
                    'transform': `scaleX(${scale})`,
                    'transform-origin': '0 0'
                });
            }
        }
    });

    const lineCustomSpaces = dottingManager.lineDotConfigs && dottingManager.lineDotConfigs[srcLineIdx] && dottingManager.lineDotConfigs[srcLineIdx].spaces !== undefined;
    if (!lineCustomSpaces && (dottingManager.userCustomGlobalSpaces === null || dottingManager.userCustomGlobalSpaces === undefined)) {
        lineDotConfig = dottingManager.getDottingConfig(srcLineIdx, $line);
        $line.find('.btn-line-dot-badge')
            .attr('title', `Dòng ${srcLineIdx + 1}: Cách ${lineDotConfig.spaces} ô (Nhấp để chỉnh riêng)`)
            .html(`<i class="fa-solid fa-circle-dot"></i> Cách ${lineDotConfig.spaces} ô`);
    }

    if (dottingManager.isDottingActive()) {
        dottingManager.renderDotsForLine($line, lineTokens, srcLineIdx, lineDotConfig);
    } else {
        $line.find('.guide-dots-layer').remove();
    }
};

boardRenderer.updateLines = function (linesData) {
    const $result = $('#result');
    const $existingLines = $result.children('p.line');

    if ($existingLines.length > linesData.length) {
        $existingLines.slice(linesData.length).remove();
    } else if ($existingLines.length < linesData.length) {
        for (let i = $existingLines.length; i < linesData.length; i++) {
            const $newLine = $('<p class="line" id="line-' + i + '"></p>');
            $result.append($newLine);
        }
    }

    $result.children('p.line').each(function (index, el) {
        boardRenderer.renderLineElement($(el), linesData[index] || [], index);
    });
};

boardRenderer.render = function () {
    if (!model.isLoaded) return;
    const $input = $('#input');
    const layout = $('#board-color-select').val();
    const isBlackboard = layout ? (layout === 'blackboard') : $('.board').hasClass('blackboard');
    const isWhite11x14 = layout ? (layout === 'white_11x14' || layout === 'white_10x14') : ($('.board').hasClass('white_11x14') || $('.board').hasClass('white_10x14'));
    const isWhite14x20 = layout ? (layout === 'white_14x20') : $('.board').hasClass('white_14x20');
    let rawLines = $input.val().split('\n');

    const hasAnyText = $input.val().trim().length > 0;
    const dotConfig = dottingManager.getDottingConfig();

    let linesData = [];
    if (!dotConfig.enabled || !hasAnyText) {
        let lines = rawLines.map(l => l.replace(/[\t]/g, "    "));
        while (lines.length > 1 && lines[lines.length - 1].trim() === '' && lines[lines.length - 2].trim() === '') {
            lines.pop();
        }
        if (lines.length === 0) lines = [''];

        linesData = lines.map((line, idx) => {
            const tokens = line.split(/(\s+)/);
            const lineTokens = [];
            for (const token of tokens) {
                if (!token) continue;
                if (/^\s+$/.test(token)) {
                    lineTokens.push({ type: 'space', text: token });
                } else {
                    const converted = model.getUnicodeStr(token);
                    lineTokens.push({ type: 'word', text: converted, raw: token });
                }
            }
            lineTokens.sourceLineIndex = idx;
            lineTokens.isPractice = false;
            return lineTokens;
        });
    } else {
        for (let i = 0; i < rawLines.length; i++) {
            const rawLine = rawLines[i].replace(/[\t]/g, "    ");
            const isBlank = rawLine.trim().length === 0;
            if (isBlank) {
                const blankTokens = [];
                blankTokens.sourceLineIndex = i;
                blankTokens.isPractice = false;
                linesData.push(blankTokens);
                continue;
            }

            const tokens = rawLine.split(/(\s+)/);
            const modelTokens = [];
            for (const token of tokens) {
                if (!token) continue;
                if (/^\s+$/.test(token)) {
                    modelTokens.push({ type: 'space', text: token });
                } else {
                    const converted = model.getUnicodeStr(token);
                    modelTokens.push({ type: 'word', text: converted, raw: token });
                }
            }
            modelTokens.sourceLineIndex = i;
            modelTokens.isPractice = false;
            linesData.push(modelTokens);

            const lineCfg = dottingManager.getDottingConfig(i);
            const count = Math.max(1, lineCfg.linesCount || 1);
            for (let p = 1; p < count; p++) {
                const practiceTokens = [];
                practiceTokens.sourceLineIndex = i;
                practiceTokens.isPractice = true;
                practiceTokens.practiceIndex = p;
                linesData.push(practiceTokens);
            }
        }
        if (linesData.length === 0) {
            const emptyTokens = [];
            emptyTokens.sourceLineIndex = 0;
            emptyTokens.isPractice = false;
            linesData = [emptyTokens];
        }
    }

    if (isBlackboard) {
        boardRenderer.syncBlackboards(linesData);
        boardRenderer.adjustBlackboardFontSize();
    } else if (isWhite11x14) {
        boardRenderer.syncWhite11x14(linesData);
    } else if (isWhite14x20) {
        boardRenderer.syncWhite14x20(linesData);
    } else {
        boardRenderer.syncNormalBoard();
        const $result = $('#result');
        $result.css({ 'font-size': '', 'top': '', 'left': '', 'position': '', 'width': '', 'max-width': '', 'min-width': '', 'white-space': '' });
        boardRenderer.updateLines(linesData);
        $result.css({ 'font-size': '', 'top': '' });
        boardRenderer.syncInfiniteCanvasWidth();
    }
    dottingManager.updateDottingLineSelect();
    dottingManager.updateDottingControlsState();
};
