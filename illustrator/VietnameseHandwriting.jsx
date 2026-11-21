#target illustrator
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
var GLYPH_DATA = {"0":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2,"y":3.75,"label":"N\u00e9t 1"}]}],"startPoint":{"x":2,"y":3.75}},"1":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":0.25,"y":3,"label":"N\u00e9t 1"}]}],"startPoint":{"x":0.25,"y":3}},"2":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":0.5,"y":3,"label":"N\u00e9t 1"}]}],"startPoint":{"x":0.5,"y":3}},"3":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":0.5,"y":4,"label":"N\u00e9t 1"}]}],"startPoint":{"x":0.5,"y":4}},"4":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2.25,"y":4,"label":"N\u00e9t 1"}]}],"startPoint":{"x":2.25,"y":4}},"5":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2.5,"y":4,"label":"N\u00e9t 1"}]}],"startPoint":{"x":2.5,"y":4}},"6":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2.5,"y":3,"label":"N\u00e9t 1"}]}],"startPoint":{"x":2.5,"y":3}},"7":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":0.5,"y":4,"label":"N\u00e9t 1"}]}],"startPoint":{"x":0.5,"y":4}},"8":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2.25,"y":3.25,"label":"N\u00e9t 1"}]}],"startPoint":{"x":2.25,"y":3.25}},"9":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2.5,"y":2.5,"label":"N\u00e9t 1"}]}],"startPoint":{"x":2.5,"y":2.5}},"a":{"baseGlyph":97,"types":[{"isCap":false,"prev":["b","c","d","\u0111","g","h","l","m","n","p","r","s","t","v","x","y","kh","nh","ch","th","ph","u","\u01b0","i","o","B","C","D",null],"next":["c","i","m","n","o","p","t","y","u","ch","nh",null],"accent":{"level":"97","acute":"225","lower":"224","rising":"7843","raised":"227","heavy":"7841"}}],"startPoint":{"x":1.5,"y":1.5}},"b":{"baseGlyph":98,"types":[{"isCap":false,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"967"}},{"isCap":false,"prev":[null],"next":[null],"accent":{"level":"600"}},{"isCap":false,"prev":[null],"next":["i","u","\u01b0"],"accent":{"level":"955"}},{"isCap":false,"prev":[null],"next":["a","\u0103","\u00e2","o","\u00f4","\u01a1","oon"],"accent":{"level":"98"}}],"startPoint":{"x":0,"y":1},"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":0,"y":1,"label":"N\u00e9t 1"}]},{"id":"cfg_1792396384413","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":0.03,"y":1.05,"label":"N\u00e9t 1"}]}]},"c":{"types":[{"isCap":false,"prev":[null],"next":["a","\u0103","\u00e2","o","\u00f4","\u01a1","u","\u01b0","oon","ooc"],"accent":{"level":"99"}},{"isCap":false,"prev":["a","\u0103","\u00e2","u","\u01b0","e","\u00ea",null],"next":[null],"accent":{"level":"598"}},{"isCap":false,"prev":["o","\u00f4","\u01a1"],"next":[null],"accent":{"level":"927,598"}}],"startPoint":{"x":1.2,"y":1.7}},"\u0103":{"types":[{"isCap":false,"prev":["b","c","d","\u0111","g","h","l","m","n","p","r","s","t","v","x","kh","nh","ch","th","ph","u","B","C","D",null],"next":["c","m","n","p","t",null],"accent":{"level":"259","acute":"7855","lower":"7857","rising":"7859","raised":"7861","heavy":"7863"}}],"startPoint":{"x":1.5,"y":1.5}},"\u00e2":{"types":[{"isCap":false,"prev":["b","c","d","\u0111","g","h","l","m","n","p","r","s","t","u","v","x","kh","nh","ch","th","ph","B","C","D",null],"next":["c","m","n","p","t","u","y",null],"accent":{"level":"226","acute":"7845","lower":"7847","rising":"7849","raised":"7851","heavy":"7853"}}],"startPoint":{"x":1.5,"y":1.5}},"d":{"types":[{"isCap":false,"prev":[null],"next":["a","\u0103","\u00e2","u","\u01b0","o","\u00f4","\u01a1","i",null],"accent":{"level":"100"}},{"isCap":false,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"910"}}],"startPoint":{"x":1.5,"y":1.5}},"\u0111":{"types":[{"isCap":false,"prev":[null],"next":["a","\u0103","\u00e2","u","\u01b0","o","\u00f4","\u01a1","i",null],"accent":{"level":"273"}},{"isCap":false,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"913"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.52,"y":1.42,"label":"N\u00e9t 1"}]}],"startPoint":{"x":1.52,"y":1.42}},"g":{"types":[{"isCap":false,"prev":["n",null],"next":["a","\u0103","\u00e2","o","\u00f4","\u01a1","i","u","\u01b0","oon"],"accent":{"level":"103"}},{"isCap":false,"prev":["n","N",null],"next":[null],"accent":{"level":"607"}}],"startPoint":{"x":1.5,"y":1.5}},"e":{"types":[{"isCap":false,"prev":["o","b","v"],"next":[null],"accent":{"level":"968","acute":"574","lower":"489","rising":"490","raised":"575","heavy":"576"}},{"isCap":false,"prev":["d","\u0111","n","m","l","h","k","r","p","t","x","kh","nh","ch","gh","ph","th","i","u","Gh","H","K","L","M"],"next":[null],"accent":{"level":"894","acute":"564","lower":"599","rising":"597","raised":"594","heavy":"7826"}},{"isCap":false,"prev":["N","P","V",null],"next":[null],"accent":{"level":"595","acute":"423","lower":"424","rising":"425","raised":"426","heavy":"427"}},{"isCap":false,"prev":["s","B","T","X"],"next":["c","m","n","o","p","t"],"accent":{"level":"7711","acute":"7712","lower":"7713","rising":"7714","raised":"7715","heavy":"7716"}},{"isCap":false,"prev":["o","b","v"],"next":["c","m","n","o","p","t"],"accent":{"level":"970","acute":"271","lower":"280","rising":"983","raised":"984","heavy":"283"}},{"isCap":false,"prev":["d","\u0111","h","k","l","m","n","r","t","u","p","x","kh","nh","ch","gh","ph"],"next":["o","c","p","t"],"accent":{"level":"688","acute":"689","lower":"989","rising":"990","raised":"991","heavy":"690"}},{"isCap":false,"prev":["d","\u0111","h","k","l","m","n","r","t","u","x","kh","nh","ch","gh","ph","th","Ch","Kh","Nh","Gh","Ph"],"next":["m","n"],"accent":{"level":"101","acute":"233","lower":"232","rising":"7867","raised":"7869","heavy":"7865"}},{"isCap":false,"prev":["s","B","T","X"],"next":[null],"accent":{"level":"7731","acute":"7732","lower":"7733","rising":"7734","raised":"7735","heavy":"7736"}},{"isCap":false,"prev":["N","V",null],"next":["c","m","n","o","p","t"],"accent":{"level":"900","acute":"731","lower":"733","rising":"734","raised":"711","heavy":"7932"}},{"isCap":false,"prev":["D","S","T","V","X","\u0110"],"next":["o",null],"accent":{"level":"7961","acute":"7962","lower":"7963","rising":"7964","raised":"7965","heavy":"7966"}},{"isCap":false,"prev":["S","D","\u0110"],"next":["n","t","m","p"],"accent":{"level":"7941","acute":"7942","lower":"7943","rising":"7944","raised":"7945","heavy":"7946"}}],"startPoint":{"x":-0.25,"y":0.25}},"\u00ea":{"types":[{"isCap":false,"prev":["b","v"],"next":[null],"accent":{"level":"579","acute":"580","lower":"478","rising":"581","raised":"582","heavy":"462"}},{"isCap":false,"prev":["d","\u0111","h","k","l","m","n","r","t","u","x","kh","nh","ch","gh","ph","th","Gh","H","K","L","M","R"],"next":[null],"accent":{"level":"592","acute":"975","lower":"565","rising":"728","raised":"729","heavy":"323"}},{"isCap":false,"prev":["N","P","V",null],"next":[null],"accent":{"level":"377","acute":"428","lower":"429","rising":"430","raised":"433","heavy":"434"}},{"isCap":false,"prev":["s"],"next":["m","n","p","t","u","ch","nh"],"accent":{"level":"389","acute":"390","lower":"391","rising":"392","raised":"393","heavy":"394"}},{"isCap":false,"prev":["b","v"],"next":["m","n","p","t","u","ch","nh"],"accent":{"level":"313","acute":"314","lower":"317","rising":"318","raised":"985","heavy":"986"}},{"isCap":false,"prev":["d","\u0111","h","i","k","l","m","i","n","r","t","u","x","kh","nh","ch","gh","ph","th"],"next":["p","t","u","ch","nh"],"accent":{"level":"691","acute":"692","lower":"693","rising":"694","raised":"695","heavy":"696"}},{"isCap":false,"prev":["d","\u0111","h","i","k","l","m","n","r","t","u","x","kh","nh","ch","gh","ph","th"],"next":["m","n"],"accent":{"level":"234","acute":"7871","lower":"7873","rising":"7875","raised":"7877","heavy":"7879"}},{"isCap":false,"prev":["y","Y"],"next":["m","n","u","t","nh","ch"],"accent":{"level":"472","acute":"473","lower":"474","rising":"475","raised":"476","heavy":"477"}},{"isCap":false,"prev":["N","V",null],"next":["m","n","p","t","u","ch","nh"],"accent":{"level":"322","acute":"286","lower":"987","rising":"988","raised":"287","heavy":"304"}},{"isCap":false,"prev":["s"],"next":[null],"accent":{"level":"408","acute":"409","lower":"410","rising":"411","raised":"412","heavy":"413"}},{"isCap":false,"prev":["B","T","X"],"next":["m","n","p","t","u","ch","nh"],"accent":{"level":"7717","acute":"7718","lower":"7719","rising":"7720","raised":"7721","heavy":"7722"}},{"isCap":false,"prev":["B","T","X"],"next":[null],"accent":{"level":"7737","acute":"7738","lower":"7739","rising":"7740","raised":"7741","heavy":"7742"}},{"isCap":false,"prev":["D","\u0110","S"],"next":["n","m","u","nh","ch",null],"accent":{"level":"7947","acute":"7948","lower":"7949","rising":"7950","raised":"7951","heavy":"7952"}}],"startPoint":{"x":-0.25,"y":0.25}},"h":{"types":[{"isCap":false,"prev":[null],"next":["o","\u00f4","\u01a1","a","\u0103","\u00e2","i","u","\u01b0","y",null],"accent":{"level":"104"}},{"isCap":false,"prev":["N",null],"next":["e","\u00ea"],"accent":{"level":"7700"}},{"isCap":false,"prev":["K"],"next":["o","\u00f4","\u01a1","a","\u0103","\u00e2","i","u","\u01b0","y",null],"accent":{"level":"534"}},{"isCap":false,"prev":["K"],"next":["e","\u00ea",null],"accent":{"level":"535"}},{"isCap":false,"prev":["C"],"next":["e","\u00ea"],"accent":{"level":"517"}},{"isCap":false,"prev":["C"],"next":["o","\u00f4","\u01a1","a","\u0103","\u00e2","i","u","\u01b0",null],"accent":{"level":"516"}},{"isCap":false,"prev":["N"],"next":["o","\u00f4","\u01a1","a","\u0103","\u00e2","i","u","\u01b0",null],"accent":{"level":"7699"}},{"isCap":false,"prev":["T"],"next":["o","\u00f4","\u01a1","a","\u0103","\u00e2","i","u","\u01b0",null],"accent":{"level":"518"}},{"isCap":false,"prev":["P"],"next":["\u00ea","e"],"accent":{"level":"914"}},{"isCap":false,"prev":["T"],"next":["\u00ea","e"],"accent":{"level":"519"}}],"startPoint":{"x":0,"y":1}},"i":{"types":[{"isCap":false,"prev":["N","P",null],"next":["a","m","n","p","t","u","nh","ch",null],"accent":{"level":"321","acute":"350","lower":"351","rising":"262","raised":"263","heavy":"337"}},{"isCap":false,"prev":[null],"next":["\u00ea"],"accent":{"level":"920"}},{"isCap":false,"prev":["a","d","\u0111","g","h","k","l","m","n","p","r","t","u","\u01b0","x","kh","nh","ch","gh","ph","th","K","H"],"next":["a","m","n","p","t","u","nh","ch",null],"accent":{"level":"105","acute":"237","lower":"236","rising":"7881","raised":"297","heavy":"7883"}},{"isCap":false,"prev":["d","\u0111","g","h","k","l","m","n","r","t","x","kh","nh","ch","gh","ph","th","Gh","L"],"next":["e","\u00ea"],"accent":{"level":"919"}},{"isCap":false,"prev":["b","v","s","B","D","\u0110","O","\u00d4","\u01a0","S","T","V","X","K","M","N","H","G"],"next":["a","m","n","p","t","u","nh","ch","\u0103","\u00e2","\u01b0","o","\u00f4","\u01a1",null],"accent":{"level":"901","acute":"357","lower":"368","rising":"369","raised":"378","heavy":"379"}},{"isCap":false,"prev":["s","b","v","S","B","V","T","M","L","N","K","D","\u0110","H","X","G"],"next":["e","\u00ea"],"accent":{"level":"956"}},{"isCap":false,"prev":["o","\u00f4","\u01a1"],"next":[null],"accent":{"level":"932,901"}}],"startPoint":{"x":0,"y":1}},"k":{"types":[{"isCap":false,"prev":[null],"next":["i","y",null],"accent":{"level":"107"}},{"isCap":false,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"915"}}],"startPoint":{"x":0,"y":1}},"l":{"types":[{"isCap":false,"prev":[null],"next":["o","\u00f4","\u01a1","a","\u0103","\u00e2","i","u","\u01b0","y",null],"accent":{"level":"108"}},{"isCap":false,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"916"}}],"startPoint":{"x":0,"y":1}},"m":{"types":[{"isCap":false,"prev":["a","\u0103","\u00e2","e","\u00ea","i","u","\u01b0"],"next":[null],"accent":{"level":"109"}},{"isCap":false,"prev":[null],"next":["o","\u00f4","\u01a1","a","\u0103","\u00e2","i","u","\u01b0","y","ooc","oon",null],"accent":{"level":"506"}},{"isCap":false,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"917"}},{"isCap":false,"prev":["o","\u00f4","\u01a1"],"next":[null],"accent":{"level":"936"}},{"isCap":false,"prev":["E","\u00ca","I","O","\u00d4","\u01a0"],"next":[null],"accent":{"level":"536"}}],"startPoint":{"x":0,"y":1.6}},"n":{"types":[{"isCap":false,"prev":["a","\u0103","\u00e2","e","\u00ea","i","u","\u01b0","A","\u0102","\u00c2"],"next":[null],"accent":{"level":"110"}},{"isCap":false,"prev":[null],"next":["o","\u00f4","\u01a1","a","\u0103","\u00e2","i","u","\u01b0","y","g","gh",null],"accent":{"level":"507"}},{"isCap":false,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"918"}},{"isCap":false,"prev":["o","\u00f4","\u01a1"],"next":["g",null],"accent":{"level":"938"}},{"isCap":false,"prev":["E","\u00ca","I","O","\u00d4","\u01a0"],"next":["g","h",null],"accent":{"level":"537"}}],"startPoint":{"x":0,"y":1.6}},"o":{"types":[{"isCap":false,"prev":["a","b","c","d","\u0111","e","g","h","l","m","n","p","r","s","t","v","x","kh","nh","ch","ph","th","B","C","D",null],"next":["i","t","c","p","m","n",null],"accent":{"level":"111","acute":"243","lower":"242","rising":"7887","raised":"245","heavy":"7885"}},{"isCap":false,"prev":["b","c","d","\u0111","g","h","l","m","n","p","r","s","t","v","x","kh","nh","ch","ph","th","B","C","D","\u0110","G","H","L","K","M","N","P","Q","T","V","X","S",null],"next":["e"],"accent":{"level":"966","acute":"319","lower":"320","rising":"356","raised":"366","heavy":"367"}},{"isCap":false,"prev":["b","c","d","\u0111","g","h","l","m","n","p","r","s","t","v","x","kh","nh","ch","ph","th","B","C","D","\u0110","G","H","L","M","N","P","X","S","T","V","R",null],"next":["a","\u0103","o"],"accent":{"level":"111,927","acute":"243,927","lower":"242,927","rising":"7887,927","raised":"245,927","heavy":"7885,927"}}],"startPoint":{"x":1.4,"y":1.7}},"\u00f4":{"types":[{"isCap":false,"prev":["b","c","d","\u0111","g","h","l","m","n","p","r","s","t","v","x","kh","nh","ch","ph","th","B","C","D",null],"next":["i","t","c","p","m","n",null],"accent":{"level":"244","acute":"7889","lower":"7891","rising":"7893","raised":"7895","heavy":"7897"}}],"startPoint":{"x":1.3,"y":1.7}},"\u01a1":{"types":[{"isCap":false,"prev":["b","c","d","\u0111","g","h","l","m","n","p","r","s","t","v","x","kh","nh","ch","ph","th","u","\u01b0","B","C","D",null],"next":["i","t","c","p","m","n",null],"accent":{"level":"417","acute":"7899","lower":"7901","rising":"7903","raised":"7905","heavy":"7907"}}],"startPoint":{"x":1.3,"y":1.7}},"p":{"types":[{"isCap":false,"prev":["a","\u0103","\u00e2","e","\u00ea","i","u"],"next":[null],"accent":{"level":"112"}},{"isCap":false,"prev":[null],"next":["a","\u0103","\u00e2","i","u","\u01b0","o","\u00f4","\u01a1"],"accent":{"level":"8616"}},{"isCap":false,"prev":["o","\u00f4","\u01a1"],"next":[null],"accent":{"level":"932,456"}},{"isCap":false,"prev":["E","I","\u00ca","O","\u00d4","\u01a0"],"next":[null],"accent":{"level":"456"}}],"startPoint":{"x":0,"y":1}},"q":{"types":[{"isCap":false,"prev":[null],"next":[null],"accent":{"level":"113"}},{"isCap":false,"prev":[null],"next":["u"],"accent":{"level":"469"}}],"startPoint":{"x":1.5,"y":1.5}},"r":{"types":[{"isCap":false,"prev":["t"],"next":["a","\u0103","\u00e2","o","\u00f4","\u01a1","u","\u01b0","i"],"accent":{"level":"114"}},{"isCap":false,"prev":["T",null],"next":["a","\u0103","\u00e2","o","\u00f4","\u01a1","u","\u01b0","i",null],"accent":{"level":"479"}},{"isCap":false,"prev":["T",null],"next":["e","\u00ea"],"accent":{"level":"962"}},{"isCap":false,"prev":["t"],"next":["e","\u00ea"],"accent":{"level":"923"}}],"startPoint":{"x":0,"y":0}},"s":{"types":[{"isCap":false,"prev":[null],"next":["ooc","o","\u00f4","\u01a1","a","\u0103","\u00e2","e","\u00ea","oon",null],"accent":{"level":"548"}},{"isCap":false,"prev":[null],"next":["i","u","\u01b0"],"accent":{"level":"552"}}],"startPoint":{"x":0,"y":0}},"t":{"types":[{"isCap":false,"prev":["a","\u0103","\u00e2","e","\u00ea","i","u","\u01b0"],"next":["r",null],"accent":{"level":"116"}},{"isCap":false,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"921"}},{"isCap":false,"prev":["o","\u00f4","\u01a1"],"next":[null],"accent":{"level":"932,942"}},{"isCap":false,"prev":[null],"next":["o","\u00f4","\u01a1","a","\u0103","\u00e2","i","u","\u01b0","y","r","oon","ooc",null],"accent":{"level":"455"}},{"isCap":false,"prev":["E","I","\u00ca","O","\u00d4","\u01a0"],"next":[null],"accent":{"level":"942"}}],"startPoint":{"x":0,"y":1}},"u":{"types":[{"isCap":false,"prev":["a","\u0103","\u00e2","c","d","\u0111","\u00ea","g","h","l","m","n","p","r","t","x","kh","nh","th","ch","ph","th"],"next":["a","\u00e2","\u00f4","\u01a1","c","i","m","n","t","p","y",null],"accent":{"level":"117","acute":"250","lower":"249","rising":"7911","raised":"361","heavy":"7909"}},{"isCap":false,"prev":["N","P",null],"next":["a","\u0103","\u00e2","\u00f4","\u01a1","c","i","m","n","t","p","y",null],"accent":{"level":"270","acute":"978","lower":"268","rising":"269","raised":"668","heavy":"355"}},{"isCap":false,"prev":[null],"next":["\u00ea"],"accent":{"level":"960"}},{"isCap":false,"prev":["d","\u0111","g","h","l","t","x","ch","kh","nh","th","L","M","N","Q","H"],"next":["\u00ea","e"],"accent":{"level":"961"}},{"isCap":false,"prev":["q","b","v","s","B","C","D","\u0110","G","I","E","\u00ca","S","T","V","X"],"next":["\u01a1","a","\u0103","\u00e2","\u00f4","c","i","m","n","p","t","y",null],"accent":{"level":"943","acute":"508","lower":"509","rising":"510","raised":"511","heavy":"7808"}},{"isCap":false,"prev":["q","b","v","s","D","\u0110","X","G","S","T","V","X","B"],"next":["e","\u00ea"],"accent":{"level":"924"}},{"isCap":false,"prev":["\u01a1"],"next":[null],"accent":{"level":"932,943"}}],"startPoint":{"x":0,"y":1}},"\u01b0":{"types":[{"isCap":false,"prev":["c","d","\u0111","g","h","l","m","n","p","r","t","x","kh","nh","th","ch","ph","th"],"next":["a","\u01a1","c","i","m","n","t","u",null],"accent":{"level":"432","acute":"7913","lower":"7915","rising":"7917","raised":"7919","heavy":"7921"}},{"isCap":false,"prev":["N","P",null],"next":["a","\u01a1","c","i","m","n","t","u",null],"accent":{"level":"340","acute":"671","lower":"327","rising":"328","raised":"336","heavy":"675"}},{"isCap":false,"prev":["s","b","v","B","C","D","\u0110","G","S","T","V","X"],"next":["a","\u01a1","c","i","m","n","t","u",null],"accent":{"level":"944","acute":"7809","lower":"7810","rising":"7811","raised":"7812","heavy":"7813"}}],"startPoint":{"x":0,"y":1}},"v":{"types":[{"isCap":false,"prev":[null],"next":[null],"accent":{"level":"554"}},{"isCap":false,"prev":[null],"next":["o","\u00f4","\u01a1","a","\u0103","\u00e2","ooc"],"accent":{"level":"553"}},{"isCap":false,"prev":[null],"next":["i","u","\u01b0"],"accent":{"level":"555"}},{"isCap":false,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"556"}}],"startPoint":{"x":-0.3,"y":1.5}},"x":{"types":[{"isCap":false,"prev":[null],"next":[null],"accent":{"level":"602"}},{"isCap":false,"prev":[null],"next":["o","\u00f4","\u01a1","a","\u0103","\u00e2","i","u","\u01b0","oon"],"accent":{"level":"120"}},{"isCap":false,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"922"}}],"startPoint":{"x":0.25,"y":1.75}},"y":{"types":[{"isCap":false,"prev":["h","l","k","m","s","t","u","th","a","\u00e2","H","K","T"],"next":["a","u","n","p","t","nh","ch"],"accent":{"level":"121","acute":"253","lower":"7923","rising":"7927","raised":"7929","heavy":"7925"}},{"isCap":false,"prev":[null],"next":[null],"accent":{"level":"448","acute":"282","lower":"341","rising":"344","raised":"345","heavy":"453"}},{"isCap":false,"prev":[null],"next":["\u00ea"],"accent":{"level":"912"}},{"isCap":false,"prev":["h","k","l","m","r","t","u","x","kh","nh","ch","ph","th","a","\u00e2","L","M","A"],"next":[null],"accent":{"level":"7979","acute":"7980","lower":"7981","rising":"7982","raised":"7983","heavy":"7984"}},{"isCap":false,"prev":["d","\u0111","h","k","l","m","n","r","s","t","u","x","kh","nh","ch","th","ph"],"next":["\u00ea"],"accent":{"level":"911"}},{"isCap":false,"prev":["P"],"next":[null],"accent":{"level":"7973"}}],"startPoint":{"x":0,"y":1}},"kh":{"types":[{"isCap":false,"prev":[null],"next":["o","\u00f4","\u01a1","a","\u0103","\u00e2","i","u","\u01b0",null],"accent":{"level":"948"}},{"isCap":false,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"902"}}],"startPoint":{"x":0,"y":1}},"nh":{"types":[{"isCap":false,"prev":[null],"next":["o","\u00f4","\u01a1","a","\u0103","\u00e2","i","u","\u01b0",null],"accent":{"level":"951"}},{"isCap":false,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"903"}},{"isCap":false,"prev":["y","a","\u00ea","i","A"],"next":[null],"accent":{"level":"950"}},{"isCap":false,"prev":["\u00ca"],"next":[null],"accent":{"level":"537,104"}}],"startPoint":{"x":0,"y":1.6}},"ch":{"types":[{"isCap":false,"prev":["a","\u00ea","i","y","A","\u00ca",null],"next":["o","\u00f4","\u01a1","a","\u0103","\u00e2","i","u","\u01b0","y","oon",null],"accent":{"level":"949"}},{"isCap":false,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"904"}}],"startPoint":{"x":1.2,"y":1.7}},"gh":{"types":[{"isCap":false,"prev":["n","N",null],"next":["i",null],"accent":{"level":"952"}},{"isCap":false,"prev":["n","N",null],"next":["e","\u00ea"],"accent":{"level":"905"}}],"startPoint":{"x":1.5,"y":1.5}},"ph":{"types":[{"isCap":false,"prev":[null],"next":["o","\u00f4","\u01a1","a","\u0103","\u00e2","i","u","\u01b0","ooc",null],"accent":{"level":"953"}},{"isCap":false,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"906"}}],"startPoint":{"x":0,"y":1}},"th":{"types":[{"isCap":false,"prev":[null],"next":["o","\u00f4","\u01a1","a","\u0103","\u00e2","i","u","\u01b0","y",null],"accent":{"level":"954"}},{"isCap":false,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"908"}}],"startPoint":{"x":0,"y":1}},"ooc":{"types":[{"isCap":false,"prev":["b","c","d","\u0111","g","h","l","m","n","p","r","s","t","v","x","kh","nh","ch","ph","th","B","C","D","\u0110","G","H","L","M","N","S","X","T",null],"next":[null],"accent":{"level":"946","acute":"947","heavy":"493"}}],"startPoint":{"x":1.3,"y":1.7}},"oon":{"types":[{"isCap":false,"prev":["b","c","x","d","\u0111","g","h","l","m","n","r","x","t","v","kh","nh","ch","th","ph","B","C","D","\u0110","G","H","K","L","M","N","P","Q","R","S","X","T","V",null],"next":["g",null],"accent":{"level":"940","acute":"111,927,243,938","lower":"111,927,242,938"}}],"startPoint":{"x":1.3,"y":1.7}},"A":{"types":[{"isCap":true,"prev":[null],"next":["c","i","m","n","o","p","t","u","y","ng","nh","ch",null],"accent":{"level":"65","acute":"193","lower":"192","rising":"7842","raised":"195","heavy":"7840"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1,"y":2,"label":"N\u00e9t 1"}]},{"id":"cfg_1792337647829","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1,"y":2,"label":"N\u00e9t 1"},{"x":4,"y":5,"label":"N\u00e9t 2"}]}],"startPoint":{"x":1,"y":2}},"B":{"types":[{"isCap":true,"prev":[null],"next":["a","\u0103","\u00e2","e","\u00ea","o","\u00f4","\u01a1","oon",null],"accent":{"level":"66"}},{"isCap":true,"prev":[null],"next":["i","u","\u01b0"],"accent":{"level":"563"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2,"y":4,"label":"N\u00e9t 1"}]},{"id":"cfg_1792337707190","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":2,"y":4,"label":"N\u00e9t 1"},{"x":3.5,"y":5,"label":"N\u00e9t 2"}]}],"startPoint":{"x":2,"y":4}},"\u0102":{"types":[{"isCap":true,"prev":[null],"next":["c","m","n","p","t",null],"accent":{"level":"258","acute":"7854","lower":"7856","rising":"7858","raised":"7860","heavy":"7862"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1,"y":2,"label":"N\u00e9t 1"}]}],"startPoint":{"x":1,"y":2}},"\u00c2":{"types":[{"isCap":true,"prev":[null],"next":["c","m","n","p","t","y",null],"accent":{"level":"194","acute":"7844","lower":"7846","rising":"7848","raised":"7850","heavy":"7852"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1,"y":2,"label":"N\u00e9t 1"}]}],"startPoint":{"x":1,"y":2}},"C":{"types":[{"isCap":true,"prev":[null],"next":["a","\u0103","\u00e2","o","\u00f4","\u01a1","oon","ooc","h",null],"accent":{"level":"67"}},{"isCap":true,"prev":[null],"next":["u","\u01b0"],"accent":{"level":"482"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2.08,"y":4.94,"label":"N\u00e9t 1"}]},{"id":"cfg_1792337887216","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":2.11,"y":4.93,"label":"N\u00e9t 1"},{"x":4,"y":4,"label":"N\u00e9t 2"}]},{"id":"cfg_1792337905843","name":"3. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":2.05,"y":4.95,"label":"N\u00e9t 1"},{"x":4,"y":4,"label":"N\u00e9t 2"},{"x":3.65,"y":4.94,"label":"N\u00e9t 3"}]}],"startPoint":{"x":2.08,"y":4.94}},"D":{"types":[{"isCap":true,"prev":[null],"next":["a","\u0103","\u00e2","e","\u00ea","o","\u00f4","\u01a1",null],"accent":{"level":"68"}},{"isCap":true,"prev":[null],"next":["i","u","\u01b0"],"accent":{"level":"483"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":3,"y":5,"label":"N\u00e9t 1"}]},{"id":"cfg_1792338599590","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":3,"y":5,"label":"N\u00e9t 1"},{"x":1.5,"y":4,"label":"N\u00e9t 2"}]}],"startPoint":{"x":3,"y":5}},"\u0110":{"types":[{"isCap":true,"prev":[null],"next":["a","\u0103","\u00e2","e","\u00ea","o","\u00f4","\u01a1",null],"accent":{"level":"272"}},{"isCap":true,"prev":[null],"next":["i","u","\u01b0"],"accent":{"level":"484"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2.94,"y":4.87,"label":"N\u00e9t 1"}]}],"startPoint":{"x":2.94,"y":4.87}},"E":{"types":[{"isCap":true,"prev":[null],"next":["m","n","o","c",null],"accent":{"level":"69","acute":"201","lower":"200","rising":"7866","raised":"7868","heavy":"7864"}},{"isCap":true,"prev":[null],"next":["p","t"],"accent":{"level":"69,454","acute":"201,454","lower":"200,454","rising":"7866,454","raised":"7868,454","heavy":"7864,454"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.82,"y":4.93,"label":"N\u00e9t 1"}]},{"id":"cfg_1792338703084","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.82,"y":4.93,"label":"N\u00e9t 1"},{"x":1,"y":3,"label":"N\u00e9t 2"}]},{"id":"cfg_1792338727688","name":"3. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.84,"y":4.93,"label":"N\u00e9t 1"},{"x":1,"y":3,"label":"N\u00e9t 2"},{"x":2.75,"y":4.91,"label":"N\u00e9t 3"}]},{"id":"cfg_1792338910983","name":"4. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.84,"y":4.93,"label":"N\u00e9t 1"},{"x":1,"y":3,"label":"N\u00e9t 2"},{"x":2.8,"y":4.93,"label":"N\u00e9t 3"},{"x":2.26,"y":2.56,"label":"N\u00e9t 4"},{"x":1.88,"y":1.11,"label":"N\u00e9t 5"}]}],"startPoint":{"x":1.82,"y":4.93}},"\u00ca":{"types":[{"isCap":true,"prev":[null],"next":["m","n","ch","nh",null],"accent":{"level":"202","acute":"7870","lower":"7872","rising":"7874","raised":"7876","heavy":"7878"}},{"isCap":true,"prev":[null],"next":["p","t","u"],"accent":{"level":"202,454","acute":"7870,454","lower":"7872,454","rising":"7874,454","raised":"7876,454","heavy":"7878,454"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.84,"y":4.94,"label":"N\u00e9t 1"}]},{"id":"cfg_1792379550433","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.84,"y":4.94,"label":"N\u00e9t 1"},{"x":0.99,"y":2.98,"label":"N\u00e9t 2"}]},{"id":"cfg_1792379580073","name":"3. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.87,"y":4.96,"label":"N\u00e9t 1"},{"x":1.02,"y":3.02,"label":"N\u00e9t 2"},{"x":2.76,"y":4.93,"label":"N\u00e9t 3"}]},{"id":"cfg_1792379672469","name":"4. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.81,"y":4.94,"label":"N\u00e9t 1"},{"x":1.02,"y":3.03,"label":"N\u00e9t 2"},{"x":2.75,"y":4.94,"label":"N\u00e9t 3"},{"x":2.26,"y":2.55,"label":"N\u00e9t 4"}]}],"startPoint":{"x":1.84,"y":4.94}},"G":{"types":[{"isCap":true,"prev":[null],"next":["a","\u0103","\u00e2","o","\u00f4","\u01a1"],"accent":{"level":"71"}},{"isCap":true,"prev":[null],"next":["u","\u01b0","i"],"accent":{"level":"976"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2.06,"y":4.94,"label":"N\u00e9t 1"}]},{"id":"cfg_1792379779766","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":2.13,"y":4.93,"label":"N\u00e9t 1"},{"x":1.43,"y":2.55,"label":"N\u00e9t 2"}]},{"id":"cfg_1792379812636","name":"3. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":2.11,"y":4.93,"label":"N\u00e9t 1"},{"x":1.58,"y":2.55,"label":"N\u00e9t 2"},{"x":4.03,"y":4.07,"label":"N\u00e9t 3"},{"x":3.81,"y":4.93,"label":"N\u00e9t 4"}]}],"startPoint":{"x":2.06,"y":4.94}},"Gh":{"types":[{"isCap":true,"prev":[null],"next":["i",null],"accent":{"level":"375"}},{"isCap":true,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"374"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2.14,"y":4.96,"label":"N\u00e9t 1"}]},{"id":"cfg_1792379951556","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":2.14,"y":4.96,"label":"N\u00e9t 1"},{"x":4.08,"y":1.94,"label":"N\u00e9t 2"}]},{"id":"cfg_1792379977488","name":"3. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":2.2,"y":4.95,"label":"N\u00e9t 1"},{"x":4.07,"y":1.95,"label":"N\u00e9t 2"},{"x":5.06,"y":2.04,"label":"N\u00e9t 3"}]}],"startPoint":{"x":2.14,"y":4.96}},"H":{"types":[{"isCap":true,"prev":[null],"next":["a","\u0103","\u00e2","i","o","\u00f4","\u01a1","u","\u01b0","y",null],"accent":{"level":"72"}},{"isCap":true,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"965"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.53,"y":4.02,"label":"N\u00e9t 1"},{"x":2.31,"y":4.95,"label":"N\u00e9t 2"}]},{"id":"cfg_1792380061467","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.58,"y":4.02,"label":"N\u00e9t 1"},{"x":2.19,"y":4.91,"label":"N\u00e9t 2"},{"x":0.99,"y":0.1,"label":"N\u00e9t 3"},{"x":2.07,"y":2.17,"label":"N\u00e9t 4"}]},{"id":"cfg_1792380150721","name":"3. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.56,"y":3.97,"label":"N\u00e9t 1"},{"x":2.23,"y":4.89,"label":"N\u00e9t 2"},{"x":1.08,"y":0.09,"label":"N\u00e9t 3"},{"x":2.04,"y":2.17,"label":"N\u00e9t 4"},{"x":3.1,"y":3.08,"label":"N\u00e9t 5"},{"x":4.1,"y":4.87,"label":"N\u00e9t 6"}]}],"startPoint":{"x":1.53,"y":4.02}},"I":{"types":[{"isCap":true,"prev":[null],"next":["a","\u00ea","nh","n","m","ch",null],"accent":{"level":"73","acute":"205","lower":"204","rising":"198","raised":"296","heavy":"7882"}},{"isCap":true,"prev":[null],"next":["p","t","u"],"accent":{"level":"73,454","acute":"205,454","lower":"204,454","rising":"198,454","raised":"296,454","heavy":"7882,454"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.81,"y":3.98,"label":"N\u00e9t 2"}]},{"id":"cfg_1792380278297","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.81,"y":3.98,"label":"N\u00e9t 1"},{"x":2.51,"y":4.89,"label":"N\u00e9t 2"}]}],"startPoint":{"x":1.81,"y":3.98}},"K":{"types":[{"isCap":true,"prev":[null],"next":["i","y",null],"accent":{"level":"75"}},{"isCap":true,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"964"}},{"isCap":true,"prev":[null],"next":["h"],"accent":{"level":"533"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.53,"y":3.96,"label":"N\u00e9t 1"}]},{"id":"cfg_1792380309862","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.53,"y":3.96,"label":"N\u00e9t 1"},{"x":2.26,"y":4.96,"label":"N\u00e9t 2"},{"x":4.05,"y":4.1,"label":"N\u00e9t 3"},{"x":1.67,"y":2.5,"label":"N\u00e9t 4"}]}],"startPoint":{"x":1.53,"y":3.96}},"L":{"types":[{"isCap":true,"prev":[null],"next":["a","\u0103","\u00e2","i","o","\u00f4","\u01a1","u","\u01b0","y",null],"accent":{"level":"76"}},{"isCap":true,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"971"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2,"y":5,"label":"N\u00e9t 2"}]},{"id":"cfg_1792380400316","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":2,"y":5,"label":"N\u00e9t 1"},{"x":2.08,"y":2.85,"label":"N\u00e9t 2"},{"x":3.35,"y":4.93,"label":"N\u00e9t 3"}]},{"id":"cfg_1792380418579","name":"3. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":2,"y":5,"label":"N\u00e9t 1"},{"x":2.02,"y":2.86,"label":"N\u00e9t 2"},{"x":3.3,"y":4.89,"label":"N\u00e9t 3"},{"x":-0.01,"y":0.33,"label":"N\u00e9t 4"}]}],"startPoint":{"x":2,"y":5}},"M":{"types":[{"isCap":true,"prev":[null],"next":["a","\u0103","\u00e2","i","o","\u00f4","\u01a1","u","\u01b0","y","ooc",null],"accent":{"level":"77"}},{"isCap":true,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"958"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.52,"y":1.07,"label":"N\u00e9t 1"}]},{"id":"cfg_1792380514793","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.52,"y":1.07,"label":"N\u00e9t 1"},{"x":3.16,"y":4.91,"label":"N\u00e9t 2"}]},{"id":"cfg_1792380527759","name":"3. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.56,"y":1.11,"label":"N\u00e9t 1"},{"x":3.11,"y":5.03,"label":"N\u00e9t 2"},{"x":2.81,"y":0.1,"label":"N\u00e9t 3"},{"x":4.69,"y":4.95,"label":"N\u00e9t 4"}]}],"startPoint":{"x":1.52,"y":1.07}},"N":{"types":[{"isCap":true,"prev":[null],"next":["a","\u0103","\u00e2","e","\u00ea","i","o","\u00f4","\u01a1","g","gh","u","\u01b0","y","h",null],"accent":{"level":"78"}}],"startPoint":{"x":1.5,"y":1},"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.5,"y":1,"label":"N\u00e9t 1"}]},{"id":"cfg_1792380573079","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.5,"y":1,"label":"N\u00e9t 1"},{"x":3.01,"y":4.96,"label":"N\u00e9t 2"}]},{"id":"cfg_1792380581198","name":"3. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.5,"y":1,"label":"N\u00e9t 1"},{"x":3,"y":5,"label":"N\u00e9t 2"},{"x":3.48,"y":0.16,"label":"N\u00e9t 3"}]}]},"O":{"types":[{"isCap":true,"prev":[null],"next":["a","\u0103","c","e","m","n","o",null],"accent":{"level":"79","acute":"211","lower":"210","rising":"7886","raised":"213","heavy":"7884"}},{"isCap":true,"prev":[null],"next":["i","p","t"],"accent":{"level":"79,549","acute":"211,549","lower":"210,549","rising":"7886,549","raised":"213,549","heavy":"7884,549"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.94,"y":4.88,"label":"N\u00e9t 2"}]},{"id":"cfg_1792380624777","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.94,"y":4.88,"label":"N\u00e9t 1"},{"x":2.96,"y":3.56,"label":"N\u00e9t 2"}]}],"startPoint":{"x":1.94,"y":4.88}},"\u00d4":{"types":[{"isCap":true,"prev":[null],"next":["m","n","c",null],"accent":{"level":"212","acute":"7888","lower":"7890","rising":"7892","raised":"7894","heavy":"7896"}},{"isCap":true,"prev":[null],"next":["i","t","p"],"accent":{"level":"212,549","acute":"7888,549","lower":"7890,549","rising":"7892,549","raised":"7894,549","heavy":"7896,549"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.95,"y":4.93,"label":"N\u00e9t 1"}]},{"id":"cfg_1792380653388","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.95,"y":4.93,"label":"N\u00e9t 1"},{"x":1.55,"y":5.32,"label":"N\u00e9t 2"}]}],"startPoint":{"x":1.95,"y":4.93}},"\u01a0":{"types":[{"isCap":true,"prev":[null],"next":["m","n","c",null],"accent":{"level":"416","acute":"7898","lower":"7900","rising":"7902","raised":"7904","heavy":"7906"}},{"isCap":true,"prev":[null],"next":["i","t","p"],"accent":{"level":"416,549","acute":"7898,549","lower":"7900,549","rising":"7902,549","raised":"7904,549","heavy":"7906,549"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2,"y":4.91,"label":"N\u00e9t 1"}]},{"id":"cfg_1792380699968","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":2.02,"y":4.96,"label":"N\u00e9t 1"},{"x":3.48,"y":5.01,"label":"N\u00e9t 2"}]}],"startPoint":{"x":2,"y":4.91}},"P":{"types":[{"isCap":true,"prev":[null],"next":["a","\u0103","\u00e2","e","\u00ea","i","o","\u00f4","\u01a1","u","\u01b0","y","h",null],"accent":{"level":"80"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":3.6,"y":5,"label":"N\u00e9t 1"}]},{"id":"cfg_1792380725222","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":3.62,"y":4.94,"label":"N\u00e9t 1"},{"x":2.06,"y":3.91,"label":"N\u00e9t 2"},{"x":3.13,"y":3.54,"label":"N\u00e9t 3"}]}],"startPoint":{"x":3.6,"y":5}},"Q":{"types":[{"isCap":true,"prev":[null],"next":["u",null],"accent":{"level":"81"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2.15,"y":5,"label":"N\u00e9t 1"}]}],"startPoint":{"x":2.15,"y":5}},"R":{"types":[{"isCap":true,"prev":[null],"next":["a","\u0103","\u00e2","o","\u00f4","\u01a1","u","\u01b0","i",null],"accent":{"level":"82"}},{"isCap":true,"prev":[null],"next":["e","\u00ea"],"accent":{"level":"945"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":3.53,"y":5.01,"label":"N\u00e9t 1"}]},{"id":"cfg_1792380789909","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":3.53,"y":5.01,"label":"N\u00e9t 1"},{"x":2.14,"y":4.07,"label":"N\u00e9t 2"}]},{"id":"cfg_1792380797205","name":"3. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":3.5,"y":5,"label":"N\u00e9t 1"},{"x":2.05,"y":4.01,"label":"N\u00e9t 2"},{"x":2.06,"y":2.6,"label":"N\u00e9t 3"}]}],"startPoint":{"x":3.53,"y":5.01}},"S":{"types":[{"isCap":true,"prev":[null],"next":["a","\u0103","\u00e2","o","\u00f4","\u01a1","ooc","e","\u00ea",null],"accent":{"level":"83"}},{"isCap":true,"prev":[null],"next":["i","u","\u01b0"],"accent":{"level":"550"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.99,"y":4.95,"label":"N\u00e9t 1"}]},{"id":"cfg_1792380873471","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.99,"y":4.95,"label":"N\u00e9t 1"},{"x":3.25,"y":4.96,"label":"N\u00e9t 2"}]}],"startPoint":{"x":1.99,"y":4.95}},"T":{"types":[{"isCap":true,"prev":[null],"next":["a","\u0103","\u00e2","o","\u00f4","\u01a1","e","\u00ea","r","h",null],"accent":{"level":"84"}},{"isCap":true,"prev":[null],"next":["i","u","\u01b0","y"],"accent":{"level":"481"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2.93,"y":3.62,"label":"N\u00e9t 1"}]},{"id":"cfg_1792380908958","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":2.93,"y":3.62,"label":"N\u00e9t 1"},{"x":3.98,"y":4.84,"label":"N\u00e9t 2"},{"x":1.31,"y":4.96,"label":"N\u00e9t 3"}]}],"startPoint":{"x":2.93,"y":3.62}},"U":{"types":[{"isCap":true,"prev":[null],"next":["a","\u0103","\u00e2","\u00f4","\u01a1","c","i","m","n","t","p","y",null],"accent":{"level":"85","acute":"218","lower":"217","rising":"7910","raised":"360","heavy":"7908"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.57,"y":3.95,"label":"N\u00e9t 1"}]}],"startPoint":{"x":1.57,"y":3.95}},"\u01af":{"types":[{"isCap":true,"prev":[null],"next":["a","\u01a1","c","i","m","n","t","u",null],"accent":{"level":"431","acute":"7912","lower":"7914","rising":"7916","raised":"7918","heavy":"7920"}}]},"V":{"types":[{"isCap":true,"prev":[null],"next":["o","\u00f4","\u01a1","a","\u0103","\u00e2","ooc","e","\u00ea","y",null],"accent":{"level":"86"}},{"isCap":true,"prev":[null],"next":["i","u","\u01b0"],"accent":{"level":"7710"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.61,"y":3.91,"label":"N\u00e9t 1"}]},{"id":"cfg_1792380981448","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.49,"y":3.95,"label":"N\u00e9t 1"},{"x":3.24,"y":1.99,"label":"N\u00e9t 2"}]}],"startPoint":{"x":1.61,"y":3.91}},"X":{"types":[{"isCap":true,"prev":[null],"next":["o","\u00f4","\u01a1","a","\u0103","\u00e2","oon","e","\u00ea",null],"accent":{"level":"88"}},{"isCap":true,"prev":[null],"next":["u","i","\u01b0"],"accent":{"level":"485"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.34,"y":3.94,"label":"N\u00e9t 1"}]},{"id":"cfg_1792381061489","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.38,"y":3.89,"label":"N\u00e9t 1"},{"x":1.9,"y":2.6,"label":"N\u00e9t 2"},{"x":3.5,"y":4.95,"label":"N\u00e9t 3"}]}],"startPoint":{"x":1.34,"y":3.94}},"Y":{"types":[{"isCap":true,"prev":[null],"next":["a","u","n","p","t","nh","ch",null],"accent":{"level":"89","acute":"7922","lower":"221","rising":"7926","raised":"7928","heavy":"7924"}},{"isCap":true,"prev":[null],"next":["\u00ea"],"accent":{"level":"972"}}],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.58,"y":3.91,"label":"N\u00e9t 1"}]}],"startPoint":{"x":1.58,"y":3.91}},"\u1e00":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.08,"y":1,"label":"N\u00e9t 1"}]}],"startPoint":{"x":1.08,"y":1}},"\u1e01":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2.01,"y":2.01,"label":"N\u00e9t 1"}]}],"startPoint":{"x":2.01,"y":2.01}},"\u1e03":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2.5,"y":2,"label":"N\u00e9t 2"}]}],"startPoint":{"x":2.5,"y":2}},"\u1e04":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2,"y":2,"label":"N\u00e9t 1"}]},{"id":"cfg_1792401188400","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.98,"y":1.93,"label":"N\u00e9t 1"},{"x":2.95,"y":0.91,"label":"N\u00e9t 2"}]}],"startPoint":{"x":2,"y":2}},"\u1e05":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1,"y":1,"label":"N\u00e9t 1"}]},{"id":"cfg_1792401217532","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1,"y":1,"label":"N\u00e9t 1"},{"x":1.98,"y":0.02,"label":"N\u00e9t 2"}]}],"startPoint":{"x":1,"y":1}},"\u1e06":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1,"y":1,"label":"N\u00e9t 1"}]},{"id":"cfg_1792401282522","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1,"y":1,"label":"N\u00e9t 1"},{"x":2.01,"y":1.96,"label":"N\u00e9t 2"},{"x":3.5,"y":1,"label":"N\u00e9t 3"}]}],"startPoint":{"x":1,"y":1}},"\u1e07":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2.64,"y":1.68,"label":"N\u00e9t 1"}]},{"id":"cfg_1792401432228","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":2.64,"y":1.68,"label":"N\u00e9t 1"},{"x":2.12,"y":1.96,"label":"N\u00e9t 2"},{"x":1.48,"y":0.98,"label":"N\u00e9t 3"},{"x":2.95,"y":0.58,"label":"N\u00e9t 4"}]}],"startPoint":{"x":2.64,"y":1.68}},"\u1e08":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.86,"y":1.71,"label":"N\u00e9t 1"}]},{"id":"cfg_1792401679338","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.86,"y":1.71,"label":"N\u00e9t 1"},{"x":2.34,"y":1.91,"label":"N\u00e9t 2"},{"x":3,"y":1.01,"label":"N\u00e9t 3"}]}],"startPoint":{"x":1.86,"y":1.71}},"\u1e09":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.45,"y":1.04,"label":"N\u00e9t 1"}]},{"id":"cfg_1792401713307","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.45,"y":1.04,"label":"N\u00e9t 1"},{"x":1.96,"y":1.98,"label":"N\u00e9t 2"},{"x":2.87,"y":4,"label":"N\u00e9t 3"}]},{"id":"cfg_1792401737551","name":"3. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.43,"y":0.99,"label":"N\u00e9t 1"},{"x":2,"y":2,"label":"N\u00e9t 2"},{"x":2.9,"y":3.95,"label":"N\u00e9t 3"},{"x":2.64,"y":4.92,"label":"N\u00e9t 4"},{"x":1.98,"y":4.02,"label":"N\u00e9t 5"}]},{"id":"cfg_1792401767174","name":"4. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":2.9,"y":3.95,"label":"N\u00e9t 1"}]}],"startPoint":{"x":1.45,"y":1.04}},"\u1e0a":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":2.02,"y":1.93,"label":"N\u00e9t 1"}]},{"id":"cfg_1792401817525","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":2.02,"y":1.93,"label":"N\u00e9t 1"},{"x":1.92,"y":-2.01,"label":"N\u00e9t 2"},{"x":1.32,"y":-2.93,"label":"N\u00e9t 3"}]},{"id":"cfg_1792401850251","name":"3. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.98,"y":1.96,"label":"N\u00e9t 1"},{"x":1.95,"y":-2.03,"label":"N\u00e9t 2"},{"x":1.38,"y":-2.95,"label":"N\u00e9t 3"},{"x":1.05,"y":-2.04,"label":"N\u00e9t 4"},{"x":2,"y":0,"label":"N\u00e9t 5"},{"x":2.5,"y":1,"label":"N\u00e9t 6"}]}],"startPoint":{"x":2.02,"y":1.93}},"\u1e0b":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":0.99,"y":1.02,"label":"N\u00e9t 1"}]},{"id":"cfg_1792401915028","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":0.99,"y":1.02,"label":"N\u00e9t 1"},{"x":2.09,"y":1.97,"label":"N\u00e9t 2"},{"x":1.75,"y":0.95,"label":"N\u00e9t 3"}]}],"startPoint":{"x":0.99,"y":1.02}},"\u1e0c":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.5,"y":0,"label":"N\u00e9t 1"}]},{"id":"cfg_1792401970472","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.5,"y":0,"label":"N\u00e9t 1"},{"x":1.92,"y":1.96,"label":"N\u00e9t 2"}]}],"startPoint":{"x":1.5,"y":0}},"\u1e10":{"types":[],"dotConfigs":[{"id":"start","name":"1. \u0110i\u1ec3m \u0111\u1eb7t b\u00fat (Chu\u1ea9n)","desc":"1 ch\u1ea5m chu\u1ea9n","dots":[{"x":1.48,"y":1.94,"label":"N\u00e9t 1"}]},{"id":"cfg_1792402003476","name":"2. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.48,"y":1.94,"label":"N\u00e9t 1"},{"x":1.46,"y":-0.07,"label":"N\u00e9t 2"},{"x":0.86,"y":-3,"label":"N\u00e9t 3"},{"x":2.5,"y":2,"label":"N\u00e9t 4"},{"x":3.15,"y":4.96,"label":"N\u00e9t 6"}]},{"id":"cfg_1792402109647","name":"3. C\u1ea5u h\u00ecnh m\u1edbi","desc":"Giai \u0111o\u1ea1n t\u1eadp vi\u1ebft","dots":[{"x":1.48,"y":1.94,"label":"N\u00e9t 1"},{"x":1.45,"y":0.02,"label":"N\u00e9t 2"},{"x":1.43,"y":-1.97,"label":"N\u00e9t 3"},{"x":0.8,"y":-2.97,"label":"N\u00e9t 4"},{"x":2.54,"y":2,"label":"N\u00e9t 5"},{"x":3.48,"y":4,"label":"N\u00e9t 6"},{"x":3.2,"y":4.96,"label":"N\u00e9t 7"},{"x":2.58,"y":4,"label":"N\u00e9t 8"}]}],"startPoint":{"x":1.48,"y":1.94}}};

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
