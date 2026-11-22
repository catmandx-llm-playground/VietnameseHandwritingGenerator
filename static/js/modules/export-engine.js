import { model } from './model.js';
import { dottingManager } from './dotting-manager.js';
import { storageManager } from './storage-manager.js';

/**
 * Multi-Format Export Engine
 * Generates Canvas PNG (with automatic & manual 2x/4x/6x/8x scaling),
 * SVG Vector files with embedded Base64 fonts, and printable A4 PDF documents
 * across Standard Infinite board, Blackboard slate, and White 11x14 notebook layouts.
 */
export const exportEngine = {};

exportEngine.blackboardImg = typeof Image !== 'undefined' ? new Image() : null;
if (exportEngine.blackboardImg) {
    exportEngine.blackboardImg.crossOrigin = 'anonymous';
    exportEngine.blackboardImg.src = '/static/img/blackboard.png';
}

exportEngine.generateFileName = storageManager.generateFileName;
exportEngine.downloadCanvasAsPng = storageManager.downloadCanvasAsPng;
exportEngine.downloadSvg = storageManager.downloadSvg;
exportEngine.getDottingConfig = dottingManager.getDottingConfig;
exportEngine.parseOutlineOption = dottingManager.parseOutlineOption;
exportEngine.getActiveDotConfig = dottingManager.getActiveDotConfig;

exportEngine.escapeXml = function (str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

exportEngine.isMobileDevice = function () {
    if (typeof window === 'undefined') return false;
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isSmallScreen = window.innerWidth <= 768;
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    return isMobileUA || (isTouch && isSmallScreen);
};

exportEngine.getExportScale = function () {
    const val = parseInt($('#export-scale-select').val(), 10);
    if (!isNaN(val) && val >= 1 && val <= 16) {
        return val;
    }
    return exportEngine.isMobileDevice() ? 4 : 8;
};

exportEngine.initExportControls = function () {
    const isMobile = exportEngine.isMobileDevice();
    const autoScale = isMobile ? '4' : '8';

    // Auto-select resolution based on device type: mobile 4x, desktop 8x
    $('#export-scale-select').val(autoScale);
    $('#export-type-select').val('png');

    exportEngine.updateExportUI();

    $('#export-type-select').on('change', function () {
        exportEngine.updateExportUI();
    });

    $('#export-scale-select').on('change', function () {
        exportEngine.updateExportUI();
    });

    // Dropdown toggle on button click
    $('#btn-export-dropdown').on('click', function (e) {
        e.stopPropagation();
        $('#export-dropdown').toggleClass('is-open');
    });

    // Dismiss on click outside
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#export-dropdown').length) {
            $('#export-dropdown').removeClass('is-open');
        }
    });

    // Enter key inside dropdown triggers download
    $('.export-dropdown-content').on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            exportEngine.exportFile();
        }
    });
};

exportEngine.updateExportUI = function () {
    const type = $('#export-type-select').val() || 'png';
    const scale = $('#export-scale-select').val() || '8';
    const isMobile = exportEngine.isMobileDevice();
    const autoScale = isMobile ? '4' : '8';
    const isOverridden = (scale !== autoScale);

    let mainLabel = 'Tải ảnh (PNG)';
    let actionLabel = `Tải về ngay (PNG ${scale}x)`;

    if (type === 'svg') {
        mainLabel = 'Tải vector (SVG)';
        actionLabel = 'Tải về ngay (SVG Vector)';
        $('#export-scale-select').prop('disabled', true);
        $('#export-scale-field').css('opacity', '0.5');
        $('#export-device-hint').html('<i class="fa-solid fa-circle-info" style="color: #0284c7;"></i> Định dạng Vector vô cực, phóng to không vỡ hạt.');
    } else if (type === 'pdf') {
        mainLabel = 'Tải tài liệu (PDF)';
        actionLabel = `Tải về ngay (PDF A4 - ${scale}x)`;
        $('#export-scale-select').prop('disabled', false);
        $('#export-scale-field').css('opacity', '1');
        const hintText = isOverridden
            ? `<i class="fa-solid fa-sliders" style="color: #f59e0b;"></i> Đã tùy chỉnh <strong>${scale}x</strong> cho PDF khổ in A4.`
            : `<i class="fa-solid ${isMobile ? 'fa-mobile-screen' : 'fa-desktop'}" style="color: #10b981;"></i> Đã tự chọn <strong>${scale}x</strong> cho PDF (${isMobile ? 'tối ưu RAM di động' : 'sắc nét máy tính'}).`;
        $('#export-device-hint').html(hintText);
    } else {
        // PNG
        mainLabel = 'Tải ảnh (PNG)';
        actionLabel = `Tải về ngay (PNG ${scale}x)`;
        $('#export-scale-select').prop('disabled', false);
        $('#export-scale-field').css('opacity', '1');
        const deviceName = isMobile ? 'di động' : 'máy tính';
        const hintText = isOverridden
            ? `<i class="fa-solid fa-sliders" style="color: #f59e0b;"></i> Đã tùy chỉnh sang <strong>${scale}x</strong> (${scale >= '6' ? 'siêu nét' : 'tiết kiệm dung lượng'}).`
            : `<i class="fa-solid ${isMobile ? 'fa-mobile-screen' : 'fa-desktop'}" style="color: #10b981;"></i> Đã tự chọn <strong>${scale}x</strong> cho ${deviceName} (${isMobile ? 'tránh tràn RAM' : 'bản in siêu nét'}).`;
        $('#export-device-hint').html(hintText);
    }

    $('#btn-export-label').text(mainLabel);
    $('#btn-execute-export-label').text(actionLabel);
};

exportEngine._fontBase64Cache = null;
exportEngine.loadFontBase64 = async function () {
    if (exportEngine._fontBase64Cache) return exportEngine._fontBase64Cache;
    exportEngine._fontBase64Cache = {};
    const fontDefs = [
        { key: 'HP001N', url: '/static/font/HP001N30.ttf' },
        { key: 'HP001B', url: '/static/font/HP001B30.ttf' },
        { key: 'HP001TD', url: '/static/font/HP001TD.otf' }
    ];
    await Promise.all(fontDefs.map(async (def) => {
        try {
            const res = await fetch(def.url);
            if (!res.ok) return;
            const blob = await res.blob();
            const dataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
            exportEngine._fontBase64Cache[def.key] = dataUrl;
        } catch (e) {
            console.warn('Font caching for SVG error:', def.key, e);
        }
    }));
    return exportEngine._fontBase64Cache;
};

exportEngine.buildSvgFontDefs = async function () {
    const fonts = await exportEngine.loadFontBase64();
    const normalSrc = fonts['HP001N'] ? `url('${fonts['HP001N']}') format('truetype')` : `url('/static/font/HP001N30.ttf') format('truetype')`;
    const boldSrc = fonts['HP001B'] ? `url('${fonts['HP001B']}') format('truetype')` : `url('/static/font/HP001B30.ttf') format('truetype')`;
    const tdSrc = fonts['HP001TD'] ? `url('${fonts['HP001TD']}') format('opentype')` : `url('/static/font/HP001TD.otf') format('opentype')`;

    return `<defs>
<style type="text/css"><![CDATA[
@font-face {
    font-family: 'HP001';
    font-weight: normal;
    font-style: normal;
    src: ${normalSrc};
}
@font-face {
    font-family: 'HP001';
    font-weight: bold;
    font-style: normal;
    src: ${boldSrc};
}
@font-face {
    font-family: 'HP001TD';
    font-weight: normal;
    font-style: normal;
    src: ${tdSrc};
}
]]></style>
</defs>`;
};

exportEngine._blackboardDataUrl = null;
exportEngine.getBlackboardDataUrl = async function () {
    if (exportEngine._blackboardDataUrl) return exportEngine._blackboardDataUrl;
    try {
        const resp = await fetch('/static/img/blackboard.png');
        const blob = await resp.blob();
        exportEngine._blackboardDataUrl = await new Promise((res) => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result);
            reader.readAsDataURL(blob);
        });
        return exportEngine._blackboardDataUrl;
    } catch (e) {
        return '/static/img/blackboard.png';
    }
};

/* ==========================================================================
   BLACKBOARD EXPORT (PNG, PDF, SVG)
   ========================================================================== */

exportEngine.renderBlackboardToCanvas = async function (bgImg, boardEl, bIdx, customScale, totalBoards) {
    let S = customScale || exportEngine.getExportScale();
    const isMobile = exportEngine.isMobileDevice();
    const maxCanvasDim = isMobile ? 8192 : 16384;
    const maxCanvasArea = isMobile ? 25000000 : 100000000;
    const widthBase = 842;
    const heightBase = 595;
    if (widthBase * S > maxCanvasDim || heightBase * S > maxCanvasDim || (widthBase * S * heightBase * S) > maxCanvasArea) {
        const scaleDim = maxCanvasDim / Math.max(widthBase, heightBase);
        const scaleArea = Math.sqrt(maxCanvasArea / (widthBase * heightBase));
        S = Math.max(1, Math.min(S, Math.floor(Math.min(scaleDim, scaleArea) * 10) / 10));
    }

    const widthPx = Math.round(widthBase * S);
    const heightPx = Math.round(heightBase * S);
    const baselineY = 408.05 * S;
    const startX = 96.092 * S;

    const isBold = $('#weight-checkbox').is(':checked') || $('.result-text, #result').hasClass('bold');
    const isItalics = $('.grid').hasClass('italics') || $('.board').hasClass('italics') || $('#style-checkbox').is(':checked');
    const textColor = $('#font-color-input').val() || '#ffd700';

    const isSmall = $('#font-size-select').val() === '37' || $('#font-size-select').val() === '36' || $('.result-text, #result').hasClass('small');
    const domFontSize = isSmall ? 144.66 : 281.5;
    const exportFontSize = domFontSize * S;

    const rawInputLines = ($('#input').val() || '').split('\n').map(l => l.replace(/[\t]/g, "    ").trim());

    const canvas = document.createElement('canvas');
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext('2d');

    // 1. Draw exact blackboard background
    ctx.drawImage(bgImg, 0, 0, widthPx, heightPx);

    // 2. Collect words for this board
    const $line = $(boardEl).find('p.line').first();
    const words = [];
    $line.children('.word').each(function () {
        const wordEl = this;
        const wordText = $(wordEl).find('.word-text').text() || $(wordEl).text();
        const rawWord = $(wordEl).attr('data-raw') || '';
        const stretch = parseFloat($(wordEl).attr('data-stretch')) || 1.0;
        const weight = $(wordEl).attr('data-weight') || null;
        words.push({
            text: wordText,
            raw: rawWord,
            offsetLeft: wordEl.offsetLeft,
            offsetWidth: wordEl.offsetWidth,
            stretch: stretch,
            weight: weight
        });
    });

    const rawLineText = rawInputLines[bIdx] || words.map(w => w.raw || w.text).join(' ');

    if (words.length > 0) {
        ctx.save();
        if (isItalics) {
            ctx.translate(0, baselineY);
            ctx.transform(1, 0, -Math.tan(17 * Math.PI / 180), 1, 0, 0);
            ctx.translate(0, -baselineY);
        }

        ctx.fillStyle = textColor;
        ctx.textBaseline = 'alphabetic';

        words.forEach(word => {
            const xPos = startX + (word.offsetLeft * S);
            ctx.fillStyle = textColor;
            const wordIsBold = word.weight === 'bold' ? true : (word.weight === 'normal' ? false : isBold);
            ctx.font = `${wordIsBold ? 'bold' : 'normal'} ${exportFontSize}px HP001, serif`;
            if (word.stretch && word.stretch !== 1.0) {
                ctx.save();
                ctx.translate(xPos, baselineY);
                ctx.scale(word.stretch, 1.0);
                ctx.fillText(word.text, 0, 0);
                ctx.restore();
            } else {
                ctx.fillText(word.text, xPos, baselineY);
            }
        });

        ctx.restore();
    }

    const $lineEl = $(boardEl).find('p.line').first();
    const srcLineIdx = parseInt($lineEl.attr('data-source-line-idx'), 10);
    const validSrcIdx = !isNaN(srcLineIdx) ? srcLineIdx : bIdx;
    const lineDotConfig = exportEngine.getDottingConfig(validSrcIdx);
    const hasText = words.length > 0;
    const hasAnyText = ($('#input').val() || '').trim().length > 0;
    if (lineDotConfig && lineDotConfig.enabled && hasAnyText) {
        let wordsToDraw = words;
        if (wordsToDraw.length === 0) {
            let $srcBoard = $(`p.line[data-source-line-idx="${validSrcIdx}"][data-is-practice="false"]`).closest('.board.blackboard');
            if (!$srcBoard.length) {
                $srcBoard = $(boardEl).prevAll('.board.blackboard').filter(function () {
                    return $(this).find('p.line .word').length > 0;
                }).first();
            }
            if (!$srcBoard.length) $srcBoard = $('.board.blackboard').first();
            $srcBoard.find('p.line').first().children('.word').each(function () {
                const wEl = this;
                wordsToDraw.push({
                    text: $(wEl).find('.word-text').text() || $(wEl).text(),
                    raw: $(wEl).attr('data-raw') || '',
                    offsetLeft: wEl.offsetLeft,
                    offsetWidth: wEl.offsetWidth,
                    stretch: parseFloat($(wEl).attr('data-stretch')) || 1.0,
                    weight: $(wEl).attr('data-weight') || null
                });
            });
        }
        let rawLine = wordsToDraw.length > 0 ? (wordsToDraw[0].raw || rawInputLines[validSrcIdx] || wordsToDraw[0].text) : (rawInputLines[validSrcIdx] || rawInputLines[0] || 'a');
        if (wordsToDraw.length === 0) {
            const rawTokens = (rawLine || 'a').split(/\s+/).filter(w => w.length > 0);
            wordsToDraw = (rawTokens.length > 0 ? rawTokens : ['a']).map(w => ({
                text: model.getUnicodeStr(w),
                raw: w,
                offsetLeft: 0,
                stretch: 1.0
            }));
        }
        const charUnit = model.getFirstCharUnit(rawLine);
        const activeDotConfig = exportEngine.getActiveDotConfig(charUnit, validSrcIdx, 0);
        let hasDotConfigs = !!(activeDotConfig && activeDotConfig.dots && activeDotConfig.dots.length > 0);
        if (!hasDotConfigs && wordsToDraw.length > 1) {
            for (let wIdx = 1; wIdx < wordsToDraw.length; wIdx++) {
                const wInfo = wordsToDraw[wIdx];
                const wChar = model.getFirstCharUnit(wInfo.raw || wInfo.text);
                const wDotCfg = exportEngine.getActiveDotConfig(wChar, validSrcIdx, wIdx);
                if (wDotCfg && Array.isArray(wDotCfg.dots) && wDotCfg.dots.length > 0) {
                    hasDotConfigs = true;
                    break;
                }
            }
        }
        const outlineInfo = exportEngine.parseOutlineOption(lineDotConfig.outline);

        const olyUnitPx = (isSmall ? 28.932 : 56.3) * S;
        const blockWidth = 225.2 * S;
        const dotRadius = (isSmall ? 4 : 7) * S;

        const wordOffset = wordsToDraw.length > 0 ? (wordsToDraw[0].offsetLeft * S) : 0;
        const firstStretch = wordsToDraw.length > 0 && wordsToDraw[0].stretch ? wordsToDraw[0].stretch : 1.0;
        const baseWordX = startX + wordOffset;

        if (hasDotConfigs || outlineInfo.isEnabled) {
            ctx.save();
            if (isItalics) {
                ctx.translate(0, baselineY);
                ctx.transform(1, 0, -Math.tan(17 * Math.PI / 180), 1, 0, 0);
                ctx.translate(0, -baselineY);
            }

            for (let j = 0; j < lineDotConfig.repetitions; j++) {
                if (hasText || lineDotConfig.fullDot || j === 0) {
                    const shiftX = j * blockWidth * lineDotConfig.spaces;

                    // A. Faint / Dotted / Curve outline copies
                    if (outlineInfo.isEnabled) {
                        const isCopy = (!hasText || j > 0);
                        if (isCopy) {
                            ctx.save();
                            ctx.textBaseline = 'alphabetic';
                            const isDotted = (outlineInfo.style === 'dotted');
                            const isFaint = (outlineInfo.style === 'faint');
                            const isCurve = (outlineInfo.style === 'curve');

                            if (isDotted) {
                                ctx.font = `normal ${exportFontSize}px HP001TD, serif`;
                                ctx.fillStyle = 'rgba(255, 215, 0, 0.75)';
                            } else if (isFaint) {
                                ctx.font = `${isBold ? 'bold' : 'normal'} ${exportFontSize}px HP001, serif`;
                                ctx.fillStyle = 'rgba(255, 215, 0, 0.38)';
                            } else {
                                ctx.font = `${isBold ? 'bold' : 'normal'} ${exportFontSize}px HP001, serif`;
                                ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
                                ctx.lineWidth = 1.2 * S;
                            }

                            const drawText = (str, x, y, strStretch) => {
                                if (strStretch && strStretch !== 1.0) {
                                    ctx.save();
                                    ctx.translate(x, y);
                                    ctx.scale(strStretch, 1.0);
                                    if (isCurve) {
                                        ctx.strokeText(str, 0, 0);
                                    } else {
                                        ctx.fillText(str, 0, 0);
                                    }
                                    ctx.restore();
                                } else {
                                    if (isCurve) {
                                        ctx.strokeText(str, x, y);
                                    } else {
                                        ctx.fillText(str, x, y);
                                    }
                                }
                            };

                            if (outlineInfo.scope === 'first') {
                                const xPos = baseWordX + shiftX;
                                const w0 = wordsToDraw[0];
                                const textToDraw = isDotted ? charUnit : model.getUnicodeStr(charUnit);
                                if (!isDotted) {
                                    const word0Weight = w0 ? w0.weight : null;
                                    const firstWordIsBold = word0Weight === 'bold' ? true : (word0Weight === 'normal' ? false : isBold);
                                    ctx.font = `${firstWordIsBold ? 'bold' : 'normal'} ${exportFontSize}px HP001, serif`;
                                }
                                drawText(textToDraw, xPos, baselineY, firstStretch);
                            } else if (outlineInfo.scope === 'all') {
                                wordsToDraw.forEach(w => {
                                    const xPos = startX + (w.offsetLeft * S) + shiftX;
                                    const textToDraw = isDotted ? (w.raw || w.text) : (w.text || model.getUnicodeStr(w.raw));
                                    if (!isDotted) {
                                        const wordIsBold = w.weight === 'bold' ? true : (w.weight === 'normal' ? false : isBold);
                                        ctx.font = `${wordIsBold ? 'bold' : 'normal'} ${exportFontSize}px HP001, serif`;
                                    }
                                    drawText(textToDraw, xPos, baselineY, w.stretch || 1.0);
                                });
                            }
                            ctx.restore();
                        }
                    }

                    // B. Guide dots
                    if (hasDotConfigs) {
                        if (wordsToDraw && wordsToDraw.length > 0) {
                            wordsToDraw.forEach((wInfo, wIdx) => {
                                const wChar = model.getFirstCharUnit(wInfo.raw || wInfo.text);
                                const wDotCfg = exportEngine.getActiveDotConfig(wChar, validSrcIdx, wIdx);
                                if (wDotCfg && Array.isArray(wDotCfg.dots) && wDotCfg.dots.length > 0) {
                                    const wBaseX = startX + (wInfo.offsetLeft * S);
                                    const wStretch = wInfo.stretch || 1.0;
                                    for (const dot of wDotCfg.dots) {
                                        const dotX = wBaseX + (dot.x * olyUnitPx * wStretch) + shiftX;
                                        const dotY = baselineY - (dot.y * olyUnitPx);
                                        ctx.beginPath();
                                        ctx.fillStyle = lineDotConfig.color;
                                        ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
                                        ctx.fill();
                                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                                        ctx.lineWidth = 1 * S;
                                        ctx.stroke();
                                    }
                                }
                            });
                        } else if (activeDotConfig && Array.isArray(activeDotConfig.dots) && activeDotConfig.dots.length > 0) {
                            for (const dot of activeDotConfig.dots) {
                                const dotX = baseWordX + (dot.x * olyUnitPx * firstStretch) + shiftX;
                                const dotY = baselineY - (dot.y * olyUnitPx);
                                ctx.beginPath();
                                ctx.fillStyle = lineDotConfig.color;
                                ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                                ctx.lineWidth = 1 * S;
                                ctx.stroke();
                            }
                        }
                    }
                }
            }
            ctx.restore();
        }
    }

    const lineSuffix = totalBoards > 1 ? (`_dong${bIdx + 1}`) : '';
    const fileName = exportEngine.generateFileName('blackboard' + lineSuffix, rawLineText, 'png');

    return { canvas, fileName, rawLineText };
};

exportEngine.renderBlackboardToSvg = async function (boardEl, bIdx, totalBoards) {
    const isBold = $('#weight-checkbox').is(':checked') || $('.result-text, #result').hasClass('bold');
    const isItalics = $('.grid').hasClass('italics') || $('.board').hasClass('italics') || $('#style-checkbox').is(':checked');
    const textColor = $('#font-color-input').val() || '#ffd700';

    const widthPx = 842;
    const heightPx = 595;
    const baselineY = 408.05;
    const startX = 96.092;

    const isSmall = $('#font-size-select').val() === '37' || $('#font-size-select').val() === '36' || $('.result-text, #result').hasClass('small');
    const fontSizePx = isSmall ? 144.66 : 281.5;

    const rawInputLines = ($('#input').val() || '').split('\n').map(l => l.replace(/[\t]/g, "    ").trim());

    const $line = $(boardEl).find('p.line').first();
    const words = [];
    $line.children('.word').each(function () {
        const wordEl = this;
        const wordText = $(wordEl).find('.word-text').text() || $(wordEl).text();
        const rawWord = $(wordEl).attr('data-raw') || '';
        const stretch = parseFloat($(wordEl).attr('data-stretch')) || 1.0;
        const weight = $(wordEl).attr('data-weight') || null;
        words.push({
            text: wordText,
            raw: rawWord,
            offsetLeft: wordEl.offsetLeft,
            offsetWidth: wordEl.offsetWidth,
            stretch: stretch,
            weight: weight
        });
    });

    const rawLineText = rawInputLines[bIdx] || words.map(w => w.raw || w.text).join(' ');

    const bgDataUrl = await exportEngine.getBlackboardDataUrl();
    const fontDefs = await exportEngine.buildSvgFontDefs();

    let textSvg = '';
    const italicMatrix = `matrix(1 0 ${(-Math.tan(17 * Math.PI / 180)).toFixed(6)} 1 0 0)`;
    const italicTransform = isItalics ? `transform="translate(0, ${baselineY.toFixed(2)}) ${italicMatrix} translate(0, ${(-baselineY).toFixed(2)})"` : '';

    if (words.length > 0) {
        let wordsMarkup = '';
        words.forEach(word => {
            const xPos = startX + word.offsetLeft;
            const wordIsBold = word.weight === 'bold' ? true : (word.weight === 'normal' ? false : isBold);
            const fontWeight = wordIsBold ? 'bold' : 'normal';
            const escaped = exportEngine.escapeXml(word.text);
            if (word.stretch && word.stretch !== 1.0) {
                wordsMarkup += `<text x="0" y="0" transform="translate(${xPos.toFixed(2)}, ${baselineY.toFixed(2)}) scale(${word.stretch.toFixed(4)}, 1)" font-family="HP001, serif" font-size="${fontSizePx.toFixed(2)}px" font-weight="${fontWeight}" fill="${textColor}" dominant-baseline="alphabetic">${escaped}</text>\n`;
            } else {
                wordsMarkup += `<text x="${xPos.toFixed(2)}" y="${baselineY.toFixed(2)}" font-family="HP001, serif" font-size="${fontSizePx.toFixed(2)}px" font-weight="${fontWeight}" fill="${textColor}" dominant-baseline="alphabetic">${escaped}</text>\n`;
            }
        });
        textSvg += `<g ${italicTransform}>${wordsMarkup}</g>\n`;
    }

    // Dotting & Outline
    const $lineEl = $(boardEl).find('p.line').first();
    const srcLineIdx = parseInt($lineEl.attr('data-source-line-idx'), 10);
    const validSrcIdx = !isNaN(srcLineIdx) ? srcLineIdx : bIdx;
    const lineDotConfig = exportEngine.getDottingConfig(validSrcIdx);
    const hasText = words.length > 0;
    const hasAnyText = ($('#input').val() || '').trim().length > 0;

    let dottingSvg = '';
    if (lineDotConfig && lineDotConfig.enabled && hasAnyText) {
        let wordsToDraw = words;
        if (wordsToDraw.length === 0) {
            let $srcBoard = $(`p.line[data-source-line-idx="${validSrcIdx}"][data-is-practice="false"]`).closest('.board.blackboard');
            if (!$srcBoard.length) {
                $srcBoard = $(boardEl).prevAll('.board.blackboard').filter(function () {
                    return $(this).find('p.line .word').length > 0;
                }).first();
            }
            if (!$srcBoard.length) $srcBoard = $('.board.blackboard').first();
            $srcBoard.find('p.line').first().children('.word').each(function () {
                const wEl = this;
                wordsToDraw.push({
                    text: $(wEl).find('.word-text').text() || $(wEl).text(),
                    raw: $(wEl).attr('data-raw') || '',
                    offsetLeft: wEl.offsetLeft,
                    offsetWidth: wEl.offsetWidth,
                    stretch: parseFloat($(wEl).attr('data-stretch')) || 1.0,
                    weight: $(wEl).attr('data-weight') || null
                });
            });
        }
        let rawLine = wordsToDraw.length > 0 ? (wordsToDraw[0].raw || rawInputLines[validSrcIdx] || wordsToDraw[0].text) : (rawInputLines[validSrcIdx] || rawInputLines[0] || 'a');
        if (wordsToDraw.length === 0) {
            const rawTokens = (rawLine || 'a').split(/\s+/).filter(w => w.length > 0);
            wordsToDraw = (rawTokens.length > 0 ? rawTokens : ['a']).map(w => ({
                text: model.getUnicodeStr(w),
                raw: w,
                offsetLeft: 0,
                stretch: 1.0
            }));
        }
        const charUnit = model.getFirstCharUnit(rawLine);
        const activeDotConfig = exportEngine.getActiveDotConfig(charUnit, validSrcIdx, 0);
        let hasDotConfigs = !!(activeDotConfig && activeDotConfig.dots && activeDotConfig.dots.length > 0);
        if (!hasDotConfigs && wordsToDraw.length > 1) {
            for (let wIdx = 1; wIdx < wordsToDraw.length; wIdx++) {
                const wInfo = wordsToDraw[wIdx];
                const wChar = model.getFirstCharUnit(wInfo.raw || wInfo.text);
                const wDotCfg = exportEngine.getActiveDotConfig(wChar, validSrcIdx, wIdx);
                if (wDotCfg && Array.isArray(wDotCfg.dots) && wDotCfg.dots.length > 0) {
                    hasDotConfigs = true;
                    break;
                }
            }
        }
        const outlineInfo = exportEngine.parseOutlineOption(lineDotConfig.outline);

        const olyUnitPx = isSmall ? 28.932 : 56.3;
        const blockWidth = 225.2;
        const dotRadius = isSmall ? 4 : 7;

        const wordOffset = wordsToDraw.length > 0 ? wordsToDraw[0].offsetLeft : 0;
        const firstStretch = wordsToDraw.length > 0 && wordsToDraw[0].stretch ? wordsToDraw[0].stretch : 1.0;
        const baseWordX = startX + wordOffset;

        if (hasDotConfigs || outlineInfo.isEnabled) {
            let groupInner = '';
            for (let j = 0; j < lineDotConfig.repetitions; j++) {
                if (hasText || lineDotConfig.fullDot || j === 0) {
                    const shiftX = j * blockWidth * lineDotConfig.spaces;

                    // A. Outline
                    if (outlineInfo.isEnabled && (!hasText || j > 0)) {
                        const isDotted = (outlineInfo.style === 'dotted');
                        const isFaint = (outlineInfo.style === 'faint');
                        const isCurve = (outlineInfo.style === 'curve');

                        const fontFam = isDotted ? 'HP001TD, serif' : 'HP001, serif';
                        const fillCol = isDotted ? 'rgba(255, 215, 0, 0.75)' : (isFaint ? 'rgba(255, 215, 0, 0.38)' : 'none');
                        const strokeAttr = isCurve ? 'stroke="rgba(255, 255, 255, 0.45)" stroke-width="1.2"' : '';

                        const drawSvgText = (str, x, y, strStretch, isBoldWord) => {
                            const esc = exportEngine.escapeXml(str);
                            const weightStr = isBoldWord ? 'bold' : 'normal';
                            if (strStretch && strStretch !== 1.0) {
                                return `<text x="0" y="0" transform="translate(${x.toFixed(2)}, ${y.toFixed(2)}) scale(${strStretch.toFixed(4)}, 1)" font-family="${fontFam}" font-size="${fontSizePx.toFixed(2)}px" font-weight="${weightStr}" fill="${fillCol}" ${strokeAttr} dominant-baseline="alphabetic">${esc}</text>\n`;
                            }
                            return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-family="${fontFam}" font-size="${fontSizePx.toFixed(2)}px" font-weight="${weightStr}" fill="${fillCol}" ${strokeAttr} dominant-baseline="alphabetic">${esc}</text>\n`;
                        };

                        if (outlineInfo.scope === 'first') {
                            const xPos = baseWordX + shiftX;
                            const w0 = wordsToDraw[0];
                            const textToDraw = isDotted ? charUnit : model.getUnicodeStr(charUnit);
                            const word0Weight = w0 ? w0.weight : null;
                            const firstWordIsBold = !isDotted && (word0Weight === 'bold' ? true : (word0Weight === 'normal' ? false : isBold));
                            groupInner += drawSvgText(textToDraw, xPos, baselineY, firstStretch, firstWordIsBold);
                        } else if (outlineInfo.scope === 'all') {
                            wordsToDraw.forEach(w => {
                                const xPos = startX + w.offsetLeft + shiftX;
                                const textToDraw = isDotted ? (w.raw || w.text) : (w.text || model.getUnicodeStr(w.raw));
                                const wordIsBold = !isDotted && (w.weight === 'bold' ? true : (w.weight === 'normal' ? false : isBold));
                                groupInner += drawSvgText(textToDraw, xPos, baselineY, w.stretch || 1.0, wordIsBold);
                            });
                        }
                    }

                    // B. Dots
                    if (hasDotConfigs) {
                        if (wordsToDraw && wordsToDraw.length > 0) {
                            wordsToDraw.forEach((wInfo, wIdx) => {
                                const wChar = model.getFirstCharUnit(wInfo.raw || wInfo.text);
                                const wDotCfg = exportEngine.getActiveDotConfig(wChar, validSrcIdx, wIdx);
                                if (wDotCfg && Array.isArray(wDotCfg.dots) && wDotCfg.dots.length > 0) {
                                    const wBaseX = startX + wInfo.offsetLeft;
                                    const wStretch = wInfo.stretch || 1.0;
                                    for (const dot of wDotCfg.dots) {
                                        const dotX = wBaseX + (dot.x * olyUnitPx * wStretch) + shiftX;
                                        const dotY = baselineY - (dot.y * olyUnitPx);
                                        groupInner += `<circle cx="${dotX.toFixed(2)}" cy="${dotY.toFixed(2)}" r="${dotRadius}" fill="${lineDotConfig.color}" stroke="rgba(0, 0, 0, 0.5)" stroke-width="1" />\n`;
                                    }
                                }
                            });
                        } else if (activeDotConfig && Array.isArray(activeDotConfig.dots) && activeDotConfig.dots.length > 0) {
                            for (const dot of activeDotConfig.dots) {
                                const dotX = baseWordX + (dot.x * olyUnitPx * firstStretch) + shiftX;
                                const dotY = baselineY - (dot.y * olyUnitPx);
                                groupInner += `<circle cx="${dotX.toFixed(2)}" cy="${dotY.toFixed(2)}" r="${dotRadius}" fill="${lineDotConfig.color}" stroke="rgba(0, 0, 0, 0.5)" stroke-width="1" />\n`;
                            }
                        }
                    }
                }
            }
            dottingSvg = `<g ${italicTransform}>${groupInner}</g>\n`;
        }
    }

    const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}">
${fontDefs}
<image href="${bgDataUrl}" x="0" y="0" width="${widthPx}" height="${heightPx}" />
${textSvg}
${dottingSvg}
</svg>`;

    const lineSuffix = totalBoards > 1 ? (`_dong${bIdx + 1}`) : '';
    const fileName = exportEngine.generateFileName('blackboard' + lineSuffix, rawLineText, 'svg');

    return { svgString, fileName };
};

exportEngine.exportBlackboardToPng = async function (customScale) {
    const $boards = $('.board.blackboard');
    if (!$boards.length) return;

    if (document.fonts) {
        try {
            await Promise.all([
                document.fonts.load('16px HP001'),
                document.fonts.load('16px HP001TD'),
                document.fonts.ready
            ]);
        } catch (_) {}
    }

    const doExportAll = async function (bgImg) {
        for (let i = 0; i < $boards.length; i++) {
            const { canvas, fileName } = await exportEngine.renderBlackboardToCanvas(bgImg, $boards[i], i, customScale, $boards.length);
            await exportEngine.downloadCanvasAsPng(canvas, fileName);
            if (i < $boards.length - 1) {
                await new Promise(r => setTimeout(r, 400));
            }
        }
    };

    if (exportEngine.blackboardImg && exportEngine.blackboardImg.complete && exportEngine.blackboardImg.naturalWidth > 0) {
        await doExportAll(exportEngine.blackboardImg);
    } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async function () {
            await doExportAll(img);
        };
        img.src = '/static/img/blackboard.png';
    }
};

exportEngine.exportBlackboardToPdf = async function (customScale) {
    const $boards = $('.board.blackboard');
    if (!$boards.length) return;

    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('Thư viện jsPDF chưa tải xong. Vui lòng thử lại sau giây lát!');
        return;
    }

    if (document.fonts) {
        try {
            await Promise.all([
                document.fonts.load('16px HP001'),
                document.fonts.load('16px HP001TD'),
                document.fonts.ready
            ]);
        } catch (_) {}
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
    });

    const getBgImg = () => new Promise((resolve) => {
        if (exportEngine.blackboardImg && exportEngine.blackboardImg.complete && exportEngine.blackboardImg.naturalWidth > 0) {
            resolve(exportEngine.blackboardImg);
        } else {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.src = '/static/img/blackboard.png';
        }
    });

    const bgImg = await getBgImg();
    let baseFileName = '';

    for (let i = 0; i < $boards.length; i++) {
        if (i > 0) {
            pdf.addPage('a4', 'landscape');
        }
        const { canvas, rawLineText } = await exportEngine.renderBlackboardToCanvas(bgImg, $boards[i], i, customScale, $boards.length);
        if (!baseFileName) {
            baseFileName = exportEngine.generateFileName('blackboard', rawLineText, 'pdf');
        }
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
    }

    pdf.save(baseFileName || 'blackboard.pdf');
};

exportEngine.exportBlackboardToSvg = async function () {
    const $boards = $('.board.blackboard');
    if (!$boards.length) return;

    if (document.fonts) {
        try {
            await Promise.all([
                document.fonts.load('16px HP001'),
                document.fonts.load('16px HP001TD'),
                document.fonts.ready
            ]);
        } catch (_) {}
    }

    for (let i = 0; i < $boards.length; i++) {
        const { svgString, fileName } = await exportEngine.renderBlackboardToSvg($boards[i], i, $boards.length);
        await exportEngine.downloadSvg(svgString, fileName);
        if (i < $boards.length - 1) {
            await new Promise(r => setTimeout(r, 400));
        }
    }
};

/* ==========================================================================
   WHITE 11x14 & 10x14 EXPORT (PNG, PDF, SVG)
   ========================================================================== */

exportEngine.renderWhite11x14PageToCanvas = async function (boardEl, pIdx, customScale, totalBoards) {
    let scale = customScale || exportEngine.getExportScale();
    const ptToPx = 96 / 72;
    const subGridPx = 14.4 * ptToPx; // 19.2px

    const widthPx = 883.2;
    const heightPx = 1152;
    const isMobile = exportEngine.isMobileDevice();
    const maxCanvasDim = isMobile ? 8192 : 16384;
    const maxCanvasArea = isMobile ? 25000000 : 100000000;
    if (widthPx * scale > maxCanvasDim || heightPx * scale > maxCanvasDim || (widthPx * scale * heightPx * scale) > maxCanvasArea) {
        const scaleDim = maxCanvasDim / Math.max(widthPx, heightPx);
        const scaleArea = Math.sqrt(maxCanvasArea / (widthPx * heightPx));
        scale = Math.max(1, Math.min(scale, Math.floor(Math.min(scaleDim, scaleArea) * 10) / 10));
    }
    const canvasWidth = Math.round(widthPx * scale);
    const canvasHeight = Math.round(heightPx * scale);

    const isSmall = $('#font-size-select').val() === '37' || $('#font-size-select').val() === '36' || $('.board.white_11x14 .result-text, .board.white_10x14 .result-text, #result').hasClass('small');
    const isBold = $('#weight-checkbox').is(':checked') || $('.result-text, #result').hasClass('bold');
    const isItalics = $('.grid').hasClass('italics') || $('.board').hasClass('italics') || $('#style-checkbox').is(':checked');
    const textColor = $('#font-color-input').val() || '#2b1055';

    const gridOriginX = subGridPx; // 19.2px
    const gridOriginY = subGridPx * 2; // 38.4px

    const fontSizePx = (isSmall ? 37 : 72) * ptToPx;
    const lineHeightPx = (isSmall ? (subGridPx * 4) : (subGridPx * 8));
    const firstBaselineY = gridOriginY + 4 * subGridPx;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // 1. Draw Paper Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, widthPx, heightPx);

    // 2. Draw Grid Lines
    const majorColor = 'rgba(60, 75, 115, 0.9)';
    const minorColor = 'rgba(90, 115, 165, 0.7)';
    const gridLineWidthMajor = 1.4;
    const gridLineWidthMinor = 0.7;

    for (let y = 0; y <= heightPx + 0.1; y += subGridPx) {
        const k = Math.round((y - gridOriginY) / subGridPx);
        const isMajor = (k % 4 === 0);
        ctx.beginPath();
        ctx.strokeStyle = isMajor ? majorColor : minorColor;
        ctx.lineWidth = isMajor ? gridLineWidthMajor : gridLineWidthMinor;
        ctx.moveTo(0, y);
        ctx.lineTo(widthPx, y);
        ctx.stroke();
    }

    const slantOffset = isItalics ? Math.tan(17 * Math.PI / 180) : 0;
    const xMin = -heightPx * slantOffset;
    const xMax = widthPx + heightPx * slantOffset;
    const startX = (gridOriginX % subGridPx) - heightPx * slantOffset;

    for (let x = startX; x <= xMax; x += subGridPx) {
        const k = Math.round((x - gridOriginX) / subGridPx);
        const isMajor = (k % 4 === 0);
        ctx.beginPath();
        ctx.strokeStyle = isMajor ? majorColor : minorColor;
        ctx.lineWidth = isMajor ? gridLineWidthMajor : gridLineWidthMinor;
        ctx.moveTo(x, 0);
        ctx.lineTo(x - heightPx * slantOffset, heightPx);
        ctx.stroke();
    }

    // 3. Draw Text
    ctx.save();
    if (isItalics) {
        ctx.transform(1, 0, -Math.tan(17 * Math.PI / 180), 1, 0, 0);
    }

    ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'alphabetic';

    const linesPerPage = isSmall ? 14 : 7;
    const $lines = $(boardEl).find('p.line');
    const pageTexts = [];

    $lines.each(function (lIdx) {
        const globalLineIdx = (pIdx * linesPerPage) + lIdx;
        const yPos = firstBaselineY + (lIdx * lineHeightPx);
        const $line = $(this);
        const words = [];
        $line.children('.word').each(function () {
            const wordEl = this;
            const wordText = $(wordEl).find('.word-text').text() || $(wordEl).text();
            const rawWord = $(wordEl).attr('data-raw') || '';
            const stretch = parseFloat($(wordEl).attr('data-stretch')) || 1.0;
            const weight = $(wordEl).attr('data-weight') || null;
            words.push({
                text: wordText,
                raw: rawWord,
                offsetLeft: wordEl.offsetLeft,
                offsetWidth: wordEl.offsetWidth,
                stretch: stretch,
                weight: weight
            });
        });

        if (words.length > 0) {
            pageTexts.push(words.map(w => w.raw || w.text).join(' '));
        }

        ctx.fillStyle = textColor;
        words.forEach(word => {
            const xPos = gridOriginX + word.offsetLeft;
            const wordIsBold = word.weight === 'bold' ? true : (word.weight === 'normal' ? false : isBold);
            ctx.font = `${wordIsBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, sans-serif`;
            if (word.stretch && word.stretch !== 1.0) {
                ctx.save();
                ctx.translate(xPos, yPos);
                ctx.scale(word.stretch, 1.0);
                ctx.fillStyle = textColor;
                ctx.fillText(word.text, 0, 0);
                ctx.restore();
            } else {
                ctx.fillStyle = textColor;
                ctx.fillText(word.text, xPos, yPos);
            }
        });

        const srcLineIdx = parseInt($line.attr('data-source-line-idx'), 10);
        const validSrcIdx = !isNaN(srcLineIdx) ? srcLineIdx : globalLineIdx;
        const hasText = words.length > 0;
        const hasAnyText = ($('#input').val() || '').trim().length > 0;
        const lineDotConfig = exportEngine.getDottingConfig(validSrcIdx);
        if (lineDotConfig && lineDotConfig.enabled && hasAnyText) {
            let wordsToDraw = words;
            if (wordsToDraw.length === 0) {
                let $lineWithWords = $(`p.line[data-source-line-idx="${validSrcIdx}"][data-is-practice="false"]`).first();
                if (!$lineWithWords.length) {
                    $lineWithWords = $line.prevAll('p.line').filter(function () { return $(this).children('.word').length > 0; }).first();
                }
                if (!$lineWithWords.length) {
                    $lineWithWords = $('.board.white_11x14, .board.white_10x14').find('p.line').filter(function () { return $(this).children('.word').length > 0; }).first();
                }
                if ($lineWithWords.length) {
                    $lineWithWords.children('.word').each(function () {
                        wordsToDraw.push({
                            text: $(this).find('.word-text').text() || $(this).text(),
                            raw: $(this).attr('data-raw') || '',
                            offsetLeft: this.offsetLeft,
                            stretch: parseFloat($(this).attr('data-stretch')) || 1.0,
                            weight: $(this).attr('data-weight') || null
                        });
                    });
                }
            }
            let rawLineText = wordsToDraw.length > 0 ? (wordsToDraw[0].raw || wordsToDraw[0].text) : '';
            if (wordsToDraw.length === 0) {
                const rawLines = ($('#input').val() || '').split('\n').map(l => l.trim());
                const lineFromInput = rawLines[validSrcIdx] || rawLines.find(l => l.length > 0) || 'a';
                const tokens = lineFromInput.split(/\s+/).filter(w => w.length > 0);
                wordsToDraw = (tokens.length > 0 ? tokens : ['a']).map(w => ({
                    text: model.getUnicodeStr(w),
                    raw: w,
                    offsetLeft: 0,
                    stretch: 1.0
                }));
                rawLineText = wordsToDraw[0].raw;
            }
            const charUnit = model.getFirstCharUnit(rawLineText);
            const activeDotConfig = exportEngine.getActiveDotConfig(charUnit, validSrcIdx, 0);
            let hasDotConfigs = !!(activeDotConfig && activeDotConfig.dots && activeDotConfig.dots.length > 0);
            if (!hasDotConfigs && wordsToDraw.length > 1) {
                for (let wIdx = 1; wIdx < wordsToDraw.length; wIdx++) {
                    const wInfo = wordsToDraw[wIdx];
                    const wChar = model.getFirstCharUnit(wInfo.raw || wInfo.text);
                    const wDotCfg = exportEngine.getActiveDotConfig(wChar, validSrcIdx, wIdx);
                    if (wDotCfg && Array.isArray(wDotCfg.dots) && wDotCfg.dots.length > 0) {
                        hasDotConfigs = true;
                        break;
                    }
                }
            }
            const outlineInfo = exportEngine.parseOutlineOption(lineDotConfig.outline);

            const olyUnitPx = isSmall ? 9.6 : 19.2;
            const blockWidth = 76.8;
            const dotRadius = isSmall ? 1.25 : 1.75;

            const wordOffset = wordsToDraw.length > 0 ? wordsToDraw[0].offsetLeft : 0;
            const firstStretch = wordsToDraw.length > 0 && wordsToDraw[0].stretch ? wordsToDraw[0].stretch : 1.0;
            const baseWordX = gridOriginX + wordOffset;

            if (hasDotConfigs || outlineInfo.isEnabled) {
                for (let j = 0; j < lineDotConfig.repetitions; j++) {
                    if (hasText || lineDotConfig.fullDot || j === 0) {
                        const shiftX = j * blockWidth * lineDotConfig.spaces;

                        // A. Outline copies
                        if (outlineInfo.isEnabled) {
                            const isCopy = (!hasText || j > 0);
                            if (isCopy) {
                                ctx.save();
                                ctx.textBaseline = 'alphabetic';
                                const isDotted = (outlineInfo.style === 'dotted');
                                const isFaint = (outlineInfo.style === 'faint');
                                const isCurve = (outlineInfo.style === 'curve');

                                if (isDotted) {
                                    ctx.font = `normal ${fontSizePx}px HP001TD, serif`;
                                    ctx.fillStyle = 'rgba(43, 16, 85, 0.65)';
                                } else if (isFaint) {
                                    ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, serif`;
                                    ctx.fillStyle = 'rgba(43, 16, 85, 0.32)';
                                } else {
                                    ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, serif`;
                                    ctx.strokeStyle = 'rgba(43, 16, 85, 0.42)';
                                    ctx.lineWidth = isSmall ? 0.8 : 1.0;
                                }

                                const drawText = (str, x, y, strStretch) => {
                                    if (strStretch && strStretch !== 1.0) {
                                        ctx.save();
                                        ctx.translate(x, y);
                                        ctx.scale(strStretch, 1.0);
                                        if (isCurve) {
                                            ctx.strokeText(str, 0, 0);
                                        } else {
                                            ctx.fillText(str, 0, 0);
                                        }
                                        ctx.restore();
                                    } else {
                                        if (isCurve) {
                                            ctx.strokeText(str, x, y);
                                        } else {
                                            ctx.fillText(str, x, y);
                                        }
                                    }
                                };

                                if (outlineInfo.scope === 'first') {
                                    const xPos = baseWordX + shiftX;
                                    const w0 = wordsToDraw[0];
                                    const textToDraw = isDotted ? charUnit : model.getUnicodeStr(charUnit);
                                    if (!isDotted) {
                                        const word0Weight = w0 ? w0.weight : null;
                                        const firstWordIsBold = word0Weight === 'bold' ? true : (word0Weight === 'normal' ? false : isBold);
                                        ctx.font = `${firstWordIsBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, serif`;
                                    }
                                    drawText(textToDraw, xPos, yPos, firstStretch);
                                } else if (outlineInfo.scope === 'all') {
                                    wordsToDraw.forEach(w => {
                                        const xPos = gridOriginX + w.offsetLeft + shiftX;
                                        const textToDraw = isDotted ? (w.raw || w.text) : (w.text || model.getUnicodeStr(w.raw));
                                        if (!isDotted) {
                                            const wordIsBold = w.weight === 'bold' ? true : (w.weight === 'normal' ? false : isBold);
                                            ctx.font = `${wordIsBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, serif`;
                                        }
                                        drawText(textToDraw, xPos, yPos, w.stretch || 1.0);
                                    });
                                }
                                ctx.restore();
                            }
                        }

                        // B. Guide dots
                        if (hasDotConfigs) {
                            if (wordsToDraw && wordsToDraw.length > 0) {
                                wordsToDraw.forEach((wInfo, wIdx) => {
                                    const wChar = model.getFirstCharUnit(wInfo.raw || wInfo.text);
                                    const wDotCfg = exportEngine.getActiveDotConfig(wChar, validSrcIdx, wIdx);
                                    if (wDotCfg && Array.isArray(wDotCfg.dots) && wDotCfg.dots.length > 0) {
                                        const wBaseX = gridOriginX + wInfo.offsetLeft;
                                        const wStretch = wInfo.stretch || 1.0;
                                        for (const dot of wDotCfg.dots) {
                                            const dotX = wBaseX + (dot.x * olyUnitPx * wStretch) + shiftX;
                                            const dotY = yPos - (dot.y * olyUnitPx);
                                            ctx.beginPath();
                                            ctx.fillStyle = lineDotConfig.color;
                                            ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
                                            ctx.fill();
                                        }
                                    }
                                });
                            } else if (activeDotConfig && Array.isArray(activeDotConfig.dots) && activeDotConfig.dots.length > 0) {
                                for (const dot of activeDotConfig.dots) {
                                    const dotX = baseWordX + (dot.x * olyUnitPx * firstStretch) + shiftX;
                                    const dotY = yPos - (dot.y * olyUnitPx);
                                    ctx.beginPath();
                                    ctx.fillStyle = lineDotConfig.color;
                                    ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
                                    ctx.fill();
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    ctx.restore();

    const firstText = pageTexts[0] || 'chu_dep';
    const pageSuffix = totalBoards > 1 ? `_p${pIdx + 1}` : '';
    const fileName = exportEngine.generateFileName('white_11x14' + pageSuffix, firstText, 'png');

    return { canvas, fileName, firstText };
};

exportEngine.renderWhite11x14PageToSvg = async function (boardEl, pIdx, totalBoards) {
    const ptToPx = 96 / 72;
    const subGridPx = 14.4 * ptToPx; // 19.2px

    const widthPx = 883.2;
    const heightPx = 1152;

    const isSmall = $('#font-size-select').val() === '37' || $('#font-size-select').val() === '36' || $('.board.white_11x14 .result-text, .board.white_10x14 .result-text, #result').hasClass('small');
    const isBold = $('#weight-checkbox').is(':checked') || $('.result-text, #result').hasClass('bold');
    const isItalics = $('.grid').hasClass('italics') || $('.board').hasClass('italics') || $('#style-checkbox').is(':checked');
    const textColor = $('#font-color-input').val() || '#2b1055';

    const gridOriginX = subGridPx; // 19.2px
    const gridOriginY = subGridPx * 2; // 38.4px

    const fontSizePx = (isSmall ? 37 : 72) * ptToPx;
    const lineHeightPx = (isSmall ? (subGridPx * 4) : (subGridPx * 8));
    const firstBaselineY = gridOriginY + 4 * subGridPx;

    const fontDefs = await exportEngine.buildSvgFontDefs();

    // 1. Grid Lines
    const majorColor = 'rgba(60, 75, 115, 0.9)';
    const minorColor = 'rgba(90, 115, 165, 0.7)';
    const gridLineWidthMajor = 1.4;
    const gridLineWidthMinor = 0.7;

    let linesSvg = '';
    for (let y = 0; y <= heightPx + 0.1; y += subGridPx) {
        const k = Math.round((y - gridOriginY) / subGridPx);
        const isMajor = (k % 4 === 0);
        linesSvg += `<line x1="0" y1="${y.toFixed(2)}" x2="${widthPx}" y2="${y.toFixed(2)}" stroke="${isMajor ? majorColor : minorColor}" stroke-width="${isMajor ? gridLineWidthMajor : gridLineWidthMinor}" />\n`;
    }

    const slantOffset = isItalics ? Math.tan(17 * Math.PI / 180) : 0;
    const xMax = widthPx + heightPx * slantOffset;
    const startX = (gridOriginX % subGridPx) - heightPx * slantOffset;

    for (let x = startX; x <= xMax; x += subGridPx) {
        const k = Math.round((x - gridOriginX) / subGridPx);
        const isMajor = (k % 4 === 0);
        linesSvg += `<line x1="${x.toFixed(2)}" y1="0" x2="${(x - heightPx * slantOffset).toFixed(2)}" y2="${heightPx}" stroke="${isMajor ? majorColor : minorColor}" stroke-width="${isMajor ? gridLineWidthMajor : gridLineWidthMinor}" />\n`;
    }

    // 2. Text & Dots
    const linesPerPage = isSmall ? 14 : 7;
    const $lines = $(boardEl).find('p.line');
    const pageTexts = [];

    let textSvg = '';
    let dottingSvg = '';

    $lines.each(function (lIdx) {
        const globalLineIdx = (pIdx * linesPerPage) + lIdx;
        const yPos = firstBaselineY + (lIdx * lineHeightPx);
        const $line = $(this);
        const words = [];
        $line.children('.word').each(function () {
            const wordEl = this;
            const wordText = $(wordEl).find('.word-text').text() || $(wordEl).text();
            const rawWord = $(wordEl).attr('data-raw') || '';
            const stretch = parseFloat($(wordEl).attr('data-stretch')) || 1.0;
            const weight = $(wordEl).attr('data-weight') || null;
            words.push({
                text: wordText,
                raw: rawWord,
                offsetLeft: wordEl.offsetLeft,
                offsetWidth: wordEl.offsetWidth,
                stretch: stretch,
                weight: weight
            });
        });

        if (words.length > 0) {
            pageTexts.push(words.map(w => w.raw || w.text).join(' '));
        }

        words.forEach(word => {
            const xPos = gridOriginX + word.offsetLeft;
            const wordIsBold = word.weight === 'bold' ? true : (word.weight === 'normal' ? false : isBold);
            const fontWeight = wordIsBold ? 'bold' : 'normal';
            const escaped = exportEngine.escapeXml(word.text);
            if (word.stretch && word.stretch !== 1.0) {
                textSvg += `<text x="0" y="0" transform="translate(${xPos.toFixed(2)}, ${yPos.toFixed(2)}) scale(${word.stretch.toFixed(4)}, 1)" font-family="HP001, sans-serif" font-size="${fontSizePx.toFixed(2)}px" font-weight="${fontWeight}" fill="${textColor}" dominant-baseline="alphabetic">${escaped}</text>\n`;
            } else {
                textSvg += `<text x="${xPos.toFixed(2)}" y="${yPos.toFixed(2)}" font-family="HP001, sans-serif" font-size="${fontSizePx.toFixed(2)}px" font-weight="${fontWeight}" fill="${textColor}" dominant-baseline="alphabetic">${escaped}</text>\n`;
            }
        });

        const srcLineIdx = parseInt($line.attr('data-source-line-idx'), 10);
        const validSrcIdx = !isNaN(srcLineIdx) ? srcLineIdx : globalLineIdx;
        const hasText = words.length > 0;
        const hasAnyText = ($('#input').val() || '').trim().length > 0;
        const lineDotConfig = exportEngine.getDottingConfig(validSrcIdx);
        if (lineDotConfig && lineDotConfig.enabled && hasAnyText) {
            let wordsToDraw = words;
            if (wordsToDraw.length === 0) {
                let $lineWithWords = $(`p.line[data-source-line-idx="${validSrcIdx}"][data-is-practice="false"]`).first();
                if (!$lineWithWords.length) {
                    $lineWithWords = $line.prevAll('p.line').filter(function () { return $(this).children('.word').length > 0; }).first();
                }
                if (!$lineWithWords.length) {
                    $lineWithWords = $('.board.white_11x14, .board.white_10x14').find('p.line').filter(function () { return $(this).children('.word').length > 0; }).first();
                }
                if ($lineWithWords.length) {
                    $lineWithWords.children('.word').each(function () {
                        wordsToDraw.push({
                            text: $(this).find('.word-text').text() || $(this).text(),
                            raw: $(this).attr('data-raw') || '',
                            offsetLeft: this.offsetLeft,
                            stretch: parseFloat($(this).attr('data-stretch')) || 1.0,
                            weight: $(this).attr('data-weight') || null
                        });
                    });
                }
            }
            let rawLineText = wordsToDraw.length > 0 ? (wordsToDraw[0].raw || wordsToDraw[0].text) : '';
            if (wordsToDraw.length === 0) {
                const rawLines = ($('#input').val() || '').split('\n').map(l => l.trim());
                const lineFromInput = rawLines[validSrcIdx] || rawLines.find(l => l.length > 0) || 'a';
                const tokens = lineFromInput.split(/\s+/).filter(w => w.length > 0);
                wordsToDraw = (tokens.length > 0 ? tokens : ['a']).map(w => ({
                    text: model.getUnicodeStr(w),
                    raw: w,
                    offsetLeft: 0,
                    stretch: 1.0
                }));
                rawLineText = wordsToDraw[0].raw;
            }
            const charUnit = model.getFirstCharUnit(rawLineText);
            const activeDotConfig = exportEngine.getActiveDotConfig(charUnit, validSrcIdx, 0);
            let hasDotConfigs = !!(activeDotConfig && activeDotConfig.dots && activeDotConfig.dots.length > 0);
            if (!hasDotConfigs && wordsToDraw.length > 1) {
                for (let wIdx = 1; wIdx < wordsToDraw.length; wIdx++) {
                    const wInfo = wordsToDraw[wIdx];
                    const wChar = model.getFirstCharUnit(wInfo.raw || wInfo.text);
                    const wDotCfg = exportEngine.getActiveDotConfig(wChar, validSrcIdx, wIdx);
                    if (wDotCfg && Array.isArray(wDotCfg.dots) && wDotCfg.dots.length > 0) {
                        hasDotConfigs = true;
                        break;
                    }
                }
            }
            const outlineInfo = exportEngine.parseOutlineOption(lineDotConfig.outline);

            const olyUnitPx = isSmall ? 9.6 : 19.2;
            const blockWidth = 76.8;
            const dotRadius = isSmall ? 1.25 : 1.75;

            const wordOffset = wordsToDraw.length > 0 ? wordsToDraw[0].offsetLeft : 0;
            const firstStretch = wordsToDraw.length > 0 && wordsToDraw[0].stretch ? wordsToDraw[0].stretch : 1.0;
            const baseWordX = gridOriginX + wordOffset;

            if (hasDotConfigs || outlineInfo.isEnabled) {
                for (let j = 0; j < lineDotConfig.repetitions; j++) {
                    if (hasText || lineDotConfig.fullDot || j === 0) {
                        const shiftX = j * blockWidth * lineDotConfig.spaces;

                        // A. Outline
                        if (outlineInfo.isEnabled && (!hasText || j > 0)) {
                            const isDotted = (outlineInfo.style === 'dotted');
                            const isFaint = (outlineInfo.style === 'faint');
                            const isCurve = (outlineInfo.style === 'curve');

                            const fontFam = isDotted ? 'HP001TD, serif' : 'HP001, serif';
                            const fillCol = isDotted ? 'rgba(43, 16, 85, 0.65)' : (isFaint ? 'rgba(43, 16, 85, 0.32)' : 'none');
                            const strokeAttr = isCurve ? `stroke="rgba(43, 16, 85, 0.42)" stroke-width="${isSmall ? 0.8 : 1.0}"` : '';

                            const drawSvgText = (str, x, y, strStretch, isBoldWord) => {
                                const esc = exportEngine.escapeXml(str);
                                const weightStr = isBoldWord ? 'bold' : 'normal';
                                if (strStretch && strStretch !== 1.0) {
                                    return `<text x="0" y="0" transform="translate(${x.toFixed(2)}, ${y.toFixed(2)}) scale(${strStretch.toFixed(4)}, 1)" font-family="${fontFam}" font-size="${fontSizePx.toFixed(2)}px" font-weight="${weightStr}" fill="${fillCol}" ${strokeAttr} dominant-baseline="alphabetic">${esc}</text>\n`;
                                }
                                return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-family="${fontFam}" font-size="${fontSizePx.toFixed(2)}px" font-weight="${weightStr}" fill="${fillCol}" ${strokeAttr} dominant-baseline="alphabetic">${esc}</text>\n`;
                            };

                            if (outlineInfo.scope === 'first') {
                                const xPos = baseWordX + shiftX;
                                const w0 = wordsToDraw[0];
                                const textToDraw = isDotted ? charUnit : model.getUnicodeStr(charUnit);
                                const word0Weight = w0 ? w0.weight : null;
                                const firstWordIsBold = !isDotted && (word0Weight === 'bold' ? true : (word0Weight === 'normal' ? false : isBold));
                                dottingSvg += drawSvgText(textToDraw, xPos, yPos, firstStretch, firstWordIsBold);
                            } else if (outlineInfo.scope === 'all') {
                                wordsToDraw.forEach(w => {
                                    const xPos = gridOriginX + w.offsetLeft + shiftX;
                                    const textToDraw = isDotted ? (w.raw || w.text) : (w.text || model.getUnicodeStr(w.raw));
                                    const wordIsBold = !isDotted && (w.weight === 'bold' ? true : (w.weight === 'normal' ? false : isBold));
                                    dottingSvg += drawSvgText(textToDraw, xPos, yPos, w.stretch || 1.0, wordIsBold);
                                });
                            }
                        }

                        // B. Dots
                        if (hasDotConfigs) {
                            if (wordsToDraw && wordsToDraw.length > 0) {
                                wordsToDraw.forEach((wInfo, wIdx) => {
                                    const wChar = model.getFirstCharUnit(wInfo.raw || wInfo.text);
                                    const wDotCfg = exportEngine.getActiveDotConfig(wChar, validSrcIdx, wIdx);
                                    if (wDotCfg && Array.isArray(wDotCfg.dots) && wDotCfg.dots.length > 0) {
                                        const wBaseX = gridOriginX + wInfo.offsetLeft;
                                        const wStretch = wInfo.stretch || 1.0;
                                        for (const dot of wDotCfg.dots) {
                                            const dotX = wBaseX + (dot.x * olyUnitPx * wStretch) + shiftX;
                                            const dotY = yPos - (dot.y * olyUnitPx);
                                            dottingSvg += `<circle cx="${dotX.toFixed(2)}" cy="${dotY.toFixed(2)}" r="${dotRadius}" fill="${lineDotConfig.color}" />\n`;
                                        }
                                    }
                                });
                            } else if (activeDotConfig && Array.isArray(activeDotConfig.dots) && activeDotConfig.dots.length > 0) {
                                for (const dot of activeDotConfig.dots) {
                                    const dotX = baseWordX + (dot.x * olyUnitPx * firstStretch) + shiftX;
                                    const dotY = yPos - (dot.y * olyUnitPx);
                                    dottingSvg += `<circle cx="${dotX.toFixed(2)}" cy="${dotY.toFixed(2)}" r="${dotRadius}" fill="${lineDotConfig.color}" />\n`;
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    const italicMatrix = `matrix(1 0 ${(-Math.tan(17 * Math.PI / 180)).toFixed(6)} 1 0 0)`;
    const textGroup = isItalics ? `<g transform="${italicMatrix}">\n${textSvg}\n${dottingSvg}\n</g>` : `${textSvg}\n${dottingSvg}`;

    const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}">
${fontDefs}
<rect width="${widthPx}" height="${heightPx}" fill="#ffffff" />
<g id="grid-lines">
${linesSvg}
</g>
<g id="text-layer">
${textGroup}
</g>
</svg>`;

    const firstText = pageTexts[0] || 'chu_dep';
    const pageSuffix = totalBoards > 1 ? `_p${pIdx + 1}` : '';
    const fileName = exportEngine.generateFileName('white_11x14' + pageSuffix, firstText, 'svg');

    return { svgString, fileName };
};

exportEngine.exportWhite11x14ToPng = async function (customScale) {
    const $boards = $('.board.white_11x14, .board.white_10x14');
    if (!$boards.length) return;

    if (document.fonts) {
        try {
            await Promise.all([
                document.fonts.load('16px HP001'),
                document.fonts.load('16px HP001TD'),
                document.fonts.ready
            ]);
        } catch (_) {}
    }

    for (let i = 0; i < $boards.length; i++) {
        const { canvas, fileName } = await exportEngine.renderWhite11x14PageToCanvas($boards[i], i, customScale, $boards.length);
        await exportEngine.downloadCanvasAsPng(canvas, fileName);
        if (i < $boards.length - 1) {
            await new Promise(r => setTimeout(r, 400));
        }
    }
};
exportEngine.exportWhite10x14ToPng = exportEngine.exportWhite11x14ToPng;

exportEngine.exportWhite11x14ToPdf = async function (customScale) {
    const $boards = $('.board.white_11x14, .board.white_10x14');
    if (!$boards.length) return;

    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('Thư viện jsPDF chưa tải xong. Vui lòng thử lại sau giây lát!');
        return;
    }

    if (document.fonts) {
        try {
            await Promise.all([
                document.fonts.load('16px HP001'),
                document.fonts.load('16px HP001TD'),
                document.fonts.ready
            ]);
        } catch (_) {}
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
    });

    const targetW = 200;
    const targetH = targetW / (883.2 / 1152);
    const offsetX = (210 - targetW) / 2;
    const offsetY = (297 - targetH) / 2;

    let baseFileName = '';

    for (let i = 0; i < $boards.length; i++) {
        if (i > 0) {
            pdf.addPage('a4', 'portrait');
        }
        const { canvas, firstText } = await exportEngine.renderWhite11x14PageToCanvas($boards[i], i, customScale, $boards.length);
        if (!baseFileName) {
            baseFileName = exportEngine.generateFileName('white_11x14', firstText, 'pdf');
        }
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', offsetX, offsetY, targetW, targetH, undefined, 'FAST');
    }

    pdf.save(baseFileName || 'white_11x14.pdf');
};
exportEngine.exportWhite10x14ToPdf = exportEngine.exportWhite11x14ToPdf;

exportEngine.exportWhite11x14ToSvg = async function () {
    const $boards = $('.board.white_11x14, .board.white_10x14');
    if (!$boards.length) return;

    if (document.fonts) {
        try {
            await Promise.all([
                document.fonts.load('16px HP001'),
                document.fonts.load('16px HP001TD'),
                document.fonts.ready
            ]);
        } catch (_) {}
    }

    for (let i = 0; i < $boards.length; i++) {
        const { svgString, fileName } = await exportEngine.renderWhite11x14PageToSvg($boards[i], i, $boards.length);
        await exportEngine.downloadSvg(svgString, fileName);
        if (i < $boards.length - 1) {
            await new Promise(r => setTimeout(r, 400));
        }
    }
};
exportEngine.exportWhite10x14ToSvg = exportEngine.exportWhite11x14ToSvg;

/* ==========================================================================
   WHITE 14x20 EXPORT (PNG, PDF, SVG)
   ========================================================================== */

exportEngine.renderWhite14x20PageToCanvas = async function (boardEl, pIdx, customScale, totalBoards) {
    let scale = customScale || exportEngine.getExportScale();
    const ptToPx = 96 / 72;
    const subGridPx = 14.4 * ptToPx; // 19.2px

    const widthPx = 1113.6;
    const heightPx = 1612.8;
    const isMobile = exportEngine.isMobileDevice();
    const maxCanvasDim = isMobile ? 8192 : 16384;
    const maxCanvasArea = isMobile ? 25000000 : 100000000;
    if (widthPx * scale > maxCanvasDim || heightPx * scale > maxCanvasDim || (widthPx * scale * heightPx * scale) > maxCanvasArea) {
        const scaleDim = maxCanvasDim / Math.max(widthPx, heightPx);
        const scaleArea = Math.sqrt(maxCanvasArea / (widthPx * heightPx));
        scale = Math.max(1, Math.min(scale, Math.floor(Math.min(scaleDim, scaleArea) * 10) / 10));
    }
    const canvasWidth = Math.round(widthPx * scale);
    const canvasHeight = Math.round(heightPx * scale);

    const isSmall = $('#font-size-select').val() === '37' || $('#font-size-select').val() === '36' || $('.board.white_14x20 .result-text, #result').hasClass('small');
    const isBold = $('#weight-checkbox').is(':checked') || $('.result-text, #result').hasClass('bold');
    const isItalics = $('.grid').hasClass('italics') || $('.board').hasClass('italics') || $('#style-checkbox').is(':checked');
    const textColor = $('#font-color-input').val() || '#2b1055';

    const gridOriginX = subGridPx; // 19.2px
    const gridOriginY = subGridPx * 2; // 38.4px

    const fontSizePx = (isSmall ? 37 : 72) * ptToPx;
    const lineHeightPx = (isSmall ? (subGridPx * 4) : (subGridPx * 8));
    const firstBaselineY = gridOriginY + 4 * subGridPx;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // 1. Draw Paper Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, widthPx, heightPx);

    // 2. Draw Grid Lines
    const majorColor = 'rgba(60, 75, 115, 0.9)';
    const minorColor = 'rgba(90, 115, 165, 0.7)';
    const gridLineWidthMajor = 1.82;
    const gridLineWidthMinor = 0.91;

    for (let y = 0; y <= heightPx + 0.1; y += subGridPx) {
        const k = Math.round((y - gridOriginY) / subGridPx);
        const isMajor = (k % 4 === 0);
        ctx.beginPath();
        ctx.strokeStyle = isMajor ? majorColor : minorColor;
        ctx.lineWidth = isMajor ? gridLineWidthMajor : gridLineWidthMinor;
        ctx.moveTo(0, y);
        ctx.lineTo(widthPx, y);
        ctx.stroke();
    }

    const slantOffset = isItalics ? Math.tan(17 * Math.PI / 180) : 0;
    const xMin = -heightPx * slantOffset;
    const xMax = widthPx + heightPx * slantOffset;
    const startX = (gridOriginX % subGridPx) - heightPx * slantOffset;

    for (let x = startX; x <= xMax; x += subGridPx) {
        const k = Math.round((x - gridOriginX) / subGridPx);
        const isMajor = (k % 4 === 0);
        ctx.beginPath();
        ctx.strokeStyle = isMajor ? majorColor : minorColor;
        ctx.lineWidth = isMajor ? gridLineWidthMajor : gridLineWidthMinor;
        ctx.moveTo(x, 0);
        ctx.lineTo(x - heightPx * slantOffset, heightPx);
        ctx.stroke();
    }

    // 3. Draw Text
    ctx.save();
    if (isItalics) {
        ctx.transform(1, 0, -Math.tan(17 * Math.PI / 180), 1, 0, 0);
    }

    ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'alphabetic';

    const linesPerPage = isSmall ? 20 : 10;
    const $lines = $(boardEl).find('p.line');
    const pageTexts = [];

    $lines.each(function (lIdx) {
        const globalLineIdx = (pIdx * linesPerPage) + lIdx;
        const yPos = firstBaselineY + (lIdx * lineHeightPx);
        const $line = $(this);
        const words = [];
        $line.children('.word').each(function () {
            const wordEl = this;
            const wordText = $(wordEl).find('.word-text').text() || $(wordEl).text();
            const rawWord = $(wordEl).attr('data-raw') || '';
            const stretch = parseFloat($(wordEl).attr('data-stretch')) || 1.0;
            const weight = $(wordEl).attr('data-weight') || null;
            words.push({
                text: wordText,
                raw: rawWord,
                offsetLeft: wordEl.offsetLeft,
                offsetWidth: wordEl.offsetWidth,
                stretch: stretch,
                weight: weight
            });
        });

        if (words.length > 0) {
            pageTexts.push(words.map(w => w.raw || w.text).join(' '));
        }

        ctx.fillStyle = textColor;
        words.forEach(word => {
            const xPos = gridOriginX + word.offsetLeft;
            const wordIsBold = word.weight === 'bold' ? true : (word.weight === 'normal' ? false : isBold);
            ctx.font = `${wordIsBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, sans-serif`;
            if (word.stretch && word.stretch !== 1.0) {
                ctx.save();
                ctx.translate(xPos, yPos);
                ctx.scale(word.stretch, 1.0);
                ctx.fillStyle = textColor;
                ctx.fillText(word.text, 0, 0);
                ctx.restore();
            } else {
                ctx.fillStyle = textColor;
                ctx.fillText(word.text, xPos, yPos);
            }
        });

        const srcLineIdx = parseInt($line.attr('data-source-line-idx'), 10);
        const validSrcIdx = !isNaN(srcLineIdx) ? srcLineIdx : globalLineIdx;
        const hasText = words.length > 0;
        const hasAnyText = ($('#input').val() || '').trim().length > 0;
        const lineDotConfig = exportEngine.getDottingConfig(validSrcIdx);
        if (lineDotConfig && lineDotConfig.enabled && hasAnyText) {
            let wordsToDraw = words;
            if (wordsToDraw.length === 0) {
                let $lineWithWords = $(`p.line[data-source-line-idx="${validSrcIdx}"][data-is-practice="false"]`).first();
                if (!$lineWithWords.length) {
                    $lineWithWords = $line.prevAll('p.line').filter(function () { return $(this).children('.word').length > 0; }).first();
                }
                if (!$lineWithWords.length) {
                    $lineWithWords = $('.board.white_14x20').find('p.line').filter(function () { return $(this).children('.word').length > 0; }).first();
                }
                if ($lineWithWords.length) {
                    $lineWithWords.children('.word').each(function () {
                        wordsToDraw.push({
                            text: $(this).find('.word-text').text() || $(this).text(),
                            raw: $(this).attr('data-raw') || '',
                            offsetLeft: this.offsetLeft,
                            stretch: parseFloat($(this).attr('data-stretch')) || 1.0,
                            weight: $(this).attr('data-weight') || null
                        });
                    });
                }
            }
            let rawLineText = wordsToDraw.length > 0 ? (wordsToDraw[0].raw || wordsToDraw[0].text) : '';
            if (wordsToDraw.length === 0) {
                const rawLines = ($('#input').val() || '').split('\n').map(l => l.trim());
                const lineFromInput = rawLines[validSrcIdx] || rawLines.find(l => l.length > 0) || 'a';
                const tokens = lineFromInput.split(/\s+/).filter(w => w.length > 0);
                wordsToDraw = (tokens.length > 0 ? tokens : ['a']).map(w => ({
                    text: model.getUnicodeStr(w),
                    raw: w,
                    offsetLeft: 0,
                    stretch: 1.0
                }));
                rawLineText = wordsToDraw[0].raw;
            }
            const charUnit = model.getFirstCharUnit(rawLineText);
            const activeDotConfig = exportEngine.getActiveDotConfig(charUnit, validSrcIdx, 0);
            let hasDotConfigs = !!(activeDotConfig && activeDotConfig.dots && activeDotConfig.dots.length > 0);
            if (!hasDotConfigs && wordsToDraw.length > 1) {
                for (let wIdx = 1; wIdx < wordsToDraw.length; wIdx++) {
                    const wInfo = wordsToDraw[wIdx];
                    const wChar = model.getFirstCharUnit(wInfo.raw || wInfo.text);
                    const wDotCfg = exportEngine.getActiveDotConfig(wChar, validSrcIdx, wIdx);
                    if (wDotCfg && Array.isArray(wDotCfg.dots) && wDotCfg.dots.length > 0) {
                        hasDotConfigs = true;
                        break;
                    }
                }
            }
            const outlineInfo = exportEngine.parseOutlineOption(lineDotConfig.outline);

            const olyUnitPx = isSmall ? 9.6 : 19.2;
            const blockWidth = 76.8;
            const dotRadius = isSmall ? 1.25 : 1.75;

            const wordOffset = wordsToDraw.length > 0 ? wordsToDraw[0].offsetLeft : 0;
            const firstStretch = wordsToDraw.length > 0 && wordsToDraw[0].stretch ? wordsToDraw[0].stretch : 1.0;
            const baseWordX = gridOriginX + wordOffset;

            if (hasDotConfigs || outlineInfo.isEnabled) {
                for (let j = 0; j < lineDotConfig.repetitions; j++) {
                    if (hasText || lineDotConfig.fullDot || j === 0) {
                        const shiftX = j * blockWidth * lineDotConfig.spaces;

                        // A. Outline copies
                        if (outlineInfo.isEnabled) {
                            const isCopy = (!hasText || j > 0);
                            if (isCopy) {
                                ctx.save();
                                ctx.textBaseline = 'alphabetic';
                                const isDotted = (outlineInfo.style === 'dotted');
                                const isFaint = (outlineInfo.style === 'faint');
                                const isCurve = (outlineInfo.style === 'curve');

                                if (isDotted) {
                                    ctx.font = `normal ${fontSizePx}px HP001TD, serif`;
                                    ctx.fillStyle = 'rgba(43, 16, 85, 0.65)';
                                } else if (isFaint) {
                                    ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, serif`;
                                    ctx.fillStyle = 'rgba(43, 16, 85, 0.32)';
                                } else {
                                    ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, serif`;
                                    ctx.strokeStyle = 'rgba(43, 16, 85, 0.42)';
                                    ctx.lineWidth = isSmall ? 0.8 : 1.0;
                                }

                                const drawText = (str, x, y, strStretch) => {
                                    if (strStretch && strStretch !== 1.0) {
                                        ctx.save();
                                        ctx.translate(x, y);
                                        ctx.scale(strStretch, 1.0);
                                        if (isCurve) {
                                            ctx.strokeText(str, 0, 0);
                                        } else {
                                            ctx.fillText(str, 0, 0);
                                        }
                                        ctx.restore();
                                    } else {
                                        if (isCurve) {
                                            ctx.strokeText(str, x, y);
                                        } else {
                                            ctx.fillText(str, x, y);
                                        }
                                    }
                                };

                                if (outlineInfo.scope === 'first') {
                                    const xPos = baseWordX + shiftX;
                                    const w0 = wordsToDraw[0];
                                    const textToDraw = isDotted ? charUnit : model.getUnicodeStr(charUnit);
                                    if (!isDotted) {
                                        const word0Weight = w0 ? w0.weight : null;
                                        const firstWordIsBold = word0Weight === 'bold' ? true : (word0Weight === 'normal' ? false : isBold);
                                        ctx.font = `${firstWordIsBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, serif`;
                                    }
                                    drawText(textToDraw, xPos, yPos, firstStretch);
                                } else if (outlineInfo.scope === 'all') {
                                    wordsToDraw.forEach(w => {
                                        const xPos = gridOriginX + w.offsetLeft + shiftX;
                                        const textToDraw = isDotted ? (w.raw || w.text) : (w.text || model.getUnicodeStr(w.raw));
                                        if (!isDotted) {
                                            const wordIsBold = w.weight === 'bold' ? true : (wordIsBold === 'normal' ? false : isBold);
                                            ctx.font = `${wordIsBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, serif`;
                                        }
                                        drawText(textToDraw, xPos, yPos, w.stretch || 1.0);
                                    });
                                }
                                ctx.restore();
                            }
                        }

                        // B. Guide dots
                        if (hasDotConfigs) {
                            if (wordsToDraw && wordsToDraw.length > 0) {
                                wordsToDraw.forEach((wInfo, wIdx) => {
                                    const wChar = model.getFirstCharUnit(wInfo.raw || wInfo.text);
                                    const wDotCfg = exportEngine.getActiveDotConfig(wChar, validSrcIdx, wIdx);
                                    if (wDotCfg && Array.isArray(wDotCfg.dots) && wDotCfg.dots.length > 0) {
                                        const wBaseX = gridOriginX + wInfo.offsetLeft;
                                        const wStretch = wInfo.stretch || 1.0;
                                        for (const dot of wDotCfg.dots) {
                                            const dotX = wBaseX + (dot.x * olyUnitPx * wStretch) + shiftX;
                                            const dotY = yPos - (dot.y * olyUnitPx);
                                            ctx.beginPath();
                                            ctx.fillStyle = lineDotConfig.color;
                                            ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
                                            ctx.fill();
                                        }
                                    }
                                });
                            } else if (activeDotConfig && Array.isArray(activeDotConfig.dots) && activeDotConfig.dots.length > 0) {
                                for (const dot of activeDotConfig.dots) {
                                    const dotX = baseWordX + (dot.x * olyUnitPx * firstStretch) + shiftX;
                                    const dotY = yPos - (dot.y * olyUnitPx);
                                    ctx.beginPath();
                                    ctx.fillStyle = lineDotConfig.color;
                                    ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
                                    ctx.fill();
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    ctx.restore();

    const firstText = pageTexts[0] || 'chu_dep';
    const pageSuffix = totalBoards > 1 ? `_p${pIdx + 1}` : '';
    const fileName = exportEngine.generateFileName('white_14x20' + pageSuffix, firstText, 'png');

    return { canvas, fileName, firstText };
};

exportEngine.renderWhite14x20PageToSvg = async function (boardEl, pIdx, totalBoards) {
    const ptToPx = 96 / 72;
    const subGridPx = 14.4 * ptToPx; // 19.2px

    const widthPx = 1113.6;
    const heightPx = 1612.8;

    const isSmall = $('#font-size-select').val() === '37' || $('#font-size-select').val() === '36' || $('.board.white_14x20 .result-text, #result').hasClass('small');
    const isBold = $('#weight-checkbox').is(':checked') || $('.result-text, #result').hasClass('bold');
    const isItalics = $('.grid').hasClass('italics') || $('.board').hasClass('italics') || $('#style-checkbox').is(':checked');
    const textColor = $('#font-color-input').val() || '#2b1055';

    const gridOriginX = subGridPx; // 19.2px
    const gridOriginY = subGridPx * 2; // 38.4px

    const fontSizePx = (isSmall ? 37 : 72) * ptToPx;
    const lineHeightPx = (isSmall ? (subGridPx * 4) : (subGridPx * 8));
    const firstBaselineY = gridOriginY + 4 * subGridPx;

    const fontDefs = await exportEngine.buildSvgFontDefs();

    // 1. Grid Lines
    const majorColor = 'rgba(60, 75, 115, 0.9)';
    const minorColor = 'rgba(90, 115, 165, 0.7)';
    const gridLineWidthMajor = 1.82;
    const gridLineWidthMinor = 0.91;

    let linesSvg = '';
    for (let y = 0; y <= heightPx + 0.1; y += subGridPx) {
        const k = Math.round((y - gridOriginY) / subGridPx);
        const isMajor = (k % 4 === 0);
        linesSvg += `<line x1="0" y1="${y.toFixed(2)}" x2="${widthPx}" y2="${y.toFixed(2)}" stroke="${isMajor ? majorColor : minorColor}" stroke-width="${isMajor ? gridLineWidthMajor : gridLineWidthMinor}" />\n`;
    }

    const slantOffset = isItalics ? Math.tan(17 * Math.PI / 180) : 0;
    const xMax = widthPx + heightPx * slantOffset;
    const startX = (gridOriginX % subGridPx) - heightPx * slantOffset;

    for (let x = startX; x <= xMax; x += subGridPx) {
        const k = Math.round((x - gridOriginX) / subGridPx);
        const isMajor = (k % 4 === 0);
        linesSvg += `<line x1="${x.toFixed(2)}" y1="0" x2="${(x - heightPx * slantOffset).toFixed(2)}" y2="${heightPx}" stroke="${isMajor ? majorColor : minorColor}" stroke-width="${isMajor ? gridLineWidthMajor : gridLineWidthMinor}" />\n`;
    }

    // 2. Text & Dots
    const linesPerPage = isSmall ? 20 : 10;
    const $lines = $(boardEl).find('p.line');
    const pageTexts = [];

    let textSvg = '';
    let dottingSvg = '';

    $lines.each(function (lIdx) {
        const globalLineIdx = (pIdx * linesPerPage) + lIdx;
        const yPos = firstBaselineY + (lIdx * lineHeightPx);
        const $line = $(this);
        const words = [];
        $line.children('.word').each(function () {
            const wordEl = this;
            const wordText = $(wordEl).find('.word-text').text() || $(wordEl).text();
            const rawWord = $(wordEl).attr('data-raw') || '';
            const stretch = parseFloat($(wordEl).attr('data-stretch')) || 1.0;
            const weight = $(wordEl).attr('data-weight') || null;
            words.push({
                text: wordText,
                raw: rawWord,
                offsetLeft: wordEl.offsetLeft,
                offsetWidth: wordEl.offsetWidth,
                stretch: stretch,
                weight: weight
            });
        });

        if (words.length > 0) {
            pageTexts.push(words.map(w => w.raw || w.text).join(' '));
        }

        words.forEach(word => {
            const xPos = gridOriginX + word.offsetLeft;
            const wordIsBold = word.weight === 'bold' ? true : (word.weight === 'normal' ? false : isBold);
            const fontWeight = wordIsBold ? 'bold' : 'normal';
            const escaped = exportEngine.escapeXml(word.text);
            if (word.stretch && word.stretch !== 1.0) {
                textSvg += `<text x="0" y="0" transform="translate(${xPos.toFixed(2)}, ${yPos.toFixed(2)}) scale(${word.stretch.toFixed(4)}, 1)" font-family="HP001, sans-serif" font-size="${fontSizePx.toFixed(2)}px" font-weight="${fontWeight}" fill="${textColor}" dominant-baseline="alphabetic">${escaped}</text>\n`;
            } else {
                textSvg += `<text x="${xPos.toFixed(2)}" y="${yPos.toFixed(2)}" font-family="HP001, sans-serif" font-size="${fontSizePx.toFixed(2)}px" font-weight="${fontWeight}" fill="${textColor}" dominant-baseline="alphabetic">${escaped}</text>\n`;
            }
        });

        const srcLineIdx = parseInt($line.attr('data-source-line-idx'), 10);
        const validSrcIdx = !isNaN(srcLineIdx) ? srcLineIdx : globalLineIdx;
        const hasText = words.length > 0;
        const hasAnyText = ($('#input').val() || '').trim().length > 0;
        const lineDotConfig = exportEngine.getDottingConfig(validSrcIdx);
        if (lineDotConfig && lineDotConfig.enabled && hasAnyText) {
            let wordsToDraw = words;
            if (wordsToDraw.length === 0) {
                let $lineWithWords = $(`p.line[data-source-line-idx="${validSrcIdx}"][data-is-practice="false"]`).first();
                if (!$lineWithWords.length) {
                    $lineWithWords = $line.prevAll('p.line').filter(function () { return $(this).children('.word').length > 0; }).first();
                }
                if (!$lineWithWords.length) {
                    $lineWithWords = $('.board.white_14x20').find('p.line').filter(function () { return $(this).children('.word').length > 0; }).first();
                }
                if ($lineWithWords.length) {
                    $lineWithWords.children('.word').each(function () {
                        wordsToDraw.push({
                            text: $(this).find('.word-text').text() || $(this).text(),
                            raw: $(this).attr('data-raw') || '',
                            offsetLeft: this.offsetLeft,
                            stretch: parseFloat($(this).attr('data-stretch')) || 1.0,
                            weight: $(this).attr('data-weight') || null
                        });
                    });
                }
            }
            let rawLineText = wordsToDraw.length > 0 ? (wordsToDraw[0].raw || wordsToDraw[0].text) : '';
            if (wordsToDraw.length === 0) {
                const rawLines = ($('#input').val() || '').split('\n').map(l => l.trim());
                const lineFromInput = rawLines[validSrcIdx] || rawLines.find(l => l.length > 0) || 'a';
                const tokens = lineFromInput.split(/\s+/).filter(w => w.length > 0);
                wordsToDraw = (tokens.length > 0 ? tokens : ['a']).map(w => ({
                    text: model.getUnicodeStr(w),
                    raw: w,
                    offsetLeft: 0,
                    stretch: 1.0
                }));
                rawLineText = wordsToDraw[0].raw;
            }
            const charUnit = model.getFirstCharUnit(rawLineText);
            const activeDotConfig = exportEngine.getActiveDotConfig(charUnit, validSrcIdx, 0);
            let hasDotConfigs = !!(activeDotConfig && activeDotConfig.dots && activeDotConfig.dots.length > 0);
            if (!hasDotConfigs && wordsToDraw.length > 1) {
                for (let wIdx = 1; wIdx < wordsToDraw.length; wIdx++) {
                    const wInfo = wordsToDraw[wIdx];
                    const wChar = model.getFirstCharUnit(wInfo.raw || wInfo.text);
                    const wDotCfg = exportEngine.getActiveDotConfig(wChar, validSrcIdx, wIdx);
                    if (wDotCfg && Array.isArray(wDotCfg.dots) && wDotCfg.dots.length > 0) {
                        hasDotConfigs = true;
                        break;
                    }
                }
            }
            const outlineInfo = exportEngine.parseOutlineOption(lineDotConfig.outline);

            const olyUnitPx = isSmall ? 9.6 : 19.2;
            const blockWidth = 76.8;
            const dotRadius = isSmall ? 1.25 : 1.75;

            const wordOffset = wordsToDraw.length > 0 ? wordsToDraw[0].offsetLeft : 0;
            const firstStretch = wordsToDraw.length > 0 && wordsToDraw[0].stretch ? wordsToDraw[0].stretch : 1.0;
            const baseWordX = gridOriginX + wordOffset;

            if (hasDotConfigs || outlineInfo.isEnabled) {
                for (let j = 0; j < lineDotConfig.repetitions; j++) {
                    if (hasText || lineDotConfig.fullDot || j === 0) {
                        const shiftX = j * blockWidth * lineDotConfig.spaces;

                        // A. Outline copies
                        if (outlineInfo.isEnabled) {
                            const isCopy = (!hasText || j > 0);
                            if (isCopy) {
                                const isDotted = (outlineInfo.style === 'dotted');
                                const isFaint = (outlineInfo.style === 'faint');
                                const isCurve = (outlineInfo.style === 'curve');

                                let fillAttr = 'fill="rgba(43, 16, 85, 0.32)"';
                                let strokeAttr = '';
                                let fontFam = 'HP001, serif';

                                if (isDotted) {
                                    fontFam = 'HP001TD, serif';
                                    fillAttr = 'fill="rgba(43, 16, 85, 0.65)"';
                                } else if (isFaint) {
                                    fontFam = 'HP001, serif';
                                    fillAttr = 'fill="rgba(43, 16, 85, 0.32)"';
                                } else {
                                    fontFam = 'HP001, serif';
                                    fillAttr = 'fill="none"';
                                    strokeAttr = `stroke="rgba(43, 16, 85, 0.42)" stroke-width="${isSmall ? '0.8' : '1.0'}"`;
                                }

                                if (outlineInfo.scope === 'first') {
                                    const xPos = baseWordX + shiftX;
                                    const w0 = wordsToDraw[0];
                                    const textToDraw = isDotted ? charUnit : model.getUnicodeStr(charUnit);
                                    const escapedText = exportEngine.escapeXml(textToDraw);
                                    const word0Weight = w0 ? w0.weight : null;
                                    const firstWordIsBold = word0Weight === 'bold' ? true : (word0Weight === 'normal' ? false : isBold);
                                    const weightAttr = (!isDotted && firstWordIsBold) ? 'bold' : 'normal';

                                    if (firstStretch && firstStretch !== 1.0) {
                                        dottingSvg += `<text x="0" y="0" transform="translate(${xPos.toFixed(2)}, ${yPos.toFixed(2)}) scale(${firstStretch.toFixed(4)}, 1)" font-family="${fontFam}" font-size="${fontSizePx.toFixed(2)}px" font-weight="${weightAttr}" ${fillAttr} ${strokeAttr} dominant-baseline="alphabetic">${escapedText}</text>\n`;
                                    } else {
                                        dottingSvg += `<text x="${xPos.toFixed(2)}" y="${yPos.toFixed(2)}" font-family="${fontFam}" font-size="${fontSizePx.toFixed(2)}px" font-weight="${weightAttr}" ${fillAttr} ${strokeAttr} dominant-baseline="alphabetic">${escapedText}</text>\n`;
                                    }
                                } else if (outlineInfo.scope === 'all') {
                                    wordsToDraw.forEach(w => {
                                        const xPos = gridOriginX + w.offsetLeft + shiftX;
                                        const textToDraw = isDotted ? (w.raw || w.text) : (w.text || model.getUnicodeStr(w.raw));
                                        const escapedText = exportEngine.escapeXml(textToDraw);
                                        const wordIsBold = w.weight === 'bold' ? true : (wordIsBold === 'normal' ? false : isBold);
                                        const weightAttr = (!isDotted && wordIsBold) ? 'bold' : 'normal';

                                        if (w.stretch && w.stretch !== 1.0) {
                                            dottingSvg += `<text x="0" y="0" transform="translate(${xPos.toFixed(2)}, ${yPos.toFixed(2)}) scale(${w.stretch.toFixed(4)}, 1)" font-family="${fontFam}" font-size="${fontSizePx.toFixed(2)}px" font-weight="${weightAttr}" ${fillAttr} ${strokeAttr} dominant-baseline="alphabetic">${escapedText}</text>\n`;
                                        } else {
                                            dottingSvg += `<text x="${xPos.toFixed(2)}" y="${yPos.toFixed(2)}" font-family="${fontFam}" font-size="${fontSizePx.toFixed(2)}px" font-weight="${weightAttr}" ${fillAttr} ${strokeAttr} dominant-baseline="alphabetic">${escapedText}</text>\n`;
                                        }
                                    });
                                }
                            }
                        }

                        // B. Guide dots
                        if (hasDotConfigs) {
                            if (wordsToDraw && wordsToDraw.length > 0) {
                                wordsToDraw.forEach((wInfo, wIdx) => {
                                    const wChar = model.getFirstCharUnit(wInfo.raw || wInfo.text);
                                    const wDotCfg = exportEngine.getActiveDotConfig(wChar, validSrcIdx, wIdx);
                                    if (wDotCfg && Array.isArray(wDotCfg.dots) && wDotCfg.dots.length > 0) {
                                        const wBaseX = gridOriginX + wInfo.offsetLeft;
                                        const wStretch = wInfo.stretch || 1.0;
                                        for (const dot of wDotCfg.dots) {
                                            const dotX = wBaseX + (dot.x * olyUnitPx * wStretch) + shiftX;
                                            const dotY = yPos - (dot.y * olyUnitPx);
                                            dottingSvg += `<circle cx="${dotX.toFixed(2)}" cy="${dotY.toFixed(2)}" r="${dotRadius}" fill="${lineDotConfig.color}" />\n`;
                                        }
                                    }
                                });
                            } else if (activeDotConfig && Array.isArray(activeDotConfig.dots) && activeDotConfig.dots.length > 0) {
                                for (const dot of activeDotConfig.dots) {
                                    const dotX = baseWordX + (dot.x * olyUnitPx * firstStretch) + shiftX;
                                    const dotY = yPos - (dot.y * olyUnitPx);
                                    dottingSvg += `<circle cx="${dotX.toFixed(2)}" cy="${dotY.toFixed(2)}" r="${dotRadius}" fill="${lineDotConfig.color}" />\n`;
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    const slantTransform = isItalics ? `transform="skewX(-17)"` : '';

    const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${widthPx} ${heightPx}" width="${widthPx}" height="${heightPx}">
<defs>
${fontDefs}
</defs>
<rect width="${widthPx}" height="${heightPx}" fill="#ffffff" />
<g id="grid-layer">
${linesSvg}
</g>
<g id="text-layer" ${slantTransform}>
${textSvg}
${dottingSvg}
</g>
</svg>`;

    const firstText = pageTexts[0] || 'chu_dep';
    const pageSuffix = totalBoards > 1 ? `_p${pIdx + 1}` : '';
    const fileName = exportEngine.generateFileName('white_14x20' + pageSuffix, firstText, 'svg');

    return { svgString, fileName };
};

exportEngine.exportWhite14x20ToPng = async function (customScale) {
    const $boards = $('.board.white_14x20');
    if (!$boards.length) return;

    if (document.fonts) {
        try {
            await Promise.all([
                document.fonts.load('16px HP001'),
                document.fonts.load('16px HP001TD'),
                document.fonts.ready
            ]);
        } catch (_) {}
    }

    for (let i = 0; i < $boards.length; i++) {
        const { canvas, fileName } = await exportEngine.renderWhite14x20PageToCanvas($boards[i], i, customScale, $boards.length);
        await exportEngine.downloadCanvasAsPng(canvas, fileName);
        if (i < $boards.length - 1) {
            await new Promise(r => setTimeout(r, 400));
        }
    }
};

exportEngine.exportWhite14x20ToPdf = async function (customScale) {
    const $boards = $('.board.white_14x20');
    if (!$boards.length) return;

    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('Thư viện jsPDF chưa tải xong. Vui lòng thử lại sau giây lát!');
        return;
    }

    if (document.fonts) {
        try {
            await Promise.all([
                document.fonts.load('16px HP001'),
                document.fonts.load('16px HP001TD'),
                document.fonts.ready
            ]);
        } catch (_) {}
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
    });

    const targetW = 200;
    const targetH = targetW / (1113.6 / 1612.8);
    const offsetX = (210 - targetW) / 2;
    const offsetY = (297 - targetH) / 2;

    let baseFileName = '';

    for (let i = 0; i < $boards.length; i++) {
        if (i > 0) {
            pdf.addPage('a4', 'portrait');
        }
        const { canvas, firstText } = await exportEngine.renderWhite14x20PageToCanvas($boards[i], i, customScale, $boards.length);
        if (!baseFileName) {
            baseFileName = exportEngine.generateFileName('white_14x20', firstText, 'pdf');
        }
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', offsetX, offsetY, targetW, targetH, undefined, 'FAST');
    }

    pdf.save(baseFileName || 'white_14x20.pdf');
};

exportEngine.exportWhite14x20ToSvg = async function () {
    const $boards = $('.board.white_14x20');
    if (!$boards.length) return;

    if (document.fonts) {
        try {
            await Promise.all([
                document.fonts.load('16px HP001'),
                document.fonts.load('16px HP001TD'),
                document.fonts.ready
            ]);
        } catch (_) {}
    }

    for (let i = 0; i < $boards.length; i++) {
        const { svgString, fileName } = await exportEngine.renderWhite14x20PageToSvg($boards[i], i, $boards.length);
        await exportEngine.downloadSvg(svgString, fileName);
        if (i < $boards.length - 1) {
            await new Promise(r => setTimeout(r, 400));
        }
    }
};

/* ==========================================================================
   STANDARD INFINITE BOARD EXPORT (PNG, PDF, SVG)
   ========================================================================== */

exportEngine.renderStandardBoardToCanvas = async function (customScale) {
    const $result = $('#result');
    const isSmall = $result.hasClass('small');
    const isBold = $result.hasClass('bold');
    const isItalics = $('.grid').hasClass('italics');
    const isWhiteBoard = $('.board').hasClass('white');
    const textColor = $result.css('color') || (isWhiteBoard ? '#2b1055' : '#ffffff');

    const lines = [];
    $result.children('p.line').each(function () {
        const $line = $(this);
        const lineWords = [];
        $line.children('.word').each(function () {
            const wordEl = this;
            const wordText = $(wordEl).find('.word-text').text() || $(wordEl).text();
            const rawWord = $(wordEl).attr('data-raw') || '';
            const stretch = parseFloat($(wordEl).attr('data-stretch')) || 1.0;
            const weight = $(wordEl).attr('data-weight') || null;
            lineWords.push({
                text: wordText,
                raw: rawWord,
                offsetLeft: wordEl.offsetLeft,
                offsetWidth: wordEl.offsetWidth,
                stretch: stretch,
                weight: weight
            });
        });
        lines.push({
            words: lineWords
        });
    });

    const hasAnyText = ($('#input').val() || '').trim().length > 0;
    const dotConfig = hasAnyText ? exportEngine.getDottingConfig() : null;
    if (lines.length === 0 || !hasAnyText) {
        throw new Error("Chưa có nội dung để xuất ảnh!");
    }

    let scale = customScale || exportEngine.getExportScale();
    const ptToPx = 96 / 72;
    const subGridPx = 14.4 * ptToPx;
    const bigGridPx = subGridPx * 4;

    const fontSizePx = (isSmall ? 37 : 72) * ptToPx;
    const lineHeightPx = (isSmall ? 4 : 8) * subGridPx;

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    measureCtx.font = `${isBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, sans-serif`;

    let maxLineRight = 0;
    lines.forEach(l => {
        l.words.forEach(w => {
            const textW = Math.max(w.offsetWidth, measureCtx.measureText(w.text).width);
            const wordRight = subGridPx + w.offsetLeft + textW;
            if (wordRight > maxLineRight) {
                maxLineRight = wordRight;
            }
        });
    });

    if (dotConfig && dotConfig.enabled) {
        const totalLinesCount = Math.max(lines.length, dotConfig.linesCount || 0);
        for (let idx = 0; idx < totalLinesCount; idx++) {
            const lineCfg = exportEngine.getDottingConfig(idx);
            const maxDotsRight = subGridPx + (lineCfg.repetitions * bigGridPx * lineCfg.spaces);
            if (maxDotsRight > maxLineRight) {
                maxLineRight = maxDotsRight;
            }
        }
    }

    const gridOriginX = subGridPx;
    const gridOriginY = subGridPx * 2.5;

    const minViewportWidth = Math.max(window.innerWidth || 1200, 1000);
    const slantExtra = isItalics ? 140 : 0;
    const neededWidth = Math.max(minViewportWidth, maxLineRight + bigGridPx * 2 + slantExtra);
    const widthPx = Math.ceil(neededWidth / bigGridPx) * bigGridPx;

    const firstBaselineY = gridOriginY + 4 * subGridPx;
    const totalLinesCount = Math.max(lines.length, (dotConfig && dotConfig.enabled) ? dotConfig.linesCount : 0);
    const lastBaselineY = firstBaselineY + Math.max(0, totalLinesCount - 1) * lineHeightPx;
    const neededHeight = lastBaselineY + bigGridPx * 2;
    const heightPx = Math.ceil(neededHeight / bigGridPx) * bigGridPx;

    const isMobile = exportEngine.isMobileDevice();
    const maxCanvasDim = isMobile ? 8192 : 16384;
    const maxCanvasArea = isMobile ? 25000000 : 100000000;
    if (widthPx * scale > maxCanvasDim || heightPx * scale > maxCanvasDim || (widthPx * scale * heightPx * scale) > maxCanvasArea) {
        const scaleDim = maxCanvasDim / Math.max(widthPx, heightPx);
        const scaleArea = Math.sqrt(maxCanvasArea / (widthPx * heightPx));
        scale = Math.max(1, Math.min(scale, Math.floor(Math.min(scaleDim, scaleArea) * 10) / 10));
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(widthPx * scale);
    canvas.height = Math.round(heightPx * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = isWhiteBoard ? '#ffffff' : '#496e53';
    ctx.fillRect(0, 0, widthPx, heightPx);

    // Grid lines
    const majorColor = isWhiteBoard ? 'rgba(60, 75, 115, 0.9)' : 'rgba(220, 220, 220, 0.7)';
    const minorColor = isWhiteBoard ? 'rgba(90, 115, 165, 0.7)' : 'rgba(200, 200, 200, 0.32)';

    const startY = gridOriginY % subGridPx;
    for (let y = startY; y <= heightPx; y += subGridPx) {
        const k = Math.round((y - gridOriginY) / subGridPx);
        const isMajor = (k % 4 === 0);
        ctx.beginPath();
        ctx.strokeStyle = isMajor ? majorColor : minorColor;
        ctx.lineWidth = isMajor ? 2.0 : 1.0;
        ctx.moveTo(0, y);
        ctx.lineTo(widthPx, y);
        ctx.stroke();
    }

    const slantOffset = isItalics ? Math.tan(17 * Math.PI / 180) : 0;
    const xMin = -heightPx * slantOffset;
    const xMax = widthPx + heightPx * slantOffset;
    const startX = (gridOriginX % subGridPx) - heightPx * slantOffset;

    for (let x = startX; x <= xMax; x += subGridPx) {
        const k = Math.round((x - gridOriginX) / subGridPx);
        const isMajor = (k % 4 === 0);
        ctx.beginPath();
        ctx.strokeStyle = isMajor ? majorColor : minorColor;
        ctx.lineWidth = isMajor ? 2.0 : 1.0;
        ctx.moveTo(x, 0);
        ctx.lineTo(x - heightPx * slantOffset, heightPx);
        ctx.stroke();
    }

    // Text
    ctx.save();
    if (isItalics) {
        ctx.transform(1, 0, -Math.tan(17 * Math.PI / 180), 1, 0, 0);
    }

    ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'alphabetic';

    lines.forEach((lineObj, idx) => {
        const yPos = firstBaselineY + (idx * lineHeightPx);
        ctx.fillStyle = textColor;
        lineObj.words.forEach(word => {
            const xPos = gridOriginX + word.offsetLeft;
            const wordIsBold = word.weight === 'bold' ? true : (word.weight === 'normal' ? false : isBold);
            ctx.font = `${wordIsBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, sans-serif`;
            if (word.stretch && word.stretch !== 1.0) {
                ctx.save();
                ctx.translate(xPos, yPos);
                ctx.scale(word.stretch, 1.0);
                ctx.fillStyle = textColor;
                ctx.fillText(word.text, 0, 0);
                ctx.restore();
            } else {
                ctx.fillStyle = textColor;
                ctx.fillText(word.text, xPos, yPos);
            }
        });
    });

    // Dotting
    if (dotConfig && dotConfig.enabled) {
        const olyUnitPx = isSmall ? 9.6 : 19.2;
        const dotRadius = isSmall ? 2.5 : 3.5;
        const rawInputLines = ($('#input').val() || '').split('\n').map(l => l.trim());

        for (let idx = 0; idx < totalLinesCount; idx++) {
            const lineObj = lines[idx];
            const $line = $($result.children('p.line')[idx]);
            const srcLineIdx = parseInt($line.attr('data-source-line-idx'), 10);
            const validSrcIdx = !isNaN(srcLineIdx) ? srcLineIdx : idx;
            const hasText = lineObj && lineObj.words.length > 0;
            const lineDotConfig = exportEngine.getDottingConfig(validSrcIdx);

            const yPos = firstBaselineY + (idx * lineHeightPx);
            let wordsToDraw = hasText ? lineObj.words : [];
            if (wordsToDraw.length === 0) {
                const $modelLine = $(`p.line[data-source-line-idx="${validSrcIdx}"][data-is-practice="false"]`).first();
                if ($modelLine.length) {
                    const modelDomIdx = $result.children('p.line').index($modelLine);
                    if (modelDomIdx !== -1 && lines[modelDomIdx] && lines[modelDomIdx].words.length > 0) {
                        wordsToDraw = lines[modelDomIdx].words;
                    }
                }
                if (wordsToDraw.length === 0) {
                    for (let prev = idx - 1; prev >= 0; prev--) {
                        if (lines[prev] && lines[prev].words.length > 0) {
                            wordsToDraw = lines[prev].words;
                            break;
                        }
                    }
                    if (wordsToDraw.length === 0) {
                        const firstLineWithWords = lines.find(l => l.words.length > 0);
                        if (firstLineWithWords) {
                            wordsToDraw = firstLineWithWords.words;
                        }
                    }
                }
            }
            let rawLineText = wordsToDraw.length > 0 ? (wordsToDraw[0].raw || wordsToDraw[0].text) : '';
            if (wordsToDraw.length === 0) {
                const lineFromInput = rawInputLines[validSrcIdx] || rawInputLines.find(l => l.length > 0) || 'a';
                const tokens = lineFromInput.split(/\s+/).filter(w => w.length > 0);
                wordsToDraw = (tokens.length > 0 ? tokens : ['a']).map(w => ({
                    text: model.getUnicodeStr(w),
                    raw: w,
                    offsetLeft: 0,
                    stretch: 1.0
                }));
                rawLineText = wordsToDraw[0].raw;
            }
            const charUnit = model.getFirstCharUnit(rawLineText);
            const activeDotConfig = exportEngine.getActiveDotConfig(charUnit, validSrcIdx, 0);
            let hasDotConfigs = !!(activeDotConfig && activeDotConfig.dots && activeDotConfig.dots.length > 0);
            if (!hasDotConfigs && wordsToDraw.length > 1) {
                for (let wIdx = 1; wIdx < wordsToDraw.length; wIdx++) {
                    const wInfo = wordsToDraw[wIdx];
                    const wChar = model.getFirstCharUnit(wInfo.raw || wInfo.text);
                    const wDotCfg = exportEngine.getActiveDotConfig(wChar, validSrcIdx, wIdx);
                    if (wDotCfg && Array.isArray(wDotCfg.dots) && wDotCfg.dots.length > 0) {
                        hasDotConfigs = true;
                        break;
                    }
                }
            }
            const outlineInfo = exportEngine.parseOutlineOption(lineDotConfig.outline);

            if (!hasDotConfigs && !outlineInfo.isEnabled) {
                continue;
            }

            const wordOffset = wordsToDraw.length > 0 ? wordsToDraw[0].offsetLeft : 0;
            const firstStretch = wordsToDraw.length > 0 && wordsToDraw[0].stretch ? wordsToDraw[0].stretch : 1.0;
            const baseWordX = gridOriginX + wordOffset;

            for (let j = 0; j < lineDotConfig.repetitions; j++) {
                if (hasText || lineDotConfig.fullDot || j === 0) {
                    const shiftX = j * bigGridPx * lineDotConfig.spaces;

                    // A. Outline
                    if (outlineInfo.isEnabled && (!hasText || j > 0)) {
                        ctx.save();
                        ctx.textBaseline = 'alphabetic';
                        const isDotted = (outlineInfo.style === 'dotted');
                        const isFaint = (outlineInfo.style === 'faint');
                        const isCurve = (outlineInfo.style === 'curve');

                        if (isDotted) {
                            ctx.font = `normal ${fontSizePx}px HP001TD, serif`;
                            ctx.fillStyle = isWhiteBoard ? 'rgba(43, 16, 85, 0.65)' : 'rgba(255, 255, 255, 0.75)';
                        } else if (isFaint) {
                            ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, serif`;
                            ctx.fillStyle = isWhiteBoard ? 'rgba(43, 16, 85, 0.32)' : 'rgba(255, 255, 255, 0.38)';
                        } else {
                            ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, serif`;
                            ctx.strokeStyle = isWhiteBoard ? 'rgba(43, 16, 85, 0.42)' : 'rgba(255, 255, 255, 0.45)';
                            ctx.lineWidth = isSmall ? 0.8 : 1.0;
                        }

                        const drawText = (str, x, y, strStretch) => {
                            if (strStretch && strStretch !== 1.0) {
                                ctx.save();
                                ctx.translate(x, y);
                                ctx.scale(strStretch, 1.0);
                                if (isCurve) {
                                    ctx.strokeText(str, 0, 0);
                                } else {
                                    ctx.fillText(str, 0, 0);
                                }
                                ctx.restore();
                            } else {
                                if (isCurve) {
                                    ctx.strokeText(str, x, y);
                                } else {
                                    ctx.fillText(str, x, y);
                                }
                            }
                        };

                        if (outlineInfo.scope === 'first') {
                            const xPos = baseWordX + shiftX;
                            const w0 = wordsToDraw[0];
                            const textToDraw = isDotted ? charUnit : model.getUnicodeStr(charUnit);
                            if (!isDotted) {
                                const word0Weight = w0 ? w0.weight : null;
                                const firstWordIsBold = word0Weight === 'bold' ? true : (word0Weight === 'normal' ? false : isBold);
                                ctx.font = `${firstWordIsBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, serif`;
                            }
                            drawText(textToDraw, xPos, yPos, firstStretch);
                        } else if (outlineInfo.scope === 'all') {
                            wordsToDraw.forEach(w => {
                                const xPos = gridOriginX + w.offsetLeft + shiftX;
                                const textToDraw = isDotted ? (w.raw || w.text) : (w.text || model.getUnicodeStr(w.raw));
                                if (!isDotted) {
                                    const wordIsBold = w.weight === 'bold' ? true : (word.weight === 'normal' ? false : isBold);
                                    ctx.font = `${wordIsBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, serif`;
                                }
                                drawText(textToDraw, xPos, yPos, w.stretch || 1.0);
                            });
                        }
                        ctx.restore();
                    }

                    // B. Dots
                    if (hasDotConfigs) {
                        if (wordsToDraw && wordsToDraw.length > 0) {
                            wordsToDraw.forEach((wInfo, wIdx) => {
                                const wChar = model.getFirstCharUnit(wInfo.raw || wInfo.text);
                                const wDotCfg = exportEngine.getActiveDotConfig(wChar, validSrcIdx, wIdx);
                                if (wDotCfg && Array.isArray(wDotCfg.dots) && wDotCfg.dots.length > 0) {
                                    const wBaseX = gridOriginX + wInfo.offsetLeft;
                                    const wStretch = wInfo.stretch || 1.0;
                                    for (const dot of wDotCfg.dots) {
                                        const dotX = wBaseX + (dot.x * olyUnitPx * wStretch) + shiftX;
                                        const dotY = yPos - (dot.y * olyUnitPx);
                                        ctx.beginPath();
                                        ctx.fillStyle = lineDotConfig.color;
                                        ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
                                        ctx.fill();
                                    }
                                }
                            });
                        } else if (activeDotConfig && Array.isArray(activeDotConfig.dots) && activeDotConfig.dots.length > 0) {
                            for (const dot of activeDotConfig.dots) {
                                const dotX = baseWordX + (dot.x * olyUnitPx * firstStretch) + shiftX;
                                const dotY = yPos - (dot.y * olyUnitPx);
                                ctx.beginPath();
                                ctx.fillStyle = lineDotConfig.color;
                                ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
                                ctx.fill();
                            }
                        }
                    }
                }
            }
        }
    }

    ctx.restore();

    const layout = $('#board-color-select').val() || 'board';
    const rawInputLines = $('#input').val().split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const fileName = exportEngine.generateFileName(layout, rawInputLines[0] || 'chu_dep', 'png');

    return { canvas, fileName, widthPx, heightPx };
};

exportEngine.renderStandardBoardToSvg = async function () {
    const $result = $('#result');
    const isSmall = $result.hasClass('small');
    const isBold = $result.hasClass('bold');
    const isItalics = $('.grid').hasClass('italics');
    const isWhiteBoard = $('.board').hasClass('white');
    const textColor = $result.css('color') || (isWhiteBoard ? '#2b1055' : '#ffffff');

    const lines = [];
    $result.children('p.line').each(function () {
        const $line = $(this);
        const lineWords = [];
        $line.children('.word').each(function () {
            const wordEl = this;
            const wordText = $(wordEl).find('.word-text').text() || $(wordEl).text();
            const rawWord = $(wordEl).attr('data-raw') || '';
            const stretch = parseFloat($(wordEl).attr('data-stretch')) || 1.0;
            const weight = $(wordEl).attr('data-weight') || null;
            lineWords.push({
                text: wordText,
                raw: rawWord,
                offsetLeft: wordEl.offsetLeft,
                offsetWidth: wordEl.offsetWidth,
                stretch: stretch,
                weight: weight
            });
        });
        lines.push({ words: lineWords });
    });

    const hasAnyText = ($('#input').val() || '').trim().length > 0;
    const dotConfig = hasAnyText ? exportEngine.getDottingConfig() : null;
    if (lines.length === 0 || !hasAnyText) {
        throw new Error("Chưa có nội dung để xuất ảnh!");
    }

    const ptToPx = 96 / 72;
    const subGridPx = 14.4 * ptToPx;
    const bigGridPx = subGridPx * 4;

    const fontSizePx = (isSmall ? 37 : 72) * ptToPx;
    const lineHeightPx = (isSmall ? 4 : 8) * subGridPx;

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    measureCtx.font = `${isBold ? 'bold' : 'normal'} ${fontSizePx}px HP001, sans-serif`;

    let maxLineRight = 0;
    lines.forEach(l => {
        l.words.forEach(w => {
            const textW = Math.max(w.offsetWidth, measureCtx.measureText(w.text).width);
            const wordRight = subGridPx + w.offsetLeft + textW;
            if (wordRight > maxLineRight) {
                maxLineRight = wordRight;
            }
        });
    });

    if (dotConfig && dotConfig.enabled) {
        const totalLinesCount = Math.max(lines.length, dotConfig.linesCount || 0);
        for (let idx = 0; idx < totalLinesCount; idx++) {
            const lineCfg = exportEngine.getDottingConfig(idx);
            const maxDotsRight = subGridPx + (lineCfg.repetitions * bigGridPx * lineCfg.spaces);
            if (maxDotsRight > maxLineRight) {
                maxLineRight = maxDotsRight;
            }
        }
    }

    const gridOriginX = subGridPx;
    const gridOriginY = subGridPx * 2.5;

    const minViewportWidth = Math.max(window.innerWidth || 1200, 1000);
    const slantExtra = isItalics ? 140 : 0;
    const neededWidth = Math.max(minViewportWidth, maxLineRight + bigGridPx * 2 + slantExtra);
    const widthPx = Math.ceil(neededWidth / bigGridPx) * bigGridPx;

    const firstBaselineY = gridOriginY + 4 * subGridPx;
    const totalLinesCount = Math.max(lines.length, (dotConfig && dotConfig.enabled) ? dotConfig.linesCount : 0);
    const lastBaselineY = firstBaselineY + Math.max(0, totalLinesCount - 1) * lineHeightPx;
    const neededHeight = lastBaselineY + bigGridPx * 2;
    const heightPx = Math.ceil(neededHeight / bigGridPx) * bigGridPx;

    const fontDefs = await exportEngine.buildSvgFontDefs();

    // Grid lines
    const majorColor = isWhiteBoard ? 'rgba(60, 75, 115, 0.9)' : 'rgba(220, 220, 220, 0.7)';
    const minorColor = isWhiteBoard ? 'rgba(90, 115, 165, 0.7)' : 'rgba(200, 200, 200, 0.32)';

    let linesSvg = '';
    const startY = gridOriginY % subGridPx;
    for (let y = startY; y <= heightPx; y += subGridPx) {
        const k = Math.round((y - gridOriginY) / subGridPx);
        const isMajor = (k % 4 === 0);
        linesSvg += `<line x1="0" y1="${y.toFixed(2)}" x2="${widthPx}" y2="${y.toFixed(2)}" stroke="${isMajor ? majorColor : minorColor}" stroke-width="${isMajor ? 2.0 : 1.0}" />\n`;
    }

    const slantOffset = isItalics ? Math.tan(17 * Math.PI / 180) : 0;
    const xMax = widthPx + heightPx * slantOffset;
    const startX = (gridOriginX % subGridPx) - heightPx * slantOffset;

    for (let x = startX; x <= xMax; x += subGridPx) {
        const k = Math.round((x - gridOriginX) / subGridPx);
        const isMajor = (k % 4 === 0);
        linesSvg += `<line x1="${x.toFixed(2)}" y1="0" x2="${(x - heightPx * slantOffset).toFixed(2)}" y2="${heightPx}" stroke="${isMajor ? majorColor : minorColor}" stroke-width="${isMajor ? 2.0 : 1.0}" />\n`;
    }

    // Text & Dots
    let textSvg = '';
    let dottingSvg = '';

    lines.forEach((lineObj, idx) => {
        const yPos = firstBaselineY + (idx * lineHeightPx);
        lineObj.words.forEach(word => {
            const xPos = gridOriginX + word.offsetLeft;
            const wordIsBold = word.weight === 'bold' ? true : (word.weight === 'normal' ? false : isBold);
            const fontWeight = wordIsBold ? 'bold' : 'normal';
            const esc = exportEngine.escapeXml(word.text);
            if (word.stretch && word.stretch !== 1.0) {
                textSvg += `<text x="0" y="0" transform="translate(${xPos.toFixed(2)}, ${yPos.toFixed(2)}) scale(${word.stretch.toFixed(4)}, 1)" font-family="HP001, sans-serif" font-size="${fontSizePx.toFixed(2)}px" font-weight="${fontWeight}" fill="${textColor}" dominant-baseline="alphabetic">${esc}</text>\n`;
            } else {
                textSvg += `<text x="${xPos.toFixed(2)}" y="${yPos.toFixed(2)}" font-family="HP001, sans-serif" font-size="${fontSizePx.toFixed(2)}px" font-weight="${fontWeight}" fill="${textColor}" dominant-baseline="alphabetic">${esc}</text>\n`;
            }
        });
    });

    if (dotConfig && dotConfig.enabled) {
        const olyUnitPx = isSmall ? 9.6 : 19.2;
        const dotRadius = isSmall ? 2.5 : 3.5;
        const rawInputLines = ($('#input').val() || '').split('\n').map(l => l.trim());

        for (let idx = 0; idx < totalLinesCount; idx++) {
            const lineObj = lines[idx];
            const $line = $($result.children('p.line')[idx]);
            const srcLineIdx = parseInt($line.attr('data-source-line-idx'), 10);
            const validSrcIdx = !isNaN(srcLineIdx) ? srcLineIdx : idx;
            const hasText = lineObj && lineObj.words.length > 0;
            const lineDotConfig = exportEngine.getDottingConfig(validSrcIdx);

            const yPos = firstBaselineY + (idx * lineHeightPx);
            let wordsToDraw = hasText ? lineObj.words : [];
            if (wordsToDraw.length === 0) {
                const $modelLine = $(`p.line[data-source-line-idx="${validSrcIdx}"][data-is-practice="false"]`).first();
                if ($modelLine.length) {
                    const modelDomIdx = $result.children('p.line').index($modelLine);
                    if (modelDomIdx !== -1 && lines[modelDomIdx] && lines[modelDomIdx].words.length > 0) {
                        wordsToDraw = lines[modelDomIdx].words;
                    }
                }
                if (wordsToDraw.length === 0) {
                    for (let prev = idx - 1; prev >= 0; prev--) {
                        if (lines[prev] && lines[prev].words.length > 0) {
                            wordsToDraw = lines[prev].words;
                            break;
                        }
                    }
                    if (wordsToDraw.length === 0) {
                        const firstLineWithWords = lines.find(l => l.words.length > 0);
                        if (firstLineWithWords) {
                            wordsToDraw = firstLineWithWords.words;
                        }
                    }
                }
            }
            let rawLineText = wordsToDraw.length > 0 ? (wordsToDraw[0].raw || wordsToDraw[0].text) : '';
            if (wordsToDraw.length === 0) {
                const lineFromInput = rawInputLines[validSrcIdx] || rawInputLines.find(l => l.length > 0) || 'a';
                const tokens = lineFromInput.split(/\s+/).filter(w => w.length > 0);
                wordsToDraw = (tokens.length > 0 ? tokens : ['a']).map(w => ({
                    text: model.getUnicodeStr(w),
                    raw: w,
                    offsetLeft: 0,
                    stretch: 1.0
                }));
                rawLineText = wordsToDraw[0].raw;
            }
            const charUnit = model.getFirstCharUnit(rawLineText);
            const activeDotConfig = exportEngine.getActiveDotConfig(charUnit, validSrcIdx, 0);
            let hasDotConfigs = !!(activeDotConfig && activeDotConfig.dots && activeDotConfig.dots.length > 0);
            if (!hasDotConfigs && wordsToDraw.length > 1) {
                for (let wIdx = 1; wIdx < wordsToDraw.length; wIdx++) {
                    const wInfo = wordsToDraw[wIdx];
                    const wChar = model.getFirstCharUnit(wInfo.raw || wInfo.text);
                    const wDotCfg = exportEngine.getActiveDotConfig(wChar, validSrcIdx, wIdx);
                    if (wDotCfg && Array.isArray(wDotCfg.dots) && wDotCfg.dots.length > 0) {
                        hasDotConfigs = true;
                        break;
                    }
                }
            }
            const outlineInfo = exportEngine.parseOutlineOption(lineDotConfig.outline);

            if (!hasDotConfigs && !outlineInfo.isEnabled) {
                continue;
            }

            const wordOffset = wordsToDraw.length > 0 ? wordsToDraw[0].offsetLeft : 0;
            const firstStretch = wordsToDraw.length > 0 && wordsToDraw[0].stretch ? wordsToDraw[0].stretch : 1.0;
            const baseWordX = gridOriginX + wordOffset;

            for (let j = 0; j < lineDotConfig.repetitions; j++) {
                if (hasText || lineDotConfig.fullDot || j === 0) {
                    const shiftX = j * bigGridPx * lineDotConfig.spaces;

                    // A. Outline
                    if (outlineInfo.isEnabled && (!hasText || j > 0)) {
                        const isDotted = (outlineInfo.style === 'dotted');
                        const isFaint = (outlineInfo.style === 'faint');
                        const isCurve = (outlineInfo.style === 'curve');

                        const fontFam = isDotted ? 'HP001TD, serif' : 'HP001, serif';
                        const fillCol = isDotted ? (isWhiteBoard ? 'rgba(43, 16, 85, 0.65)' : 'rgba(255, 255, 255, 0.75)') : (isFaint ? (isWhiteBoard ? 'rgba(43, 16, 85, 0.32)' : 'rgba(255, 255, 255, 0.38)') : 'none');
                        const strokeAttr = isCurve ? `stroke="${isWhiteBoard ? 'rgba(43, 16, 85, 0.42)' : 'rgba(255, 255, 255, 0.45)'}" stroke-width="${isSmall ? 0.8 : 1.0}"` : '';

                        const drawSvgText = (str, x, y, strStretch, isBoldWord) => {
                            const esc = exportEngine.escapeXml(str);
                            const weightStr = isBoldWord ? 'bold' : 'normal';
                            if (strStretch && strStretch !== 1.0) {
                                return `<text x="0" y="0" transform="translate(${x.toFixed(2)}, ${y.toFixed(2)}) scale(${strStretch.toFixed(4)}, 1)" font-family="${fontFam}" font-size="${fontSizePx.toFixed(2)}px" font-weight="${weightStr}" fill="${fillCol}" ${strokeAttr} dominant-baseline="alphabetic">${esc}</text>\n`;
                            }
                            return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-family="${fontFam}" font-size="${fontSizePx.toFixed(2)}px" font-weight="${weightStr}" fill="${fillCol}" ${strokeAttr} dominant-baseline="alphabetic">${esc}</text>\n`;
                        };

                        if (outlineInfo.scope === 'first') {
                            const xPos = baseWordX + shiftX;
                            const w0 = wordsToDraw[0];
                            const textToDraw = isDotted ? charUnit : model.getUnicodeStr(charUnit);
                            const word0Weight = w0 ? w0.weight : null;
                            const firstWordIsBold = !isDotted && (word0Weight === 'bold' ? true : (word0Weight === 'normal' ? false : isBold));
                            dottingSvg += drawSvgText(textToDraw, xPos, yPos, firstStretch, firstWordIsBold);
                        } else if (outlineInfo.scope === 'all') {
                            wordsToDraw.forEach(w => {
                                const xPos = gridOriginX + w.offsetLeft + shiftX;
                                const textToDraw = isDotted ? (w.raw || w.text) : (w.text || model.getUnicodeStr(w.raw));
                                const wordIsBold = !isDotted && (w.weight === 'bold' ? true : (w.weight === 'normal' ? false : isBold));
                                dottingSvg += drawSvgText(textToDraw, xPos, yPos, w.stretch || 1.0, wordIsBold);
                            });
                        }
                    }

                    // B. Dots
                    if (hasDotConfigs) {
                        if (wordsToDraw && wordsToDraw.length > 0) {
                            wordsToDraw.forEach((wInfo, wIdx) => {
                                const wChar = model.getFirstCharUnit(wInfo.raw || wInfo.text);
                                const wDotCfg = exportEngine.getActiveDotConfig(wChar, validSrcIdx, wIdx);
                                if (wDotCfg && Array.isArray(wDotCfg.dots) && wDotCfg.dots.length > 0) {
                                    const wBaseX = gridOriginX + wInfo.offsetLeft;
                                    const wStretch = wInfo.stretch || 1.0;
                                    for (const dot of wDotCfg.dots) {
                                        const dotX = wBaseX + (dot.x * olyUnitPx * wStretch) + shiftX;
                                        const dotY = yPos - (dot.y * olyUnitPx);
                                        dottingSvg += `<circle cx="${dotX.toFixed(2)}" cy="${dotY.toFixed(2)}" r="${dotRadius}" fill="${lineDotConfig.color}" />\n`;
                                    }
                                }
                            });
                        } else if (activeDotConfig && Array.isArray(activeDotConfig.dots) && activeDotConfig.dots.length > 0) {
                            for (const dot of activeDotConfig.dots) {
                                const dotX = baseWordX + (dot.x * olyUnitPx * firstStretch) + shiftX;
                                const dotY = yPos - (dot.y * olyUnitPx);
                                dottingSvg += `<circle cx="${dotX.toFixed(2)}" cy="${dotY.toFixed(2)}" r="${dotRadius}" fill="${lineDotConfig.color}" />\n`;
                            }
                        }
                    }
                }
            }
        }
    }

    const italicMatrix = `matrix(1 0 ${(-Math.tan(17 * Math.PI / 180)).toFixed(6)} 1 0 0)`;
    const textGroup = isItalics ? `<g transform="${italicMatrix}">\n${textSvg}\n${dottingSvg}\n</g>` : `${textSvg}\n${dottingSvg}`;

    const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}">
${fontDefs}
<rect width="${widthPx}" height="${heightPx}" fill="${isWhiteBoard ? '#ffffff' : '#496e53'}" />
<g id="grid-lines">
${linesSvg}
</g>
<g id="text-layer">
${textGroup}
</g>
</svg>`;

    const layout = $('#board-color-select').val() || 'board';
    const rawInputLines = $('#input').val().split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const fileName = exportEngine.generateFileName(layout, rawInputLines[0] || 'chu_dep', 'svg');

    return { svgString, fileName };
};

exportEngine.exportStandardToPng = async function (customScale) {
    if (document.fonts) {
        try {
            await Promise.all([
                document.fonts.load('16px HP001'),
                document.fonts.load('16px HP001TD'),
                document.fonts.ready
            ]);
        } catch (_) {}
    }

    const { canvas, fileName } = await exportEngine.renderStandardBoardToCanvas(customScale);
    await exportEngine.downloadCanvasAsPng(canvas, fileName);
};

exportEngine.exportStandardToPdf = async function (customScale) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('Thư viện jsPDF chưa tải xong. Vui lòng thử lại sau giây lát!');
        return;
    }

    if (document.fonts) {
        try {
            await Promise.all([
                document.fonts.load('16px HP001'),
                document.fonts.load('16px HP001TD'),
                document.fonts.ready
            ]);
        } catch (_) {}
    }

    const { canvas, widthPx, heightPx } = await exportEngine.renderStandardBoardToCanvas(customScale);
    const isLandscape = (widthPx >= heightPx);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
    });

    const pageW = isLandscape ? 297 : 210;
    const pageH = isLandscape ? 210 : 297;
    const margin = 10;
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;

    const ratio = Math.min(maxW / widthPx, maxH / heightPx);
    const drawW = widthPx * ratio;
    const drawH = heightPx * ratio;
    const offX = margin + (maxW - drawW) / 2;
    const offY = margin + (maxH - drawH) / 2;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', offX, offY, drawW, drawH, undefined, 'FAST');

    const layout = $('#board-color-select').val() || 'board';
    const rawInputLines = $('#input').val().split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const fileName = exportEngine.generateFileName(layout, rawInputLines[0] || 'chu_dep', 'pdf');

    pdf.save(fileName);
};

exportEngine.exportStandardToSvg = async function () {
    if (document.fonts) {
        try {
            await Promise.all([
                document.fonts.load('16px HP001'),
                document.fonts.load('16px HP001TD'),
                document.fonts.ready
            ]);
        } catch (_) {}
    }

    const { svgString, fileName } = await exportEngine.renderStandardBoardToSvg();
    await exportEngine.downloadSvg(svgString, fileName);
};

/* ==========================================================================
   MASTER EXPORT DISPATCHERS
   ========================================================================== */

exportEngine.exportToPng = async function (customScale) {
    const layout = $('#board-color-select').val();
    const isBlackboard = layout ? (layout === 'blackboard') : $('.board').hasClass('blackboard');
    const isWhite11x14 = layout ? (layout === 'white_11x14' || layout === 'white_10x14') : ($('.board').hasClass('white_11x14') || $('.board').hasClass('white_10x14'));
    const isWhite14x20 = layout ? (layout === 'white_14x20') : $('.board').hasClass('white_14x20');

    if (isBlackboard) {
        await exportEngine.exportBlackboardToPng(customScale);
        return;
    }
    if (isWhite14x20) {
        await exportEngine.exportWhite14x20ToPng(customScale);
        return;
    }
    if (isWhite11x14) {
        await exportEngine.exportWhite11x14ToPng(customScale);
        return;
    }
    await exportEngine.exportStandardToPng(customScale);
};

exportEngine.exportToPdf = async function (customScale) {
    const layout = $('#board-color-select').val();
    const isBlackboard = layout ? (layout === 'blackboard') : $('.board').hasClass('blackboard');
    const isWhite11x14 = layout ? (layout === 'white_11x14' || layout === 'white_10x14') : ($('.board').hasClass('white_11x14') || $('.board').hasClass('white_10x14'));
    const isWhite14x20 = layout ? (layout === 'white_14x20') : $('.board').hasClass('white_14x20');

    if (isBlackboard) {
        await exportEngine.exportBlackboardToPdf(customScale);
        return;
    }
    if (isWhite14x20) {
        await exportEngine.exportWhite14x20ToPdf(customScale);
        return;
    }
    if (isWhite11x14) {
        await exportEngine.exportWhite11x14ToPdf(customScale);
        return;
    }
    await exportEngine.exportStandardToPdf(customScale);
};

exportEngine.exportToSvg = async function () {
    const layout = $('#board-color-select').val();
    const isBlackboard = layout ? (layout === 'blackboard') : $('.board').hasClass('blackboard');
    const isWhite11x14 = layout ? (layout === 'white_11x14' || layout === 'white_10x14') : ($('.board').hasClass('white_11x14') || $('.board').hasClass('white_10x14'));
    const isWhite14x20 = layout ? (layout === 'white_14x20') : $('.board').hasClass('white_14x20');

    if (isBlackboard) {
        await exportEngine.exportBlackboardToSvg();
        return;
    }
    if (isWhite14x20) {
        await exportEngine.exportWhite14x20ToSvg();
        return;
    }
    if (isWhite11x14) {
        await exportEngine.exportWhite11x14ToSvg();
        return;
    }
    await exportEngine.exportStandardToSvg();
};

exportEngine.exportFile = async function () {
    const type = $('#export-type-select').val() || 'png';
    const scale = exportEngine.getExportScale();

    $('#export-dropdown').removeClass('is-open');

    const $btn = $('#btn-execute-export');
    const originalText = $('#btn-execute-export-label').text();
    $('#btn-execute-export-label').html('<i class="fa-solid fa-spinner fa-spin"></i> Đang xuất tệp...');
    $btn.prop('disabled', true);

    try {
        if (type === 'svg') {
            await exportEngine.exportToSvg();
        } else if (type === 'pdf') {
            await exportEngine.exportToPdf(scale);
        } else {
            await exportEngine.exportToPng(scale);
        }
    } catch (err) {
        console.error('Export error:', err);
        alert('Có lỗi khi xuất tệp: ' + err.message);
    } finally {
        $('#btn-execute-export-label').text(originalText);
        $btn.prop('disabled', false);
    }
};

