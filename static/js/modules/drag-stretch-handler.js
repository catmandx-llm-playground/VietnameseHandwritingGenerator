import { dottingManager, escapeHtml } from './dotting-manager.js';
import { model } from './model.js';
import { APP_CONFIG } from './config.js';

/**
 * Drag and Stretch Interaction Handler
 * Manages word positioning, horizontal text stretching, per-word bold overrides,
 * and inline popover configuration for lines and individual words.
 */
export const dragStretchHandler = {};

dragStretchHandler.applyWordStretch = function ($word, scale, isManual) {
    if (!$word || !$word.length) return;
    const $wordText = $word.children('.word-text');
    if (!$wordText.length) return;

    if (!scale || Math.abs(scale - 1.0) <= 0.005) {
        $word.css('width', '').removeAttr('data-stretch').removeAttr('data-natural-width').removeAttr('data-manual-stretch').removeAttr('data-auto-stretch');
        $wordText.css({
            'width': '',
            'transform': '',
            'display': '',
            'vertical-align': ''
        });
    } else {
        let naturalWidth = parseFloat($word.attr('data-natural-width'));
        if (!naturalWidth) {
            const currentScale = parseFloat($word.attr('data-stretch')) || 1.0;
            const origWidth = $wordText[0].style.width;
            const origTransform = $wordText[0].style.transform;
            $wordText.css({ 'width': '', 'transform': '' });
            const rect = $wordText[0].getBoundingClientRect();
            naturalWidth = rect.width;
            $wordText.css({ 'width': origWidth, 'transform': origTransform });
            if (naturalWidth > 0) {
                $word.attr('data-natural-width', naturalWidth);
            }
        }

        if (naturalWidth > 0) {
            const scaledWidth = Math.round(naturalWidth * scale * 100) / 100;
            $word.css('width', scaledWidth + 'px');
            $word.attr('data-stretch', scale.toFixed(4));
            if (isManual) {
                $word.attr('data-manual-stretch', 'true').removeAttr('data-auto-stretch');
            } else {
                $word.attr('data-auto-stretch', 'true');
            }
            $wordText.css({
                'display': 'inline-block',
                'vertical-align': 'baseline',
                'width': naturalWidth + 'px',
                'transform': 'scaleX(' + scale + ')',
                'transform-origin': '0 0'
            });
        }
    }

    if (dottingManager.isDottingActive()) {
        const $line = $word.closest('p.line');
        if ($line.length) {
            dottingManager.renderDotsForLineAndPracticeLines($line);
        }
    }
};

dragStretchHandler.setupDragInteractions = function () {
    const $container = $('.board-container');
    let dragState = null;
    let stretchState = null;

    // Tap / click word to activate handles on touch / mobile devices and select line in toolbar
    $container.on('pointerdown click', '.word', function (e) {
        if ($(e.target).closest('.btn-word-stretch, .btn-word-drag, .btn-word-reset, .btn-word-bold').length) {
            return;
        }
        $('.word.is-active').not(this).removeClass('is-active');
        $(this).addClass('is-active');

        const $line = $(this).closest('p.line');
        const srcLineIdx = parseInt($line.attr('data-source-line-idx'), 10);
        if (!isNaN(srcLineIdx) && $('#dotting-line-select').length) {
            if ($('#dotting-line-select').val() != srcLineIdx && $(`#dotting-line-select option[value="${srcLineIdx}"]`).length) {
                $('#dotting-line-select').val(srcLineIdx).trigger('change');
            }
        }
    });

    // Tap / click line background to select line in toolbar
    $container.on('pointerdown click', 'p.line', function (e) {
        if ($(e.target).closest('.word, .line-dot-wrapper, .line-dot-popover, .word-dot-wrapper, .word-dot-config-popover').length) {
            return;
        }
        const srcLineIdx = parseInt($(this).attr('data-source-line-idx'), 10);
        if (!isNaN(srcLineIdx) && $('#dotting-line-select').length) {
            if ($('#dotting-line-select').val() != srcLineIdx && $(`#dotting-line-select option[value="${srcLineIdx}"]`).length) {
                $('#dotting-line-select').val(srcLineIdx).trigger('change');
            }
        }
    });

    $(document).on('pointerdown click', function (e) {
        if (!$(e.target).closest('.word').length) {
            $('.word.is-active').removeClass('is-active');
        }
    });

    // Pointer down on .btn-word-drag: start dragging word
    $container.on('pointerdown', '.btn-word-drag', function (e) {
        if (e.button !== undefined && e.button !== 0) return;

        const handleEl = this;
        const $word = $(handleEl).closest('.word');
        const wordEl = $word[0];
        const $line = $word.closest('p.line');
        const wordIdx = parseInt($word.attr('data-word-idx'), 10) || 0;

        if (typeof handleEl.setPointerCapture === 'function') {
            try {
                handleEl.setPointerCapture(e.pointerId);
            } catch (_) {}
        }

        const startMargin = parseFloat(wordEl.style.marginLeft) || 0;
        const dragCfg = APP_CONFIG.dragPastStart || {};
        const maxLeftDrag = dragCfg.maxLeftDragPx !== undefined ? dragCfg.maxLeftDragPx : 28.35;

        let minMargin = 0;
        if (wordIdx === 0) {
            minMargin = -maxLeftDrag;
        } else {
            const $prevWord = $line.find(`.word[data-word-idx="${wordIdx - 1}"]`);
            if ($prevWord.length) {
                const prevRect = $prevWord[0].getBoundingClientRect();
                const currentRect = wordEl.getBoundingClientRect();
                const gap = currentRect.left - prevRect.right;
                minMargin = startMargin - (gap - 2);
                minMargin = Math.min(minMargin, startMargin);
            } else {
                minMargin = -maxLeftDrag;
            }
        }

        dragState = {
            pointerId: e.pointerId,
            handleEl: handleEl,
            wordEl: wordEl,
            $word: $word,
            startX: e.clientX,
            startMargin: startMargin,
            minMargin: minMargin
        };

        $('.word.is-active').not($word).removeClass('is-active');
        $word.addClass('is-dragging is-active');
        $('body').addClass('is-word-dragging');

        $(window).off('.wordDrag').on('pointermove.wordDrag', handlePointerMove);
        $(window).off('pointerup.wordDrag pointercancel.wordDrag blur.wordDrag').on('pointerup.wordDrag pointercancel.wordDrag blur.wordDrag', endDrag);

        e.preventDefault();
        e.stopPropagation();
    });

    function handlePointerMove(e) {
        if (!dragState) return;
        if (e.pointerType !== 'touch' && e.buttons !== undefined && (e.buttons & 1) === 0) {
            endDrag(e);
            return;
        }
        if (e.pointerId !== undefined && dragState.pointerId !== undefined && e.pointerId !== dragState.pointerId) {
            return;
        }

        const deltaX = e.clientX - dragState.startX;
        let newMargin = dragState.startMargin + deltaX;
        newMargin = Math.max(dragState.minMargin, newMargin);
        dragState.wordEl.style.marginLeft = Math.round(newMargin) + 'px';
        if (dottingManager.isDottingActive()) {
            const $line = dragState.$word.closest('p.line');
            dottingManager.renderDotsForLineAndPracticeLines($line);
        }
    }

    function endDrag(e) {
        if (!dragState) return;
        if (e && e.pointerId !== undefined && dragState.pointerId !== undefined && e.pointerId !== dragState.pointerId) {
            return;
        }

        $(window).off('.wordDrag');

        if (dragState.handleEl && typeof dragState.handleEl.releasePointerCapture === 'function') {
            try {
                if (dragState.pointerId !== undefined) {
                    dragState.handleEl.releasePointerCapture(dragState.pointerId);
                }
            } catch (_) {}
        }

        if (dragState.$word) {
            dragState.$word.removeClass('is-dragging');
            if (dottingManager.isDottingActive()) {
                const $line = dragState.$word.closest('p.line');
                dottingManager.renderDotsForLineAndPracticeLines($line);
            }
        }
        $('body').removeClass('is-word-dragging');
        dragState = null;
        if (typeof window !== 'undefined' && window.view && typeof window.view.triggerAutoSave === 'function') {
            window.view.triggerAutoSave(true);
        }
    }

    $container.on('lostpointercapture', '.btn-word-drag', endDrag);

    function toggleOptimalStretch($word) {
        const currentStretch = parseFloat($word.attr('data-stretch')) || 1.0;
        const isStretched = $word.attr('data-stretch') && Math.abs(currentStretch - 1.0) > 0.005;
        const cfg = APP_CONFIG.wordStretch || { stretchTargetPercent: 121.89 };
        const optimalScale = cfg.stretchTargetPercent / 100;

        if (isStretched) {
            dragStretchHandler.applyWordStretch($word, 1.0);
        } else {
            dragStretchHandler.applyWordStretch($word, optimalScale, true);
        }
        if (typeof window !== 'undefined' && window.view && typeof window.view.triggerAutoSave === 'function') {
            window.view.triggerAutoSave(true);
        }
    }

    let lastStretchClick = 0;
    let lastStretchEl = null;

    // Pointer down on .btn-word-stretch: start stretching word
    $container.on('pointerdown', '.btn-word-stretch', function (e) {
        if (e.button !== undefined && e.button !== 0) return;

        const handleEl = this;
        const $word = $(handleEl).closest('.word');
        const wordEl = $word[0];
        const $wordText = $word.children('.word-text');
        if (!$wordText.length) return;

        const now = Date.now();
        if (lastStretchEl === handleEl && (now - lastStretchClick) < 320) {
            lastStretchClick = 0;
            lastStretchEl = null;
            toggleOptimalStretch($word);
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        lastStretchClick = now;
        lastStretchEl = handleEl;

        if (typeof handleEl.setPointerCapture === 'function') {
            try {
                handleEl.setPointerCapture(e.pointerId);
            } catch (_) {}
        }

        let naturalWidth = parseFloat($word.attr('data-natural-width'));
        if (!naturalWidth) {
            const currentScale = parseFloat($word.attr('data-stretch')) || 1.0;
            const origWidth = $wordText[0].style.width;
            const origTransform = $wordText[0].style.transform;
            $wordText.css({ 'width': '', 'transform': '' });
            const rect = $wordText[0].getBoundingClientRect();
            naturalWidth = rect.width;
            $wordText.css({ 'width': origWidth, 'transform': origTransform });
            if (naturalWidth > 0) {
                $word.attr('data-natural-width', naturalWidth);
            }
        }

        if (!naturalWidth || naturalWidth <= 0) {
            return;
        }

        const startScale = parseFloat($word.attr('data-stretch')) || 1.0;
        const startRenderedWidth = naturalWidth * startScale;

        const $line = $word.closest('p.line');
        const $board = $word.closest('.board');

        const stretchCfg = APP_CONFIG.wordStretch || {
            stretchTargetPercent: 121.89,
            minStretchPercent: 100,
            maxStretchPercent: 150,
            snapTolerancePercent: 2.5
        };

        const targetScale = (stretchCfg.stretchTargetPercent || 121.89) / 100;
        const minScale = (stretchCfg.minStretchPercent || 100) / 100;
        const maxScale = (stretchCfg.maxStretchPercent || 150) / 100;
        const snapTolerance = (stretchCfg.snapTolerancePercent || 2.5) / 100;

        // Create or find the green snap guideline denoting optimal stretch (121.89%)
        let $guideline = $board.find('.snap-guideline');
        if (!$guideline.length) {
            $guideline = $('<div class="snap-guideline no-print"></div>');
            $board.append($guideline);
        }

        const boardRect = $board.length ? $board[0].getBoundingClientRect() : { left: 0, top: 0 };
        const lineRect = $line.length ? $line[0].getBoundingClientRect() : { left: 0, top: 0, height: 153.6 };
        const wordRect = wordEl.getBoundingClientRect();

        // Calculate snap guideline position on board (anchored at target width right edge)
        const wordStartLeftOnBoard = wordRect.left - boardRect.left + ($board.scrollLeft() || 0);
        const targetSnapLeft = wordStartLeftOnBoard + (naturalWidth * targetScale);
        const lineTopOnBoard = lineRect.top - boardRect.top + ($board.scrollTop() || 0);

        const isCurrentlySnapped = Math.abs(startScale - targetScale) <= snapTolerance;

        $guideline.css({
            top: lineTopOnBoard + 'px',
            height: lineRect.height + 'px',
            left: targetSnapLeft + 'px',
            display: 'block'
        });

        if (isCurrentlySnapped) {
            $guideline.addClass('is-snapped');
            $(handleEl).addClass('is-snapped');
        } else {
            $guideline.removeClass('is-snapped');
            $(handleEl).removeClass('is-snapped');
        }

        stretchState = {
            pointerId: e.pointerId,
            handleEl: handleEl,
            $word: $word,
            $wordText: $wordText,
            $stretchBtn: $(handleEl),
            $line: $line,
            $board: $board,
            $guideline: $guideline,
            naturalWidth: naturalWidth,
            startX: e.clientX,
            startRenderedWidth: startRenderedWidth,
            targetScale: targetScale,
            minScale: minScale,
            maxScale: maxScale,
            snapTolerance: snapTolerance,
            lastScale: startScale
        };

        $('.word.is-active').not($word).removeClass('is-active');
        $word.addClass('is-stretching is-active');
        $('body').addClass('is-word-stretching');

        $(window).off('.wordStretch').on('pointermove.wordStretch', handleStretchMove);
        $(window).off('pointerup.wordStretch pointercancel.wordStretch blur.wordStretch').on('pointerup.wordStretch pointercancel.wordStretch blur.wordStretch', endStretch);

        e.preventDefault();
        e.stopPropagation();
    });

    function handleStretchMove(e) {
        if (!stretchState) return;
        if (e.pointerType !== 'touch' && e.buttons !== undefined && (e.buttons & 1) === 0) {
            endStretch(e);
            return;
        }
        if (e.pointerId !== undefined && stretchState.pointerId !== undefined && e.pointerId !== stretchState.pointerId) {
            return;
        }

        const deltaX = e.clientX - stretchState.startX;
        const newRenderedWidth = stretchState.startRenderedWidth + deltaX;
        let scale = newRenderedWidth / stretchState.naturalWidth;

        scale = Math.max(stretchState.minScale, Math.min(stretchState.maxScale, scale));

        const isSnapped = Math.abs(scale - stretchState.targetScale) <= stretchState.snapTolerance;
        if (isSnapped) {
            scale = stretchState.targetScale;
            stretchState.$stretchBtn.addClass('is-snapped');
            stretchState.$guideline.addClass('is-snapped');
        } else {
            stretchState.$stretchBtn.removeClass('is-snapped');
            stretchState.$guideline.removeClass('is-snapped');
            if (Math.abs(scale - 1.0) <= 0.02) {
                scale = 1.0;
            }
        }

        stretchState.lastScale = scale;
        dragStretchHandler.applyWordStretch(stretchState.$word, scale, true);
    }

    function endStretch(e) {
        if (!stretchState) return;
        if (e && e.pointerId !== undefined && stretchState.pointerId !== undefined && e.pointerId !== stretchState.pointerId) {
            return;
        }

        $(window).off('.wordStretch');

        if (stretchState.handleEl && typeof stretchState.handleEl.releasePointerCapture === 'function') {
            try {
                if (stretchState.pointerId !== undefined) {
                    stretchState.handleEl.releasePointerCapture(stretchState.pointerId);
                }
            } catch (_) {}
        }

        if (stretchState.$word) {
            stretchState.$word.removeClass('is-stretching');
        }
        if (stretchState.$stretchBtn) {
            stretchState.$stretchBtn.removeClass('is-stretching is-snapped');
        }
        $('body').removeClass('is-word-stretching');
        if (stretchState.$guideline) {
            stretchState.$guideline.removeClass('is-snapped').hide();
        }
        stretchState = null;
        if (typeof window !== 'undefined' && window.view && typeof window.view.triggerAutoSave === 'function') {
            window.view.triggerAutoSave(true);
        }
    }

    $container.on('lostpointercapture', '.btn-word-stretch', endStretch);

    $container.on('dblclick', '.btn-word-stretch', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const $word = $(this).closest('.word');
        toggleOptimalStretch($word);
    });

    // Word bold override toggle
    $container.on('pointerdown click', '.btn-word-bold', function (e) {
        e.stopPropagation();
        e.preventDefault();
        if (e.type === 'pointerdown' && e.button !== 0) return;

        const $btn = $(this);
        const $word = $btn.closest('.word');
        const currentOverride = $word.attr('data-weight');
        const isGlobalBold = $('#weight-checkbox').is(':checked') || $('.result-text, #result').hasClass('bold');

        let nextOverride = null;
        if (!currentOverride) {
            nextOverride = isGlobalBold ? 'normal' : 'bold';
        } else if (currentOverride === 'bold') {
            nextOverride = isGlobalBold ? null : 'normal';
        } else if (currentOverride === 'normal') {
            nextOverride = isGlobalBold ? 'bold' : null;
        }

        if (nextOverride) {
            $word.attr('data-weight', nextOverride);
            $btn.addClass('is-override');
            $btn.attr('title', nextOverride === 'bold' ? 'Đang ép chữ đậm (Nhấp để đổi)' : 'Đang ép chữ thanh (Nhấp để đổi)');
        } else {
            $word.removeAttr('data-weight');
            $btn.removeClass('is-override');
            $btn.attr('title', isGlobalBold ? 'Đang theo mẫu đậm (Nhấp để đổi sang thanh)' : 'Đang theo mẫu thanh (Nhấp để đổi sang đậm)');
        }

        if (dottingManager.isDottingActive()) {
            const $line = $word.closest('p.line');
            if ($line.length) {
                dottingManager.renderDotsForLineAndPracticeLines($line);
            }
        }

        if (typeof window !== 'undefined' && window.view && typeof window.view.triggerAutoSave === 'function') {
            window.view.triggerAutoSave(true);
        }
    });

    // Reset single word margin and stretch
    $container.on('pointerdown click', '.btn-word-reset', function (e) {
        e.stopPropagation();
        e.preventDefault();
        if (e.type === 'pointerdown' && e.button !== 0) return;

        const $word = $(this).closest('.word');
        $word[0].style.marginLeft = '';
        dragStretchHandler.applyWordStretch($word, 1.0);
        $word.removeAttr('data-weight');
        $word.find('.btn-word-bold').removeClass('is-override');

        if (dottingManager.isDottingActive()) {
            const $line = $word.closest('p.line');
            if ($line.length) {
                dottingManager.renderDotsForLineAndPracticeLines($line);
            }
        }
        if (typeof window !== 'undefined' && window.view && typeof window.view.triggerAutoSave === 'function') {
            window.view.triggerAutoSave(true);
        }
    });

    // Double-click line: reset all word positions and stretches on that line
    $container.on('dblclick', 'p.line', function (e) {
        if ($(e.target).closest('.word-handle, .btn-word-stretch, .btn-word-drag, .btn-word-reset, .btn-word-bold, .btn-line-dot-badge, .btn-word-dot-badge').length) {
            return;
        }
        const $line = $(this);
        $line.children('.word').each(function () {
            this.style.marginLeft = '';
            dragStretchHandler.applyWordStretch($(this), 1.0);
            $(this).removeAttr('data-weight');
            $(this).find('.btn-word-bold').removeClass('is-override');
        });
        if (dottingManager.isDottingActive()) {
            dottingManager.renderDotsForLineAndPracticeLines($line);
        }
        if (typeof window !== 'undefined' && window.view && typeof window.view.triggerAutoSave === 'function') {
            window.view.triggerAutoSave(true);
        }
    });

    // Line dotting badge click handler: show popover
    $container.on('click', '.btn-line-dot-badge', function (e) {
        e.stopPropagation();
        e.preventDefault();
        const $badge = $(this);
        const $wrapper = $badge.closest('.line-dot-wrapper');
        const $word = $badge.closest('.word');
        const $line = $badge.closest('p.line');
        const lineIdx = parseInt($badge.attr('data-line-idx'), 10);

        if ($wrapper.children('.line-dot-popover').length) {
            $('.line-dot-popover').remove();
            $('.word').removeClass('is-dotting-open');
            $('p.line').removeClass('has-dot-popover');
            return;
        }

        $('.line-dot-popover, .word-dot-config-popover').remove();
        $('.word').removeClass('is-dotting-open');
        $('p.line').removeClass('has-dot-popover');

        $line.addClass('has-dot-popover');
        $word.addClass('is-dotting-open');

        $('#dotting-line-select').val(lineIdx).trigger('change');

        const cfg = dottingManager.getDottingConfig(lineIdx);
        const lineFirstWord = $line.children('.word').first();
        const lineRawText = lineFirstWord.length ? (lineFirstWord.attr('data-raw') || lineFirstWord.find('.word-text').text()) : '';
        const lineCharUnit = model.getFirstCharUnit(lineRawText);
        const lineActiveDotCfg = dottingManager.getActiveDotConfig(lineCharUnit, lineIdx, 0);
        const lineAvailableCfgs = model.getGlyphDotConfigs(lineCharUnit);

        let cfgOptionsHtml = '';
        if (lineAvailableCfgs && lineAvailableCfgs.length > 0) {
            const isNone = !lineActiveDotCfg;
            cfgOptionsHtml = `
                <div class="popover-row">
                    <label>Mẫu chấm:</label>
                    <select class="form-select form-select-sm popover-cfg-select" style="max-width: 125px; font-size: 0.75rem; padding: 1px 4px;">
                        <option value="none" ${isNone ? 'selected' : ''}>Không chấm</option>
                        ${lineAvailableCfgs.map(c => `<option value="${escapeHtml(c.id)}" ${(!isNone && c.id === (lineActiveDotCfg ? lineActiveDotCfg.id : '')) ? 'selected' : ''}>${escapeHtml(c.name)} (${(c.dots || []).length}c)</option>`).join('')}
                    </select>
                </div>
            `;
        }

        const $popover = $(`
            <div class="line-dot-popover no-print" data-line-idx="${lineIdx}">
                <div class="popover-header">
                    <strong>Dòng ${lineIdx + 1}</strong>
                    <button type="button" class="popover-close" title="Đóng">&times;</button>
                </div>
                <div class="popover-row">
                    <label>Khoảng cách:</label>
                    <div class="step-control">
                        <button type="button" class="btn-step" data-action="dec" title="Giảm khoảng cách">-</button>
                        <span class="step-val step-spaces-val">${cfg.spaces} ô</span>
                        <button type="button" class="btn-step" data-action="inc" title="Tăng khoảng cách">+</button>
                    </div>
                </div>
                <div class="popover-row">
                    <label>Số chấm:</label>
                    <span class="step-val step-reps-val">${cfg.repetitions}</span>
                </div>
                <div class="popover-row">
                    <label>Số dòng:</label>
                    <div class="step-control">
                        <button type="button" class="btn-step-lines" data-action="dec" title="Giảm số dòng">-</button>
                        <span class="step-val step-lines-val">${cfg.linesCount}</span>
                        <button type="button" class="btn-step-lines" data-action="inc" title="Tăng số dòng">+</button>
                    </div>
                </div>
                ${cfgOptionsHtml}
                <div class="popover-row">
                    <label>Nét mờ:</label>
                    <select class="form-select form-select-sm popover-outline-select" style="max-width: 125px; font-size: 0.75rem; padding: 1px 4px;">
                        <option value="none" ${cfg.outline === 'none' ? 'selected' : ''}>Không nét mờ</option>
                        <optgroup label="Nét mờ (Độ mờ)">
                            <option value="faint_all" ${cfg.outline === 'faint_all' || cfg.outline === 'all' ? 'selected' : ''}>Cả dòng (Mờ)</option>
                            <option value="faint_first" ${cfg.outline === 'faint_first' || cfg.outline === 'first' ? 'selected' : ''}>Chữ đầu (Mờ)</option>
                        </optgroup>
                        <optgroup label="Chữ chấm đồ (HP001TD)">
                            <option value="dotted_all" ${cfg.outline === 'dotted_all' ? 'selected' : ''}>Cả dòng (Chấm đồ)</option>
                            <option value="dotted_first" ${cfg.outline === 'dotted_first' ? 'selected' : ''}>Chữ đầu (Chấm đồ)</option>
                        </optgroup>
                        <optgroup label="Viền nét (Rỗng lòng)">
                            <option value="curve_all" ${cfg.outline === 'curve_all' ? 'selected' : ''}>Cả dòng (Viền nét)</option>
                            <option value="curve_first" ${cfg.outline === 'curve_first' ? 'selected' : ''}>Chữ đầu (Viền nét)</option>
                        </optgroup>
                    </select>
                </div>
                <div class="popover-row">
                    <label style="cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                        <input type="checkbox" class="popover-fulldot" ${cfg.fullDot ? 'checked' : ''} /> Chấm hết dòng
                    </label>
                </div>
                ${cfg.isCustom ? '<button type="button" class="btn-popover-reset">Đặt lại mặc định</button>' : ''}
            </div>
        `);

        $wrapper.append($popover);
    });

    // Word dotting configuration popover click handler
    $container.on('click', '.btn-word-dot-badge', function (e) {
        e.stopPropagation();
        e.preventDefault();
        const $badge = $(this);
        const $wrapper = $badge.closest('.word-dot-wrapper');
        const $word = $badge.closest('.word');
        const $line = $badge.closest('p.line');
        const lineIdx = parseInt($badge.attr('data-line-idx'), 10);
        const wordIdx = parseInt($badge.attr('data-word-idx'), 10);
        const charUnit = $badge.attr('data-char') || 'a';

        if ($wrapper.children('.word-dot-config-popover').length) {
            $('.word-dot-config-popover, .line-dot-popover').remove();
            $('.word').removeClass('is-dotting-open');
            $('p.line').removeClass('has-dot-popover');
            return;
        }

        $('.word-dot-config-popover, .line-dot-popover').remove();
        $('.word').removeClass('is-dotting-open');
        $('p.line').removeClass('has-dot-popover');

        $line.addClass('has-dot-popover');
        $word.addClass('is-dotting-open');

        const activeConfig = dottingManager.getActiveDotConfig(charUnit, lineIdx, wordIdx);
        const configs = model.getGlyphDotConfigs(charUnit);
        const wordKey = `${lineIdx}_${wordIdx}`;
        const wordCfg = dottingManager.wordDotConfigs && dottingManager.wordDotConfigs[wordKey];
        const lineCfg = dottingManager.lineDotConfigs && dottingManager.lineDotConfigs[lineIdx];

        let customDots = null;
        if (wordCfg && Array.isArray(wordCfg.customDots) && wordCfg.customDots.length > 0) {
            customDots = wordCfg.customDots;
        } else if (wordIdx === 0 && lineCfg && Array.isArray(lineCfg.customDots) && lineCfg.customDots.length > 0) {
            customDots = lineCfg.customDots;
        }

        const isNoneSelected = (activeConfig === null);
        const noneItemHtml = `
            <div class="dot-cfg-item ${isNoneSelected ? 'is-selected' : ''}" data-config-id="none">
                <div class="dot-cfg-item-main">
                    <div class="dot-cfg-item-title">
                        <strong><i class="fa-solid fa-ban text-secondary me-1"></i> Không chấm</strong>
                    </div>
                    <div class="dot-cfg-item-desc">Tắt hiển thị điểm chấm cho chữ này</div>
                </div>
                ${isNoneSelected ? '<i class="fa-solid fa-check text-success dot-cfg-check"></i>' : ''}
            </div>
        `;

        let customItemHtml = '';
        if (customDots && customDots.length > 0) {
            const isSelected = activeConfig && (activeConfig.id === 'dynamic');
            customItemHtml = `
                <div class="dot-cfg-item is-custom-dynamic ${isSelected ? 'is-selected' : ''}" data-config-id="dynamic">
                    <div class="dot-cfg-item-main">
                        <div class="dot-cfg-item-title">
                            <strong><i class="fa-solid fa-wand-magic-sparkles text-warning me-1"></i> Chấm tự do</strong>
                            <span class="badge bg-danger rounded-pill">${customDots.length} chấm</span>
                        </div>
                        <div class="dot-cfg-item-desc">${customDots.length} điểm chấm tự do tùy chỉnh</div>
                    </div>
                    <div class="dot-cfg-actions">
                        <button type="button" class="btn-icon-xs btn-edit-freestyle-dots" title="Chỉnh sửa chấm tự do"><i class="fa-solid fa-pen"></i></button>
                        <button type="button" class="btn-icon-xs text-danger btn-remove-freestyle-dots" title="Xóa chấm tự do"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
        }

        let configsHtml = '';
        if (configs && configs.length > 0) {
            configs.forEach((cfg) => {
                const isSelected = activeConfig && (cfg.id === activeConfig.id);
                const dotCount = (cfg.dots && cfg.dots.length) || 1;
                configsHtml += `
                    <div class="dot-cfg-item ${isSelected ? 'is-selected' : ''}" data-config-id="${escapeHtml(cfg.id)}">
                        <div class="dot-cfg-item-main">
                            <div class="dot-cfg-item-title">
                                <strong>${escapeHtml(cfg.name)}</strong>
                                <span class="badge bg-danger rounded-pill">${dotCount} chấm</span>
                            </div>
                            ${cfg.desc ? `<div class="dot-cfg-item-desc">${escapeHtml(cfg.desc)}</div>` : ''}
                        </div>
                        ${isSelected ? '<i class="fa-solid fa-check text-success dot-cfg-check"></i>' : ''}
                    </div>
                `;
            });
        }

        let popoverBodyHtml = `
            <div class="dot-cfg-list">
                ${noneItemHtml}
                ${customItemHtml}
                ${configsHtml}
            </div>
            ${(!customDots && (!configs || configs.length === 0)) ? `
                <div class="popover-dynamic-teaser" style="margin: 8px 0 4px 0;">
                    <div class="dynamic-hint" style="margin-bottom: 8px; font-size: 0.8rem; color: #64748b;">
                        Chữ này chưa có cấu hình chấm mẫu trong editor. Bạn có thể tự do đặt các điểm chấm trực quan bằng công cụ bên dưới:
                    </div>
                    <button type="button" class="btn-open-freestyle-modal">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Tùy chỉnh chấm tự do...
                    </button>
                </div>
            ` : `
                <button type="button" class="btn-open-freestyle-modal">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> ${customDots ? 'Chỉnh sửa chấm tự do...' : 'Tùy chỉnh chấm tự do...'}
                </button>
            `}
        `;

        const rawWord = $word.attr('data-raw') || '';
        const wordWeight = $word.attr('data-weight') || null;
        const isGlobalBold = $('#font-weight-select').val() === 'bold' || $('#result').hasClass('bold');
        const finalWeight = wordWeight ? wordWeight : (isGlobalBold ? 'bold' : 'normal');
        const displayGlyph = (rawWord && model.getWordFirstGlyph) ? model.getWordFirstGlyph(rawWord) : (model.getUnicodeStr ? model.getUnicodeStr(charUnit) : charUnit);

        const $popover = $(`
            <div class="word-dot-config-popover no-print" data-line-idx="${lineIdx}" data-word-idx="${wordIdx}" data-char="${escapeHtml(charUnit)}">
                <div class="popover-header">
                    <div class="d-flex align-items-center gap-1">
                        <i class="fa-solid fa-braille text-danger"></i>
                        <strong>Cấu hình chấm:</strong>
                        <span class="badge bg-primary text-white" style="font-family: HP001, serif; font-size: 0.95rem; line-height: 1; font-weight: ${finalWeight};">${escapeHtml(displayGlyph)}</span>
                    </div>
                    <button type="button" class="popover-close" title="Đóng">&times;</button>
                </div>
                ${popoverBodyHtml}
            </div>
        `);

        $wrapper.append($popover);
    });

    $container.on('click', '.word-dot-config-popover .btn-open-freestyle-modal, .word-dot-config-popover .btn-edit-freestyle-dots', function (e) {
        e.stopPropagation();
        e.preventDefault();
        const $popover = $(this).closest('.word-dot-config-popover');
        const lineIdx = parseInt($popover.attr('data-line-idx'), 10);
        const wordIdx = parseInt($popover.attr('data-word-idx'), 10);
        const charUnit = $popover.attr('data-char');
        if (typeof window !== 'undefined' && window.view && typeof window.view.openFreestyleDottingModal === 'function') {
            window.view.openFreestyleDottingModal(charUnit, lineIdx, wordIdx);
        }
    });

    $container.on('click', '.word-dot-config-popover .btn-remove-freestyle-dots', function (e) {
        e.stopPropagation();
        e.preventDefault();
        const $popover = $(this).closest('.word-dot-config-popover');
        const lineIdx = parseInt($popover.attr('data-line-idx'), 10);
        const wordIdx = parseInt($popover.attr('data-word-idx'), 10);
        const wordKey = `${lineIdx}_${wordIdx}`;

        if (dottingManager.wordDotConfigs && dottingManager.wordDotConfigs[wordKey]) {
            delete dottingManager.wordDotConfigs[wordKey].customDots;
            dottingManager.wordDotConfigs[wordKey].dotConfigId = (wordIdx > 0 ? 'none' : null);
        }
        if (wordIdx === 0 && dottingManager.lineDotConfigs && dottingManager.lineDotConfigs[lineIdx]) {
            delete dottingManager.lineDotConfigs[lineIdx].customDots;
            dottingManager.lineDotConfigs[lineIdx].dotConfigId = null;
        }

        $('.word-dot-config-popover, .line-dot-popover').remove();
        $('.word').removeClass('is-dotting-open');
        $('p.line').removeClass('has-dot-popover');

        if (typeof window !== 'undefined' && window.view && typeof window.view.render === 'function') {
            window.view.render();
        }
        if (typeof window !== 'undefined' && window.view && typeof window.view.saveWorkspaceToLocalStorage === 'function') {
            window.view.saveWorkspaceToLocalStorage();
        }
    });

    $container.on('click', '.word-dot-config-popover .dot-cfg-item', function (e) {
        if ($(e.target).closest('.dot-cfg-actions').length) {
            return;
        }
        e.stopPropagation();
        e.preventDefault();
        const $item = $(this);
        const $popover = $item.closest('.word-dot-config-popover');
        const lineIdx = parseInt($popover.attr('data-line-idx'), 10);
        const wordIdx = parseInt($popover.attr('data-word-idx'), 10);
        const configId = $item.attr('data-config-id');
        const wordKey = `${lineIdx}_${wordIdx}`;

        if (!dottingManager.lineDotConfigs[lineIdx]) {
            dottingManager.lineDotConfigs[lineIdx] = {};
        }
        if (!dottingManager.wordDotConfigs) dottingManager.wordDotConfigs = {};

        if (configId === 'dynamic') {
            if (dottingManager.wordDotConfigs[wordKey]) {
                dottingManager.wordDotConfigs[wordKey].dotConfigId = 'dynamic';
            }
            if (wordIdx === 0) {
                dottingManager.lineDotConfigs[lineIdx].dotConfigId = 'dynamic';
                dottingManager.lineDotConfigs[lineIdx].isCustom = true;
            }
        } else {
            if (dottingManager.wordDotConfigs[wordKey]) {
                delete dottingManager.wordDotConfigs[wordKey].customDots;
            }
            if (wordIdx === 0 && dottingManager.lineDotConfigs[lineIdx]) {
                delete dottingManager.lineDotConfigs[lineIdx].customDots;
            }

            if (configId === 'none') {
                dottingManager.wordDotConfigs[wordKey] = {
                    dotConfigId: 'none',
                    enabled: false
                };
                if (wordIdx === 0) {
                    dottingManager.lineDotConfigs[lineIdx].dotConfigId = 'none';
                    dottingManager.lineDotConfigs[lineIdx].isCustom = true;
                }
            } else {
                dottingManager.wordDotConfigs[wordKey] = {
                    dotConfigId: configId,
                    enabled: true
                };
                if (wordIdx === 0) {
                    dottingManager.lineDotConfigs[lineIdx].dotConfigId = configId;
                    dottingManager.lineDotConfigs[lineIdx].isCustom = true;
                }
            }
        }

        $('.word-dot-config-popover, .line-dot-popover').remove();
        $('.word').removeClass('is-dotting-open');
        $('p.line').removeClass('has-dot-popover');

        if (typeof window !== 'undefined' && window.view && typeof window.view.render === 'function') {
            window.view.render();
        }
        if (typeof window !== 'undefined' && window.view && typeof window.view.saveWorkspaceToLocalStorage === 'function') {
            window.view.saveWorkspaceToLocalStorage();
        }
    });

    $container.on('change', '.line-dot-popover .popover-cfg-select', function (e) {
        e.stopPropagation();
        const $select = $(this);
        const $popover = $select.closest('.line-dot-popover');
        const lineIdx = parseInt($popover.attr('data-line-idx'), 10);
        const chosenId = $select.val();

        if (!dottingManager.lineDotConfigs[lineIdx]) {
            dottingManager.lineDotConfigs[lineIdx] = {};
        }

        if (chosenId === 'none') {
            dottingManager.lineDotConfigs[lineIdx].dotConfigId = 'none';
        } else {
            dottingManager.lineDotConfigs[lineIdx].dotConfigId = chosenId;
        }
        dottingManager.lineDotConfigs[lineIdx].isCustom = true;

        if (typeof window !== 'undefined' && window.view && typeof window.view.render === 'function') {
            window.view.render();
        }
        if (typeof window !== 'undefined' && window.view && typeof window.view.saveWorkspaceToLocalStorage === 'function') {
            window.view.saveWorkspaceToLocalStorage();
        }
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('.line-dot-wrapper, .word-dot-wrapper, .line-dot-popover, .word-dot-config-popover').length) {
            $('.line-dot-popover, .word-dot-config-popover').remove();
            $('.word').removeClass('is-dotting-open');
            $('p.line').removeClass('has-dot-popover');
        }
    });

    $container.on('click', '.popover-close', function (e) {
        e.stopPropagation();
        $(this).closest('.line-dot-popover, .word-dot-config-popover').remove();
        $('.word').removeClass('is-dotting-open');
        $('p.line').removeClass('has-dot-popover');
    });

    $container.on('click', '.line-dot-popover .btn-step', function (e) {
        e.stopPropagation();
        const $btn = $(this);
        const $popover = $btn.closest('.line-dot-popover');
        const lineIdx = parseInt($popover.attr('data-line-idx'), 10);
        const action = $btn.attr('data-action');

        const cfg = dottingManager.getDottingConfig(lineIdx);
        let currentSpaces = cfg.spaces;
        if (action === 'inc') {
            currentSpaces = Math.min(30, currentSpaces + 1);
        } else {
            currentSpaces = Math.max(1, currentSpaces - 1);
        }

        if (!dottingManager.lineDotConfigs[lineIdx]) {
            dottingManager.lineDotConfigs[lineIdx] = {};
        }
        dottingManager.lineDotConfigs[lineIdx].spaces = currentSpaces;
        dottingManager.lineDotConfigs[lineIdx].isCustom = true;

        $popover.find('.step-spaces-val').text(currentSpaces + ' ô');
        const newCfg = dottingManager.getDottingConfig(lineIdx);
        $popover.find('.step-reps-val').text(newCfg.repetitions);

        if (!$popover.find('.btn-popover-reset').length) {
            $popover.append('<button type="button" class="btn-popover-reset">Đặt lại mặc định</button>');
        }

        if ($('#dotting-line-select').val() == lineIdx) {
            $('#dotting-spaces-input').val(currentSpaces);
            dottingManager.updateDottingControlsState();
        }

        const $line = $(`p.line[data-source-line-idx="${lineIdx}"][data-is-practice="false"]`).first();
        if ($line.length) {
            dottingManager.renderDotsForLineAndPracticeLines($line);
        }
        dottingManager.updateDottingLineSelect();
        if (typeof window !== 'undefined' && window.view && typeof window.view.triggerAutoSave === 'function') {
            window.view.triggerAutoSave(true);
        }
    });

    $container.on('click', '.line-dot-popover .btn-step-lines', function (e) {
        e.stopPropagation();
        const $btn = $(this);
        const $popover = $btn.closest('.line-dot-popover');
        const lineIdx = parseInt($popover.attr('data-line-idx'), 10);
        const action = $btn.attr('data-action');

        const cfg = dottingManager.getDottingConfig(lineIdx);
        let currentLines = cfg.linesCount;
        if (action === 'inc') {
            currentLines = Math.min(30, currentLines + 1);
        } else {
            currentLines = Math.max(1, currentLines - 1);
        }

        if (!dottingManager.lineDotConfigs[lineIdx]) {
            dottingManager.lineDotConfigs[lineIdx] = {};
        }
        dottingManager.lineDotConfigs[lineIdx].linesCount = currentLines;
        dottingManager.lineDotConfigs[lineIdx].isCustom = true;

        $popover.find('.step-lines-val').text(currentLines);

        if (!$popover.find('.btn-popover-reset').length) {
            $popover.append('<button type="button" class="btn-popover-reset">Đặt lại mặc định</button>');
        }

        if ($('#dotting-line-select').val() == lineIdx) {
            $('#dotting-lines-input').val(currentLines);
        }

        if (typeof window !== 'undefined' && window.view && typeof window.view.render === 'function') {
            window.view.render();
        }
        dottingManager.updateDottingLineSelect();
        if (typeof window !== 'undefined' && window.view && typeof window.view.triggerAutoSave === 'function') {
            window.view.triggerAutoSave(true);
        }
    });

    $container.on('change', '.line-dot-popover .popover-fulldot', function (e) {
        e.stopPropagation();
        const $cb = $(this);
        const $popover = $cb.closest('.line-dot-popover');
        const lineIdx = parseInt($popover.attr('data-line-idx'), 10);
        const isChecked = $cb.is(':checked');

        if (!dottingManager.lineDotConfigs[lineIdx]) {
            dottingManager.lineDotConfigs[lineIdx] = {};
        }
        dottingManager.lineDotConfigs[lineIdx].fullDot = isChecked;
        dottingManager.lineDotConfigs[lineIdx].isCustom = true;

        if (!$popover.find('.btn-popover-reset').length) {
            $popover.append('<button type="button" class="btn-popover-reset">Đặt lại mặc định</button>');
        }

        if ($('#dotting-line-select').val() == lineIdx) {
            $('#dotting-fulldot-checkbox').prop('checked', isChecked);
        }

        const $line = $(`p.line[data-source-line-idx="${lineIdx}"][data-is-practice="false"]`).first();
        if ($line.length) {
            dottingManager.renderDotsForLineAndPracticeLines($line);
        }
        if (typeof window !== 'undefined' && window.view && typeof window.view.triggerAutoSave === 'function') {
            window.view.triggerAutoSave(true);
        }
    });

    $container.on('change', '.line-dot-popover .popover-outline-select', function (e) {
        e.stopPropagation();
        const $select = $(this);
        const $popover = $select.closest('.line-dot-popover');
        const lineIdx = parseInt($popover.attr('data-line-idx'), 10);
        const val = $select.val();

        if (!dottingManager.lineDotConfigs[lineIdx]) {
            dottingManager.lineDotConfigs[lineIdx] = {};
        }
        dottingManager.lineDotConfigs[lineIdx].outline = val;
        dottingManager.lineDotConfigs[lineIdx].isCustom = true;

        if (!$popover.find('.btn-popover-reset').length) {
            $popover.append('<button type="button" class="btn-popover-reset">Đặt lại mặc định</button>');
        }

        if ($('#dotting-line-select').val() == lineIdx) {
            $('#dotting-outline-select').val(val);
        }

        const $line = $(`p.line[data-source-line-idx="${lineIdx}"][data-is-practice="false"]`).first();
        if ($line.length) {
            dottingManager.renderDotsForLineAndPracticeLines($line);
        }
        if (typeof window !== 'undefined' && window.view && typeof window.view.triggerAutoSave === 'function') {
            window.view.triggerAutoSave(true);
        }
    });

    $container.on('click', '.line-dot-popover .btn-popover-reset', function (e) {
        e.stopPropagation();
        const $popover = $(this).closest('.line-dot-popover');
        const lineIdx = parseInt($popover.attr('data-line-idx'), 10);

        delete dottingManager.lineDotConfigs[lineIdx];

        $popover.remove();
        $('.word').removeClass('is-dotting-open');
        $('p.line').removeClass('has-dot-popover');

        dottingManager.updateDottingLineSelect();
        dottingManager.updateDottingControlsState();

        if (typeof window !== 'undefined' && window.view && typeof window.view.render === 'function') {
            window.view.render();
        }
        if (typeof window !== 'undefined' && window.view && typeof window.view.triggerAutoSave === 'function') {
            window.view.triggerAutoSave(true);
        }
    });
};
