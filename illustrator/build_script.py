import json

with open('data/all.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

ascii_json = json.dumps(data, separators=(',', ':'), ensure_ascii=True)

raw_jsx = r'''#target illustrator
/**
 * Vietnamese Handwriting Generator for Adobe Illustrator (HP001 Font)
 * Features:
 * - Direct Vietnamese handwriting glyph conversion (HP001 ligatures)
 * - Deep recursive scanning of nested groups: G1 -> (VL, BB, HL -> H1, H2.. Hxx)
 * - Synchronous modal dialog execution (100% immune to "there is no document" focus errors)
 * - Exact PointText placement on H baseline & inside BB
 * - Automatic containment inside BB (with optional Auto-Fit to BB width)
 * - Horizontal stretching (custom & 121.89% optimal cursive standard)
 * - Full Unicode escaping & font dropdown for Windows English Illustrator
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

    // Combining diacritical marks (Unicode To hop from Unikey/EVKey)
    if (/[\u0301]/.test(ch)) return 'acute';
    if (/[\u0300]/.test(ch)) return 'lower';
    if (/[\u0309]/.test(ch)) return 'rising';
    if (/[\u0303]/.test(ch)) return 'raised';
    if (/[\u0323]/.test(ch)) return 'heavy';

    // Precomposed Unicode (Unicode Dung san)
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
    str = str.replace(/[\u0300\u0301\u0303\u0309\u0323]/g, '');

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

// --- 4. Font Scanner ---
function scanHPFonts() {
    var found = [];
    if (!app.textFonts || app.textFonts.length === 0) return found;
    for (var i = 0; i < app.textFonts.length; i++) {
        var f = app.textFonts[i];
        var fullName = (f.name || '') + ' ' + (f.family || '') + ' ' + (f.style || '');
        if (fullName.toUpperCase().indexOf('HP001') !== -1) {
            var isBold = (fullName.toUpperCase().indexOf('BOLD') !== -1 || fullName.toUpperCase().indexOf('B30') !== -1);
            found.push({
                font: f,
                displayName: f.name + ' (' + (f.style || (isBold ? 'Bold' : 'Normal')) + ')',
                isBold: isBold
            });
        }
    }
    return found;
}

// --- 5. Recursive Named Grid Scanner (Nested Groups: G1 -> VL, BB, HL -> H1..Hxx) ---
function scanGridItems(doc) {
    if (!doc) return null;
    var result = {
        bb: null,
        linesMap: {},
        lineNumbers: []
    };

    function inspectItem(it) {
        if (!it) return;
        var nm = it.name ? it.name.replace(/^\s+|\s+$/g, '') : '';
        if (nm) {
            if (/^(BB|BOUNDING[\s_-]?BOX)$/i.test(nm)) {
                if (!result.bb) result.bb = it;
            } else {
                var m = nm.match(/^H[\s_-]?(\d+)$/i);
                if (m) {
                    var num = parseInt(m[1], 10);
                    if (!result.linesMap[num]) {
                        result.linesMap[num] = it;
                        result.lineNumbers.push(num);
                    }
                }
            }
        }

        // Deeply recurse into groups
        if (it.typename === 'GroupItem' && it.pageItems && it.pageItems.length > 0) {
            for (var j = 0; j < it.pageItems.length; j++) {
                inspectItem(it.pageItems[j]);
            }
        }
    }

    // Traverse all items in document
    for (var i = 0; i < doc.pageItems.length; i++) {
        inspectItem(doc.pageItems[i]);
    }

    result.lineNumbers.sort(function (a, b) { return a - b; });
    return result;
}

// --- 6. Persistent Preferences Storage (Folder.userData / VietnameseHandwriting / settings.json) ---
function stringifyJSON(obj) {
    if (!obj) return '{}';
    var pairs = [];
    for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
            var val = obj[k];
            if (typeof val === 'string') {
                var s = val.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
                pairs.push('"' + k + '":"' + s + '"');
            } else if (typeof val === 'number' || typeof val === 'boolean') {
                pairs.push('"' + k + '":' + val);
            }
        }
    }
    return '{\n  ' + pairs.join(',\n  ') + '\n}';
}

function getSettingsFile() {
    var baseFolder = null;
    try {
        if (Folder.userData && Folder.userData.exists) {
            baseFolder = Folder.userData;
        }
    } catch (eU) {}
    if (!baseFolder) {
        baseFolder = Folder.myDocuments;
    }
    var appDir = new Folder(baseFolder.fsName + '/VietnameseHandwriting');
    if (!appDir.exists) {
        try { appDir.create(); } catch (eCr) {}
    }
    return new File(appDir.fsName + '/settings.json');
}

function loadPreferences() {
    try {
        var f = getSettingsFile();
        if (f.exists) {
            f.encoding = 'UTF-8';
            if (f.open('r')) {
                var txt = f.read();
                f.close();
                if (txt && txt.replace(/^\s+|\s+$/g, '') !== '') {
                    return eval('(' + txt + ')');
                }
            }
        }
    } catch (e) {}
    return null;
}

function savePreferences(prefs) {
    try {
        var f = getSettingsFile();
        f.encoding = 'UTF-8';
        if (f.open('w')) {
            f.write(stringifyJSON(prefs));
            f.close();
            return true;
        }
    } catch (e) {}
    return false;
}

// --- 7. Main Runner Dialog ---
function runHandwritingTool() {
    if (!app.documents || app.documents.length === 0) {
        alert('Vui l\u00F2ng m\u1EDF t\u00E0i li\u1EC7u Illustrator c\u00F3 l\u01B0\u1EDBti tr\u01B0\u1EDBc khi ch\u1EA1y script!');
        return;
    }

    var doc = app.activeDocument;
    var gridData = scanGridItems(doc);
    var userPrefs = loadPreferences();

    // Modal dialog ensures synchronous execution with full document access
    var win = new Window('dialog', 'Vietnamese Handwriting (HP001) - Named Grid & BB Alignment');
    win.orientation = 'column';
    win.alignChildren = ['fill', 'top'];
    win.spacing = 8;
    win.margins = 14;

    // --- Panel A: Text Input ---
    var pText = win.add('panel', undefined, '1. V\u0103n b\u1EA3n ti\u1EBFng Vi\u1EC7t (Text Input)');
    pText.orientation = 'column';
    pText.alignChildren = ['fill', 'top'];
    pText.margins = 10;
    pText.spacing = 6;

    var defaultVietnameseText = 'C\u1ED9ng h\u00F2a x\u00E3 h\u1ED9i ch\u1EE7 ngh\u0129a Vi\u1EC7t Nam\n\u0110\u1ED9c l\u1EADp - T\u1EF1 do - H\u1EA1nh ph\u00FAc';
    var initText = (userPrefs && userPrefs.lastText) ? userPrefs.lastText : defaultVietnameseText;
    var txtInput = pText.add('edittext', undefined, initText, { multiline: true, scrollable: true });
    txtInput.preferredSize = [520, 68];

    // Font Controls Row
    var rFont = pText.add('group');
    rFont.orientation = 'row';
    rFont.alignChildren = ['left', 'center'];
    rFont.spacing = 8;

    rFont.add('statictext', undefined, 'Ph\u00F4ng ch\u1EEF (Font):');
    var ddFontSelect = rFont.add('dropdownlist', undefined, ['[T\u1EF1 \u0111\u1ED9ng t\u00ECm HP001]']);
    ddFontSelect.preferredSize = [180, 22];
    ddFontSelect.selection = 0;

    rFont.add('statictext', undefined, 'C\u1EE1:');
    var ddFontSize = rFont.add('dropdownlist', undefined, ['37 pt (1 \u00F4 ly)', '72 pt (2 \u00F4 ly)', 'T\u00F9y ch\u1EC9nh']);
    ddFontSize.preferredSize = [110, 22];
    ddFontSize.selection = 0;

    var txtCustomSize = rFont.add('edittext', undefined, '37');
    txtCustomSize.preferredSize = [42, 22];
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

    var chkBold = rFont.add('checkbox', undefined, '\u0110\u1EADm (Bold)');
    chkBold.value = false;

    var hpFontList = scanHPFonts();
    if (hpFontList.length > 0) {
        ddFontSelect.removeAll();
        var selectIdx = 0;
        for (var fIdx = 0; fIdx < hpFontList.length; fIdx++) {
            ddFontSelect.add('item', hpFontList[fIdx].displayName);
            if (userPrefs && userPrefs.fontName) {
                if (hpFontList[fIdx].font.name === userPrefs.fontName || hpFontList[fIdx].displayName === userPrefs.fontName) {
                    selectIdx = fIdx;
                }
            }
        }
        ddFontSelect.selection = selectIdx;
    }

    // Apply restored font preferences if present
    if (userPrefs) {
        if (typeof userPrefs.fontSizeIndex === 'number' && userPrefs.fontSizeIndex >= 0 && userPrefs.fontSizeIndex < 3) {
            ddFontSize.selection = userPrefs.fontSizeIndex;
            if (userPrefs.customSize) {
                txtCustomSize.text = String(userPrefs.customSize);
            }
            txtCustomSize.visible = (userPrefs.fontSizeIndex === 2);
        }
        if (typeof userPrefs.isBold === 'boolean') {
            chkBold.value = userPrefs.isBold;
        }
    }

    chkBold.onClick = function () {
        if (hpFontList.length > 1) {
            for (var k = 0; k < hpFontList.length; k++) {
                if (chkBold.value && hpFontList[k].isBold) {
                    ddFontSelect.selection = k;
                    break;
                } else if (!chkBold.value && !hpFontList[k].isBold) {
                    ddFontSelect.selection = k;
                    break;
                }
            }
        }
    };

    // --- Panel B: Named Grid Placement (H1..Hxx & BB) ---
    var pGrid = win.add('panel', undefined, '2. C\u0103n theo \u0110\u01B0\u1EDDng k\u1EBB (H1..Hxx) & Khung Bounding Box (BB)');
    pGrid.orientation = 'column';
    pGrid.alignChildren = ['fill', 'top'];
    pGrid.margins = 10;
    pGrid.spacing = 6;

    var rGridStatus = pGrid.add('group');
    rGridStatus.orientation = 'row';
    rGridStatus.alignChildren = ['left', 'center'];
    rGridStatus.spacing = 8;

    var btnRescan = rGridStatus.add('button', undefined, 'Qu\u00E9t l\u1EA1i L\u01B0\u1EDBi (Re-scan)');
    btnRescan.preferredSize = [140, 24];
    var lblGridInfo = rGridStatus.add('statictext', undefined, '');
    lblGridInfo.preferredSize = [360, 20];

    var rGridPlacement = pGrid.add('group');
    rGridPlacement.orientation = 'row';
    rGridPlacement.alignChildren = ['left', 'center'];
    rGridPlacement.spacing = 8;

    rGridPlacement.add('statictext', undefined, 'B\u1EAFt \u0111\u1EA7u t\u1EEB D\u00F2ng:');
    var ddTargetLine = rGridPlacement.add('dropdownlist', undefined, ['H1']);
    ddTargetLine.preferredSize = [80, 22];
    ddTargetLine.selection = 0;

    rGridPlacement.add('statictext', undefined, 'L\u00F9i l\u1EC1 tr\u00E1i BB (Indent pt):');
    var txtIndent = rGridPlacement.add('edittext', undefined, '0');
    txtIndent.preferredSize = [45, 22];

    rGridPlacement.add('statictext', undefined, 'L\u1EC7ch Baseline (pt):');
    var txtBaselineNudge = rGridPlacement.add('edittext', undefined, '0');
    txtBaselineNudge.preferredSize = [35, 22];

    var rGridOptions = pGrid.add('group');
    rGridOptions.orientation = 'row';
    rGridOptions.alignChildren = ['left', 'center'];
    rGridOptions.spacing = 10;

    var chkMultiLine = rGridOptions.add('checkbox', undefined, 'R\u1EA3i nhi\u1EC1u d\u00F2ng theo th\u1EE9 t\u1EF1 H1, H2, H3...');
    chkMultiLine.value = true;

    var chkAutoFitBB = rGridOptions.add('checkbox', undefined, 'T\u1EF1 \u0111\u1ED9ng co gi\u00E3n v\u1EEBa khung BB (Auto-fit to BB)');
    chkAutoFitBB.value = true;

    // Apply restored grid preferences
    if (userPrefs) {
        if (userPrefs.indent !== undefined) txtIndent.text = String(userPrefs.indent);
        if (userPrefs.baselineNudge !== undefined) txtBaselineNudge.text = String(userPrefs.baselineNudge);
        if (userPrefs.multiLine !== undefined) chkMultiLine.value = !!userPrefs.multiLine;
        if (userPrefs.autoFitBB !== undefined) chkAutoFitBB.value = !!userPrefs.autoFitBB;
    }

    function refreshGridDisplay() {
        gridData = scanGridItems(doc);
        if (!gridData) {
            lblGridInfo.text = 'Kh\u00F4ng t\u00ECm th\u1EA5y th\u00F4ng tin l\u01B0\u1EDBi!';
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
            statusText += '[Ch\u01B0a c\u00F3 BB] ';
        }

        if (lineCount > 0) {
            statusText += 'T\u00ECm th\u1EA5y ' + lineCount + ' d\u00F2ng (H' + gridData.lineNumbers[0] + ' -> H' + gridData.lineNumbers[lineCount - 1] + ')';
        } else {
            statusText += 'Kh\u00F4ng t\u00ECm th\u1EA5y d\u00F2ng H1..Hxx!';
        }
        lblGridInfo.text = statusText;

        ddTargetLine.removeAll();
        if (lineCount > 0) {
            var targetLineIdx = 0;
            for (var i = 0; i < lineCount; i++) {
                var lName = 'H' + gridData.lineNumbers[i];
                ddTargetLine.add('item', lName);
                if (userPrefs && userPrefs.startLine === lName) {
                    targetLineIdx = i;
                }
            }
            ddTargetLine.selection = targetLineIdx;
        } else {
            ddTargetLine.add('item', 'H1 (m\u1EB7c \u0111\u1ECBnh)');
            ddTargetLine.selection = 0;
        }
    }

    btnRescan.onClick = function () {
        refreshGridDisplay();
    };

    refreshGridDisplay();

    // --- Panel C: Stretch Configuration ---
    var pStretch = win.add('panel', undefined, '3. C\u1EA5u h\u00ECnh \u0110\u1ED9 gi\u00E3n ch\u1EEF (Horizontal Stretch)');
    pStretch.orientation = 'column';
    pStretch.alignChildren = ['fill', 'top'];
    pStretch.margins = 10;
    pStretch.spacing = 6;

    var rScale = pStretch.add('group');
    rScale.orientation = 'row';
    rScale.alignChildren = ['left', 'center'];
    rScale.spacing = 8;

    rScale.add('statictext', undefined, '\u0110\u1ED9 gi\u00E3n ngang (% Horizontal Scale):');
    var txtStretch = rScale.add('edittext', undefined, '121.89');
    txtStretch.preferredSize = [55, 22];

    var btn100 = rScale.add('button', undefined, '100%');
    btn100.preferredSize = [45, 22];
    var btn122 = rScale.add('button', undefined, '121.89% (Chu\u1EA9n)');
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

    // Apply restored stretch preferences
    if (userPrefs && userPrefs.stretch !== undefined) {
        txtStretch.text = String(userPrefs.stretch);
        var sVal = parseFloat(userPrefs.stretch);
        if (!isNaN(sVal)) slStretch.value = sVal;
    }

    function collectCurrentPrefs() {
        var fontName = '';
        if (hpFontList && hpFontList.length > 0 && ddFontSelect.selection) {
            fontName = hpFontList[ddFontSelect.selection.index].font.name;
        }
        var selLine = (ddTargetLine && ddTargetLine.selection) ? ddTargetLine.selection.text : 'H1';
        return {
            fontName: fontName,
            fontSizeIndex: ddFontSize.selection ? ddFontSize.selection.index : 0,
            customSize: txtCustomSize.text,
            isBold: chkBold.value,
            startLine: selLine,
            indent: txtIndent.text,
            baselineNudge: txtBaselineNudge.text,
            multiLine: chkMultiLine.value,
            autoFitBB: chkAutoFitBB.value,
            stretch: txtStretch.text,
            lastText: txtInput.text
        };
    }

    // --- Panel D: Action Buttons ---
    var rAction = win.add('group');
    rAction.orientation = 'row';
    rAction.alignment = 'right';
    rAction.spacing = 10;

    var btnSaveDefaults = rAction.add('button', undefined, 'L\u01B0u t\u00F9y ch\u1ECDn (Save Prefs)');
    btnSaveDefaults.preferredSize = [140, 32];
    btnSaveDefaults.onClick = function () {
        var p = collectCurrentPrefs();
        if (savePreferences(p)) {
            alert('\u0110\u00E3 l\u01B0u th\u00E0nh c\u00F4ng t\u00F9y ch\u1ECDn v\u00E0o t\u1EC7p settings.json!');
        } else {
            alert('Kh\u00F4ng th\u1EC3 l\u01B0u file c\u00E0i \u0111\u1EB7t!');
        }
    };

    var btnInsert = rAction.add('button', undefined, 'Ch\u00E8n Ch\u1EEF v\u00E0o L\u01B0\u1EDBi (Insert to Grid)');
    btnInsert.preferredSize = [200, 32];
    var btnClose = rAction.add('button', undefined, '\u0110\u00F3ng (Close)');
    btnClose.preferredSize = [80, 32];

    btnClose.onClick = function () { win.close(); };

    btnInsert.onClick = function () {
        try {
            var rawText = txtInput.text;
            if (!rawText || rawText.replace(/^\s+|\s+$/g, '') === '') {
                alert('Vui l\u00F2ng nh\u1EADp n\u1ED9i dung v\u0103n b\u1EA3n!');
                return;
            }

            // Automatically persist preferences
            try {
                savePreferences(collectCurrentPrefs());
            } catch (eSave) {}

            var targetFont = null;
            if (hpFontList && hpFontList.length > 0 && ddFontSelect.selection) {
                targetFont = hpFontList[ddFontSelect.selection.index].font;
            }

            var fontSize = parseFloat(txtCustomSize.text) || 37;
            var stretchVal = parseFloat(txtStretch.text) || 100;
            var indent = parseFloat(txtIndent.text) || 0;
            var baselineNudge = parseFloat(txtBaselineNudge.text) || 0;

            var selLineText = (ddTargetLine && ddTargetLine.selection) ? ddTargetLine.selection.text : 'H1';
            var lineMatch = selLineText.match(/^H(\d+)/i);
            var startLineNum = lineMatch ? parseInt(lineMatch[1], 10) : 1;

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

                if (gridData && gridData.linesMap && gridData.linesMap[currentLineNum]) {
                    var hItem = gridData.linesMap[currentLineNum];
                    var gb = hItem.geometricBounds;
                    targetBaselineY = (gb[1] + gb[3]) / 2 + baselineNudge;
                    if (!gridData.bb) {
                        bbLeft = gb[0];
                        bbRight = gb[2];
                    }
                } else if (gridData && gridData.lineNumbers && gridData.lineNumbers.length >= 2) {
                    var nums = gridData.lineNumbers;
                    var lastN = nums[nums.length - 1];
                    var prevN = nums[nums.length - 2];
                    var lastY = (gridData.linesMap[lastN].geometricBounds[1] + gridData.linesMap[lastN].geometricBounds[3]) / 2;
                    var prevY = (gridData.linesMap[prevN].geometricBounds[1] + gridData.linesMap[prevN].geometricBounds[3]) / 2;
                    var stepY = (lastY - prevY) / (lastN - prevN);
                    targetBaselineY = lastY + stepY * (currentLineNum - lastN) + baselineNudge;
                } else {
                    var abRect = (doc.artboards && doc.artboards.length > 0) ? doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect : [0, 0, 800, -600];
                    targetBaselineY = abRect[1] - 100 - (l * 76.8) + baselineNudge;
                }

                var targetX = bbLeft + indent;

                // 1. Create PointText at baseline coordinates
                var tf = null;
                try {
                    tf = doc.textFrames.pointText([targetX, targetBaselineY]);
                } catch (ePt) {
                    tf = doc.textFrames.add();
                    tf.left = targetX;
                    tf.top = targetBaselineY;
                }

                // 2. Set contents FIRST so textRange has characters
                tf.contents = converted;

                // 3. Name the text frame
                try {
                    tf.name = 'Handwriting_H' + currentLineNum;
                } catch (eNm) {}

                // 4. Style textRange attributes
                if (tf.textRange) {
                    if (targetFont) {
                        try {
                            tf.textRange.characterAttributes.textFont = targetFont;
                        } catch (eF) {}
                    }
                    try {
                        tf.textRange.characterAttributes.size = fontSize;
                    } catch (eS) {}
                    try {
                        tf.textRange.characterAttributes.horizontalScale = stretchVal;
                    } catch (eSc) {}
                }

                // 5. Auto-fit to BB Width if requested and text overflows BB
                if (bbRight !== null && chkAutoFitBB.value) {
                    var tfBounds = tf.geometricBounds;
                    var curW = tfBounds[2] - tfBounds[0];
                    var maxW = bbRight - targetX;
                    if (maxW > 10 && curW > maxW) {
                        var fitScale = (maxW / curW) * stretchVal;
                        try {
                            tf.textRange.characterAttributes.horizontalScale = Math.round(fitScale * 100) / 100;
                        } catch (eFit) {}
                    }
                }

                createdItems.push(tf);
            }

            // Select newly created items so user sees selection handles immediately
            doc.selection = null;
            for (var k = 0; k < createdItems.length; k++) {
                createdItems[k].selected = true;
            }

            // Close dialog cleanly so Illustrator repaints canvas instantly
            win.close();

        } catch (err) {
            alert('L\u1ED7i ch\u00E8n ch\u1EEF: ' + err.message + ' (D\u00F2ng ' + (err.line || '') + ')');
        }
    };

    win.center();
    win.show();
}

// Run tool
runHandwritingTool();
'''

output = raw_jsx.replace('__EMBEDDED_GLYPH_DATA__', ascii_json)

# Convert any remaining non-ASCII character in output to pure \uXXXX escape sequence
escaped_output = ''.join(r'\u{:04x}'.format(ord(c)) if ord(c) > 127 else c for c in output)

# Write as UTF-8 with BOM (utf-8-sig)
with open('illustrator/VietnameseHandwriting.jsx', 'w', encoding='utf-8-sig') as out_f:
    out_f.write(escaped_output)

print('Generated illustrator/VietnameseHandwriting.jsx successfully.')
print('File size:', len(escaped_output), 'characters.')
print('Non-ASCII characters remaining in string:', sum(1 for c in escaped_output if ord(c) > 127))
