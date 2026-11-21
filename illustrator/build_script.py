import json

with open('data/all.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

ascii_json = json.dumps(data, separators=(',', ':'), ensure_ascii=True)

jsx_template = r'''#target illustrator
/**
 * Vietnamese Handwriting Generator for Adobe Illustrator (HP001 Font)
 * Features:
 * - Direct Vietnamese handwriting glyph conversion (HP001 ligatures)
 * - Automatic grid detection (snapping to existing grid groups)
 * - Placement onto specified line numbers
 * - Horizontal stretching (custom & 121.89% standard)
 * - Live line nudging & movement
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

function getAccent(char) {
    if (!char) return 'level';
    char = char.toLowerCase();
    if (/ooc/.test(char)) return 'level';
    if (/oon/.test(char)) return 'level';
    if (/o\u00F2n/.test(char)) return 'lower';
    if (/o\u00F3n/.test(char)) return 'acute';
    if (/o\u00F3c/.test(char)) return 'acute';
    if (/o\u1ECDc/.test(char)) return 'heavy';

    var accentList = {
        'acute': '\u00E1\u1EAF\u1EA5\u00F3\u1ED1\u1EDB\u00E9\u1EBF\u00ED\u00FA\u1EE9\u00FD',
        'lower': '\u00E0\u1EB1\u1EA7\u00F2\u1ED3\u1EDD\u00E8\u1EC1\u00EC\u00F9\u1EEB\u1EF3',
        'rising': '\u1EA3\u1EB3\u1EA9\u1ECF\u1ED5\u1EDF\u1EBB\u1EC3\u1EC9\u1EE7\u1EED\u1EF7',
        'raised': '\u00E3\u1EB5\u1EAB\u00F5\u1ED7\u1EE1\u1EBD\u1EC5\u0129\u0169\u1EEF\u1EF9',
        'heavy': '\u1EA1\u1EB7\u1EAD\u1ECD\u1ED9\u1EE3\u1EB9\u1EC7\u1ECB\u1EE5\u1EF1\u1EF5'
    };
    for (var acc in accentList) {
        var re = new RegExp('[' + accentList[acc] + ']');
        if (re.test(char)) return acc;
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

function getGlyph(base, previous, char, next) {
    var isUpper = isUpperCase(char);
    var accent = getAccent(char);
    if (!GLYPH_DATA || !GLYPH_DATA[base]) return char;
    var currentSet = GLYPH_DATA[base].types;
    if (!currentSet) return char;
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
    return char;
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

// --- 5. ScriptUI Floating Palette ---
function buildHandwritingPalette() {
    var win = new Window('palette', 'Vietnamese Handwriting (HP001) - Adobe Illustrator', undefined, { resizeable: true });
    win.orientation = 'column';
    win.alignChildren = ['fill', 'top'];
    win.spacing = 8;
    win.margins = 12;

    // --- Panel A: Text Input ---
    var pText = win.add('panel', undefined, '1. Văn bản tiếng Việt (Text Input)');
    pText.orientation = 'column';
    pText.alignChildren = ['fill', 'top'];
    pText.margins = 10;
    pText.spacing = 6;

    var txtInput = pText.add('edittext', undefined, 'Cộng hòa xã hội chủ nghĩa Việt Nam\nĐộc lập - Tự do - Hạnh phúc', { multiline: true, scrollable: true });
    txtInput.preferredSize = [-1, 65];

    // Font Controls Row
    var rFont = pText.add('group');
    rFont.orientation = 'row';
    rFont.alignChildren = ['left', 'center'];
    rFont.spacing = 10;

    rFont.add('statictext', undefined, 'Cỡ chữ (Size):');
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

    var chkBold = rFont.add('checkbox', undefined, 'Đậm (Bold)');
    chkBold.value = false;

    // --- Panel B: Grid Placement ---
    var pGrid = win.add('panel', undefined, '2. Tọa độ & Bố cục Ô Ly (Grid Placement)');
    pGrid.orientation = 'column';
    pGrid.alignChildren = ['fill', 'top'];
    pGrid.margins = 10;
    pGrid.spacing = 6;

    var rGridDetect = pGrid.add('group');
    rGridDetect.orientation = 'row';
    var btnDetect = rGridDetect.add('button', undefined, 'Nhận diện Lưới đang chọn (Detect Selected Grid)');
    var lblGridStatus = rGridDetect.add('statictext', undefined, 'Chưa nhận diện lưới');
    lblGridStatus.preferredSize = [180, 20];

    var rGridCoords = pGrid.add('group');
    rGridCoords.orientation = 'row';
    rGridCoords.alignChildren = ['left', 'center'];
    rGridCoords.spacing = 8;

    rGridCoords.add('statictext', undefined, 'Bắt đầu từ Dòng:');
    var txtLineNum = rGridCoords.add('edittext', undefined, '1');
    txtLineNum.preferredSize = [35, 22];

    rGridCoords.add('statictext', undefined, 'Bước dòng (Step pt):');
    var txtLineStep = rGridCoords.add('edittext', undefined, '76.8');
    txtLineStep.preferredSize = [50, 22];

    rGridCoords.add('statictext', undefined, 'Lùi dòng (Indent pt):');
    var txtIndent = rGridCoords.add('edittext', undefined, '19.2');
    txtIndent.preferredSize = [45, 22];

    var rFineTune = pGrid.add('group');
    rFineTune.orientation = 'row';
    rFineTune.alignChildren = ['left', 'center'];
    rFineTune.spacing = 8;

    rFineTune.add('statictext', undefined, 'Căn chỉnh Baseline (Nudge pt):');
    var txtBaselineNudge = rFineTune.add('edittext', undefined, '0');
    txtBaselineNudge.preferredSize = [40, 22];

    var chkMultiLine = rFineTune.add('checkbox', undefined, 'Rải các dòng theo thứ tự (Multi-line cascade)');
    chkMultiLine.value = true;

    // Grid Detect Click Handler
    var detectedGridBounds = null;
    btnDetect.onClick = function () {
        if (!app.documents.length) {
            alert('Vui lòng mở một tài liệu Illustrator!');
            return;
        }
        var doc = app.activeDocument;
        if (!doc.selection || doc.selection.length === 0) {
            alert('Vui lòng dùng công cụ Selection Tool (V) bấm chọn nhóm lưới (2 grids merged group) trước, rồi bấm nút này!');
            return;
        }
        var sel = doc.selection[0];
        detectedGridBounds = sel.geometricBounds; // [left, top, right, bottom]
        var w = Math.round(detectedGridBounds[2] - detectedGridBounds[0]);
        var h = Math.round(detectedGridBounds[1] - detectedGridBounds[3]);
        lblGridStatus.text = 'Lưới: ' + w + 'x' + h + ' pt (X:' + Math.round(detectedGridBounds[0]) + ', Y:' + Math.round(detectedGridBounds[1]) + ')';
    };

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
    };
    btn122.onClick = function () {
        txtStretch.text = '121.89';
        slStretch.value = 121.89;
    };

    var slStretch = pStretch.add('slider', undefined, 121.89, 80, 200);
    slStretch.onChanging = function () {
        txtStretch.text = slStretch.value.toFixed(2);
    };
    txtStretch.onChange = function () {
        var v = parseFloat(txtStretch.text);
        if (!isNaN(v)) slStretch.value = v;
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
    }
    btnNudgeL10.onClick = function () { nudgeSelection(-10); };
    btnNudgeL1.onClick = function () { nudgeSelection(-1); };
    btnNudgeR1.onClick = function () { nudgeSelection(1); };
    btnNudgeR10.onClick = function () { nudgeSelection(10); };

    var btnApplySelected = pStretch.add('button', undefined, 'Áp dụng Độ giãn ngang cho chữ đang chọn');
    btnApplySelected.onClick = function () {
        if (!app.documents.length) return;
        var doc = app.activeDocument;
        if (!doc.selection || doc.selection.length === 0) {
            alert('Vui lòng chọn khối chữ trên Artboard!');
            return;
        }
        var sVal = parseFloat(txtStretch.text) || 100;
        for (var i = 0; i < doc.selection.length; i++) {
            var it = doc.selection[i];
            if (it.typename === 'TextFrame') {
                it.textRange.characterAttributes.horizontalScale = sVal;
            }
        }
    };

    // --- Panel D: Action Buttons ---
    var rAction = win.add('group');
    rAction.orientation = 'row';
    rAction.alignment = 'right';
    rAction.spacing = 10;

    var btnInsert = rAction.add('button', undefined, 'Chèn Chữ vào Lưới (Insert to Grid)', { name: 'ok' });
    btnInsert.preferredSize = [180, 28];
    var btnClose = rAction.add('button', undefined, 'Đóng (Close)', { name: 'cancel' });

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
        var startLine = parseInt(txtLineNum.text, 10) || 1;
        var lineStep = parseFloat(txtLineStep.text) || 76.8;
        var indent = parseFloat(txtIndent.text) || 19.2;
        var baselineNudge = parseFloat(txtBaselineNudge.text) || 0;

        // Base coordinates origin
        var originX = 50;
        var originY = -50;
        if (detectedGridBounds) {
            originX = detectedGridBounds[0];
            originY = detectedGridBounds[1];
        } else if (doc.artboards && doc.artboards.length > 0) {
            var abRect = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
            originX = abRect[0] + 50;
            originY = abRect[1] - 50;
        }

        var lines = rawText.split(/\r?\n/);
        var createdItems = [];

        for (var l = 0; l < lines.length; l++) {
            var lineStr = lines[l];
            if (lineStr.replace(/^\s+|\s+$/g, '') === '') continue;

            var converted = convertLine(lineStr);
            var lineIndex = chkMultiLine.value ? (startLine - 1 + l) : (startLine - 1);

            // Baseline Y coordinate calculation
            // In Illustrator: Top edge of line is (originY - lineIndex * lineStep).
            // Baseline is near the bottom guideline of the ô ly box.
            var targetBaselineY = originY - (lineIndex * lineStep) - lineStep + baselineNudge;
            var targetX = originX + indent;

            var tf = doc.textFrames.add();
            tf.contents = converted;

            if (font) {
                try {
                    tf.textRange.characterAttributes.textFont = font;
                } catch (e) {}
            }
            tf.textRange.characterAttributes.size = fontSize;
            tf.textRange.characterAttributes.horizontalScale = stretchVal;

            // Anchor point in point text sets baseline position
            tf.anchor = [targetX, targetBaselineY];
            createdItems.push(tf);
        }

        // Select the newly created text frames for immediate editing/nudging
        doc.selection = null;
        for (var k = 0; k < createdItems.length; k++) {
            createdItems[k].selected = true;
        }
    };

    win.center();
    win.show();
}

// Run palette
buildHandwritingPalette();
'''

output = jsx_template.replace('__EMBEDDED_GLYPH_DATA__', ascii_json)

with open('illustrator/VietnameseHandwriting.jsx', 'w', encoding='utf-8') as out_f:
    out_f.write(output)

print('Generated illustrator/VietnameseHandwriting.jsx successfully. Size:', len(output), 'bytes')
