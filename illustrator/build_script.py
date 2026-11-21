import json

with open('data/all.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

ascii_json = json.dumps(data, separators=(',', ':'), ensure_ascii=True)

jsx_template = r'''#target illustrator
/**
 * Vietnamese Handwriting Generator for Adobe Illustrator (HP001 Font)
 * Features:
 * - Direct Vietnamese handwriting glyph conversion (HP001 ligatures)
 * - Automatic named line matching (H1, H2, ... Hxx) and Bounding Box (BB) alignment
 * - Automatic containment inside BB (with optional Auto-Fit to BB width)
 * - Horizontal stretching (custom & 121.89% optimal cursive standard)
 * - Live line nudging & movement with instant app.redraw()
 */

// --- 1. Polyfills for ExtendScript (ES3) ---
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (elt) {
        var len = this.length >>> 0;
        var from = Number(arguments[1]) || 0;
        from = (from < 0) ? Math.ceil(from) : Math.floor(from);
        if (from < 0) from += len;
        for (; from < len; from++) {
            if (from in this && this[from] === elt) return from;
        }
        return -1;
    };
}
if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
}

// --- 2. Embedded Glyph Database (Minified HP001 Ligatures) ---
var GLYPH_DATA = __EMBEDDED_GLYPH_DATA__;

// --- 3. Vietnamese Linguistic & Ligature Engine ---
function isLetter(c) {
    if (!c || typeof c !== 'string') return false;
    return /^[a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9]+$/i.test(c);
}

function getAccent(ch) {
    if (!ch) return 'level';
    ch = ch.toLowerCase();
    if (/ooc/.test(ch)) return 'level';
    if (/oon/.test(ch)) return 'level';
    if (/o\u00F2n/.test(ch)) return 'lower';
    if (/o\u00F3n/.test(ch)) return 'acute';
    if (/o\u00F3c/.test(ch)) return 'acute';
    if (/o\u1ECDc/.test(ch)) return 'heavy';

    var accentList = {
        'acute': '\u00E1\u1EAF\u1EA5\u00F3\u1ED1\u1EDB\u00E9\u1EBF\u00ED\u00FA\u1EE9\u00FD',
        'lower': '\u00E0\u1EB1\u1EA7\u00F2\u1ED3\u1EDD\u00E8\u1EC1\u00EC\u00F9\u1EEB\u1EF3',
        'rising': '\u1EA3\u1EB3\u1EA9\u1ECF\u1ED5\u1EDF\u1EBB\u1EC3\u1EC9\u1EE7\u1EED\u1EF7',
        'raised': '\u00E3\u1EB5\u1EAB\u00F5\u1ED7\u1EE1\u1EBD\u1EC5\u0129\u0169\u1EEF\u1EF9',
        'heavy': '\u1EA1\u1EB7\u1EAD\u1ECD\u1ED9\u1EE3\u1EB9\u1EC7\u1ECB\u1EE5\u1EF1\u1EF5'
    };
    for (var acc in accentList) {
        var re = new RegExp('[' + accentList[acc] + ']');
        if (re.test(ch)) return acc;
    }
    return 'level';
}

function isUpperCase(str) {
    if (str === 'Gh') return true;
    if (str.length !== 1) return false;
    var uppercaseLetters = [
        'A\u00C0\u1EA2\u00C3\u00C1\u1EA0\u0102\u1EB0\u1EB2\u1EB4\u1EAE\u1EB6\u00C2\u1EA6\u1EA8\u1EAA\u1EA4\u1EAC',
        'D\u0110',
        'E\u00C8\u1EBA\u1EBC\u00C9\u1EB8\u00CA\u1EC0\u1EC2\u1EC4\u1EBE\u1EC6',
        'I\u00CC\u1EC8\u0128\u00CD\u1ECA',
        'O\u00D2\u1ECE\u00D5\u00D3\u1ECC\u00D4\u1ED2\u1ED4\u1ED6\u1ED0\u1ED8\u01A0\u1EDC\u1EDE\u1EE0\u1EDA\u1EE2',
        'U\u00D9\u1EE6\u0168\u00DA\u1EE4\u01AF\u1EEA\u1EEC\u1EEE\u1EE8\u1EF0',
        'Y\u1EF2\u1EF6\u1EF8\u00DD\u1EF4',
        'BCGHKLMNPQRSTVX'
    ];
    for (var i = 0; i < uppercaseLetters.length; i++) {
        var re = new RegExp('[' + uppercaseLetters[i] + ']', 'g');
        if (re.test(str)) return true;
    }
    return false;
}

function removeAccents(str) {
    var AccentsMap = [
        'a\u00E0\u1EA3\u00E3\u00E1\u1EA1',
        '\u0103\u1EB1\u1EB3\u1EB5\u1EAF\u1EB7',
        '\u00E2\u1EA7\u1EA9\u1EAB\u1EA5\u1EAD',
        'A\u00C0\u1EA2\u00C3\u00C1\u1EA0',
        '\u0102\u1EB0\u1EB2\u1EB4\u1EAE\u1EB6',
        '\u00C2\u1EA6\u1EA8\u1EAA\u1EA4\u1EAC',
        'e\u00E8\u1EBB\u1EBD\u00E9\u1EB9',
        '\u00EA\u1EC1\u1EC3\u1EC5\u1EBF\u1EC7',
        'E\u00C8\u1EBA\u1EBC\u00C9\u1EB8',
        '\u00CA\u1EC0\u1EC2\u1EC4\u1EBE\u1EC6',
        'i\u00EC\u1EC9\u0129\u00ED\u1ECA',
        'I\u00CC\u1EC8\u0128\u00CD\u1ECA',
        'o\u00F2\u1ECF\u00F5\u00F3\u1ECC',
        '\u00F4\u1ED3\u1ED5\u1ED7\u1ED1\u1ED9',
        '\u01A1\u1EDD\u1EDF\u1EE1\u1EDB\u1EE3',
        'O\u00D2\u1ECE\u00D5\u00D3\u1ECC',
        '\u00D4\u1ED2\u1ED4\u1ED6\u1ED0\u1ED8',
        '\u01A0\u1EDC\u1EDE\u1EE0\u1EDA\u1EE2',
        'u\u00F9\u1EE7\u0169\u00FA\u1EE5',
        '\u01B0\u1EEB\u1EED\u1EEF\u1EE9\u1EF1',
        'U\u00D9\u1EE6\u0168\u00DA\u1EE4',
        '\u01AF\u1EEA\u1EEC\u1EEE\u1EE8\u1EF0',
        'y\u1EF3\u1EF7\u1EF9\u00FD\u1EF5',
        'Y\u1EF2\u1EF6\u1EF8\u00DD\u1EF4'
    ];
    for (var i = 0; i < AccentsMap.length; i++) {
        var baseChar = AccentsMap[i].charAt(0);
        var rest = AccentsMap[i].substring(1);
        var re = new RegExp('[' + rest + ']', 'g');
        str = str.replace(re, baseChar);
    }
    return str;
}

function getGlyph(base, previous, ch, next) {
    var isUpper = isUpperCase(ch);
    var accent = getAccent(ch);
    if (!GLYPH_DATA || !GLYPH_DATA[base]) return ch;
    var currentSet = GLYPH_DATA[base].types;
    if (!currentSet) return ch;
    for (var i = 0; i < currentSet.length; i++) {
        var type = currentSet[i];
        if (type.prev.indexOf(previous) !== -1 && type.next.indexOf(next) !== -1 && type.isCap === isUpper) {
            if (type.accent && type.accent[accent] !== undefined && type.accent[accent] !== null && String(type.accent[accent]).trim() !== '') {
                var glyphs = String(type.accent[accent]);
                var parts = glyphs.split(',');
                var res = '';
                for (var j = 0; j < parts.length; j++) {
                    var code = parseInt(parts[j].trim(), 10);
                    if (!isNaN(code)) res += String.fromCharCode(code);
                }
                return res;
            }
        }
    }
    return ch;
}

function getUnicodeStr(word) {
    word = word.trim();
    if (!word) return '';
    var charArr = word.split('');
    var compoundConsonants = ['kh', 'nh', 'ch', 'gh', 'ph', 'th', 'Gh'];
    var i = 0;
    while (i < charArr.length - 1) {
        var pair = charArr[i] + charArr[i + 1];
        if (compoundConsonants.indexOf(pair) >= 0) {
            charArr[i] = pair;
            charArr.splice(i + 1, 1);
        }
        i++;
    }

    var specialVowels = ['ooc', 'o\u00F3c', 'o\u1ECDc', 'oon', 'o\u00F3n', 'o\u00F2n'];
    i = 0;
    while (i < charArr.length - 2) {
        var trio = charArr[i] + charArr[i + 1] + charArr[i + 2];
        if (specialVowels.indexOf(trio) >= 0) {
            charArr[i] = trio;
            charArr.splice(i + 1, 2);
        }
        i++;
    }

    var baseChars = [];
    for (i = 0; i < charArr.length; i++) {
        baseChars.push(removeAccents(charArr[i]));
    }

    var unicodeString = '';
    for (i = 0; i < charArr.length; i++) {
        var base = baseChars[i];
        var curr = charArr[i];
        var prev = (i === 0) ? null : baseChars[i - 1];
        var next = (i === charArr.length - 1) ? null : baseChars[i + 1];
        if (!isLetter(prev)) prev = null;
        if (!isLetter(next)) next = null;
        unicodeString += getGlyph(base, prev, curr, next);
    }
    return unicodeString;
}

function convertLine(text) {
    var tokens = text.split(/(\s+)/);
    var out = '';
    for (var i = 0; i < tokens.length; i++) {
        var t = tokens[i];
        if (!t) continue;
        if (/^\s+$/.test(t)) {
            out += t;
        } else {
            out += getUnicodeStr(t);
        }
    }
    return out;
}

// --- 4. Illustrator Typography & Font Helpers ---
function findHPFont(isBold) {
    if (!app.textFonts || app.textFonts.length === 0) return null;
    for (var i = 0; i < app.textFonts.length; i++) {
        var f = app.textFonts[i];
        var name = (f.name || '') + ' ' + (f.family || '') + ' ' + (f.style || '');
        if (name.indexOf('HP001') !== -1) {
            if (isBold && (name.indexOf('Bold') !== -1 || name.indexOf('B30') !== -1)) return f;
            if (!isBold && (name.indexOf('Normal') !== -1 || name.indexOf('Regular') !== -1 || name.indexOf('N30') !== -1)) return f;
        }
    }
    for (var j = 0; j < app.textFonts.length; j++) {
        if ((app.textFonts[j].name || '').indexOf('HP001') !== -1 || (app.textFonts[j].family || '').indexOf('HP001') !== -1) {
            return app.textFonts[j];
        }
    }
    return null;
}

// --- 5. Named Grid Scanner (Lines H1..Hxx and Bounding Box BB) ---
function scanGridItems() {
    if (!app.documents.length) return null;
    var doc = app.activeDocument;
    var bbItem = null;
    var hLinesMap = {};
    var lineNumbers = [];

    // Search all pageItems in document
    for (var i = 0; i < doc.pageItems.length; i++) {
        var it = doc.pageItems[i];
        var nm = it.name ? it.name.replace(/^\s+|\s+$/g, '') : '';
        if (!nm) continue;

        if (/^(BB|BOUNDING[\s_-]?BOX)$/i.test(nm)) {
            bbItem = it;
        } else {
            var m = nm.match(/^H[\s_-]?(\d+)$/i);
            if (m) {
                var num = parseInt(m[1], 10);
                if (!hLinesMap[num]) {
                    hLinesMap[num] = it;
                    lineNumbers.push(num);
                }
            }
        }
    }

    lineNumbers.sort(function (a, b) { return a - b; });

    return {
        bb: bbItem,
        linesMap: hLinesMap,
        lineNumbers: lineNumbers
    };
}

// --- 6. ScriptUI Dialog Window ---
function buildHandwritingDialog() {
    var win = new Window('dialog', 'Vietnamese Handwriting (HP001) - Named Grid & BB Alignment');
    win.orientation = 'column';
    win.alignChildren = ['fill', 'top'];
    win.spacing = 8;
    win.margins = 14;

    // --- Panel A: Text Input ---
    var pText = win.add('panel', undefined, '1. Văn bản tiếng Việt (Text Input)');
    pText.orientation = 'column';
    pText.alignChildren = ['fill', 'top'];
    pText.margins = 10;
    pText.spacing = 6;

    var txtInput = pText.add('edittext', undefined, 'Cộng hòa xã hội chủ nghĩa Việt Nam\nĐộc lập - Tự do - Hạnh phúc', { multiline: true, scrollable: true });
    txtInput.preferredSize = [440, 65];

    // Font Controls Row
    var rFont = pText.add('group');
    rFont.orientation = 'row';
    rFont.alignChildren = ['left', 'center'];
    rFont.spacing = 10;

    rFont.add('statictext', undefined, 'Cỡ chữ:');
    var ddFontSize = rFont.add('dropdownlist', undefined, ['37 pt (1 ô ly chuẩn)', '72 pt (2 ô ly lớn)', 'Tùy chỉnh (Custom)']);
    ddFontSize.selection = 0;

    var txtCustomSize = rFont.add('edittext', undefined, '37');
    txtCustomSize.preferredSize = [45, 22];
    txtCustomSize.visible = false;

    ddFontSize.onChange = function () {
        if (ddFontSize.selection.index === 0) {
            txtCustomSize.text = '37';
            txtCustomSize.visible = false;
        } else if (ddFontSize.selection.index === 1) {
            txtCustomSize.text = '72';
            txtCustomSize.visible = false;
        } else {
            txtCustomSize.visible = true;
        }
    };

    var chkBold = rFont.add('checkbox', undefined, 'Chữ đậm (Bold)');
    chkBold.value = false;

    // --- Panel B: Named Grid Placement (H1..Hxx & BB) ---
    var pGrid = win.add('panel', undefined, '2. Căn theo Đường kẻ (H1..Hxx) & Khung Bounding Box (BB)');
    pGrid.orientation = 'column';
    pGrid.alignChildren = ['fill', 'top'];
    pGrid.margins = 10;
    pGrid.spacing = 6;

    var rGridStatus = pGrid.add('group');
    rGridStatus.orientation = 'row';
    rGridStatus.alignChildren = ['left', 'center'];

    var btnRescan = rGridStatus.add('button', undefined, 'Quét lại Lưới (Re-scan)');
    var lblGridInfo = rGridStatus.add('statictext', undefined, 'Đang quét named lines...');
    lblGridInfo.preferredSize = [320, 20];

    var rGridPlacement = pGrid.add('group');
    rGridPlacement.orientation = 'row';
    rGridPlacement.alignChildren = ['left', 'center'];
    rGridPlacement.spacing = 8;

    rGridPlacement.add('statictext', undefined, 'Bắt đầu từ Dòng:');
    var ddTargetLine = rGridPlacement.add('dropdownlist', undefined, ['H1']);
    ddTargetLine.preferredSize = [80, 22];
    ddTargetLine.selection = 0;

    rGridPlacement.add('statictext', undefined, 'Lùi lề trái BB (Indent pt):');
    var txtIndent = rGridPlacement.add('edittext', undefined, '0');
    txtIndent.preferredSize = [45, 22];

    rGridPlacement.add('statictext', undefined, 'Lệch Baseline (pt):');
    var txtBaselineNudge = rGridPlacement.add('edittext', undefined, '0');
    txtBaselineNudge.preferredSize = [35, 22];

    var rGridOptions = pGrid.add('group');
    rGridOptions.orientation = 'row';
    rGridOptions.alignChildren = ['left', 'center'];
    rGridOptions.spacing = 10;

    var chkMultiLine = rGridOptions.add('checkbox', undefined, 'Rải nhiều dòng theo thứ tự H1, H2, H3...');
    chkMultiLine.value = true;

    var chkAutoFitBB = rGridOptions.add('checkbox', undefined, 'Tự động co giãn vừa khung BB (Auto-fit to BB)');
    chkAutoFitBB.value = true;

    // Grid Scan State
    var gridData = null;

    function refreshGridDisplay() {
        gridData = scanGridItems();
        if (!gridData) {
            lblGridInfo.text = 'Chưa mở tài liệu Illustrator nào!';
            return;
        }

        var lineCount = gridData.lineNumbers.length;
        var hasBB = !!gridData.bb;

        var statusText = '';
        if (hasBB) {
            var bbB = gridData.bb.geometricBounds;
            var bbW = Math.round(bbB[2] - bbB[0]);
            var bbH = Math.round(bbB[1] - bbB[3]);
            statusText += '[BB: ' + bbW + 'x' + bbH + 'pt] ';
        } else {
            statusText += '[Chưa có BB] ';
        }

        if (lineCount > 0) {
            statusText += 'Tìm thấy ' + lineCount + ' dòng (H' + gridData.lineNumbers[0] + ' -> H' + gridData.lineNumbers[lineCount - 1] + ')';
        } else {
            statusText += 'Không tìm thấy dòng H1..Hxx!';
        }
        lblGridInfo.text = statusText;

        // Re-populate dropdown
        ddTargetLine.removeAll();
        if (lineCount > 0) {
            for (var i = 0; i < lineCount; i++) {
                ddTargetLine.add('item', 'H' + gridData.lineNumbers[i]);
            }
            ddTargetLine.selection = 0;
        } else {
            ddTargetLine.add('item', 'H1 (mặc định)');
            ddTargetLine.selection = 0;
        }
    }

    btnRescan.onClick = function () {
        refreshGridDisplay();
    };

    // Initial scan on dialog open
    refreshGridDisplay();

    // --- Panel C: Stretch & Movement ---
    var pStretch = win.add('panel', undefined, '3. Giãn chữ & Dịch chuyển (Stretch & Movement)');
    pStretch.orientation = 'column';
    pStretch.alignChildren = ['fill', 'top'];
    pStretch.margins = 10;
    pStretch.spacing = 6;

    var rScale = pStretch.add('group');
    rScale.orientation = 'row';
    rScale.alignChildren = ['left', 'center'];
    rScale.spacing = 8;

    rScale.add('statictext', undefined, 'Độ giãn ngang (% Horizontal Scale):');
    var txtStretch = rScale.add('edittext', undefined, '121.89');
    txtStretch.preferredSize = [55, 22];

    var btn100 = rScale.add('button', undefined, '100%');
    btn100.preferredSize = [45, 22];
    var btn122 = rScale.add('button', undefined, '121.89% (Chuẩn)');
    btn122.preferredSize = [105, 22];

    btn100.onClick = function () {
        txtStretch.text = '100';
        slStretch.value = 100;
        applyStretchToSelection(100);
    };
    btn122.onClick = function () {
        txtStretch.text = '121.89';
        slStretch.value = 121.89;
        applyStretchToSelection(121.89);
    };

    var slStretch = pStretch.add('slider', undefined, 121.89, 80, 200);
    slStretch.onChanging = function () {
        txtStretch.text = slStretch.value.toFixed(2);
    };
    txtStretch.onChange = function () {
        var v = parseFloat(txtStretch.text);
        if (!isNaN(v)) {
            slStretch.value = v;
            applyStretchToSelection(v);
        }
    };

    var rNudge = pStretch.add('group');
    rNudge.orientation = 'row';
    rNudge.alignChildren = ['left', 'center'];
    rNudge.spacing = 6;

    rNudge.add('statictext', undefined, 'Dịch chuyển dòng đã chọn:');
    var btnNudgeL10 = rNudge.add('button', undefined, '<< -10pt');
    var btnNudgeL1 = rNudge.add('button', undefined, '< -1pt');
    var btnNudgeR1 = rNudge.add('button', undefined, '+1pt >');
    var btnNudgeR10 = rNudge.add('button', undefined, '+10pt >>');

    function nudgeSelection(deltaX) {
        if (!app.documents.length) return;
        var doc = app.activeDocument;
        if (!doc.selection || doc.selection.length === 0) return;
        for (var i = 0; i < doc.selection.length; i++) {
            var item = doc.selection[i];
            item.left += deltaX;
        }
        app.redraw();
    }
    btnNudgeL10.onClick = function () { nudgeSelection(-10); };
    btnNudgeL1.onClick = function () { nudgeSelection(-1); };
    btnNudgeR1.onClick = function () { nudgeSelection(1); };
    btnNudgeR10.onClick = function () { nudgeSelection(10); };

    function applyStretchToSelection(val) {
        if (!app.documents.length) return;
        var doc = app.activeDocument;
        if (!doc.selection || doc.selection.length === 0) return;
        for (var i = 0; i < doc.selection.length; i++) {
            var it = doc.selection[i];
            if (it.typename === 'TextFrame') {
                it.textRange.characterAttributes.horizontalScale = val;
            }
        }
        app.redraw();
    }

    var rStretchExtra = pStretch.add('group');
    rStretchExtra.orientation = 'row';
    var btnApplySelected = rStretchExtra.add('button', undefined, 'Áp dụng Độ giãn cho chữ đang chọn');
    var btnFitSelectedToBB = rStretchExtra.add('button', undefined, 'Thu vừa khung BB cho chữ đang chọn');

    btnApplySelected.onClick = function () {
        var sVal = parseFloat(txtStretch.text) || 100;
        applyStretchToSelection(sVal);
    };

    btnFitSelectedToBB.onClick = function () {
        if (!app.documents.length) return;
        var doc = app.activeDocument;
        if (!doc.selection || doc.selection.length === 0) {
            alert('Vui lòng chọn đối tượng chữ trên Artboard!');
            return;
        }
        if (!gridData || !gridData.bb) {
            alert('Không tìm thấy đối tượng Bounding Box (BB) trong tài liệu!');
            return;
        }
        var bbRight = gridData.bb.geometricBounds[2];
        for (var i = 0; i < doc.selection.length; i++) {
            var it = doc.selection[i];
            if (it.typename === 'TextFrame') {
                var itBounds = it.geometricBounds;
                var itLeft = itBounds[0];
                var curWidth = itBounds[2] - itBounds[0];
                var availWidth = bbRight - itLeft;
                if (curWidth > 0 && availWidth > 10) {
                    var curScale = it.textRange.characterAttributes.horizontalScale || 100;
                    var newScale = (availWidth / curWidth) * curScale;
                    it.textRange.characterAttributes.horizontalScale = Math.round(newScale * 100) / 100;
                }
            }
        }
        app.redraw();
    };

    // --- Panel D: Action Buttons ---
    var rAction = win.add('group');
    rAction.orientation = 'row';
    rAction.alignment = 'right';
    rAction.spacing = 10;

    var btnInsert = rAction.add('button', undefined, 'Chèn Chữ vào Lưới (Insert to Grid)');
    btnInsert.preferredSize = [190, 30];
    var btnClose = rAction.add('button', undefined, 'Đóng (Close)');

    btnClose.onClick = function () { win.close(); };

    btnInsert.onClick = function () {
        if (!app.documents.length) {
            alert('Vui lòng mở hoặc tạo một tài liệu Illustrator trước!');
            return;
        }
        var rawText = txtInput.text;
        if (!rawText || rawText.replace(/^\s+|\s+$/g, '') === '') {
            alert('Vui lòng nhập nội dung văn bản!');
            return;
        }

        var doc = app.activeDocument;
        var font = findHPFont(chkBold.value);
        if (!font) {
            alert('Lưu ý: Không tìm thấy Font HP001 trong hệ thống (HP001 Normal/Bold). Chữ sẽ tạo bằng font mặc định; hãy gán font HP001 sau khi cài font vào máy.');
        }

        var fontSize = parseFloat(txtCustomSize.text) || 37;
        var stretchVal = parseFloat(txtStretch.text) || 100;
        var indent = parseFloat(txtIndent.text) || 0;
        var baselineNudge = parseFloat(txtBaselineNudge.text) || 0;

        // Determine starting line number from dropdown
        var selLineText = ddTargetLine.selection ? ddTargetLine.selection.text : 'H1';
        var lineMatch = selLineText.match(/^H(\d+)/i);
        var startLineNum = lineMatch ? parseInt(lineMatch[1], 10) : 1;

        // Determine BB Bounds and Left Anchor
        var bbLeft = 50;
        var bbRight = null;
        if (gridData && gridData.bb) {
            var bbb = gridData.bb.geometricBounds;
            bbLeft = bbb[0];
            bbRight = bbb[2];
        }

        var lines = rawText.split(/\r?\n/);
        var createdItems = [];

        for (var l = 0; l < lines.length; l++) {
            var lineStr = lines[l];
            if (lineStr.replace(/^\s+|\s+$/g, '') === '') continue;

            var converted = convertLine(lineStr);
            var currentLineNum = chkMultiLine.value ? (startLineNum + l) : startLineNum;

            // Find H line for Y baseline
            var targetBaselineY = 0;
            var hasDirectHLine = false;

            if (gridData && gridData.linesMap && gridData.linesMap[currentLineNum]) {
                var hItem = gridData.linesMap[currentLineNum];
                var gb = hItem.geometricBounds; // [left, top, right, bottom]
                // Stroke centerline is baseline
                targetBaselineY = (gb[1] + gb[3]) / 2 + baselineNudge;
                hasDirectHLine = true;
                if (!gridData.bb) {
                    bbLeft = gb[0];
                    bbRight = gb[2];
                }
            } else if (gridData && gridData.lineNumbers && gridData.lineNumbers.length >= 2) {
                // Extrapolate spacing from available H lines
                var nums = gridData.lineNumbers;
                var lastN = nums[nums.length - 1];
                var prevN = nums[nums.length - 2];
                var lastY = (gridData.linesMap[lastN].geometricBounds[1] + gridData.linesMap[lastN].geometricBounds[3]) / 2;
                var prevY = (gridData.linesMap[prevN].geometricBounds[1] + gridData.linesMap[prevN].geometricBounds[3]) / 2;
                var stepY = (lastY - prevY) / (lastN - prevN);
                targetBaselineY = lastY + stepY * (currentLineNum - lastN) + baselineNudge;
            } else {
                // Fallback standard 76.8pt step
                var fallbackOriginY = (doc.artboards && doc.artboards.length > 0) ? (doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect[1] - 100) : 500;
                targetBaselineY = fallbackOriginY - (l * 76.8) + baselineNudge;
            }

            var targetX = bbLeft + indent;

            var tf = doc.textFrames.add();
            tf.contents = converted;
            tf.name = 'Handwriting_H' + currentLineNum;

            if (font) {
                try {
                    tf.textRange.characterAttributes.textFont = font;
                } catch (e) {}
            }
            tf.textRange.characterAttributes.size = fontSize;
            tf.textRange.characterAttributes.horizontalScale = stretchVal;

            // PointText anchor anchors baseline Y and left X
            tf.anchor = [targetX, targetBaselineY];

            // Auto-fit to BB Width if requested and text overflows BB
            if (bbRight !== null && chkAutoFitBB.value) {
                var tfBounds = tf.geometricBounds;
                var curW = tfBounds[2] - tfBounds[0];
                var maxW = bbRight - targetX;
                if (maxW > 10 && curW > maxW) {
                    var fitScale = (maxW / curW) * stretchVal;
                    tf.textRange.characterAttributes.horizontalScale = Math.round(fitScale * 100) / 100;
                }
            }

            createdItems.push(tf);
        }

        // Select the newly created text frames so user can see them and adjust stretch/nudge immediately
        doc.selection = null;
        for (var k = 0; k < createdItems.length; k++) {
            createdItems[k].selected = true;
        }

        // Force Illustrator canvas redraw
        app.redraw();
    };

    win.center();
    win.show();
}

// Run dialog
buildHandwritingDialog();
'''

output = jsx_template.replace('__EMBEDDED_GLYPH_DATA__', ascii_json)

with open('illustrator/VietnameseHandwriting.jsx', 'w', encoding='utf-8') as out_f:
    out_f.write(output)

print('Generated illustrator/VietnameseHandwriting.jsx successfully. Size:', len(output), 'bytes')
