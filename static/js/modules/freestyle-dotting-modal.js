import { model } from './model.js';
import { dottingManager, escapeHtml } from './dotting-manager.js';

/**
 * Freestyle Runtime Dotting Modal
 * Interactive SVG grid editor allowing teachers/users to visually customize guide dot placement
 * with sub-grid snapping (0.25 ô ly) and word-level / document-level scope.
 */
export const freestyleDottingModal = {};

freestyleDottingModal.openFreestyleDottingModal = function (charUnit, lineIdx, wordIdx) {
    if (!charUnit) charUnit = 'a';
    lineIdx = parseInt(lineIdx, 10) || 0;
    wordIdx = parseInt(wordIdx, 10) || 0;

    // 1. Close any open popovers
    $('.word-dot-config-popover, .line-dot-popover').remove();
    $('.word').removeClass('is-dotting-open');
    $('p.line').removeClass('has-dot-popover');

    const $modal = $('#freestyleDottingModal');
    if (!$modal.length) return;

    // Resolve word info
    let rawWord = '';
    let wordWeight = null;
    let $word = null;

    const $targetLine = $(`p.line[data-source-line-idx="${lineIdx}"][data-is-practice="false"]`).first();
    if ($targetLine.length) {
        $word = $targetLine.find(`.word[data-word-idx="${wordIdx}"]`).first();
    }
    if (!$word || !$word.length) {
        const $lines = $('#result p.line');
        if ($lines.length > lineIdx) {
            $word = $lines.eq(lineIdx).find(`.word[data-word-idx="${wordIdx}"]`).first();
        }
    }
    if ($word && $word.length) {
        rawWord = $word.attr('data-raw') || '';
        wordWeight = $word.attr('data-weight') || null;
    }
    if (!rawWord) {
        const rawInputLines = ($('#input').val() || '').split('\n');
        const lineText = (rawInputLines[lineIdx] !== undefined ? rawInputLines[lineIdx].trim() : '') || rawInputLines.find(l => l.trim().length > 0) || '';
        const words = lineText.split(/\s+/).filter(w => w.length > 0);
        rawWord = words[wordIdx] || words[0] || charUnit;
    }

    const isGlobalBold = $('#font-weight-select').val() === 'bold' || $('#result').hasClass('bold');
    const finalWeight = wordWeight ? wordWeight : (isGlobalBold ? 'bold' : 'normal');
    const displayGlyph = (rawWord && model.getWordFirstGlyph) ? model.getWordFirstGlyph(rawWord) : (model.getUnicodeStr ? model.getUnicodeStr(charUnit) : charUnit);

    // 2. Set title and glyph badge
    $('#freestyleCharBadge').text(displayGlyph).css('font-weight', finalWeight);
    $('#freestyleApplyAllText').text(`Áp dụng cho tất cả chữ '${charUnit}' trong bài viết`);
    $('#freestyleApplyAll').prop('checked', false);

    // 3. Resolve starting dots
    const wordKey = `${lineIdx}_${wordIdx}`;
    const wordCfg = dottingManager.wordDotConfigs && dottingManager.wordDotConfigs[wordKey];
    const lineCfg = dottingManager.lineDotConfigs && dottingManager.lineDotConfigs[lineIdx];

    let localDots = [];
    if (wordCfg && Array.isArray(wordCfg.customDots) && wordCfg.customDots.length > 0) {
        localDots = JSON.parse(JSON.stringify(wordCfg.customDots));
    } else if (wordIdx === 0 && lineCfg && Array.isArray(lineCfg.customDots) && lineCfg.customDots.length > 0) {
        localDots = JSON.parse(JSON.stringify(lineCfg.customDots));
    } else {
        const activeCfg = dottingManager.getActiveDotConfig(charUnit, lineIdx, wordIdx);
        if (activeCfg && Array.isArray(activeCfg.dots) && activeCfg.dots.length > 0) {
            localDots = JSON.parse(JSON.stringify(activeCfg.dots));
        } else {
            localDots = [{ x: 0.50, y: 1.75, label: 'Nét 1' }];
        }
    }

    if (localDots.length === 0) {
        localDots = [{ x: 0.50, y: 1.75, label: 'Nét 1' }];
    }

    let activeDotIdx = 0;
    let isDragging = false;

    // Geometry constants matching editor ô ly grid
    const CELL_PX = 56;
    const COLS = 8;
    const ROWS = 9;
    const WIDTH = COLS * CELL_PX; // 448px
    const HEIGHT = ROWS * CELL_PX; // 504px
    const ORIGIN_X = CELL_PX; // 56px (X = 0)
    const BASELINE_Y = 6 * CELL_PX; // 336px (Y = 0)
    const FONT_SIZE = CELL_PX * (2048 / 412); // ~278.37px

    // 4. Build SVG Grid
    const $container = $('#freestylePreviewContainer');
    const svgHtml = `
    <svg id="freestyleDottingSvg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" style="display: block; width: 100%; height: 100%; cursor: crosshair;">
        <defs>
            <pattern id="freestyle_subgrid" width="14" height="14" patternUnits="userSpaceOnUse">
                <path d="M 14 0 L 0 0 0 14" fill="none" stroke="#f1f5f9" stroke-width="0.75" />
            </pattern>
            <pattern id="freestyle_grid" width="${CELL_PX}" height="${CELL_PX}" patternUnits="userSpaceOnUse">
                <rect width="${CELL_PX}" height="${CELL_PX}" fill="url(#freestyle_subgrid)" />
                <path d="M ${CELL_PX} 0 L 0 0 0 ${CELL_PX}" fill="none" stroke="#cbd5e1" stroke-width="1" />
            </pattern>
        </defs>
        
        <!-- Base Grid -->
        <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#freestyle_grid)" />
        <rect width="${WIDTH}" height="${HEIGHT}" fill="none" stroke="#94a3b8" stroke-width="1" />

        <!-- Reference Lines & Labels -->
        <line x1="0" y1="${BASELINE_Y}" x2="${WIDTH}" y2="${BASELINE_Y}" stroke="#2563eb" stroke-width="2.5" />
        <text x="${WIDTH - 6}" y="${BASELINE_Y - 5}" font-size="10.5" font-weight="bold" fill="#2563eb" text-anchor="end">ĐK 1 (0)</text>

        <line x1="0" y1="${BASELINE_Y - 2 * CELL_PX}" x2="${WIDTH}" y2="${BASELINE_Y - 2 * CELL_PX}" stroke="#3b82f6" stroke-width="1.2" stroke-dasharray="4,2" />
        <text x="${WIDTH - 6}" y="${BASELINE_Y - 2 * CELL_PX - 5}" font-size="10.5" fill="#3b82f6" text-anchor="end">ĐK 3 (+2)</text>

        <line x1="0" y1="${BASELINE_Y - 5 * CELL_PX}" x2="${WIDTH}" y2="${BASELINE_Y - 5 * CELL_PX}" stroke="#60a5fa" stroke-width="1.2" stroke-dasharray="4,2" />
        <text x="${WIDTH - 6}" y="${BASELINE_Y - 5 * CELL_PX - 5}" font-size="10.5" fill="#60a5fa" text-anchor="end">ĐK 5 (+5)</text>

        <line x1="0" y1="${BASELINE_Y + 2 * CELL_PX}" x2="${WIDTH}" y2="${BASELINE_Y + 2 * CELL_PX}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2" />
        <text x="${WIDTH - 6}" y="${BASELINE_Y + 2 * CELL_PX - 5}" font-size="10.5" fill="#94a3b8" text-anchor="end">ĐK Dưới (-2)</text>

        <line x1="${ORIGIN_X}" y1="0" x2="${ORIGIN_X}" y2="${HEIGHT}" stroke="#2563eb" stroke-width="1.5" />
        <text x="${ORIGIN_X + 6}" y="${HEIGHT - 8}" font-size="10.5" font-weight="bold" fill="#2563eb">X=0</text>

        <!-- Render Glyph -->
        <text id="freestylePreviewGlyph" x="${ORIGIN_X}" y="${BASELINE_Y}" font-family="HP001, serif" font-size="${FONT_SIZE}" fill="#1e293b" font-weight="${finalWeight}" pointer-events="none" style="user-select: none;">${escapeHtml(displayGlyph)}</text>

        <!-- SVG Dots Layer -->
        <g id="freestyleSvgDotsLayer"></g>
    </svg>
    `;
    $container.html(svgHtml);

    const $svg = $('#freestyleDottingSvg');
    const $dotsLayer = $('#freestyleSvgDotsLayer');
    const $dotsListContainer = $('#freestyleDotsList');
    const $inputX = $('#freestyleInputX');
    const $inputY = $('#freestyleInputY');
    const $inputLabel = $('#freestyleInputLabel');

    function getCurrentDot() {
        if (!localDots[activeDotIdx]) {
            activeDotIdx = 0;
        }
        return localDots[activeDotIdx];
    }

    function renderDotsList() {
        let html = '';
        localDots.forEach((dot, idx) => {
            const isActive = (idx === activeDotIdx);
            const labelStr = dot.label ? `: ${escapeHtml(dot.label)}` : '';
            html += `
                <button type="button" class="freestyle-dot-pill ${isActive ? 'is-active' : ''}" data-dot-idx="${idx}">
                    <strong>Chấm ${idx + 1}</strong>${labelStr} <span class="small opacity-75">(${dot.x.toFixed(2)}, ${dot.y.toFixed(2)})</span>
                </button>
            `;
        });
        $dotsListContainer.html(html);
    }

    function renderActiveDotInputs() {
        const dot = getCurrentDot();
        $('#freestyleActiveDotHeading').html(`
            <i class="fa-solid fa-circle-dot text-danger"></i> Đang chỉnh: <strong>Chấm ${activeDotIdx + 1}</strong>
        `);
        $inputX.val(dot.x.toFixed(2));
        $inputY.val(dot.y.toFixed(2));
        $inputLabel.val(dot.label || '');
    }

    function renderSvgDots() {
        $dotsLayer.empty();
        if (activeDotIdx >= localDots.length) {
            activeDotIdx = 0;
        }

        localDots.forEach((dot, idx) => {
            const px = ORIGIN_X + dot.x * CELL_PX;
            const py = BASELINE_Y - dot.y * CELL_PX;
            const isActive = (idx === activeDotIdx);

            let $g = $(document.createElementNS('http://www.w3.org/2000/svg', 'g'))
                .attr('class', `svg-dot-node ${isActive ? 'is-active' : ''}`)
                .attr('data-dot-idx', idx)
                .attr('transform', `translate(${px}, ${py})`)
                .css('cursor', isActive ? 'grab' : 'pointer');

            if (isActive) {
                let $halo = $(document.createElementNS('http://www.w3.org/2000/svg', 'circle'))
                    .attr('cx', 0).attr('cy', 0).attr('r', 18)
                    .attr('fill', 'rgba(239, 68, 68, 0.25)')
                    .attr('pointer-events', 'none');
                let $center = $(document.createElementNS('http://www.w3.org/2000/svg', 'circle'))
                    .attr('cx', 0).attr('cy', 0).attr('r', 8)
                    .attr('fill', '#ef4444')
                    .attr('stroke', '#ffffff').attr('stroke-width', 2);
                let tooltipText = `${dot.label || ('Chấm ' + (idx + 1))}: (${dot.x.toFixed(2)}, ${dot.y.toFixed(2)})`;
                let badgeWidth = Math.max(70, tooltipText.length * 7);
                let $badgeBg = $(document.createElementNS('http://www.w3.org/2000/svg', 'rect'))
                    .attr('x', -badgeWidth / 2).attr('y', -28)
                    .attr('width', badgeWidth).attr('height', 18)
                    .attr('rx', 4).attr('fill', 'rgba(15, 23, 42, 0.88)')
                    .attr('pointer-events', 'none');
                let $badgeText = $(document.createElementNS('http://www.w3.org/2000/svg', 'text'))
                    .attr('x', 0).attr('y', -15)
                    .attr('font-size', '10.5').attr('font-weight', 'bold')
                    .attr('fill', '#ffffff').attr('text-anchor', 'middle')
                    .attr('pointer-events', 'none')
                    .text(tooltipText);

                $g.append($halo).append($center).append($badgeBg).append($badgeText);
            } else {
                let $center = $(document.createElementNS('http://www.w3.org/2000/svg', 'circle'))
                    .attr('cx', 0).attr('cy', 0).attr('r', 7)
                    .attr('fill', '#3b82f6')
                    .attr('stroke', '#ffffff').attr('stroke-width', 1.5);
                let $numBadge = $(document.createElementNS('http://www.w3.org/2000/svg', 'text'))
                    .attr('x', 9).attr('y', -7)
                    .attr('font-size', '10').attr('font-weight', 'bold')
                    .attr('fill', '#1e40af')
                    .attr('pointer-events', 'none')
                    .text(`${idx + 1}`);

                $g.append($center).append($numBadge);
            }

            $dotsLayer.append($g);
        });
    }

    function updateActiveDotVisualsOnly(x, y) {
        let $activeG = $dotsLayer.find('.svg-dot-node.is-active');
        if (!$activeG.length) {
            renderSvgDots();
            $activeG = $dotsLayer.find('.svg-dot-node.is-active');
        }
        const px = ORIGIN_X + x * CELL_PX;
        const py = BASELINE_Y - y * CELL_PX;
        if ($activeG.length) {
            $activeG[0].setAttribute('transform', `translate(${px}, ${py})`);
            const dot = getCurrentDot();
            const tooltipText = `${dot.label || ('Chấm ' + (activeDotIdx + 1))}: (${x.toFixed(2)}, ${y.toFixed(2)})`;
            const badgeWidth = Math.max(70, tooltipText.length * 7);
            const rect = $activeG.find('rect')[0];
            const text = $activeG.find('text')[0];
            if (rect) {
                rect.setAttribute('x', -badgeWidth / 2);
                rect.setAttribute('width', badgeWidth);
            }
            if (text) {
                text.textContent = tooltipText;
            }
        }
        $inputX.val(x.toFixed(2));
        $inputY.val(y.toFixed(2));
    }

    function renderAll() {
        renderDotsList();
        renderActiveDotInputs();
        renderSvgDots();
    }

    renderAll();
    $modal.fadeIn(150);

    function cleanupModal() {
        $container.off('.freestyle');
        $(window).off('.freestyleDrag');
        $(document).off('.freestyleKey');
        $('#btn-close-freestyle-modal, #btn-freestyle-cancel').off('click');
        $('#btn-freestyle-add-dot, #btn-freestyle-del-dot, #btn-freestyle-snap, #btn-freestyle-load-preset').off('click');
        $('#btn-freestyle-reset-default, #btn-freestyle-apply').off('click');
        $dotsListContainer.off('click');
        $inputX.off('input change');
        $inputY.off('input change');
        $inputLabel.off('input change');
    }

    // Dot Pill Selection
    $dotsListContainer.off('click').on('click', '.freestyle-dot-pill', function (e) {
        e.preventDefault();
        const idx = parseInt($(this).attr('data-dot-idx'), 10);
        if (!isNaN(idx) && idx !== activeDotIdx) {
            activeDotIdx = idx;
            renderAll();
        }
    });

    function onInputChange() {
        const xVal = parseFloat($inputX.val());
        const yVal = parseFloat($inputY.val());
        const labelVal = $inputLabel.val().trim();
        const dot = getCurrentDot();
        if (!isNaN(xVal)) dot.x = Math.round(Math.max(-0.5, Math.min(6.5, xVal)) * 100) / 100;
        if (!isNaN(yVal)) dot.y = Math.round(Math.max(-3.0, Math.min(6.0, yVal)) * 100) / 100;
        dot.label = labelVal;
        renderDotsList();
        renderSvgDots();
    }
    $inputX.off('input change').on('input change', onInputChange);
    $inputY.off('input change').on('input change', onInputChange);
    $inputLabel.off('input change').on('input change', onInputChange);

    // Add Dot
    $('#btn-freestyle-add-dot').off('click').on('click', function (e) {
        e.preventDefault();
        const curDot = getCurrentDot();
        const newX = Math.round(Math.min(6.0, curDot.x + 0.5) * 100) / 100;
        const newY = Math.round(curDot.y * 100) / 100;
        localDots.push({
            x: newX,
            y: newY,
            label: `Nét ${localDots.length + 1}`
        });
        activeDotIdx = localDots.length - 1;
        renderAll();
    });

    // Delete Dot
    $('#btn-freestyle-del-dot').off('click').on('click', function (e) {
        e.preventDefault();
        if (localDots.length <= 1) {
            alert('Mỗi cấu hình cần ít nhất 1 điểm chấm.');
            return;
        }
        localDots.splice(activeDotIdx, 1);
        activeDotIdx = Math.max(0, activeDotIdx - 1);
        renderAll();
    });

    // Snap to 0.25 ô ly
    $('#btn-freestyle-snap').off('click').on('click', function (e) {
        e.preventDefault();
        const dot = getCurrentDot();
        dot.x = Math.round(dot.x * 4) / 4;
        dot.y = Math.round(dot.y * 4) / 4;
        renderAll();
    });

    // Load preset if available
    $('#btn-freestyle-load-preset').off('click').on('click', function (e) {
        e.preventDefault();
        const presetCfgs = model.getGlyphDotConfigs(charUnit);
        if (presetCfgs && presetCfgs.length > 0 && presetCfgs[0].dots && presetCfgs[0].dots.length > 0) {
            localDots = JSON.parse(JSON.stringify(presetCfgs[0].dots));
            activeDotIdx = 0;
            renderAll();
        } else {
            alert(`Chữ '${charUnit}' chưa có mẫu chấm sẵn trong hệ thống.`);
        }
    });

    function getOlyFromEvent(e) {
        const rect = $svg[0].getBoundingClientRect();
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (clientX === undefined && e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (clientX === undefined && e.originalEvent) {
            if (e.originalEvent.touches && e.originalEvent.touches.length > 0) {
                clientX = e.originalEvent.touches[0].clientX;
                clientY = e.originalEvent.touches[0].clientY;
            } else {
                clientX = e.originalEvent.clientX;
                clientY = e.originalEvent.clientY;
            }
        }
        const scaleX = WIDTH / rect.width;
        const scaleY = HEIGHT / rect.height;
        const px = ((clientX || 0) - rect.left) * scaleX;
        const py = ((clientY || 0) - rect.top) * scaleY;
        const xOly = (px - ORIGIN_X) / CELL_PX;
        const yOly = (BASELINE_Y - py) / CELL_PX;
        return {
            x: Math.round(Math.max(-0.5, Math.min(6.5, xOly)) * 100) / 100,
            y: Math.round(Math.max(-3.0, Math.min(6.0, yOly)) * 100) / 100
        };
    }

    $container.off('.freestyle').on('pointerdown.freestyle mousedown.freestyle touchstart.freestyle', function (e) {
        const $dotNode = $(e.target).closest('.svg-dot-node');
        if ($dotNode.length) {
            const clickedIdx = parseInt($dotNode.attr('data-dot-idx'), 10);
            if (!isNaN(clickedIdx) && clickedIdx !== activeDotIdx) {
                activeDotIdx = clickedIdx;
                renderDotsList();
                renderActiveDotInputs();
                renderSvgDots();
            }
        } else {
            const pos = getOlyFromEvent(e);
            const dot = getCurrentDot();
            dot.x = pos.x;
            dot.y = pos.y;
            updateActiveDotVisualsOnly(pos.x, pos.y);
        }

        isDragging = true;
        try {
            if (e.pointerId !== undefined && this.setPointerCapture) {
                this.setPointerCapture(e.pointerId);
            }
        } catch (_) {}
        e.preventDefault();
    });

    $container.on('pointermove.freestyle mousemove.freestyle touchmove.freestyle', function (e) {
        if (!isDragging) return;
        const pos = getOlyFromEvent(e);
        const dot = getCurrentDot();
        dot.x = pos.x;
        dot.y = pos.y;
        updateActiveDotVisualsOnly(pos.x, pos.y);
        e.preventDefault();
    });

    function endDrag(e) {
        if (isDragging) {
            isDragging = false;
            try {
                if (e && e.pointerId !== undefined && $container[0].releasePointerCapture) {
                    $container[0].releasePointerCapture(e.pointerId);
                }
            } catch (_) {}
            renderAll();
        }
    }

    $container.on('pointerup.freestyle pointercancel.freestyle mouseup.freestyle touchend.freestyle', endDrag);

    $(window).off('.freestyleDrag').on('pointerup.freestyleDrag pointercancel.freestyleDrag mouseup.freestyleDrag touchend.freestyleDrag', function (e) {
        if (isDragging) endDrag(e);
    });

    function closeModal() {
        isDragging = false;
        cleanupModal();
        $modal.fadeOut(150);
    }

    $('#btn-close-freestyle-modal, #btn-freestyle-cancel').off('click').on('click', function (e) {
        e.preventDefault();
        closeModal();
    });

    $(document).off('.freestyleKey').on('keydown.freestyleKey', function (e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    $('#btn-freestyle-reset-default').off('click').on('click', function (e) {
        e.preventDefault();
        const applyAll = $('#freestyleApplyAll').is(':checked');

        if (applyAll) {
            $('#result').children('p.line').each(function (lIdx) {
                $(this).children('.word').each(function () {
                    const wIdx = parseInt($(this).attr('data-word-idx'), 10);
                    const rawToken = $(this).attr('data-raw') || $(this).text();
                    const wCharUnit = model.getFirstCharUnit(rawToken);
                    if (wCharUnit === charUnit) {
                        const key = `${lIdx}_${wIdx}`;
                        if (dottingManager.wordDotConfigs && dottingManager.wordDotConfigs[key]) {
                            delete dottingManager.wordDotConfigs[key].customDots;
                            dottingManager.wordDotConfigs[key].dotConfigId = null;
                        }
                        if (wIdx === 0 && dottingManager.lineDotConfigs && dottingManager.lineDotConfigs[lIdx]) {
                            delete dottingManager.lineDotConfigs[lIdx].customDots;
                            dottingManager.lineDotConfigs[lIdx].dotConfigId = null;
                        }
                    }
                });
            });
        } else {
            const key = `${lineIdx}_${wordIdx}`;
            if (dottingManager.wordDotConfigs && dottingManager.wordDotConfigs[key]) {
                delete dottingManager.wordDotConfigs[key].customDots;
                dottingManager.wordDotConfigs[key].dotConfigId = null;
            }
            if (wordIdx === 0 && dottingManager.lineDotConfigs && dottingManager.lineDotConfigs[lineIdx]) {
                delete dottingManager.lineDotConfigs[lineIdx].customDots;
                dottingManager.lineDotConfigs[lineIdx].dotConfigId = null;
            }
        }

        closeModal();
        if (typeof window !== 'undefined' && window.view && typeof window.view.render === 'function') {
            window.view.render();
        }
        if (typeof window !== 'undefined' && window.view && typeof window.view.saveWorkspaceToLocalStorage === 'function') {
            window.view.saveWorkspaceToLocalStorage();
        }
    });

    $('#btn-freestyle-apply').off('click').on('click', function (e) {
        e.preventDefault();
        const finalDots = localDots.map((d, i) => ({
            x: Math.round(d.x * 100) / 100,
            y: Math.round(d.y * 100) / 100,
            label: (d.label || '').trim() || `Nét ${i + 1}`
        }));

        const applyAll = $('#freestyleApplyAll').is(':checked');

        if (applyAll) {
            $('#result').children('p.line').each(function (lIdx) {
                $(this).children('.word').each(function () {
                    const wIdx = parseInt($(this).attr('data-word-idx'), 10);
                    const rawToken = $(this).attr('data-raw') || $(this).text();
                    const wCharUnit = model.getFirstCharUnit(rawToken);
                    if (wCharUnit === charUnit) {
                        const key = `${lIdx}_${wIdx}`;
                        if (!dottingManager.wordDotConfigs) dottingManager.wordDotConfigs = {};
                        dottingManager.wordDotConfigs[key] = {
                            customDots: JSON.parse(JSON.stringify(finalDots)),
                            dotConfigId: 'dynamic'
                        };
                        if (wIdx === 0) {
                            if (!dottingManager.lineDotConfigs[lIdx]) dottingManager.lineDotConfigs[lIdx] = {};
                            dottingManager.lineDotConfigs[lIdx].customDots = JSON.parse(JSON.stringify(finalDots));
                            dottingManager.lineDotConfigs[lIdx].dotConfigId = 'dynamic';
                            dottingManager.lineDotConfigs[lIdx].isCustom = true;
                        }
                    }
                });
            });
        } else {
            const key = `${lineIdx}_${wordIdx}`;
            if (!dottingManager.wordDotConfigs) dottingManager.wordDotConfigs = {};
            dottingManager.wordDotConfigs[key] = {
                customDots: JSON.parse(JSON.stringify(finalDots)),
                dotConfigId: 'dynamic'
            };
            if (wordIdx === 0) {
                if (!dottingManager.lineDotConfigs[lineIdx]) dottingManager.lineDotConfigs[lineIdx] = {};
                dottingManager.lineDotConfigs[lineIdx].customDots = JSON.parse(JSON.stringify(finalDots));
                dottingManager.lineDotConfigs[lineIdx].dotConfigId = 'dynamic';
                dottingManager.lineDotConfigs[lineIdx].isCustom = true;
            }
        }

        closeModal();
        $('#btn-reset-line-dotting').show();
        if (typeof window !== 'undefined' && window.view && typeof window.view.render === 'function') {
            window.view.render();
        }
        if (typeof window !== 'undefined' && window.view && typeof window.view.saveWorkspaceToLocalStorage === 'function') {
            window.view.saveWorkspaceToLocalStorage();
        }
    });
};
