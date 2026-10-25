import { dottingManager } from './dotting-manager.js';

/**
 * Storage & Persistence Manager
 * Manages LocalStorage auto-save drafts and `.json` project file import/export.
 */
export const storageManager = {
    _autoSaveTimer: null,
    _isApplyingState: false,
    _draftBannerTimer: null
};

storageManager.generateFileName = function (layoutPrefix, text, ext = 'png') {
    let cleanText = (text || '')
        .toLowerCase()
        .trim()
        .replace(/[\s\t\n]+/g, '_')
        .replace(/[/\\:*?"<>|#%&{}+,;=~`^!@$()[\].,]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');

    if (!cleanText) cleanText = 'chu_dep';
    let prefix = layoutPrefix || 'blackboard';
    let base = `${prefix}_${cleanText}`;

    const extension = ext.startsWith('.') ? ext : ('.' + ext);
    const maxBaseLen = 50 - extension.length;
    if (base.length > maxBaseLen) {
        base = base.substring(0, maxBaseLen).replace(/_+$/, '');
    }
    return base + extension;
};

storageManager.downloadSvg = function (svgContent, fileName) {
    return new Promise((resolve) => {
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName.endsWith('.svg') ? fileName : (fileName + '.svg');
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            if (document.body.contains(a)) {
                document.body.removeChild(a);
            }
            resolve();
        }, 300);
        setTimeout(() => {
            try {
                URL.revokeObjectURL(url);
            } catch (e) {}
        }, 60000);
    });
};

storageManager.downloadCanvasAsPng = function (canvas, fileName) {
    return new Promise((resolve) => {
        const triggerDownload = (url, isBlob) => {
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                if (document.body.contains(a)) {
                    document.body.removeChild(a);
                }
                resolve();
            }, 300);
            if (isBlob) {
                setTimeout(() => {
                    try {
                        URL.revokeObjectURL(url);
                    } catch (e) {}
                }, 60000);
            }
        };

        if (canvas.toBlob) {
            canvas.toBlob(function (blob) {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    triggerDownload(url, true);
                } else {
                    try {
                        const dataUrl = canvas.toDataURL('image/png');
                        triggerDownload(dataUrl, false);
                    } catch (e) {
                        console.error('Canvas export error:', e);
                        resolve();
                    }
                }
            }, 'image/png');
        } else {
            try {
                const dataUrl = canvas.toDataURL('image/png');
                triggerDownload(dataUrl, false);
            } catch (e) {
                console.error('Canvas export error:', e);
                resolve();
            }
        }
    });
};

storageManager.captureWorkspaceState = function () {
    const $input = $('#input');
    const state = {
        app: "VietnameseHandwritingGenerator",
        version: 1,
        savedAt: new Date().toISOString(),
        text: $input.val() || '',
        sampleSelect: $('#sample-select').val() || '',
        settings: {
            fontSize: $('#font-size-select').val() || '72',
            boardColor: $('#board-color-select').val() || 'black',
            fontColor: $('#font-color-input').val() || '#ffffff',
            weight: $('#weight-checkbox').is(':checked'),
            style: $('#style-checkbox').is(':checked'),
            autoStretch: $('#autostretch-checkbox').is(':checked')
        },
        dotting: {
            enabled: $('#dotting-checkbox').is(':checked'),
            spaces: parseInt($('#dotting-spaces-input').val(), 10) || 2,
            repetitions: parseInt($('#dotting-reps-input').val(), 10) || 5,
            linesCount: parseInt($('#dotting-lines-input').val(), 10) || 1,
            fullDot: $('#dotting-fulldot-checkbox').is(':checked'),
            outline: $('#dotting-outline-select').val() || 'none',
            color: $('#dotting-color-input').val() || '#e53935',
            userCustomGlobalSpaces: dottingManager.userCustomGlobalSpaces !== undefined ? dottingManager.userCustomGlobalSpaces : null,
            userCustomGlobalLinesCount: dottingManager.userCustomGlobalLinesCount !== undefined ? dottingManager.userCustomGlobalLinesCount : null,
            userCustomGlobalFullDot: dottingManager.userCustomGlobalFullDot !== undefined ? dottingManager.userCustomGlobalFullDot : null,
            userCustomGlobalOutline: dottingManager.userCustomGlobalOutline !== undefined ? dottingManager.userCustomGlobalOutline : null,
            lineDotConfigs: JSON.parse(JSON.stringify(dottingManager.lineDotConfigs || {})),
            wordDotConfigs: JSON.parse(JSON.stringify(dottingManager.wordDotConfigs || {}))
        },
        wordLayout: {}
    };

    $('#result').children('p.line').each(function (lineIdx) {
        const lineOverrides = {};
        let hasOverrides = false;
        $(this).children('.word').each(function () {
            const wIdx = $(this).attr('data-word-idx');
            const ml = this.style.marginLeft;
            const stretch = $(this).attr('data-stretch');
            const natW = $(this).attr('data-natural-width');
            const weight = $(this).attr('data-weight');
            const manual = $(this).attr('data-manual-stretch');
            const auto = $(this).attr('data-auto-stretch');
            if (ml || (stretch && stretch !== '1') || weight) {
                lineOverrides[wIdx] = {
                    marginLeft: ml || null,
                    stretch: stretch ? parseFloat(stretch) : null,
                    naturalWidth: natW ? parseFloat(natW) : null,
                    weight: weight || null,
                    manualStretch: manual ? true : null,
                    autoStretch: auto ? true : null
                };
                hasOverrides = true;
            }
        });
        if (hasOverrides) {
            state.wordLayout[lineIdx] = lineOverrides;
        }
    });

    return state;
};

storageManager.applyWorkspaceState = function (state) {
    if (!state || typeof state !== 'object') return;

    storageManager._isApplyingState = true;

    try {
        if (typeof state.text === 'string') {
            $('#input').val(state.text);
        }
        if (state.sampleSelect !== undefined) {
            $('#sample-select').val(state.sampleSelect);
        }

        if (state.settings) {
            if (state.settings.fontSize) {
                $('#font-size-select').val(state.settings.fontSize);
                if (window.view && typeof window.view.changeFontSize === 'function') {
                    window.view.changeFontSize(state.settings.fontSize);
                }
            }
            if (state.settings.boardColor) {
                $('#board-color-select').val(state.settings.boardColor);
                if (window.view && typeof window.view.changeBoardColor === 'function') {
                    window.view.changeBoardColor(state.settings.boardColor);
                }
            }
            if (state.settings.fontColor) {
                $('#font-color-input').val(state.settings.fontColor);
                if (window.view && typeof window.view.changeColorText === 'function') {
                    window.view.changeColorText(state.settings.fontColor);
                }
            }
            if (state.settings.weight !== undefined) {
                $('#weight-checkbox').prop('checked', !!state.settings.weight);
                if (window.view && typeof window.view.changeWeight === 'function') {
                    window.view.changeWeight(!!state.settings.weight);
                }
            }
            if (state.settings.style !== undefined) {
                $('#style-checkbox').prop('checked', !!state.settings.style);
                if (window.view && typeof window.view.changeStyle === 'function') {
                    window.view.changeStyle(!!state.settings.style);
                }
            }
            if (state.settings.autoStretch !== undefined) {
                $('#autostretch-checkbox').prop('checked', !!state.settings.autoStretch);
            }
        }

        if (state.dotting) {
            const d = state.dotting;
            $('#dotting-checkbox').prop('checked', !!d.enabled);
            if (d.enabled) {
                $('#dotting-options').show();
            } else {
                $('#dotting-options').hide();
            }
            if (d.spaces !== undefined) $('#dotting-spaces-input').val(d.spaces);
            if (d.repetitions !== undefined) $('#dotting-reps-input').val(d.repetitions);
            if (d.linesCount !== undefined) $('#dotting-lines-input').val(d.linesCount);
            if (d.fullDot !== undefined) $('#dotting-fulldot-checkbox').prop('checked', !!d.fullDot);
            if (d.outline !== undefined) $('#dotting-outline-select').val(d.outline);
            if (d.color !== undefined) $('#dotting-color-input').val(d.color);

            dottingManager.userCustomGlobalSpaces = d.userCustomGlobalSpaces !== undefined ? d.userCustomGlobalSpaces : null;
            dottingManager.userCustomGlobalLinesCount = d.userCustomGlobalLinesCount !== undefined ? d.userCustomGlobalLinesCount : null;
            dottingManager.userCustomGlobalFullDot = d.userCustomGlobalFullDot !== undefined ? d.userCustomGlobalFullDot : null;
            dottingManager.userCustomGlobalOutline = d.userCustomGlobalOutline !== undefined ? d.userCustomGlobalOutline : null;
            dottingManager.lineDotConfigs = d.lineDotConfigs ? JSON.parse(JSON.stringify(d.lineDotConfigs)) : {};
            dottingManager.wordDotConfigs = d.wordDotConfigs ? JSON.parse(JSON.stringify(d.wordDotConfigs)) : {};
        }

        dottingManager.syncLineDotConfigs();
        if (window.view && typeof window.view.render === 'function') {
            window.view.render();
        }

        if (state.wordLayout && typeof state.wordLayout === 'object') {
            const $lines = $('#result').children('p.line');
            for (const [lineIdxStr, wordMap] of Object.entries(state.wordLayout)) {
                const lineIdx = parseInt(lineIdxStr, 10);
                const $line = $lines.eq(lineIdx);
                if ($line.length && wordMap) {
                    for (const [wIdxStr, override] of Object.entries(wordMap)) {
                        const $word = $line.find(`.word[data-word-idx="${wIdxStr}"]`);
                        if ($word.length && override) {
                            if (override.marginLeft) {
                                $word.css('margin-left', override.marginLeft);
                            }
                            if (override.weight) {
                                $word.attr('data-weight', override.weight);
                                $word.find('.btn-word-bold').addClass('is-override');
                            }
                            if (override.manualStretch) {
                                $word.attr('data-manual-stretch', 'true');
                            }
                            if (override.autoStretch) {
                                $word.attr('data-auto-stretch', 'true');
                            }
                            if (override.stretch && override.stretch !== 1) {
                                $word.attr('data-stretch', override.stretch);
                                if (override.naturalWidth) {
                                    $word.attr('data-natural-width', override.naturalWidth);
                                    $word.css('width', (override.naturalWidth * override.stretch).toFixed(2) + 'px');
                                    $word.children('.word-text').css({
                                        'width': override.naturalWidth + 'px',
                                        'transform': `scaleX(${override.stretch})`,
                                        'transform-origin': '0 0',
                                        'display': 'inline-block',
                                        'vertical-align': 'baseline'
                                    });
                                }
                            }
                        }
                    }
                    if (dottingManager.isDottingActive()) {
                        dottingManager.renderDotsForLineAndPracticeLines($line);
                    }
                }
            }
        }

        dottingManager.updateDottingLineSelect();
        dottingManager.updateDottingControlsState();
    } finally {
        storageManager._isApplyingState = false;
    }
};

storageManager.triggerAutoSave = function (immediate) {
    if (storageManager._isApplyingState) return;
    if (storageManager._autoSaveTimer) {
        clearTimeout(storageManager._autoSaveTimer);
        storageManager._autoSaveTimer = null;
    }

    const doSave = function () {
        try {
            const state = storageManager.captureWorkspaceState();
            localStorage.setItem('chudep_workspace_draft', JSON.stringify(state));
            localStorage.setItem('handwriting_workspace_draft_v1', JSON.stringify(state));
            $('#btn-menu-restore-draft').show();
        } catch (e) {
            console.warn('Auto-save error:', e);
        }
    };

    if (immediate) {
        doSave();
    } else {
        storageManager._autoSaveTimer = setTimeout(doSave, 500);
    }
};

storageManager.saveWorkspaceToLocalStorage = function () {
    storageManager.triggerAutoSave(true);
};

storageManager.formatDraftTime = function (isoString) {
    if (!isoString) return '';
    try {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return '';
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        const pad = (n) => String(n).padStart(2, '0');
        const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
        if (isToday) {
            return `hôm nay lúc ${timeStr}`;
        }
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} lúc ${timeStr}`;
    } catch (_) {
        return '';
    }
};

storageManager.checkDraftOnLoad = function () {
    try {
        const raw = localStorage.getItem('handwriting_workspace_draft_v1') || localStorage.getItem('chudep_workspace_draft');
        if (!raw) return;
        const draft = JSON.parse(raw);
        if (!draft || !draft.text) return;

        $('#btn-menu-restore-draft').show();

        const currentText = ($('#input').val() || '').trim();
        const draftText = (draft.text || '').trim();
        const hasCustomSettings = draft.settings && (draft.settings.fontSize !== '72' || draft.settings.boardColor !== 'black');
        const hasDotting = draft.dotting && draft.dotting.enabled;
        const hasWordOverrides = draft.wordLayout && Object.keys(draft.wordLayout).length > 0;
        const hasCustomText = draftText.length > 0 && draftText !== currentText;

        if (hasCustomText || hasCustomSettings || hasDotting || hasWordOverrides) {
            const timeDesc = storageManager.formatDraftTime(draft.savedAt);
            const msg = timeDesc ? `Phát hiện bản nháp chưa lưu (${timeDesc}).` : 'Phát hiện bản nháp chưa lưu.';
            $('#draft-banner-text').text(msg);
            $('#draft-banner').slideDown(200);

            if (storageManager._draftBannerTimer) clearTimeout(storageManager._draftBannerTimer);
            storageManager._draftBannerTimer = setTimeout(function () {
                storageManager.dismissDraftNotification();
            }, 10000);
        }
    } catch (e) {
        console.warn('Draft check error:', e);
    }
};

storageManager.dismissDraftNotification = function () {
    if (storageManager._draftBannerTimer) {
        clearTimeout(storageManager._draftBannerTimer);
        storageManager._draftBannerTimer = null;
    }
    $('#draft-banner').slideUp(180);
};

storageManager.restoreSavedDraft = function () {
    try {
        const raw = localStorage.getItem('handwriting_workspace_draft_v1') || localStorage.getItem('chudep_workspace_draft');
        if (!raw) {
            alert('Không tìm thấy bản nháp đã lưu.');
            return;
        }
        const state = JSON.parse(raw);
        storageManager.applyWorkspaceState(state);
        storageManager.dismissDraftNotification();
    } catch (e) {
        console.error('Lỗi khi khôi phục bản nháp:', e);
        alert('Không thể khôi phục bản nháp: ' + e.message);
    }
};

storageManager.resetToDefault = function () {
    if (confirm('Bạn có chắc chắn muốn đặt lại bài viết về mặc định? Mọi thay đổi hiện tại trên bảng sẽ bị xóa.')) {
        try {
            localStorage.removeItem('chudep_workspace_draft');
            localStorage.removeItem('handwriting_workspace_draft_v1');
        } catch (_) {}
        storageManager.applyWorkspaceState({
            text: "Nét chữ nết người",
            sampleSelect: "",
            settings: {
                fontSize: '72',
                boardColor: 'black',
                fontColor: '#ffffff',
                weight: true,
                style: false
            },
            dotting: {
                enabled: false,
                spaces: 2,
                repetitions: 5,
                linesCount: 1,
                fullDot: true,
                outline: 'none',
                color: '#e53935'
            },
            wordLayout: {}
        });
        $('#btn-menu-restore-draft').hide();
        storageManager.dismissDraftNotification();
    }
};

storageManager.generateProjectFileName = function (text) {
    let cleanText = (text || '')
        .toLowerCase()
        .trim()
        .replace(/[\s\t\n]+/g, '_')
        .replace(/[/\\:*?"<>|#%&{}+,;=~`^!@$()[\].,]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');

    if (!cleanText) cleanText = 'bai_tap';
    if (cleanText.length > 35) {
        cleanText = cleanText.substring(0, 35).replace(/_+$/, '');
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());

    return `chudep_${cleanText}_${yyyy}${mm}${dd}-${hh}${min}.json`;
};

storageManager.exportProjectFile = function () {
    try {
        const state = storageManager.captureWorkspaceState();
        const firstLine = ($('#input').val() || '').split('\n').map(l => l.trim()).filter(l => l.length > 0)[0] || '';
        const fileName = storageManager.generateProjectFileName(firstLine);
        const jsonStr = JSON.stringify(state, null, 2);

        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
        console.error('Lỗi khi xuất tệp dự án:', e);
        alert('Không thể xuất tệp dự án: ' + e.message);
    }
};

storageManager.importProjectFile = function (file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
        alert('Vui lòng chọn tệp có định dạng .json');
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const state = JSON.parse(e.target.result);
            if (!state || typeof state !== 'object' || Array.isArray(state)) {
                throw new Error('Dữ liệu JSON không đúng định dạng đối tượng.');
            }
            if (state.app !== 'VietnameseHandwritingGenerator' && typeof state.text !== 'string' && !state.settings) {
                throw new Error('Tệp này không phải là tệp dự án bài tập Viết Chữ Đẹp.');
            }
            storageManager.applyWorkspaceState(state);

            localStorage.setItem('chudep_workspace_draft', JSON.stringify(state));
            localStorage.setItem('handwriting_workspace_draft_v1', JSON.stringify(state));
            $('#btn-menu-restore-draft').show();
            storageManager.dismissDraftNotification();
        } catch (err) {
            console.error('Lỗi nạp tệp dự án:', err);
            alert('Không thể mở tệp dự án: ' + (err.message || 'Cấu trúc không hợp lệ'));
        }
    };
    reader.readAsText(file, 'utf-8');
};

storageManager.setupProjectDragAndDrop = function () {
    $(window).off('dragover.projectDrop dragleave.projectDrop drop.projectDrop');

    $(window).on('dragover.projectDrop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $('body').addClass('project-drag-active');
    });

    $(window).on('dragleave.projectDrop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.originalEvent.pageX === 0 && e.originalEvent.pageY === 0) {
            $('body').removeClass('project-drag-active');
        }
    });

    $(window).on('drop.projectDrop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $('body').removeClass('project-drag-active');
        const dt = e.originalEvent.dataTransfer;
        if (dt && dt.files && dt.files.length > 0) {
            storageManager.importProjectFile(dt.files[0]);
        }
    });

    $('#project-file-input').off('change').on('change', function (e) {
        const file = e.target.files && e.target.files[0];
        if (file) {
            storageManager.importProjectFile(file);
        }
        $(this).val('');
    });
};
