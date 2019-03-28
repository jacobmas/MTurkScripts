// ==UserScript==
// @name         DQ
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Another attempt at DQ
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*trystuff.com*
// @include *
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @grant GM_deleteValue
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(30000,200,[],begin_script,"A4R60DG7BBK8Y",false);
    function is_bad_name(b_name)
    {
	return false;
    }
  /* DQ.begin_year is the earliest year cars to do */
    var DQ={dealer_regex:new RegExp(
        "www\\.360\\.agency|"+
        "www\\.allautonetwork\\.com|webstatic\\.auction123\\.com|"+
        "www\\.(auto(conx|corner|dealerwebsites|drivenmarketing|funds|jini|manager|revo|searchtech|webexpress))\\.com|"+
        "\\/\\/auto(drivenmarketing|motiveleads)\\.com|www\\.autosalesweb\\.net|www\\.bwebauto\\.com|"+
        "www\\.(car(base|guywebdesign|max|prolive|sforsale|think)).com|www\\.carwizard\\.net|www\\.chromacars\\.com|"+
        "www\\.convertus\\.com|"+
        "(www|static)\\.dealer\\.com|\\/dealeron\\.js|www\\.dealercity\\.(ca|com)|"+
        "www\\.(dealer(carsearch|center|eprocess|fire|inspire|on|pac|peak|scloud|specialties|spike|spiketruck|sync|websites))\\.com|"+
        "dealerclick\\.com|www\\.dealerexpress\\.net|\\/\\/dealer(city|leads)\\.com|cdn\\.dealereprocess\\.org|"+
        "(\\/\\/|inventoryplus\\.)dealersocket\\.com|\\/\\/dealerseo\\.net|dealersiteplus\\.ca|dealer-cdn\\.dealersync\\.com|"+
        "\\/\\/dealersolutionssoftware\\.com|www\\.(dssal|drive(dominion|time))\\.com|www\\.d2cmedia\\.ca|"+
        "(www|images)\\.ebizautos\\.com|"+
        "www\\.edealer\\.ca|(www\\.|\\/\\/)evolio\\.ca|www\\.ez-results\\.ca|"+
        "foxdealerinteractive\\.com|www\\.fridaynet\\.com|www\\.fzautomotive\\.com|www\\.goauto\\.ca|www\\.higherturnover\\.com|"+
        "www\\.interactivedms\\.com|(www|tracking)\\.hasyourcar\\.com|"+
        "www\\.jazelauto\\.com|analytics\\.jazel\\.net|(images-stag|userlogin)\\.jazelc\\.com|"+
        "www\\.(jdbyrider|lotboys|motorcarmarketing|wearefullthrottle)\\.com|"+
        "\\/\\/kukui\\.com|(\\/\\/|\\/\\/leadboxhq\\.com|"+
        "www\\.)lotwizard\\.com|media-cf\\.assets-cdk\\.com|"+
        "(www|secure[0-9])\\.motionfuze\\.com|(www\\.|\\/\\/)nakedlime\\.com|(www\\.|\\/\\/)obbauto\\.com|"+
        "(www\\.|\\/\\/)prontodealer\\.com|\\/\\/remora\\.com|www\\.solutionsmedias360\\.com|"+
        "www\\.stormdivision\\.com|strathcom\\.com|"+
        "www\\.vicimus\\.com|(www|cdn-w)\\.v12soft(|ware)\\.com|"+
        "(\\/\\/|www\\.)waynereaves\\.com|www\\.(wearefullthrottle|webstreak)\\.com|www\\.yourcarlot\\.com","i"),

           dealer_map:{"fridaynet":"lotwizard","dealersocket":"dealerfire","dealerseo":"automotiveleads",
                       "dealerleads":"automotiveleads","v12soft":"v12software","jazelc":"jazelauto","dealerspiketruck":"dealerspike",
                       "solutionsmedias360":"360"
                      },
         begin_year:1981,
         make_rx_str:"Acura|Audi|BMW|Buick|Cadillac|Can-Am|Chevrolet|Chrysler|Dodge|Entegra|Ferrari|Fiat|Ford|GMC|"+
          "Honda|Hummer|Hyundai|Infiniti|Isuzu|Jaguar|Jeep|Kia|Land Rover|Lexux|Lincoln|"+
          "Mazda|Mercedes-Benz|Mercury|Mini|Mitsubishi|Nissan|Plymouth|Pontiac|Porsche|"+
          "Ram|Saab|Saturn|Scion|Smart|Subaru|Suzuki|Toyota|Volkswagen|Volvo",
           employee_list:[],email_list:[]};

    DQ.carSearchShit=function(t, n, r,doc,url) {
        function i(o, s) {
            if (!n[o]) {
                if (!t[o]) {
                    var c = "function" == typeof require && require;
                    if (!s && c) return c(o, !0);
                    if (a) return a(o, !0);
                    var u = new Error("Cannot find module '" + o + "'");
                    throw u.code = "MODULE_NOT_FOUND", u
                }
                var d = n[o] = {
                    exports: {}
                };

                t[o][0].call(d.exports, function(e) {
                    var n = t[o][1][e];
                    return i(n ? n : e)
                }, d, d.exports,doc,url);//, e, t, n, r)
            }
            return n[o].exports
        }
        for (var a = "function" == typeof require && require, o = 0; o < r.length; o++) i(r[o]);
        return i;
    }

    DQ.param1={
        1: [function(e, t, n, doc,url) {
            var r = e("./sha1"),
                i = function(e) {
                    var t = {
                        hashImages: !0
                    };
                    this.options = this.extend(e, t), this.nativeForEach = Array.prototype.forEach, this.nativeMap = Array.prototype.map
                };
            i.prototype = {
                extend: function(e, t) {
                    if (null == e) return t;
                    for (var n in e) null != e[n] && t[n] !== e[n] && (t[n] = e[n]);
                    return t
                },
                addIfDefined: function(e, t, n) {
                    return void 0 !== n && (e[t] = n), e
                },
                interrogate: function(e) {
                    var t = {};
                    t = this.userAgentKey(t), t = this.languageKey(t), t = this.screenKey(t), t = this.timezoneKey(t), t = this.indexedDbKey(t), t = this.addBehaviorKey(t), t = this.openDatabaseKey(t), t = this.cpuClassKey(t), t = this.platformKey(t), t = this.doNotTrackKey(t), t = this.pluginsKey(t), t = this.canvasKey(t), t = this.webglKey(t), t = this.touchSupportKey(t), t = this.videoKey(t), t = this.audioKey(t), t = this.vendorKey(t), t = this.productKey(t), t = this.productSubKey(t), t = this.browserKey(t), t = this.windowKey(t), this.keys = t, this.parallel([this.fontsKey], e)
                },
                userAgentKey: function(e) {
                    return this.options.excludeUserAgent ? e : (e.userAgent = this.getUserAgent(), e)
                },
                getUserAgent: function() {
                    return window.navigator.userAgent
                },
                languageKey: function(e) {
                    return this.options.excludeLanguage ? e : (e.language = navigator.language, e)
                },
                screenKey: function(e) {
                    return this.options.excludeScreen ? e : (e.screen = this.getScreen(e), e)
                },
                getScreen: function() {
                    var e = {};
                    return e.width = screen.width, e.height = screen.height, e = this.addIfDefined(e, "availHeight", screen.availHeight), e = this.addIfDefined(e, "availWidth", screen.availWidth), e = this.addIfDefined(e, "pixelDepth", screen.pixelDepth), e = this.addIfDefined(e, "innerWidth", window.innerWidth), e = this.addIfDefined(e, "innerHeight", window.innerHeight), e = this.addIfDefined(e, "outerWidth", window.outerWidth), e = this.addIfDefined(e, "outerHeight", window.outerHeight), e = this.addIfDefined(e, "devicePixelRatio", window.devicePixelRatio)
                },
                timezoneKey: function(e) {
                    return this.options.excludeTimezone ? e : (e.timezone = (new Date).getTimezoneOffset() / -60, e)
                },
                indexedDbKey: function(e) {
                    return this.options.excludeIndexedDB || this.options.excludeIndexedDb ? e : (e.indexedDb = this.hasIndexedDb(), e)
                },
                hasIndexedDb: function() {
                    return !!window.indexedDB
                },
                addBehaviorKey: function(e) {
                    return this.options.excludeAddBehavior ? e : (e.addBehavior = this.hasAddBehavior(), e)
                },
                hasAddBehavior: function() {
                    return !!doc.body.addBehavior
                },
                openDatabaseKey: function(e) {
                    return this.options.excludeOpenDatabase ? e : (e.openDatabase = this.hasOpenDatabase(), e)
                },
                hasOpenDatabase: function() {
                    return !!window.openDatabase
                },
                cpuClassKey: function(e) {
                    return this.options.excludeCpuClass ? e : (e.cpuClass = this.getNavigatorCpuClass(), e)
                },
                getNavigatorCpuClass: function() {
                    return navigator.cpuClass ? navigator.cpuClass : "unknown"
                },
                platformKey: function(e) {
                    return this.options.excludePlatform ? e : (e.platform = this.getNavigatorPlatform(), e)
                },
                getNavigatorPlatform: function() {
                    return navigator.platform ? navigator.platform : "unknown"
                },
                doNotTrackKey: function(e) {
                    return this.options.excludeDoNotTrack ? e : (e.doNotTrack = this.getDoNotTrack(), e)
                },
                getDoNotTrack: function() {
                    return navigator.doNotTrack ? navigator.doNotTrack : "unknown"
                },
                pluginsKey: function(e) {
                    return this.options.excludePlugins ? e : (e.plugins = this.isIE() ? this.getIEPlugins() : this.getPlugins(), e)
                },
                getPlugins: function() {
                    for (var e = [], t = 0, n = navigator.plugins.length; n > t; ++t) e.push(navigator.plugins[t]);
                    return e = e.sort(function(e, t) {
                        return e.name > t.name ? 1 : e.name < t.name ? -1 : 0
                    }), this.map(e, function(e) {
                        var t = this.map(e, function(e) {
                            return [e.type, e.suffixes].join("~")
                        }).join(",");
                        return [e.name, e.description, t].join("::")
                    }, this).join(";")
                },
                getIEPlugins: function() {
                    if (window.ActiveXObject) {
                        var e = ["AcroPDF.PDF", "Adodb.Stream", "AgControl.AgControl", "DevalVRXCtrl.DevalVRXCtrl.1", "MacromediaFlashPaper.MacromediaFlashPaper", "Msxml2.DOMDocument", "Msxml2.XMLHTTP", "PDF.PdfCtrl", "QuickTime.QuickTime", "QuickTimeCheckObject.QuickTimeCheck.1", "RealPlayer", "RealPlayer.RealPlayer(tm) ActiveX Control (32-bit)", "RealVideo.RealVideo(tm) ActiveX Control (32-bit)", "Scripting.Dictionary", "SWCtl.SWCtl", "Shell.UIHelper", "ShockwaveFlash.ShockwaveFlash", "Skype.Detection", "TDCCtl.TDCCtl", "WMPlayer.OCX", "rmocx.RealPlayer G2 Control", "rmocx.RealPlayer G2 Control.1"];
                        return this.map(e, function(e) {
                            try {
                                return new ActiveXObject(e), e
                            } catch (t) {
                                return null
                            }
                        }).join(";")
                    }
                    return ""
                },
                canvasKey: function(e) {
                    return this.options.excludeCanvas ? void 0 : (e.canvas = this.isCanvasSupported() ? this.getCanvasFp() : "unsupported", e)
                },
                isCanvasSupported: function() {
                    var e = doc.createElement("canvas");
                    return !(!e.getContext || !e.getContext("2d"))
                },
                getCanvasFp: function() {
                    var e = {},
                        t = doc.createElement("canvas");
                    t.width = 600, t.height = 160, t.style.display = "inline";
                    var n = t.getContext("2d");
                    n.rect(1, 1, 11, 11), n.rect(3, 3, 7, 7), e.winding = n.isPointInPath(6, 6, "evenodd") === !1 ? "yes" : "no", e.towebp = !1;
                    try {
                        var i = doc.createElement("canvas");
                        i.width = 1, i.height = 1, e.towebp = 0 === i.toDataURL("image/webp").indexOf("data:image/webp")
                    } catch (a) {
                        e.towebp = "error"
                    }
                    e.blending = function() {
                        var e = doc.createElement("canvas").getContext("2d");
                        try {
                            return e.globalCompositeOperation = "screen", "screen" === e.globalCompositeOperation
                        } catch (t) {
                            return !1
                        }
                    }(), n.textBaseline = "alphabetic", n.fillStyle = "#f60", n.fillRect(125, 1, 62, 20), n.fillStyle = "#069", n.font = "11pt Arial", n.fillText("Cwm fjordbank glyphs vext quiz, ðŸ˜ƒ", 2, 15), n.fillStyle = "rgba(102, 204, 0, 0.7)", n.font = "18pt Arial", n.fillText("Cwm fjordbank glyphs vext quiz, ðŸ˜ƒ", 4, 45);
                    try {
                        n.globalCompositeOperation = "multiply"
                    } catch (a) {}
                    return n.fillStyle = "rgb(255,0,255)", n.beginPath(), n.arc(50, 50, 50, 0, 2 * Math.PI, !0), n.closePath(), n.fill(), n.fillStyle = "rgb(0,255,255)", n.beginPath(), n.arc(100, 50, 50, 0, 2 * Math.PI, !0), n.closePath(), n.fill(), n.fillStyle = "rgb(255,255,0)", n.beginPath(), n.arc(75, 100, 50, 0, 2 * Math.PI, !0), n.closePath(), n.fill(), n.fillStyle = "rgb(255,0,255)", n.arc(75, 75, 75, 0, 2 * Math.PI, !0), n.arc(75, 75, 25, 0, 2 * Math.PI, !0), n.fill("evenodd"), this.options.hashImages ? e.img = r(t.toDataURL()) : e.img = t.toDataURL(), e
                },
                fontsKey: function(e, t, n) {
                    return n.options.excludeFonts ? void t() : void n.getFonts(e, t, n)
                },
                getFonts: function(e, t) {
                    setTimeout(function() {
                        var n = ["monospace", "sans-serif", "serif"],
                            r = "mmmmmmmmlli",
                            i = "72px";
                        try {
                            if (!doc.getElementById("d__fFH")) {
                                var a = doc.createElement("div");
                                a.id = "d__fFH", a.style.position = "absolute", a.style.top = "-5000px", a.style.left = "-5000px", a.innerHTML = '<object id="d_dlg" classid="clsid:3050f819-98b5-11cf-bb82-00aa00bdce0b" width="0px" height="0px"></object><span id="d__fF" style="font-family:serif;font-size:200px;visibility:hidden"></span>', doc.body.appendChild(a)
                            }
                        } catch (o) {}
                        try {
                            var s = doc.getElementById("d__fF");
                            s.style.fontSize = i, s.innerHTML = r;
                            var c = {},
                                u = {};
                            for (var d in n) s.style.fontFamily = n[d], c[n[d]] = s.offsetWidth, u[n[d]] = s.offsetHeight;
                            for (var h = function(e) {
                                for (var t in n)
                                    if (s.style.fontFamily = e + "," + n[t], s.offsetWidth !== c[n[t]] || s.offsetHeight !== u[n[t]]) return !0;
                                return !1
                            }, l = ["ARNOPRO", "AgencyFB", "ArabicTypesetting", "ArialUnicodeMS", "AvantGardeBkBT", "BankGothicMdBT", "Batang", "BitstreamVeraSansMono", "Calibri", "Century", "CenturyGothic", "Clarendon", "EUROSTILE", "FranklinGothic", "FuturaBkBT", "FuturaMdBT", "GOTHAM", "GillSans", "HELV", "Haettenschweiler", "HelveticaNeue", "Humanst521BT", "Leelawadee", "LetterGothic", "LevenimMT", "LucidaBright", "LucidaSans", "MSMincho", "MSOutlook", "MSReferenceSpecialty", "MSUIGothic", "MTExtra", "MYRIADPRO", "Marlett", "MeiryoUI", "MicrosoftUighur", "MinionPro", "MonotypeCorsiva", "PMingLiU", "Pristina", "SCRIPTINA", "SegoeUILight", "Serifa", "SimHei", "SmallFonts", "Staccato222BT", "TRAJANPRO", "UniversCE55Medium", "Vrinda", "ZWAdobeF"], g = [], f = 0, p = l.length; p > f; ++f) h(l[f]) && g.push(l[f]);
                            e.fonts = g.join(";")
                        } catch (o) {
                            e.fonts = ";"
                        }
                        t()
                    }, 1)
                },
                videoKey: function(e) {
                    return this.options.excludeVideo ? e : (e.video = this.getVideo(), e)
                },
                getVideo: function() {
                    var e = doc.createElement("video"),
                        t = !1;
                    try {
                        (t = !!e.canPlayType) && (t = new Boolean(t), t.ogg = e.canPlayType('video/ogg; codecs="theora"'), t.h264 = e.canPlayType('video/mp4; codecs="avc1.42E01E"'), t.webm = e.canPlayType('video/webm; codecs="vp8, vorbis"'))
                    } catch (n) {
                        return "errored"
                    }
                    return t ? {
                        ogg: t.ogg,
                        h264: t.h264,
                        webm: t.webm
                    } : !1
                },
                audioKey: function(e) {
                    return this.options.excludeAudio ? e : (e.audio = this.getAudio(), e)
                },
                getAudio: function() {
                    var e = doc.createElement("audio"),
                        t = !1;
                    return (t = !!e.canPlayType) && (t = new Boolean(t), t.ogg = e.canPlayType('audio/ogg; codecs="vorbis"') || "nope", t.mp3 = e.canPlayType("audio/mpeg;") || "nope", t.wav = e.canPlayType('audio/wav; codecs="1"') || "nope", t.m4a = e.canPlayType("audio/x-m4a;") || e.canPlayType("audio/aac;") || "nope"), t ? {
                        ogg: t.ogg,
                        mp3: t.mp3,
                        wav: t.wav,
                        m4a: t.m4a
                    } : !1
                },
                webglKey: function(e) {
                    return this.options.excludeWebGL ? e : (e.webGL = this.getWebglFp(), e)
                },
                getWebglFp: function() {
                    var e = this.getWebglCanvas();
                    if (!e) return "unsupported";
                    var t = function(t) {
                        return e.clearColor(0, 0, 0, 1), e.enable(e.DEPTH_TEST), e.depthFunc(e.LEQUAL), e.clear(e.COLOR_BUFFER_BIT | e.DEPTH_BUFFER_BIT), "[" + t[0] + ", " + t[1] + "]"
                    },
                        n = function(e) {
                            var t, n = e.getExtension("EXT_texture_filter_anisotropic") || e.getExtension("WEBKIT_EXT_texture_filter_anisotropic") || e.getExtension("MOZ_EXT_texture_filter_anisotropic");
                            return n ? (t = e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT), 0 === t && (t = 2), t) : null
                        },
                        i = {},
                        a = "attribute vec2 attrVertex;varying vec2 varyinTexCoordinate;uniform vec2 uniformOffset;void main(){varyinTexCoordinate=attrVertex+uniformOffset;gl_Position=vec4(attrVertex,0,1);}",
                        o = "precision mediump float;varying vec2 varyinTexCoordinate;void main() {gl_FragColor=vec4(varyinTexCoordinate,0,1);}",
                        s = e.createBuffer();
                    e.bindBuffer(e.ARRAY_BUFFER, s);
                    var c = new Float32Array([-.2, -.9, 0, .4, -.26, 0, 0, .732134444, 0]);
                    e.bufferData(e.ARRAY_BUFFER, c, e.STATIC_DRAW), s.itemSize = 3, s.numItems = 3;
                    var u = e.createProgram(),
                        d = e.createShader(e.VERTEX_SHADER);
                    e.shaderSource(d, a), e.compileShader(d);
                    var h = e.createShader(e.FRAGMENT_SHADER);
                    return e.shaderSource(h, o), e.compileShader(h), e.attachShader(u, d), e.attachShader(u, h), e.linkProgram(u), e.useProgram(u), u.vertexPosAttrib = e.getAttribLocation(u, "attrVertex"), u.offsetUniform = e.getUniformLocation(u, "uniformOffset"), e.enableVertexAttribArray(u.vertexPosArray), e.vertexAttribPointer(u.vertexPosAttrib, s.itemSize, e.FLOAT, !1, 0, 0), e.uniform2f(u.offsetUniform, 1, 1), e.drawArrays(e.TRIANGLE_STRIP, 0, s.numItems), null != e.canvas && (this.options.hashImages === !0 ? i.img = r(e.canvas.toDataURL()) : i.img = e.canvas.toDataURL()), i.extensions = e.getSupportedExtensions().join(";"), i["aliased line width range"] = t(e.getParameter(e.ALIASED_LINE_WIDTH_RANGE)), i["aliased point size range"] = t(e.getParameter(e.ALIASED_POINT_SIZE_RANGE)), i["alpha bits"] = e.getParameter(e.ALPHA_BITS), i.antialiasing = e.getContextAttributes().antialias ? "yes" : "no", i["blue bits"] = e.getParameter(e.BLUE_BITS), i["depth bits"] = e.getParameter(e.DEPTH_BITS), i["green bits"] = e.getParameter(e.GREEN_BITS), i["max anisotropy"] = n(e), i["max combined texture image units"] = e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS), i["max cube map texture size"] = e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE), i["max fragment uniform vectors"] = e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS), i["max render buffer size"] = e.getParameter(e.MAX_RENDERBUFFER_SIZE), i["max texture image units"] = e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS), i["max texture size"] = e.getParameter(e.MAX_TEXTURE_SIZE), i["max varying vectors"] = e.getParameter(e.MAX_VARYING_VECTORS), i["max vertex attribs"] = e.getParameter(e.MAX_VERTEX_ATTRIBS), i["max vertex texture image units"] = e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS), i["max vertex uniform vectors"] = e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS), i["max viewport dims"] = t(e.getParameter(e.MAX_VIEWPORT_DIMS)), i["red bits"] = e.getParameter(e.RED_BITS), i.renderer = e.getParameter(e.RENDERER), i["shading language version"] = e.getParameter(e.SHADING_LANGUAGE_VERSION), i["stencil bits"] = e.getParameter(e.STENCIL_BITS), i.vendor = e.getParameter(e.VENDOR), i.version = e.getParameter(e.VERSION), e.getShaderPrecisionFormat ? (i["vertex shader high float precision"] = e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.HIGH_FLOAT).precision, i["vertex shader high float precision rangeMin"] = e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.HIGH_FLOAT).rangeMin, i["vertex shader high float precision rangeMax"] = e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.HIGH_FLOAT).rangeMax, i["vertex shader medium float precision"] = e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.MEDIUM_FLOAT).precision, i["vertex shader medium float precision rangeMin"] = e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.MEDIUM_FLOAT).rangeMin, i["vertex shader medium float precision rangeMax"] = e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.MEDIUM_FLOAT).rangeMax, i["vertex shader low float precision"] = e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.LOW_FLOAT).precision, i["vertex shader low float precision rangeMin"] = e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.LOW_FLOAT).rangeMin, i["vertex shader low float precision rangeMax"] = e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.LOW_FLOAT).rangeMax, i["fragment shader high float precision"] = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.HIGH_FLOAT).precision, i["fragment shader high float precision rangeMin"] = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.HIGH_FLOAT).rangeMin, i["fragment shader high float precision rangeMax"] = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.HIGH_FLOAT).rangeMax, i["fragment shader medium float precision"] = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.MEDIUM_FLOAT).precision, i["fragment shader medium float precision rangeMin"] = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.MEDIUM_FLOAT).rangeMin, i["fragment shader medium float precision rangeMax"] = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.MEDIUM_FLOAT).rangeMax, i["fragment shader low float precision"] = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.LOW_FLOAT).precision, i["fragment shader low float precision rangeMin"] = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.LOW_FLOAT).rangeMin, i["fragment shader low float precision rangeMax"] = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.LOW_FLOAT).rangeMax, i["vertex shader high int precision"] = e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.HIGH_INT).precision, i["vertex shader high int precision rangeMin"] = e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.HIGH_INT).rangeMin, i["vertex shader high int precision rangeMax"] = e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.HIGH_INT).rangeMax, i["vertex shader medium int precision"] = e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.MEDIUM_INT).precision, i["vertex shader medium int precision rangeMin"] = e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.MEDIUM_INT).rangeMin, i["vertex shader medium int precision rangeMax"] = e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.MEDIUM_INT).rangeMax, i["vertex shader low int precision"] = e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.LOW_INT).precision, i["vertex shader low int precision rangeMin"] = e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.LOW_INT).rangeMin, i["vertex shader low int precision rangeMax"] = e.getShaderPrecisionFormat(e.VERTEX_SHADER, e.LOW_INT).rangeMax, i["fragment shader high int precision"] = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.HIGH_INT).precision, i["fragment shader high int precision rangeMin"] = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.HIGH_INT).rangeMin, i["fragment shader high int precision rangeMax"] = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.HIGH_INT).rangeMax, i["fragment shader medium int precision"] = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.MEDIUM_INT).precision, i["fragment shader medium int precision rangeMin"] = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.MEDIUM_INT).rangeMin, i["fragment shader medium int precision rangeMax"] = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.MEDIUM_INT).rangeMax, i["fragment shader low int precision"] = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.LOW_INT).precision, i["fragment shader low int precision rangeMin"] = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.LOW_INT).rangeMin, i["fragment shader low int precision rangeMax"] = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.LOW_INT).rangeMax, i) : i
                },
                touchSupportKey: function(e) {
                    return this.options.excludeTouchSupport ? e : (e.touch = this.getTouchSupport(), e)
                },
                getTouchSupport: function() {
                    var e = 0,
                        t = !1;
                    "undefined" != typeof navigator.maxTouchPoints ? e = navigator.maxTouchPoints : "undefined" != typeof navigator.msMaxTouchPoints && (e = navigator.msMaxTouchPoints);
                    try {
                        doc.createEvent("TouchEvent"), t = !0
                    } catch (n) {
                        t = !1
                    }
                    var r = "ontouchstart" in window;
                    return {
                        maxTouchPoints: e,
                        touchEvent: t,
                        touchStart: r
                    }
                },
                getWebglCanvas: function() {
                    var e = doc.createElement("canvas"),
                        t = null;
                    try {
                        t = e.getContext("webgl") || e.getContext("experimental-webgl")
                    } catch (n) {
                        return null
                    }
                    return t || (t = null), t
                },
                vendorKey: function(e) {
                    return this.options.excludeVendor ? e : (e.vendor = this.getVendor(), e)
                },
                getVendor: function() {
                    return window.navigator.vendor
                },
                productKey: function(e) {
                    return this.options.excludeProduct ? e : (e.product = this.getProduct(), e)
                },
                getProduct: function() {
                    return window.navigator.product
                },
                productSubKey: function(e) {
                    return this.options.excludeProductSub ? e : (e.productSub = this.getProductSub(), e)
                },
                getProductSub: function() {
                    return window.navigator.productSub
                },
                browserKey: function(e) {
                    return this.options.excludeBrowser ? e : (e.browser = this.getBrowser(), e)
                },
                getBrowser: function() {
                    return {
                        ie: this.isIE(),
                        chrome: this.isChrome(),
                        webdriver: this.isWebdriver()
                    }
                },
                isIE: function() {
                    return "Microsoft Internet Explorer" === navigator.appName ? !0 : !("Netscape" !== navigator.appName || !/Trident/.test(navigator.userAgent))
                },
                isChrome: function() {
                    return "undefined" != typeof window.chrome
                },
                isWebdriver: function() {
                    return !!navigator.webdriver
                },
                windowKey: function(e) {
                    return this.options.excludeWindow ? e : (e.window = this.getWindow(), e)
                },
                getWindow: function() {
                    var e = {};
                    return e = this.getHistoryLength(e), e = this.getHardwareConcurrency(e), e = this.isIFrame(e)
                },
                getHistoryLength: function(e) {
                    return this.addIfDefined(e, "historyLength", window.history.length)
                },
                getHardwareConcurrency: function(e) {
                    return this.addIfDefined(e, "hardwareConcurrency", navigator.hardwareConcurrency)
                },
                isIFrame: function(e) {
                    return e.iframe = window.self !== window.top, e
                },
                parallel: function(e, t) {
                    if (e.constructor != Array || 0 === e.length) return void t(this.keys);
                    var n = e.length,
                        r = this;
                    this.each(e, function(e) {
                        e(r.keys, function() {
                            n -= 1, 0 === n && t(r.keys)
                        }, r)
                    })
                },
                map: function(e, t, n) {
                    var r = [];
                    return null == e ? r : this.nativeMap && e.map === this.nativeMap ? e.map(t, n) : (this.each(e, function(e, i, a) {
                        r[r.length] = t.call(n, e, i, a)
                    }), r)
                },
                each: function(e, t, n) {
                    if (null !== e)
                        if (this.nativeForEach && e.forEach === this.nativeForEach) e.forEach(t, n);
                        else if (e.length === +e.length) {
                            for (var r = 0, i = e.length; i > r; r++)
                                if (t.call(n, e[r], r, e) === {}) return
                        } else
                            for (var a in e)
                                if (e.hasOwnProperty(a) && t.call(n, e[a], a, e) === {}) return
                }
            }, t.exports = i
        }, {
            "./sha1": 5
        }],
        2: [function(e, t, n, doc,url) {
            var r = function() {};
            r.prototype = {
                get: function() {
                    if (this.alreadySent) return null;
                    var e = {};
                    try {
                        e.cookies = navigator.cookieEnabled ? 1 : 0
                    } catch (t) {
                        e.cookies = 0
                    }
                    try {
                        e.setTimeout = setTimeout.toString().replace(/\s/g, "") === "function setTimeout() { [native code] }".replace(/\s/g, "") ? 0 : 1
                    } catch (t) {
                        e.setTimeout = 0
                    }
                    try {
                        e.setInterval = setInterval.toString().replace(/\s/g, "") === "function setInterval() { [native code] }".replace(/\s/g, "") ? 0 : 1
                    } catch (t) {
                        e.setInterval = 0
                    }
                    try {
                        e.appName = navigator.appName
                    } catch (t) {
                        e.appName = 0
                    }
                    try {
                        e.platform = navigator.platform
                    } catch (t) {
                        e.platform = 0
                    }
                    try {
                        e.syslang = navigator.systemLanguage ? navigator.systemLanguage : navigator.language
                    } catch (t) {
                        e.syslang = ""
                    }
                    try {
                        e.userlang = navigator.userLanguage ? navigator.userLanguage : navigator.language
                    } catch (t) {
                        e.userlang = ""
                    }
                    try {
                        e.cpu = navigator.oscpu || navigator.cpuClass || ""
                    } catch (t) {
                        e.cpu = ""
                    }
                    try {
                        e.productSub = navigator.productSub ? navigator.productSub : 0
                    } catch (t) {
                        e.productSub = 0
                    }
                    e.plugins = [], e.mimeTypes = [], e.screen = {}, e.fonts = [];
                    try {
                        if (navigator.plugins)
                            for (var n in navigator.plugins) "object" == typeof navigator.plugins[n] && e.plugins.push(navigator.plugins[n].name + " " + (navigator.plugins[n].version ? navigator.plugins[n].version : ""))
                    } catch (t) {}
                    try {
                        if (navigator.mimeTypes)
                            for (let n in navigator.mimeTypes) "object" == typeof navigator.mimeTypes[n] && e.mimeTypes.push(navigator.mimeTypes[n].description + " " + navigator.mimeTypes[n].type)
                    } catch (t) {}
                    try {
                        screen && (e.screen.width = screen.width, e.screen.height = screen.height, e.screen.colorDepth = screen.colorDepth)
                    } catch (t) {}
                    try {
                        if (!doc.getElementById("d__fFH")) {
                            var r = doc.createElement("DIV");
                            r.id = "d__fFH", r.style.position = "absolute", r.style.top = "-5000px", r.style.left = "-5000px", r.innerHTML = '<OBJECT id="d_dlg" CLASSID="clsid:3050f819-98b5-11cf-bb82-00aa00bdce0b" width="0px" height="0px"></OBJECT><SPAN id="d__fF" style="font-family:serif;font-size:200px;visibility:hidden"></SPAN>', doc.body.appendChild(r)
                        }
                    } catch (t) {}
                    try {
                        var i = doc.getElementById("d_dlg");
                        if (i && i.fonts) {
                            e.fonts.push("dlg");
                            for (let n = 1; n <= i.fonts.count; n++) e.fonts.push(i.fonts(n))
                        } else {
                            var a = doc.getElementById("d__fF"),
                                o = ["\x73\x65\x72\x69\x66", "\x43\x61\x6C\x69\x62\x72\x69", "\x43\x61\x6D\x62\x72\x69\x61", "\x48\x6F\x65\x66\x6C\x65\x72\x20\x54\x65\x78\x74", "\x55\x74\x6F\x70\x69\x61", "\x4C\x69\x62\x65\x72\x61\x74\x69\x6F\x6E\x20\x53\x65\x72\x69\x66", "\x4E\x69\x6D\x62\x75\x73\x20\x52\x6F\x6D\x61\x6E\x20\x4E\x6F\x39\x20\x4C", "\x54\x69\x6D\x65\x73", "\x4D\x6F\x6E\x61\x63\x6F", "\x54\x65\x72\x6D\x69\x6E\x61\x6C", "\x6D\x6F\x6E\x6F\x73\x70\x61\x63\x65", "\x43\x6F\x6E\x73\x74\x61\x6E\x74\x69\x61", "\x4C\x75\x63\x69\x64\x61\x20\x42\x72\x69\x67\x68\x74", "\x44\x65\x6A\x61\x56\x75\x20\x53\x65\x72\x69\x66", "\x42\x69\x74\x73\x74\x72\x65\x61\x6D\x20\x56\x65\x72\x61\x20\x53\x65\x72\x69\x66", "\x47\x65\x6F\x72\x67\x69\x61", "\x53\x65\x67\x6F\x65\x20\x55\x49", "\x43\x61\x6E\x64\x61\x72\x61", "\x42\x69\x74\x73\x74\x72\x65\x61\x6D\x20\x56\x65\x72\x61\x20\x53\x61\x6E\x73", "\x44\x65\x6A\x61\x56\x75\x20\x53\x61\x6E\x73", "\x54\x72\x65\x62\x75\x63\x68\x65\x74\x20\x4D\x53", "\x56\x65\x72\x64\x61\x6E\x61", "\x43\x6F\x6E\x73\x6F\x6C\x61\x73", "\x41\x6E\x64\x61\x6C\x65\x20\x4D\x6F\x6E\x6F", "\x4C\x75\x63\x69\x64\x61\x20\x43\x6F\x6E\x73\x6F\x6C\x65", "\x4C\x75\x63\x69\x64\x61\x20\x53\x61\x6E\x73\x20\x54\x79\x70\x65\x77\x72\x69\x74\x65\x72", "\x44\x65\x6A\x61\x56\x75\x20\x53\x61\x6E\x73\x20\x4D\x6F\x6E\x6F", "\x42\x69\x74\x73\x74\x72\x65\x61\x6D\x20\x56\x65\x72\x61\x20\x53\x61\x6E\x73\x20\x4D\x6F\x6E\x6F", "\x4C\x69\x62\x65\x72\x61\x74\x69\x6F\x6E\x20\x4D\x6F\x6E\x6F", "\x4E\x69\x6D\x62\x75\x73\x20\x4D\x6F\x6E\x6F\x20\x4C", "\x4D\x6F\x6E\x61\x63\x6F", "\x43\x6F\x75\x72\x69\x65\x72\x20\x4E\x65\x77", "\x43\x6F\x75\x72\x69\x65\x72"];
                            a.innerHTML = "The quick brown fox jumps over the lazy dog.", a.style.fontFamily = o[0];
                            for (let s = a.offsetWidth, n = 1; n < o.length; n++) a.style.fontFamily = '"' + o[n] + '",' + o[0], s != a.offsetWidth && e.fonts.push(o[n])
                        }
                    } catch (t) {}
                    return e
                }
            }, t.exports = r
        }, {}],
        3: [function(e, t, n, doc,url) {

            console.log("MOO in 3 "+JSON.stringify(n));
            var r = e("./legacy"),
                i = e("./stringify"),
                a = e("./xhr"),
                o = e("./miner"),
                s = e("./interrogator"),
                c = e("./wiring");
            console.log("r="+r);
            var FingerprintWrapper = function(e) {
                var t = null,
                    n = new r;
                console.log("MOO "+JSON.stringify(e));
                c.rebuildXMLHttpRequest(e.ajax_header), c.fetchAjaxHeaders(e);
                var u = function(r) {
                    if (!t) {
                        t = r ? r.type : "manual/other";
                        var c = function(t) {
                            var n = a();
                            GM_xmlhttpRequest({method:"POST",url:e.path,data:"p=" + r,
                                               onreadystatechange:function() {
                                                   if (4 == n.readyState && 200 == n.status) {
                                                       h("DistilPostResponse");
                                                       try {
                                                           var e = n.getResponseHeader("X-UID")
                                                           } catch (t) {}
                                                       if (doc.getElementById("distilIdentificationBlock")) {
                                                           var r = encodeURIComponent(doc.location.pathname + doc.location.search),
                                                               i = "/distil_identify_cookie.html?httpReferrer=" + r;
                                                           e && (i = i + "&uid=" + e), doc.location.hash && (i += doc.location.hash), doc.location.replace(i)
                                                       } else if (doc.getElementById("distil_ident_block")) {
                                                           var a = "d_ref=" + doc.location.pathname.replace(/&/, "%26");
                                                           a += "&qs=" + doc.location.search + doc.location.hash, e && (a = "uid=" + e + "&" + a), doc.location.replace("/distil_identify_cookie.html?" + a)
                                                       } else(doc.getElementById("distil_ident_block_POST") || doc.getElementById("distilIdentificationBlockPOST")) && window.location.reload()
                                                   }
                                               }});
                            h("DistilPostSent");
                        },
                            u = function(e, t) {
                                for (var n = {}, r = e.length, i = 0, a = e.length; a > i; ++i) e[i](function(e) {
                                    for (var i in e) e.hasOwnProperty(i) && (n[i] = e[i]);
                                    r -= 1, 0 === r && t(n)
                                })
                            };
                        u([function(e) {
                            setTimeout(function() {
                                function t(e) {
                                    for (var t = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", n = "", r = 0; e > r; ++r) n += t.substr(Math.floor(Math.random() * t.length), 1);
                                    return n
                                }
                                h("DistilProofOfWorkStart");
                                var n = new o,
                                    r = (new Date).getTime() + ":" + t(20);
                                n.mine(r, 8, function(t) {
                                    h("DistilProofOfWorkStop"), e({
                                        proof: t
                                    })
                                })
                            }, 1)
                        }, function(e) {
                            setTimeout(function() {
                                h("DistilFP2Start");
                                var t = new s;
                                t.interrogate(function(t) {
                                    h("DistilFP2End"), e({
                                        fp2: t
                                    })
                                })
                            }, 1)
                        }, function(e) {
                            setTimeout(function() {
                                setTimeout(function() {
                                    h("DistilLegacyStart");
                                    var t = n.get();
                                    h("DistilLegacyEnd"), e(t)
                                }, 1)
                            }, 1)
                        }], function(e) {
                            c(e)
                        })
                    }
                },
                    d = !1,
                    h = function(e) {},
                    l = doc.getElementById("d__inj");
                console.log("d="+d);
                l && l.className && (l.className.indexOf("delayed") > -1 && (d = !0), l.className.indexOf("perfmarks") > -1 && void 0 != performance && void 0 != performance.mark && (h = function(e) {
                    performance.mark(e)
                })), d ? window.document.readyState && "complete" == window.document.readyState ? u() : window.addEventListener ? window.addEventListener("load", u, !1) : window.doc.attachEvent && window.doc.attachEvent("onload", u) : window.document.readyState && "loading" == window.document.readyState ? u() : window.addEventListener ? (window.addEventListener("DOMContentLoaded", u, !1), window.addEventListener("load", u, !1)) : window.document.attachEvent && (window.document.attachEvent("onreadystatechange", u), window.document.attachEvent("onload", u))
                u();
            };
            FingerprintWrapper({
                path: url.match(/https?:\/\/[^\/]+/)[0]+"/lawaitlakjhngozb.js?PID=A52A50FA-E350-3E55-8F5D-B0667BDD6BF3",
                ajax_header: "bbbtyefxcyaxydyrebcdsdvudquy",
                interval: 27e4
            })
        }, {
            "./interrogator": 1,
            "./legacy": 2,
            "./miner": 4,
            "./stringify": 6,
            "./wiring": 7,
            "./xhr": 8
        }],
        4: [function(e, t, n, doc,url) {
            var r = e("./sha1.js"),
                i = function(e) {
                    var t = {};
                    this.options = this.extend(e, t)
                };
            i.prototype = {
                extend: function(e, t) {
                    if (null == e) return t;
                    for (var n in e) null != e[n] && t[n] !== e[n] && (t[n] = e[n]);
                    return t
                },
                mine: function(e, t, n) {
                    for (var i = 0, a = Math.pow(2, 32 - t);;) {
                        var o = i.toString(16) + ":" + e;
                        i++;
                        var s = r(o);
                        if (parseInt(s.substr(0, 8), 16) < a) return void n(o)
                    }
                }
            }, t.exports = i
        }, {
            "./sha1.js": 5
        }],
        5: [function(e, t, n, doc,url) {
            "use strict";
            var r = {};
            r.hash = function(e) {
                e = e.utf8Encode();
                var t = [1518500249, 1859775393, 2400959708, 3395469782];
                e += String.fromCharCode(128);
                for (var n = e.length / 4 + 2, i = Math.ceil(n / 16), a = new Array(i), o = 0; i > o; o++) {
                    a[o] = new Array(16);
                    for (var s = 0; 16 > s; s++) a[o][s] = e.charCodeAt(64 * o + 4 * s) << 24 | e.charCodeAt(64 * o + 4 * s + 1) << 16 | e.charCodeAt(64 * o + 4 * s + 2) << 8 | e.charCodeAt(64 * o + 4 * s + 3)
                }
                a[i - 1][14] = 8 * (e.length - 1) / Math.pow(2, 32), a[i - 1][14] = Math.floor(a[i - 1][14]), a[i - 1][15] = 8 * (e.length - 1) & 4294967295;
                o=0;
                for (var c, u, d, h, l, g = 1732584193, f = 4023233417, p = 2562383102, m = 271733878, v = 3285377520, y = new Array(80); i > o; o++) {
                    for (let E = 0; 16 > E; E++) y[E] = a[o][E];
                    for (let E = 16; 80 > E; E++) y[E] = r.ROTL(y[E - 3] ^ y[E - 8] ^ y[E - 14] ^ y[E - 16], 1);
                    c = g, u = f, d = p, h = m, l = v;
                    for (let E = 0; 80 > E; E++) {
                        var T = Math.floor(E / 20),
                            S = r.ROTL(c, 5) + r.f(T, u, d, h) + l + t[T] + y[E] & 4294967295;
                        l = h, h = d, d = r.ROTL(u, 30), u = c, c = S
                    }
                    g = g + c & 4294967295, f = f + u & 4294967295, p = p + d & 4294967295, m = m + h & 4294967295, v = v + l & 4294967295
                }
                return r.toHexStr(g) + r.toHexStr(f) + r.toHexStr(p) + r.toHexStr(m) + r.toHexStr(v)
            }, r.f = function(e, t, n, r) {
                switch (e) {
                    case 0:
                        return t & n ^ ~t & r;
                    case 1:
                        return t ^ n ^ r;
                    case 2:
                        return t & n ^ t & r ^ n & r;
                    case 3:
                        return t ^ n ^ r
                }
            }, r.ROTL = function(e, t) {
                return e << t | e >>> 32 - t
            }, r.toHexStr = function(e) {
                for (var t, n = "", r = 7; r >= 0; r--) t = e >>> 4 * r & 15, n += t.toString(16);
                return n
            }, "undefined" == typeof String.prototype.utf8Encode && (String.prototype.utf8Encode = function() {
                return unescape(encodeURIComponent(this))
            }), "undefined" == typeof String.prototype.utf8Decode && (String.prototype.utf8Decode = function() {
                try {
                    return decodeURIComponent(escape(this))
                } catch (e) {
                    return this
                }
            }), "undefined" != typeof t && t.exports && (t.exports = r.hash)
        }, {}],
        6: [function(e, t, n, doc,url) {
            function r(e) {
                return c.lastIndex = 0, '"' + (c.test(e) ? e.replace(c, s) : e) + '"'
            }

            function i(e, t) {
                for (var n = "", r = 0; e > r; ++r) n += "0";
                return (n + (t || 0)).slice(-e)
            }

            function a(e, t) {
                if (void 0 == e) return "null";
                var n = Object.prototype.toString,
                    i = typeof e,
                    o = void 0;
                "object" == i && (o = n.call(e));
                var s = "[object Boolean]",
                    c = "[object Number]",
                    u = "[object String]",
                    d = "[object Array]";
                switch (o || i) {
                    case "boolean":
                    case s:
                        return "" + e;
                    case "number":
                    case c:
                        return e > -1 / 0 && 1 / 0 > e ? "" + e : "null";
                    case "string":
                    case u:
                        return r("" + e)
                }
                if ("object" == typeof e) {
                    if (o != d || t) {
                        var h = "{";
                        for (var l in e) "function" != typeof e[l] && (h += '"' + l + '":' + a(e[l], t) + ",");
                        return 1 == h.length ? "{}" : h.substring(0, h.length - 1) + "}"
                    }
                    for (var g = [], f = 0, p = e.length; p > f; ++f) el = a(e[f], t), g.push(void 0 === el ? "null" : el);
                    return "[" + g.join(",") + "]"
                }
                return '""'
            }
            var o = "\\u00",
                s = function(e) {
                    var t = e.charCodeAt(0),
                        n = u[t];
                    return n ? n : o + i(2, t.toString(16))
                },
                c = /[\x00-\x1f\x22\x5c]/g,
                u = {
                    92: "\\\\",
                    34: '\\"',
                    8: "\\b",
                    12: "\\f",
                    10: "\\n",
                    13: "\\r",
                    9: "\\t"
                };
            t.exports = a
        }, {}],
        7: [function(e, t, n, doc,url) {
            var r = e("./xhr"),
                i = function(e) {
                    var t = !1,
                        n = function() {
                            try {
                                var n = r();
                                n.dH && (n.onreadystatechange = function() {
                                    try {
                                        4 == n.readyState && 200 == n.status ? (n.getResponseHeader("X-JU") && (e.path = n.getResponseHeader("X-JU"), XMLHttpRequest.prototype.dU = n.getResponseHeader("X-JU")), n.getResponseHeader("X-AH") && (XMLHttpRequest.prototype.dH = n.getResponseHeader("X-AH"))) : 4 == n.readyState && 200 != n.status && clearInterval(t)
                                    } catch (r) {}
                                }, n.open("HEAD", e.path, !0), n.send())
                            } catch (i) {}
                        };
                    t = setInterval(n, e.interval)
                },
                a = function(e) {
                    try {
                        window.XMLHttpRequest && !window.XMLHttpRequest.prototype.dH && (XMLHttpRequest.prototype.dH = e, function() {
                            var e = XMLHttpRequest.prototype;
                            e.dOpen = e.open, e.open = function(t, n, r, i, a) {
                                e.dOpen.apply(this, arguments);
                                var o = new RegExp("^(((https?:)?//" + location.hostname + "([/]|$))|(/[^/]))");
                                (n.match(o) || !n.match(/^https?:\/\//) && n.match(/^[a-zA-Z0-9\-_\.]/) && -1 == n.indexOf("://")) && e.setRequestHeader.apply(this, ["X-Distil-Ajax", e.dH])
                            }, XMLHttpRequest.prototype.open = e.open
                        }())
                    } catch (t) {}
                };
            t.exports = {
                fetchAjaxHeaders: i,
                rebuildXMLHttpRequest: a
            }
        }, {
            "./xhr": 8
        }],
        8: [function(e, t, n, doc,url) {
            t.exports = function() {
                try {
                    var e;
                    if (window.XMLHttpRequest) e = new XMLHttpRequest;
                    else if ("undefined" == typeof XMLHttpRequest) try {
                        e = new ActiveXObject("Msxml2.XMLHTTP.6.0")
                    } catch (t) {
                        try {
                            e = new ActiveXObject("Msxml2.XMLHTTP.3.0")
                        } catch (t) {
                            try {
                                e = new ActiveXObject("Microsoft.XMLHTTP")
                            } catch (t) {
                                return 0
                            }
                        }
                    }
                } catch (t) {
                    return 0
                }
                return e
            }
        }, {}]
    };
    DQ.param2={};
    DQ.param3=[3];


var _0x174c = ["/lawaitlakjhngozb.js?PID=A52A50FA-E350-3E55-8F5D-B0667BDD6BF3", "\x49\x6E\x74\x65\x72\x6E\x65\x74\x20\x45\x78\x70\x6C\x6F\x72\x65\x72", "\x46\x69\x72\x65\x66\x6F\x78", "\x43\x68\x72\x6F\x6D\x65", "\x43\x68\x72\x6F\x6D\x69\x75\x6D", "\x53\x61\x66\x61\x72\x69", "\x4D\x61\x63\x49\x6E\x74\x65\x6C", "\x57\x69\x6E\x33\x32", "\x57\x69\x6E\x36\x34", "\x57\x69\x6E\x64\x6F\x77\x73", "\x57\x69\x6E\x4E\x54", "\x4F\x53\x58", "\x4C\x69\x6E\x75\x78", "\x65\x76\x61\x6C", "\x4F", "\x53\x6E\x6F\x77\x20\x4C\x65\x6F\x70\x61\x72\x64", "\x4C\x69\x6F\x6E\x2F\x4D\x6F\x75\x6E\x74\x61\x69\x6E\x20\x4C\x69\x6F\x6E", "\x59\x6F\x73\x65\x6D\x69\x74\x65", "\x4D\x61\x76\x65\x72\x69\x63\x6B\x73", "\x64", "\x58\x4D\x4C\x48\x74\x74\x70\x52\x65\x71\x75\x65\x73\x74", "\x75\x6E\x64\x65\x66\x69\x6E\x65\x64", "\x4D\x73\x78\x6D\x6C\x32\x2E\x58\x4D\x4C\x48\x54\x54\x50\x2E\x36\x2E\x30", "\x4D\x73\x78\x6D\x6C\x32\x2E\x58\x4D\x4C\x48\x54\x54\x50\x2E\x33\x2E\x30", "\x4D\x69\x63\x72\x6F\x73\x6F\x66\x74\x2E\x58\x4D\x4C\x48\x54\x54\x50", "\x6C\x65\x6E\x67\x74\x68", "\x73\x75\x62\x73\x74\x72\x69\x6E\x67", "\x73\x6C\x69\x63\x65", "\x6E", "\x73\x75\x62\x73\x74\x72", "", "\x6E\x61\x76\x69\x67\x61\x74\x6F\x72", "\x74\x6F\x4C\x6F\x77\x65\x72\x43\x61\x73\x65", "\x61", "\x68", "\x72\x65\x70\x6C\x61\x63\x65", "\x74", "\x24\x32\x24\x31", "\x70\x6C\x61\x74\x66\x6F\x72\x6D", "\x73\x63\x72\x69\x70\x74", "\x6F\x62\x6A\x65\x63\x74", "\x73\x63\x72\x65\x65\x6E", "\x66\x6F\x6E\x74\x73", "\x63\x70\x75", "\x61\x64\x64\x45\x76\x65\x6E\x74\x4C\x69\x73\x74\x65\x6E\x65\x72", "\x5F\x5F", "\x5F", "\x75\x61\x74\x65", "\x5F\x5F\x77\x65\x62", "\x5F\x5F\x73", "\x5F\x5F\x66\x78", "\x5F\x75\x6E\x77\x72\x61\x70\x70\x65\x64", "\x5F\x73\x63\x72\x69\x70\x74\x5F", "\x74\x69\x6F\x6E", "\x5F\x66\x6E", "\x5F\x53", "\x5F\x49\x44\x45", "\x5F\x52\x65\x63\x6F\x72\x64\x65\x72", "\x5F\x70", "\x5F\x73", "\x50", "\x53", "\x65", "\x64\x6F\x63\x75\x6D\x65\x6E\x74", "\x6D\x61\x74\x63\x68", "\x63\x61\x63\x68\x65\x5F", "\x33\x30\x30", "\x65\x78\x74\x65\x72\x6E\x61\x6C", "\x53\x65\x71\x75\x65\x6E\x74\x75\x6D", "\x69\x6E\x64\x65\x78\x4F\x66", "\x34\x30\x30", "\x73", "\x67\x65\x74\x41\x74\x74\x72\x69\x62\x75\x74\x65", "\x64\x6F\x63\x75\x6D\x65\x6E\x74\x45\x6C\x65\x6D\x65\x6E\x74", "\x35\x30\x30", "\x77\x65\x62", "\x36\x30\x30", "\x37\x30\x30", "\x50\x4F\x53\x54", "\x6F\x70\x65\x6E", "\x3D", "\x73\x65\x6E\x64", "\x68\x6F\x73\x74\x6E\x61\x6D\x65", "\x6C\x6F\x63\x61\x74\x69\x6F\x6E", "\x5F\x5F\x5F\x64\x54\x4C", "\x67\x65\x74\x45\x6C\x65\x6D\x65\x6E\x74\x42\x79\x49\x64", "\x6E\x6F\x64\x65\x4E\x61\x6D\x65", "\x49\x4E\x50\x55\x54", "\x76\x61\x6C\x75\x65", "\x61\x75\x64\x69\x6F", "\x70\x72\x6F\x67\x72\x65\x73\x73", "\x76\x69\x64\x65\x6F", "\x77\x69\x6E\x64\x6F\x77", "\x6D\x65\x64\x69\x61", "\x72\x65\x61\x64\x79\x73\x74\x61\x74\x65", "\x6C\x6F\x61\x64\x69\x6E\x67", "\x6C\x6F\x61\x64", "\x2D", "\x61\x74\x74\x61\x63\x68\x45\x76\x65\x6E\x74", "\x6F\x6E\x6C\x6F\x61\x64"];
(function(_0x9e50x1) {
    var _0x9e50x2 = _0x174c[0],
        _0x9e50x3 = [_0x174c[1], _0x174c[2], _0x174c[3], _0x174c[4], _0x174c[5], _0x174c[6], _0x174c[7], _0x174c[8], _0x174c[9], _0x174c[10], _0x174c[11], _0x174c[12], _0x174c[13]],
        _0x9e50x4 = function(_0x9e50x14) {
            return (_0x9e50x14 == _0x174c[14]) ? [_0x174c[15], _0x174c[16], _0x174c[17], _0x174c[18]] : []
        },
        _0x9e50x5 = false,
        _0x9e50x6 = false,
        _0x9e50x7 = 2,
        _0x9e50x8 = _0x174c[19],
        _0x9e50x9 = function() {
            try {
                var _0x9e50x15;
                if (_0x9e50x1[_0x174c[20]]) {
                    _0x9e50x15 = new XMLHttpRequest()
                } else {
                    if (typeof XMLHttpRequest == _0x174c[21]) {
                        try {
                            _0x9e50x15 = new ActiveXObject(_0x174c[22])
                        } catch (e) {
                            try {
                                _0x9e50x15 = new ActiveXObject(_0x174c[23])
                            } catch (e) {
                                try {
                                    _0x9e50x15 = new ActiveXObject(_0x174c[24])
                                } catch (e) {
                                    return 0
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                return 0
            };
            return _0x9e50x15
        },
        _0x9e50xa = function() {
            try {
                _0x9e50xc = _0x9e50x3[3][_0x174c[26]](_0x9e50x4(_0x174c[14])[_0x174c[25]] - !![], _0x9e50x4(_0x174c[14])[_0x174c[25]] + !![]), _0x9e50xd = [] + _0x9e50x3[_0x174c[27]](-!![]), _0x9e50xe = _0x9e50x3[8][2 + !![]] + _0x9e50x3[_0x9e50x4(_0x174c[14])[_0x174c[25]]][_0x174c[26]](_0x9e50xd[_0x174c[25]] + ![]), _0x9e50xf = _0x9e50x3[_0x9e50xd[_0x174c[25]] + 1][_0x174c[27]](-2) + (_0x9e50x3[_0x174c[27]](-1) + [])[+[]] + _0x174c[28] + _0x9e50x3[+!![] + !![] + !![]][_0x174c[29]](-(+!![] + !![] + !![])), _0x9e50x12 = _0x9e50xf[_0x174c[26]](_0x9e50xe[_0x174c[25]], +[] + 5), _0x9e50x11 = _0x9e50xd[_0x174c[26]](!![] + !![]), _0x9e50x12 = _0x9e50x12 + (_0x174c[30] + _0x9e50x1[_0x174c[31]])[_0x174c[26]](_0x9e50x3[_0x174c[25]] - !![], _0x9e50x3[_0x174c[25]] + _0x9e50x11[_0x174c[25]]), _0x9e50x10 = (_0x9e50x3[!_0x9e50x4() + 1][+![]] + _0x9e50xf[_0x9e50xe[_0x174c[25]] + _0x9e50xe[_0x174c[25]] - !![]] + _0x9e50xf[_0x9e50xe[_0x174c[25]]] + _0x9e50x3[_0x9e50xe[_0x174c[25]] - !![]][-![]])[_0x174c[32]](), _0x9e50x12 = (_0x9e50x12 + _0x9e50xc[_0x9e50xc[_0x174c[25]] - !![]] + _0x9e50x11[1 - _0x9e50x4() - !![]])[_0x174c[35]](_0x174c[33], _0x174c[34]), _0x9e50x11 = _0x9e50x10[_0x9e50x10[_0x174c[25]] - !![]] + _0x9e50x11 + _0x9e50x11[+!![]], _0x9e50xc = _0x9e50x4(_0x174c[14])[+!![]][_0x174c[26]](_0x9e50xf[_0x174c[25]] + _0x9e50xd[_0x174c[25]] - !![], _0x9e50xf[_0x174c[25]] + (_0x9e50xe[_0x174c[25]] * 2))[_0x174c[35]](_0x9e50x4(_0x174c[14])[+!![]][+!![]], _0x174c[30]) + _0x174c[36] + _0x9e50xc;
                _0x9e50xe = _0x9e50xe + (_0x9e50x3[_0x174c[27]](-!!_0x9e50x4()) + [])[_0x174c[26]](-!_0x9e50x4(), _0x9e50x4(_0x174c[14])[_0x174c[25]] - !![] - !![])[_0x174c[35]](/(.)(.)/, _0x174c[37]) + _0x9e50xe[+!![]], _0x9e50xc = _0x174c[34] + _0x9e50xc, _0x9e50x12 = _0x9e50x12 + _0x9e50xe[+!![]]
            } catch (e) {
                _0x9e50xc = _0x174c[38];
                _0x9e50xd = _0x174c[39];
                _0x9e50xe = _0x174c[40];
                _0x9e50xf = _0x174c[41];
                _0x9e50x10 = _0x174c[42];
                _0x9e50x11 = _0x174c[43]
            };
            return _0x174c[44]
        },
        _0x9e50xb = function() {
            _0x9e50x6 = setTimeout(_0x9e50xb, _0x9e50x7++ * 200);
            var _0x9e50x16 = 0,
                _0x9e50x17 = null,
                _0x9e50x18 = null;
            var _0x9e50x19 = [_0x174c[45] + _0x9e50xe + _0x174c[46] + _0x9e50xd + _0x174c[47], _0x174c[48] + _0x9e50xe + _0x174c[46] + _0x9e50xd + _0x174c[47], _0x174c[49] + _0x9e50xf + _0x174c[46] + _0x9e50xd + _0x174c[47], _0x174c[50] + _0x9e50xe + _0x174c[46] + _0x9e50xd + _0x174c[47], _0x174c[45] + _0x9e50xe + _0x174c[51], _0x174c[48] + _0x9e50xe + _0x174c[51], _0x174c[49] + _0x9e50xf + _0x174c[51], _0x174c[50] + _0x9e50xe + _0x174c[51], _0x174c[48] + _0x9e50xe + _0x174c[52] + _0x9e50x10 + _0x174c[53], _0x174c[48] + _0x9e50xe + _0x174c[46] + _0x174c[39] + _0x174c[46] + _0x9e50x10, _0x174c[48] + _0x9e50xe + _0x174c[46] + _0x174c[39] + _0x174c[54]];
            var _0x9e50x1a = [_0x174c[55] + _0x9e50xf + _0x174c[56] + _0x174c[57], _0x174c[58] + _0x9e50xc, _0x174c[59] + _0x9e50xf, _0x9e50x11 + _0x174c[60] + _0x9e50xc, _0x9e50x11 + _0x174c[61] + _0x9e50xf, _0x9e50x19[+[]][+!![]] + _0x174c[46] + _0x9e50x12 + _0x174c[62]];
            try {
                for (_0x9e50x17 in _0x9e50x1a) {
                    _0x9e50x18 = _0x9e50x1a[_0x9e50x17];
                    if (_0x9e50x1[_0x9e50x18]) {
                        _0x9e50x16 = 100 + parseInt(_0x9e50x17)
                    }
                };
                for (_0x9e50x17 in _0x9e50x19) {
                    _0x9e50x18 = _0x9e50x19[_0x9e50x17];
                    if (_0x9e50x1[_0x174c[63]][_0x9e50x18]) {
                        _0x9e50x16 = 200 + parseInt(_0x9e50x17)
                    }
                };
                for (_0x9e50x17 in _0x9e50x1[_0x174c[63]]) {
                    if (_0x9e50x17[_0x174c[64]](/\$[a-z]dc_/) && _0x9e50x1[_0x174c[63]][_0x9e50x17][_0x174c[65]]) {
                        _0x9e50x16 = _0x174c[66]
                    }
                }
            } catch (e) {};
            try {
                if (!_0x9e50x16 && _0x9e50x1[_0x174c[67]] && _0x9e50x1[_0x174c[67]].toString() && (_0x9e50x1[_0x174c[67]].toString()[_0x174c[69]](_0x174c[68]) != -1)) {
                    _0x9e50x16 = _0x174c[70]
                }
            } catch (e) {};
            try {
                if ((!_0x9e50x16) && _0x9e50x1[_0x174c[63]][_0x174c[73]][_0x174c[72]](_0x174c[71] + _0x9e50xf)) {
                    _0x9e50x16 = _0x174c[74]
                } else {
                    if ((!_0x9e50x16) && _0x9e50x1[_0x174c[63]][_0x174c[73]][_0x174c[72]](_0x174c[75] + _0x9e50xe)) {
                        _0x9e50x16 = _0x174c[76]
                    } else {
                        if ((!_0x9e50x16) && _0x9e50x1[_0x174c[63]][_0x174c[73]][_0x174c[72]](_0x9e50xe)) {
                            _0x9e50x16 = _0x174c[77]
                        }
                    }
                }
            } catch (e) {};
            try {
                if ((![]) !== _0x9e50x5) {
                    _0x9e50x8 = _0x174c[62];
                    _0x9e50x16 = 1
                }
            } catch (e) {};
            if (_0x9e50x16) {
                var _0x9e50x15 = _0x9e50x9();
                _0x9e50x15[_0x174c[79]](_0x174c[78], _0x9e50x2, true);
                _0x9e50x15[_0x174c[81]](_0x9e50x8 + _0x174c[80] + _0x9e50x16);
                clearInterval(_0x9e50x6);
                try {
                    if (_0x9e50x1[_0x174c[83]][_0x174c[82]]) {
                        var _0x9e50x1b = _0x9e50x1[_0x174c[83]][_0x174c[82]][_0x174c[35]](/\./g, _0x174c[46]) + _0x174c[84];
                        if (document[_0x174c[85]](_0x9e50x1b) && (document[_0x174c[85]](_0x9e50x1b)[_0x174c[86]] == _0x174c[87])) {
                            document[_0x174c[85]](_0x9e50x1b)[_0x174c[88]] = _0x9e50x16
                        }
                    }
                } catch (e) {}
            }
        },
        _0x9e50xc = _0x174c[89],
        _0x9e50xd = _0x174c[90],
        _0x9e50xe = _0x174c[91],
        _0x9e50xf = _0x174c[31],
        _0x9e50x10 = _0x174c[92],
        _0x9e50x11 = _0x174c[63],
        _0x9e50x12 = _0x174c[93],
        _0x9e50x13 = _0x9e50xa();
    if (_0x9e50x1[_0x174c[63]][_0x174c[94]] && (_0x9e50x1[_0x174c[63]][_0x174c[94]] == _0x174c[95])) {
        _0x9e50xb()
    } else {
        if (_0x9e50x1[_0x174c[44]]) {
            _0x9e50x1[_0x174c[44]](_0x174c[96], _0x9e50xb, false);
            _0x9e50x1[_0x174c[63]][_0x174c[44]](_0x9e50xe + _0x174c[97] + _0x9e50xd + _0x174c[47], _0x9e50xb, false);
            _0x9e50x1[_0x174c[63]][_0x174c[44]](_0x174c[75] + _0x9e50xe + _0x174c[97] + _0x9e50xd + _0x174c[47], _0x9e50xb, false);
            _0x9e50x1[_0x174c[63]][_0x174c[44]](_0x174c[71] + _0x9e50xf + _0x174c[97] + _0x9e50xd + _0x174c[47], _0x9e50xb, false)
        } else {
            if (_0x9e50x1[_0x174c[63]][_0x174c[98]]) {
                _0x9e50x1[_0x174c[63]][_0x174c[98]](_0x174c[99], _0x9e50xb)
            }
        }
    }
})(window);
    /* Straightforward enough parsers for # vehicles */
    DQ.parse_allautonetwork=function(doc,url,resolve,reject) {
        var text=doc.body.innerHTML,parsed,count=0,num,x,split_text=doc.body.innerHTML.split("\n");
        try {
            parsed=JSON.parse(split_text[2]);
            for(x in parsed.year) if(parseInt(x)>=DQ.begin_year) count+=parseInt(parsed.year[x]);
            resolve({count:count.toString(),url:url});
            return;
        }
        catch(error) {
            console.log(url+": parse error="+error+", text="+split_text[2]);
            if(split_text.length>0 && split_text[0].length>0 && (resolve({count:split_text[0],url:url}))) return;
        }
        resolve({count:"0",url:url,error:true});

    };
    DQ.parse_assets_cdk=function(doc,url,resolve,reject) {
        var match=doc.getElementsByTagName("h3")[0].innerText.match(/^[\d,]+/);
        if(match) resolve({count:match[0],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_auction123=function(doc,url,resolve,reject) {
        var show=doc.getElementsByTagName("iframe"),promise;
        if(show.length>0 && show[0].src) {
            promise=MTurkScript.prototype.create_promise(show[0].src.replace(/\/detectmobile/i,"/index"),
                                                         DQ.parse_auction123_showroom,resolve,reject,url); }
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_auction123_showroom=function(doc,url,resolve,reject,prev_url) {
        var inv=doc.getElementsByClassName("a123InventoryCount"),num;
        if(inv.length>0 && (num=inv[0].innerText.trim().match(/of ([\d,]+)/))) resolve({count:num[1],url:prev_url});
        else resolve({count:"0",url:prev_url,error:true});
    };
    DQ.parse_autoconx=function(doc,url,resolve,reject) {
        var result=doc.getElementsByClassName("number-results"),num;
        if(result.length>0 && (num=result[0].innerText.trim().match(/^[\d,]+/))) resolve({count:num[0],url:url});
        else resolve({count:"0",url:prev_url,error:true});
    };
    DQ.parse_autocorner=function(doc,url,resolve,reject) {
        var item=doc.getElementsByClassName("list-item"),i,count=0,match;
        for(i=0; i < item.length; i++) if(match=item[i].innerText.match(/\(([\d,]+)\)/)) count+=parseInt(match[1]);
        resolve({count:count.toString(),url:url});
    };
    DQ.parse_autodealerwebsites=function(doc,url,resolve,reject) {
        var inv=doc.getElementsByClassName("inv-list-results"),num;
        if(inv.length>0 && (num=inv[0].innerText.trim().match(/^[\d,]+/))) resolve({count:num[0],url:url});
        else resolve({count:"0",url:prev_url,error:true});
    };
    DQ.parse_autodrivenmarketing=function(doc,url,resolve,reject) {
        var adm_url="https://www.admcars4u.com/Dealers/Inventory.php?dealerid=";
        var found=doc.getElementsByClassName("num_found"),num,pr,dealerID,links=doc.links;
        var i,ifr=doc.getElementsByTagName("iframe"),rows=doc.getElementsByClassName("num_rows");
        for(i=0; i < ifr.length; i++) {
            if(!ifr[i].src && ifr[i].dataset.src) ifr[i].src=ifr[i].dataset.src;
            if(ifr[i].src && /admcars4u\.com/.test(ifr[i].src) &&
                (pr=MTurkScript.prototype.create_promise(ifr[i].src,DQ.parse_admcars,resolve,reject,url))) return; }
        if((dealerID=doc.getElementsByName("dealerID")).length>0 &&
                (pr=MTurkScript.prototype.create_promise(adm_url+dealerID[0].value,DQ.parse_admcars,resolve,reject,url))) return;
        for(i=0;i<links.length; i++) {
            if((dealerID=links[i].href.match(/php\?dealerID\=([\d]+)/i)) &&
               (pr=MTurkScript.prototype.create_promise(adm_url+dealerID[1],DQ.parse_admcars,resolve,reject,url))) return;
        }

        if(found.length>0 && (num=found[0].innerText.trim().match(/([\d,]+) found/i))) resolve({count:num[1],url:url});
        if(rows.length>0 && (num=rows[0].innerText.trim().match(/^([\d,]+)/i))) resolve({count:num[1],url:url});
        else resolve({count:"0",url:url,error:true});

    };
    DQ.parse_admcars=function(doc,url,resolve,reject,prev_url) {
        var i,num=null,page_nums=doc.getElementsByClassName("page_nums");
        for(i=0;i<page_nums.length;i++) if(num=page_nums[i].innerText.trim().match(/of ([\d,]+)/i)) break;
        if(num) resolve({count:num[1],url:prev_url});
        else resolve({count:"0",url:prev_url,error:true});
    };
    DQ.parse_autofind=function(doc,url,resolve,reject,prev_url) {
        var res=doc.getElementsByClassName("searchResults"),num,c2L=doc.getElementsByClassName("column2L");
        if(prev_url===undefined) prev_url=url;
        if(res.length>0 && (num=res[0].innerText.trim().match(/of ([\d,]+)/))) resolve({count:num[1],url:prev_url});
        else if(c2L.length>0 && (num=c2L[0].innerText.trim().match(/of ([\d,]+)/))) resolve({count:num[1],url:prev_url});
        else resolve({count:"0",url:prev_url,error:true});
    };
    DQ.parse_autofunds=function(doc,url,resolve,reject) {
        var num=doc.getElementById("inv_maxCount");
        if(num) resolve({count:num.innerText,url:url});
        else resolve({count:"0",url:url,error:true});
    }
    DQ.parse_autojini=function(doc,url,resolve,reject) {
        var badge=doc.getElementsByClassName("badge");
        if(badge.length>0) resolve({count:badge[0].innerText.trim(),url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_automanager=function(doc,url,resolve,reject) {
        try { resolve({count:doc.getElementsByClassName("vehicles-found-header")[0].getElementsByClassName("accent-color1")[0].innerText.trim(),url:url}); }
        catch(error) { resolve({count:"0",url:url,error:true}); }
    };
    DQ.parse_automotiveleads=function(doc,url,resolve,reject) {
        var listing=doc.getElementById("inventoryListing"),light,num;
        if(listing && (light=listing.getElementsByClassName("light")).length &&
           (num=light[0].innerText.match(/[\d,]+$/))) resolve({count:num[0],url:url});
        else resolve({count:doc.getElementsByClassName("vehicle-inv-title").length,url:url});
    };
    DQ.parse_autorevo=function(doc,url,resolve,reject) {
        var title,panel,num;
        if((title=doc.getElementsByClassName("results-title")).length>0 &&
          (num=title[0].innerText.match(/^[\d,]+/))) resolve({count:num[0],url:url});
        else if((title=doc.getElementsByClassName("search_results")).length>0 &&
                (num=title[0].innerText.match(/[\d,]+/))) resolve({count:num[0],url:url});
        else if((panel=doc.getElementById("searchResultsMessagePanel")) &&
                 (num=panel.innerText.match(/[\d,]+/))) resolve({count:num[0],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_autosalesweb=function(doc,url,resolve,reject) {
        var result=doc.querySelector(".inv-list-results"),match;
        if(result && (match=result.innerText.match(/\s*([\d,]+)/))) resolve({count:match[1],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_autosearchtech=function(doc,url,resolve,reject) {
        var cell=doc.getElementsByClassName("te_paging_middle_cell"),num;
        if(cell.length>0 && (num=cell[0].innerText.trim().match(/^[\d,]+/))) resolve({count:num[0],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_autotrader=function(doc,url,resolve,reject) {
        var auto=doc.getElementsByClassName("margin-left-auto"),num;
        if(auto.length>0 && (num=auto[0].innerText.trim().match(/^[\d,]+/))) resolve({count:num[0],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_autowebexpress=function(doc,url,resolve,reject) {
        var make=doc.getElementsByClassName("makelist"),i,num,count=0;
        for(i=0; i < make.length; i++) if(num=make[i].innerText.trim().match(/\(([\d,]+)\)/)) count+=parseInt(num[1]);
        else resolve({count:count,url:url});
    };
    DQ.parse_carbase=function(doc,url,resolve,reject) {
        var total=doc.getElementsByClassName("totalMatchesCount"),num;
        if(total.length>0 && (num=total[0].innerText.trim().match(/^[\d,]+/))) resolve({count:num[0],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_carmax=function(doc,url,resolve,reject) {
        var orig=doc.getElementById("orig-number-of-matches"),num;
        if(orig&&(num=orig.innerText.trim().match(/^[\d,]+/))) resolve({count:num[0],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_carguywebdesign=function(doc,url,resolve,reject) {
        var div=doc.getElementById("contentInv"),num;
        if(!div) div=doc.getElementById("wrapper");
        if(div && (num=div.innerText.trim().match(/([\d,]+) vehicles/))) resolve({count:num[1],url:url});
        else if(div && (num=div.innerText.trim().match(/of\s+([\d,]+)/))) resolve({count:num[1],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_carprolive=function(doc,url,resolve,reject) { resolve({count:doc.getElementsByClassName("grid_3").length.toString(),url:url}); }
    DQ.parse_carthink=function(doc,url,resolve,reject) {
        var nav=doc.getElementsByClassName("envor-navigation"),tab=doc.getElementsByClassName("table-hover"),num,count;
        if(nav.length>0 && (num=nav[0].innerText.trim().match(/of ([\d,]+)/))) resolve({count:num[1],url:url});
        else if(tab.length>0) resolve({count:tab[0].rows.length,url:url});
        else resolve({count:"0",url:url,error:true}); }
    DQ.parse_carsforsale=function(doc,url,resolve,reject) {
        console.log("in DQ.parse_carsforsale at url="+url);
        var cars=doc.getElementById("ctl00_cphBody_inv1_lblVehicleCount"),num,crumb;
        if(cars && (num=cars.innerText.match(/[\d,]+/)) && (resolve({count:num[0],url:url}))) return;
        if((crumb=doc.getElementsByClassName("inventory-breadcrumb")).length>0 &&
           (num=crumb[0].getElementsByClassName("section-title")[0].innerText.match(/^[\d,]+/))) {
            resolve({count:num[0],url:url});
            return; }
        resolve({count:"0",url:url,error:true});
    };
    DQ.parse_carwizard=function(doc,url,resolve,reject) {
        var x,inp=doc.getElementsByTagName("input"),i,select=doc.getElementsByTagName("select");
        var the_data={},cars;
        for(i=0; i < inp.length; i++) if(inp[i].type==="hidden") the_data[inp[i].name]=inp[i].value;
        for(i=0; i < select.length;i++) {
            if(select[i].style.display==="none") the_data[select[i].name]=select[i].value;
        }
        if(doc.getElementById("WebsiteHeader_lbnSearchInventory")) the_data.__EVENTTARGET="WebsiteHeader$lbnSearchInventory";
        else if((cars=doc.getElementById("Menu_lbnMenu2"))) {
            the_data.__EVENTTARGET="Menu$lbnMenu2"; the_data["hdnMenuNum"]=1;
        }
        else if((cars=doc.getElementById("bpMenu_lbnMenu2"))) { the_data.__EVENTTARGET="bpMenu$lbnMenu2"; the_data["hdnMenuNum"]=1;
                                                              the_data["hdnMenuText"]="bpMenu_CARS"; }
        the_data["WebsiteHeader$ddlMake1"]="0";
        var json_to_post=function(obj) {
            var str="",x;
            for(x in obj) {
                if(str.length>0) str=str+"&";
                str=str+encodeURIComponent(x)+"="+encodeURIComponent(obj[x]);
            }
            return str; };

        var data_str=json_to_post(the_data);
        url=url.replace(/\/$/,"");
        var headers={"content-type":"application/x-www-form-urlencoded","host":url.replace(/https?:\/\//,""),"origin":url,"referer":url,
            "Upgrade-Insecure-Requests":1};


      // console.log("("+url+"), the_data="+JSON.stringify(the_data));
        GM_xmlhttpRequest({method: 'POST',
                           data:data_str,url:url,headers:headers,
                           onload: function(response) {
                                 var doc = new DOMParser()
                     .parseFromString(response.responseText, "text/html");
                          
                               DQ.parse_carwizard2(doc,url,resolve,reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    };
    DQ.parse_carwizard2=function(doc,url,resolve,reject) {
        var tab=doc.getElementById("SearchCars_tblPages"),num;
        if(tab && (num=tab.innerText.match(/of ([\d,]+)/))) resolve({count:num[1],url:url});
        else if(!tab && (tab=doc.getElementById("SearchCarsWide_tblPages")) &&
               (num=tab.innerText.match(/of ([\d,]+)/))) resolve({count:num[1],url:url});
        else { resolve({count:"0",url:url,error:true});
              /*console.log("("+url+"), doc.body.innerHTML="+doc.body.innerHTML);*/ }
    };
    DQ.parse_chromacars=function(doc,url,resolve,reject) {
         var cond=doc.getElementById("dcondition"),num;
         if(cond && (num=cond.innerText.trim().match(/\(([\d,]+)\)/))) resolve({count:num[1],url:url});
         else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_dealer=function(doc,url,resolve,reject) {
        console.log("in parse_dealer, url="+url);
        var count=doc.getElementsByClassName("vehicle-count"),num;
        if(count.length>0 && (num=count[0].innerText.trim().match(/^[\d,]+/))) resolve({count:num[0],url:url})
        else if((count=doc.getElementsByClassName("total-count")).length>0 &&
                (num=count[0].innerText.trim().match(/[\d,]+/))) resolve({count:num[0],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_dealerclick=function(doc,url,resolve,reject) {
        console.log("in DQ.parse_dealerclick at url="+url);
        resolve({count:doc.getElementsByClassName("title").length,url:url});
    };
    DQ.parse_dealercarsearch=function(doc,url,resolve,reject) {
        console.log("in DQ.parse_dealercarsearch at url="+url);
        var dxp=doc.getElementsByClassName("dxpSummary"),elem,text;
        if(dxp.length===0) dxp=doc.getElementsByClassName("dxp-summary");
        if(dxp.length>0 && (text=dxp[0].innerText) && (elem=text.match(/\(([\d,]+)/))) resolve({count:elem[1],url:url});
        else resolve({count:"0",url:url,error:true});
    };  
    DQ.parse_dealereprocess=function(doc,url,resolve,reject) {
        var cont=doc.getElementsByClassName("srp_results_count_container"),search=doc.getElementsByClassName("search-results_count"),num;
        if(cont.length>0 && (num=cont[0].innerText.trim().match(/^[\d,]+/))) resolve({count:num[0],url:url});
        else if(search.length>0 && (num=search[0].innerText.trim().match(/[\d,]+/))) resolve({count:num[0],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_dealerexpress=function(doc,url,resolve,reject) {
        var x,num,i,TR=doc.getElementsByClassName("TRHeader"),bic=doc.getElementsByClassName("bic"),count=0;
        var vfs=doc.getElementsByClassName("vfs-count"),inv=doc.getElementsByClassName("inventorydropdown"),tot;
        if(TR.length===0 &&(TR=doc.getElementsByClassName("TRheader")).length===0) TR=doc.getElementsByClassName("pagenation");
        for(i=0;i<TR.length;i++) {
            if((num=TR[i].innerText.trim().match(/([\d,]+)\s*vehicles/i)) && (resolve({count:num[1],url:url}))) return; }
        for(i=0;i<bic.length;i++) {
            if(bic[i].dataset&&bic[i].dataset.type==="newused"&& bic[i].dataset.value==="used"
               && bic[i].dataset.count && (resolve({count:bic[i].dataset.count,url:url}))) return; }
        if(vfs.length>0 && (num=vfs[0].innerText.trim().match(/[\d,]+/))) resolve({count:num[0],url:url});
        else if(inv.length>0 && (tot=inv[0].getElementsByClassName("total"))) {
            for(i=0; i < tot.length; i++) if(num=tot[0].innerText.match(/[\d,]+/)) count+=parseInt(num[0]);
            resolve({count:count,url:url}); }

        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_dealerfire=function(doc,url,resolve,reject) {
        var total=doc.getElementsByClassName("total-found"),num;
        if(total.length>0 && (num=total[0].innerText.trim().match(/[\d,]+/))) resolve({count:num[0],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_dealerinspire=function(doc,url,resolve,reject) {
        var num;
        if((num=doc.title.trim().match(/^[\d,]+/))) resolve({count:num[0],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_dealeron=function(doc,url,resolve,reject) {
        var count=doc.getElementsByClassName("srpVehicleCount"),num;
        if(count.length>0 && (num=count[0].innerText.trim().match(/of ([\d,]+)/))) resolve({count:num[1],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_dealerpac=function(doc,url,resolve,reject) {
        var page=doc.getElementsByClassName("pageNavigation"),num;
        if(page.length>0 && (num=page[0].innerText.trim().match(/[\d,]+$/))) resolve({count:num[0],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_dealerpeak=function(doc,url,resolve,reject) {
        console.log("url="+url);
        var tot=doc.getElementsByClassName("total_result"),nav=doc.getElementsByClassName("vehicle-search-results-nav"),num;
        if(nav.length>0 && (num=nav[0].innerText.trim().match(/([\d,]+) results/i))) resolve({count:num[1],url:url});
        else if(tot.length>0 && (num=tot[0].innerText.trim().match(/([\d,]+)/i))) resolve({count:num[1],url:url});
        else if((tot=doc.getElementsByClassName("recordcount")).length>0) resolve({count:tot[0].innerText,url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_dealerscloud=function(doc,url,resolve,reject) {
        var info=doc.getElementsByClassName("showingPageinfo2"),ribbon=doc.getElementsByClassName("ribbon"),num;
        if(ribbon.length>0 && (num=ribbon[0].innerText.trim().match(/^[\d,]+/))) resolve({count:num[0],url:url});
        else if(info.length>0 && (num=info[0].innerText.trim().match(/of ([\d,]+)/))) resolve({count:num[1],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_dealersolutionssoftware=function(doc,url,resolve,reject) {
        var inv=doc.getElementsByClassName("InvBrowseSubTitle"),num;
        if(inv.length>0 && (num=inv[0].innerText.trim().match(/of ([\d,]+)/))) resolve({count:num[1],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_dealerspecialties=function(doc,url,resolve,reject) {
        var i,ifr=doc.getElementsByTagName("iframe"),pr,links=doc.links;
        console.log("url="+url);
        for(i=0; i < links.length; i++) {
            if(/(autofind|ps\.getauto)\.com\/dealer/.test(links[i].href)) {
                ifr=[{src:MTurkScript.prototype.fix_remote_url(links[i].href,url)}]; }
        }
        for(i=0;i<ifr.length;i++) {
            if(!ifr[i].src && ifr[i].dataset&&ifr[i].dataset.src) ifr[i].src=ifr[i].dataset.src;
            if(ifr[i].src&&/getauto\.com/.test(ifr[i].src)&&
              (pr=MTurkScript.prototype.create_promise(ifr[i].src,DQ.parse_getauto,resolve,reject,url))) return;
            else if(ifr[i].src&&/autofind\.com/.test(ifr[i].src)&&
                    (pr=MTurkScript.prototype.create_promise(ifr[i].src,DQ.parse_autofind,resolve,reject,url))) return;
        }
        resolve({count:"0",url:url,error:true});

    };
    DQ.parse_dealerspike=function(doc,url,resolve,reject) {
        var num,count,v7,sp,jscached=doc.getElementById("jsCachedFile"),new_url,promise;

        if((v7=doc.getElementsByClassName("v7list-subheader__result-text")).length>0 &&
                (sp=v7[0].getElementsByTagName("span")).length>1 &&
                (num=sp[1].innerText.match(/[\d]+/))) resolve({count:num[0],url:url});
        else if(jscached && (new_url=MTurkScript.prototype.fix_remote_url(jscached.src,url))) {
            promise=MTurkScript.prototype.create_promise(new_url,DQ.parse_dealerspike_json,resolve,reject,url); }
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_dealerspike_json=function(doc,url,resolve,reject,prev_url) {
        var text=doc.body.innerHTML.replace(/^var Vehicles\=/,"").replace(/;$/,""),parsed;
        try {
            parsed=JSON.parse(text);
            resolve({count:(parsed.length).toString(),url:prev_url});
            return;
        }
        catch(error) { console.log("Error parsing="+error); }
        resolve({count:"0",url:prev_url,error:true});
//        console.log("doc="+doc.body.innerHTML);
    };
    DQ.parse_dealersync=function(doc,url,resolve,reject) {
        var pull=doc.getElementsByClassName("pull-left"),num;
        if(pull.length>0 && (num=pull[0].innerText.trim().match(/^[\d]+(,[\d]+)?/))) resolve({count:num[0],url:url});
        else resolve({count:"0",url:url,error:true});

    };
    DQ.parse_dealerwebsites=function(doc,url,resolve,reject) {
        resolve({count:(doc.getElementsByClassName("inventory-item").length).toString(),url:url});
    };
    DQ.parse_drivedominion=function(doc,url,resolve,reject) {
        var form=doc.getElementsByClassName("srp-form"),the_li,num;
        if(form.length>0 && (the_li=form[0].getElementsByTagName("li")).length>=3 &&
           (num=the_li[2].innerText.trim().match(/of ([\d,]+)/))) resolve({count:num[1],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_drivetime=function(doc,url,resolve,reject) {
        var num;
        if(num=doc.title.match(/^[\d,]+/)) resolve({count:num[0],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_dssal=function(doc,url,resolve,reject) {
        var item=doc.getElementsByClassName("item"),th=doc.getElementsByTagName("th"),tab,i;
        if(item.length>0) resolve({count:(item.length).toString(),url:url});
        else {
            for(i=0; i < th.length; i++) {
                if(/View/.test(th[i].innerText) && th[i].parentNode && th[i].parentNode.parentNode && th[i].parentNode.parentNode.parentNode
                   &&((tab=th[i].parentNode.parentNode.parentNode).rows) && (resolve({count:(tab.rows.length).toString(),url:url}))) return;
            }
            resolve({count:"0",url:url});
        }
    };
    DQ.parse_ebizautos=function(doc,url,resolve,reject) {
        console.log("ebizautos,url="+url);
        var vehicles,toggle,list1,list2,sec4,num,count=0,i,label;
        if((vehicles=doc.getElementsByClassName("numVehiclesFoundNumber")).length>0 &&
           (num=vehicles[0].innerText.trim().match(/[\d,]+/))) resolve(num[0]);
        else if((toggle=doc.getElementsByClassName("togglec")).length>0 && (list1=toggle[0].getElementsByClassName("label"))) {
            for(i=0;i<list1.length;i++) if(num=parseInt(list1[i].innerText.trim().match(/[\d,]+/)[0])) count+=num;
            resolve({count:(count).toString(),url:url});
        }
        else if((sec4=doc.getElementById("Section4Body")) && (list2=sec4.getElementsByClassName("RefineItemLabel"))) {
            for(i=0; i < list2.length; i++) if(num=list2[i].innerText.match(/[\d,]+/)) count+=parseInt(num[0]);
            resolve({count:(count).toString(),url:url});
        }
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_FordDirect=function(doc,url,resolve,reject) {
        var hide,num;
        if((hide=doc.getElementsByClassName("hide-when-loading")).length>0 &&
           (num=hide[0].innerText.trim().match(/[\d,]+/))) resolve({count:num[0],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_foxdealerinteractive=function(doc,url,resolve,reject) {
        var rc=doc.getElementsByClassName("resultsCount"),num;
        if(rc.length>0 && (num=rc[0].innerText.trim().match(/([\d,]+) vehicles/i))) resolve({count:num[1],url:url});
        else if(num=doc.title.match(/[\d,]+/)) resolve({count:num[0],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_fzautomotive=function(doc,url,resolve,reject) {
        var srp,num;
        if((srp=doc.getElementsByClassName("srp-selected")) && (num=srp[0].innerText.trim().match(/^[\d,]+/))) resolve({count:num[0],url:url});
        resolve({count:"0",url:url,error:true});
    };
    DQ.parse_getauto=function(doc,url,resolve,reject,prev_url) {
        var res=doc.getElementsByClassName("searchResults"),num,c2L=doc.getElementsByClassName("column2L");
        if(prev_url===undefined) prev_url=url;
        if(res.length>0 && (num=res[0].innerText.trim().match(/of ([\d,]+)/))) resolve({count:num[1],url:prev_url});
        else if(c2L.length>0 && (num=c2L[0].innerText.trim().match(/of ([\d,]+)/))) resolve({count:num[1],url:prev_url});
        else resolve({count:"0",url:prev_url,error:true});
    };
    DQ.parse_hasyourcar=function(doc,url,resolve,reject) {
        var scripts=doc.scripts,i,script_url="",promise;
        var temp_url=url.match(/^https?:\/\/[^\/]+/)[0]+"/GetInventoryDetailsService?Make=All+Makes&Model=All+Models"+
            "&Year=All+Years&MinPrice=&MaxPrice=&IsWithPicOnly=off&SortBy=Year&CurrentPage=1&SortByDir=Desc";
        console.log("## temp_url="+temp_url);

        for(i=0; i < scripts.length; i++) if(scripts[i].src && /\/vehicles\?/.test(scripts[i].src)) script_url=scripts[i].src;
        if(script_url.length===0) promise=MTurkScript.prototype.create_promise(temp_url,DQ.parse_hasyourcar_Service,resolve,reject,url);
        else promise=MTurkScript.prototype.create_promise(MTurkScript.prototype.fix_remote_url(script_url,url),DQ.parse_hasyourcar_vehicle,resolve,reject,url);
    };
    DQ.parse_hasyourcar_Service=function(doc,url,resolve,reject,prev_url) {
        var parsed,text=doc.body.innerHTML;
        try {
            parsed=JSON.parse(text);
            resolve({count:(parsed.totalCount).toString(),url:prev_url});
            return; }
        catch(error) { console.log("Service: error parsing "+url+", "+error+", text="+text); }
        resolve({count:"0",url:prev_url,error:true});
    };
    DQ.parse_hasyourcar_vehicle=function(doc,url,resolve,reject,prev_url) {
        var parsed,text=doc.body.innerHTML.replace(/^[^\(]*\(/,"").replace(/\);$/,"");
        try {
            parsed=JSON.parse(text);
            resolve({count:parsed.TotalRecordCount,url:prev_url});
            return; }
        catch(error) { console.log("Vehicle error parsing "+url+", "+error+", text="+text); }
        resolve({count:"0",url:prev_url,error:true});
    };
    DQ.parse_higherturnover=function(doc,url,resolve,reject) {
        var inv=doc.getElementById("inventoryContent"),row,num,form,font;
        if(inv&&(row=inv.getElementsByClassName("row")).length>0
           &&(num=row[0].innerText.trim().match(/^[\d,]+/))) resolve({count:num[0],url:url});
        else if((form=doc.getElementsByName("compareForm")).length>0 && (font=form[0].getElementsByClassName("carviewFont1")).length>0
        && (num=font[0].innerText.trim().match(/^\(([\d,]+)/))) resolve({count:num[1],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_interactivedms=function(doc,url,resolve,reject) {
        var rib=doc.getElementsByClassName("ribbon"),num,stock=doc.getElementsByClassName("Stockbox-inventory");
        if(rib.length>0 && (num=rib[0].innerText.trim().match(/^[\d,]+/))) resolve({count:num[0],url:url});
        else if(/\.php/.test(url)) resolve({count:(stock.length).toString(),url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_jazelauto=function(doc,url,resolve,reject) {
        var f2rem=doc.getElementsByClassName("f2rem"),num;
        if(f2rem.length>0 && (num=f2rem[0].innerText.trim().match(/^[\d,]+/))) resolve({count:num[0],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_jdbyrider=function(doc,url,resolve,reject) {
        var main=doc.getElementById("content"),scripts,inv,text,parsed;
        if(main && (scripts=main.getElementsByTagName("script")).length>0 &&
           (inv=scripts[0].innerHTML.match(/var inventoryResponse \= ([^\n]+)/)) && (text=inv[1].replace(/;$/,""))) {
            try {
                if((parsed=JSON.parse(text)) && parsed.MetaData &&parsed.MetaData.TotalInventoryCount &&
                   (resolve({count:parsed.MetaData.TotalInventoryCount.toString(),url:url}))) return; }
            catch(error) { console.log("error parsing="+error); }
        }
        resolve({count:"0",url:url,error:true});
    };
    DQ.parse_lotwizard=function(doc,url,resolve,reject) {
        var table=doc.querySelector("table"),tfw=doc.getElementsByClassName("tfw-taxlist");
        var inner_li,num,count=0,i,parent,sib,make=doc.getElementById("make"),opts;
        if(tfw.length>0 && (inner_li=tfw[0].getElementsByTagName("li"))) {
            for(i=0; i < inner_li.length; i++) if(num=inner_li[i].innerText.match(/\(([\d,]+)\)/)) count+=parseInt(num[1]);
            resolve({url:url,count:count});
        }
        else if(table && table.parentNode&&(parent=table.parentNode.parentNode) &&
                (sib=parent.previousElementSibling) && (num=sib.innerText.match(/of ([\d]+(,[\d]+)?)/))) resolve({url:url,count:num[1]});
        else if(make && (opts=make.options)) {
            for(i=0; i < opts.length; i++) if(num=opts[i].innerText.match(/\(([\d,]+)\)/)) count+=parseInt(num[1]);
            resolve({url:url,count:count});
        }
        else resolve({url:url,count:"0",error:true});
    };
    DQ.parse_motorcarmarketing=function(doc,url,resolve,reject) {
        var and=doc.getElementById("dropdownAndroid"),inner,num;
        if(and&&and.children.length>0 && (num=and.children[0].innerText.trim().match(/\(([\d,]+)\)/))) resolve({count:num[1],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_motionfuze=function(doc,url,resolve,reject) {
        var pag=doc.getElementsByClassName("pagination"),num;
        if(pag.length>0 && (num=pag[0].innerText.match(/Found ([\d,]+)/i))) resolve({count:num[1],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_prontodealer=function(doc,url,resolve,reject) {
        var tot=doc.getElementsByClassName("page-total"),num;
        if(tot.length===0) tot=doc.getElementsByClassName("botpages");
        if(tot.length===0) tot=doc.getElementsByClassName("pager");
        if(tot.length>0 && (num=tot[0].innerText.match(/\(([\d,]+)/i))) resolve({count:num[1],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_remora=function(doc,url,resolve,reject) {
        var veh=doc.getElementById("vehicle-count"),num;
        if(veh&&(num=veh.innerText.trim().match(/[\d,]+/))) resolve({count:num[0],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_v12software=function(doc,url,resolve,reject) {
        var block=doc.getElementsByClassName("InvList-MakesBlock"),num,count=0,i,results,pg;
        var invlist=doc.getElementById("inventory-list"),sub,link=doc.getElementsByClassName("page-link");
        if(block.length>0) {
            for(i=0; i < block.length; i++) if(num=block[i].innerText.trim().match(/\(([\d,]+)\)/)) count+=parseInt(num[1]);
            resolve({count:count,url:url}); }
        else if(invlist && (sub=invlist.getElementsByClassName("subtitle")).length>0 &&
                (num=sub[0].innerText.trim().match(/^[\d,]+/))) resolve({count:num[0],url:url});
        else if((invlist=doc.getElementById("inv-list")) && (results=invlist.getElementsByClassName("results")).length>0 &&
                 (num=results[0].innerText.trim().match(/Results:\s*([\d,]+)/i))) resolve({count:num[1],url:url});
        else if(link.length===1 || (link.length===0 && (pg=doc.getElementsByClassName("pagination"))[0].children.length===1)) {
            if((count=doc.getElementsByClassName("vehicle-title")).length>0) resolve({count:(count.length).toString(),url:url});
            else if((count=doc.getElementsByClassName("InvList-VehicleBlock")).length>0) resolve({count:(count.length).toString(),url:url});
            else if((count=doc.getElementsByClassName("result-item")).length>0) resolve({count:(count.length).toString(),url:url});
            else resolve({count:"0",url:url}); }
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_waynereaves=function(doc,url,resolve,reject) {
        var make=doc.getElementsByClassName("makes-menu"),i,num,count=0,c_el;
        var item=doc.getElementsByClassName("inv-item");
        if(/\/legacy/.test(url)) resolve({count:(item.length).toString(),url:url});
        else if(make.length>0 && (c_el=make[0].getElementsByClassName("count"))) {
            for(i=0; i < c_el.length; i++) if(num=c_el[i].innerText.trim().match(/\(([\d,]+)\)/)) count+=parseInt(num[1]);
            resolve({count:count.toString(),url:url}); }
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_wearefullthrottle=function(doc,url,resolve,reject) {
        var car=doc.getElementsByClassName("carcount"),num;
        if(car.length>0 && (num=car[0].innerText.trim().match(/[\d,]+/))) resolve({count:num[0],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_webstreak=function(doc,url,resolve,reject) {
        var found=doc.getElementsByClassName("vehicles-found"),num;
        if(found.length>0 && (num=found[0].innerText.trim().match(/^[\d,]+/))) resolve({count:num[0],url:url});
        else resolve({count:"0",url:url,error:true});
    };
    DQ.parse_yourcarlot=function(doc,url,resolve,reject) {
        var table=doc.getElementsByTagName("table"),cell,num,new_url,base_url,headers;
        for(let i=0; i < table.length; i++) {
            for(let j=0; j < table[i].rows.length; j++) {
                if((cell=table[i].rows[j].cells).length>0 && (num=cell[0].innerText.trim().match(/^([\d,]+)\s*Vehicles/i))
                   && (resolve({count:num[1],url:url}))) return; }
        }
        headers={"Content-Type": "application/x-www-form-urlencoded",'host':url.match(/https?:\/\/([^\/]+)/)[1],
                 'origin':url.match(/https?:\/\/[^\/]+/)[0],'X-Requested-With':'xmlhttprequest'};
        var x=GM_xmlhttpRequest({method: 'POST',headers:headers,data:"currentPage=1&make=ALL&model=ALL&perPage=1000",
                                 url:url.match(/https?:\/\/[^\/]+/)[0]+"/vehicles.php",onload: function(response) {
                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               DQ.parse_yourcarlot2(doc,response.finalUrl,resolve,reject); },
                           onerror: function(response) { resolve({count:"0",url:url,error:true}); },
                           ontimeout: function(response) { resolve({count:"0",url:url,error:true}); }});
    };
    DQ.parse_yourcarlot2=function(doc,url,resolve,reject) {
        resolve({count:parseInt(doc.getElementsByClassName("container-fluid").length)/2,url:url});
    };

    DQ.parse_none=function(doc,url,resolve,reject) {
        var url_list,i;
        if(DQ.check_if_bad(doc,url,resolve,reject) && (resolve({count:"0",url:url,bad_url:true}))) return;
        url_list=DQ.find_links_none(doc,url,resolve,reject);
        console.log("url_list="+JSON.stringify(url_list));
    };
    DQ.check_if_bad=function(doc,url,resolve,reject) {
        var links=doc.links,i;
        if(/Error/i.test(doc.title)) return true;
        for(i=0; i < links.length; i++) {
            if(/domain(\s[a-z]+)? available for sale/.test(links[i].innerText)) return true;
        }
        return false;
    };

    DQ.find_link=function(doc,url,resolve,reject,page_type) {
        for(var i=0; i < doc.links.length; i++) {
            if(page_type.href_rx.test(doc.links[i].href) &&
               page_type.text_rx.test(doc.links[i].innerText)) return MTurkScript.prototype.fix_remote_url(doc.links[i].href,url);}
        return url;
    };
    DQ.find_link_carmax=function(doc,url,resolve,reject,page_type) {
        var primary=doc.getElementsByClassName("primary");
        if(primary.length>0) return MTurkScript.prototype.fix_remote_url(primary[0].href,"https://websearch-website.carmax.com");
        else return url;
    };
    DQ.find_link_dealerexpress=function(doc,url,resolve,reject,page_type) {
        var i,links=doc.links;
        if(/CarDealer\/index\.php/.test(url)) return url.replace(/\/index\.php/,"/results.php");
        for(i=0;i<links.length; i++) {
            links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url);
            if((/Inventory/.test(links[i].innerText) && /\/results\.php/.test(links[i].href)) ||
              ( /Vans for Sale/i.test(links[i].innerText) && /vans-for-sale[^\/]*\/used/.test(links[i].href))) return links[i].href; }
        return url;
    };
    DQ.find_link_dealerspecialties=function(doc,url,resolve,reject,page_type) {
        var inv=doc.getElementById("Inventory"),ref;
        if(!inv) inv=doc.getElementById("Inventory Nav");
        if(inv && (ref=inv.parentNode) && ref.tagName==="A" &&
           /getauto\.com|autofind\.com/.test(ref.href)) return url;
        else if(inv && ref && ref.tagName==="A" && /inventory\.htm/.test(ref.href)) {
            return MTurkScript.prototype.fix_remote_url(ref.href,url); }
        else return MTurkScript.prototype.fix_remote_url(ref.href,url);
    };
    DQ.find_link_jazel=function(doc,url,resolve,reject,page_type) {
        var links=doc.links,used_link="",all_link="",i;
        for(i=0; i < links.length; i++) {
            links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url);
            if(/\/inventory\/used-vehicles/.test(links[i].href)) used_link=links[i].href;
            if(/\/inventory\/all-vehicles/.test(links[i].href)) all_link=links[i].href; }
        if(used_link.length>0) return used_link;
        else if(all_link.length>0) return all_link;
        else return url;
    };
    DQ.find_link_jdbyrider=function(doc,url,resolve,reject,page_type) {
        var links=doc.links,i;
        for(i=0; i < links.length; i++) {
            links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url);
            if(/\/dealerships\/[^\/]+\/inventory(\/)?$/.test(links[i].href)) return links[i].href;
        }
        return url.replace(/\/$/,"")+"/inventory";
    };
    DQ.find_link_waynereaves=function(doc,url,resolve,reject,page_type) {
        var redirect=doc.getElementsByClassName("legacy-redirect"),new_url=url.replace(/(https?:\/\/[^\/]+).*$/,"$1");
        if(doc.getElementsByClassName("legacy-redirect").length>0) return new_url.replace(/\/$/,"")+"/legacy";
        return new_url.replace(/\/$/,"")+"/inventory";
    };
    DQ.find_link_yourcarlot=function(doc,url,resolve,reject,page_type) {
        var table=doc.getElementsByTagName("table"),rows,cell,i,j;
        for(i=0; i < table.length; i++) {
            rows=table[i].rows;
            for(j=0; j < rows.length; j++) {
                if((cell=rows[j].cells).length>0 &&
               /^[\d,]+\s*Vehicles/i.test(cell[0].innerText.trim())) return url;
            }
        }
        return url.replace(/\/$/,"")+"/inventory.php";
    };
    /* Finds multiple links */
    DQ.find_links_none=function(doc,url,resolve,reject,page_type) {
        var href_rx=/\/inventory/i,text_rx=/Inventory/i,i,links=doc.links;
        var url_list=[];
        for(i=0; i < links.length; i++) {
            links[i].href=MTurkScript.prototype.fix_remote_url(links[i].href,url);
            if(href_rx.test(links[i].href) || text_rx.test(links[i].innerText)) url_list.push(links[i].href);
        }
        return url_list;
    };
    DQ["assets-cdk"]={suffix:"/VehicleSearchResults?search=used",parser:DQ.parse_assets_cdk};
    DQ.allautonetwork={suffix:"/isapi_xml.php?module=inventory&sold=Available&main=&orderby=when_added,desc&offset=0",parser:DQ.parse_allautonetwork};
    DQ.auction123={find_link:DQ.find_link,parser:DQ.parse_auction123,href_rx:/\/inventory/,text_rx:/Inventory/i};
    DQ.autoconx={suffix:"/used/for-sale/",parser:DQ.parse_autoconx};
    DQ.autocorner={suffix:"/cat_pages/inventory_1.shtml",parser:DQ.parse_autocorner};
    DQ.autodealerwebsites={suffix:"/inventory",parser:DQ.parse_autodealerwebsites};
    DQ.autodrivenmarketing={find_link:DQ.find_link,parser:DQ.parse_autodrivenmarketing,href_rx:/.*/,text_rx:/(Inventory|Our Vehicles)/i};
    DQ.autofunds={find_link:DQ.find_link,parser:DQ.parse_autofunds,href_rx:/used_cars/,text_rx:/INVENTORY/i};
    DQ.autojini={suffix:"/en/inventory.cfm",parser:DQ.parse_autojini};
    DQ.automanager={find_link:DQ.find_link,parser:DQ.parse_automanager,href_rx:/used-cars|view-inventory/,text_rx:/Inventory/i};
    DQ.automotiveleads={suffix:"/inventory/1",parser:DQ.parse_automotiveleads};
    DQ.autorevo={find_link:DQ.find_link,parser:DQ.parse_autorevo,href_rx:/\/vehicles|\/inventory/,text_rx:/Inventory/i};
    DQ.autosearchtech={suffix:"/autos.php",parser:DQ.parse_autosearchtech};
    DQ.autotrader={find_link:function(doc,url,resolve,reject,page_type) { return url; },parser:DQ.parse_autotrader};
    DQ.autosalesweb={suffix:"/inventory",parser:DQ.parse_autosalesweb};
    DQ.autowebexpress={suffix:"/inventory.php",parser:DQ.parse_autowebexpress};
    DQ.carbase={suffix:"/used-inventory",parser:DQ.parse_carbase};
    DQ.carguywebdesign={suffix:"/invList.php",parser:DQ.parse_carguywebdesign};
    DQ.carmax={find_link:DQ.find_link_carmax,parser:DQ.parse_carmax};
    DQ.carprolive={suffix:"/inventory.asp",parser:DQ.parse_carprolive};
    DQ.carsforsale={suffix:"/inventory.aspx?sold=0",parser:DQ.parse_carsforsale};
    DQ.carthink={find_link:DQ.find_link,parser:DQ.parse_carthink,href_rx:/\/inventory/i,text_rx:/Inventory/i};
    /** Needs work **/
    DQ.carwizard={suffix:"",parser:DQ.parse_carwizard};
    DQ.chromacars={suffix:"/vehicle-inventory.php",parser:DQ.parse_chromacars};
    DQ.dealer={suffix:"/used-inventory/index.htm",parser:DQ.parse_dealer};
    DQ.dealerclick={suffix:"/inventory",parser:DQ.parse_dealerclick};
    DQ.dealercarsearch={suffix:"/newandusedcars.aspx?clearall=1",parser:DQ.parse_dealercarsearch};
    DQ.dealereprocess={suffix:"/search/used/tp/",parser:DQ.parse_dealereprocess};
    DQ.dealerexpress={find_link:DQ.find_link_dealerexpress,parser:DQ.parse_dealerexpress};
    DQ.dealerfire={find_link:DQ.find_link,parser:DQ.parse_dealerfire,href_rx:/\/(preowned|used)-cars/,text_rx:/View all|Inventory/i};
    DQ.dealerinspire={suffix:"/used-vehicles/",parser:DQ.parse_dealerinspire};
    DQ.dealeron={suffix:"/searchused.aspx",parser:DQ.parse_dealeron};
    DQ.dealerpac={find_link:DQ.find_link,parser:DQ.parse_dealerpac,href_rx:/\/external\/listveh.php\?/,text_rx:/.*/i};
    DQ.dealerpeak={find_link:DQ.find_link,parser:DQ.parse_dealerpeak,href_rx:/(\/used-cars\/for-sale)|(\/VehicleSearch\/UsedVehicles)/i,text_rx:/.*/};
    DQ.dealerscloud={suffix:"/used-cars",parser:DQ.parse_dealerscloud};
    DQ.dealersolutionssoftware={suffix:"/inventory.aspx",parser:DQ.parse_dealersolutionssoftware};
    DQ.dealerspecialties={find_link:DQ.find_link_dealerspecialties,parser:DQ.parse_dealerspecialties};
    DQ.dealerspike={suffix:"/default.asp?page=xPreOwnedInventory",parser:DQ.parse_dealerspike};
    DQ.dealersync={suffix:"/pre-owned-cars",parser:DQ.parse_dealersync};
    DQ.dealerwebsites={suffix:"/Search/List?CurrentPage=1&VehicleCategory=0&Make=&VehicleModel=&Stock=&MinPrice=&MaxPrice=&MinYear=0&MaxYear=0&Sort=Make&Type=&Mileage=&pageSize=1000",
                       parser:DQ.parse_dealerwebsites};
    DQ.drivedominion={suffix:"/used-inventory",parser:DQ.parse_drivedominion};
    DQ.drivetime={find_link:DQ.find_link,parser:DQ.parse_drivetime,href_rx:/\/inventory/,text_rx:/Search/i};
    DQ.dssal={suffix:"",parser:DQ.parse_dssal};
    DQ.ebizautos={find_link:DQ.find_link,parser:DQ.parse_ebizautos,href_rx:/\/(used-cars|view-(all-)?inventory)\.aspx/,text_rx:/Inventory|Pre(-)?Owned/i};
    DQ.FordDirect={suffix:"/used-inventory",parser:DQ.parse_FordDirect};
    DQ.foxdealerinteractive={suffix:"/inventory/used/",parser:DQ.parse_foxdealerinteractive};
    DQ.fzautomotive={suffix:"/inventory?type=used",parser:DQ.parse_fzautomotive};
    DQ.hasyourcar={suffix:"/Inventory",parser:DQ.parse_hasyourcar};
    DQ.higherturnover={find_link:DQ.find_link,parser:DQ.parse_higherturnover,href_rx:/\/(inventory|vehicles\-for\-sale)/,text_rx:/Vehicles|Inventory/i};
    DQ.interactivedms={find_link:DQ.find_link,parser:DQ.parse_interactivedms,href_rx:/\/inventory/,text_rx:/.*/i};
    DQ.jazelauto={find_link:DQ.find_link_jazel,parser:DQ.parse_jazelauto,href_rx:/\/inventory\/(all|used)-vehicles/,text_rx:/.*/i};
    DQ.jdbyrider={find_link:DQ.find_link_jdbyrider,parser:DQ.parse_jdbyrider};
    DQ.kukui={suffix:"",parser:function(doc,url,resolve,reject) { resolve({count:0,url:url}); } };
    DQ.lotwizard={find_link:DQ.find_link,parser:DQ.parse_lotwizard,href_rx:/\/inventory/,text_rx:/Inventory/i};
    DQ.motionfuze={suffix:"/used.cfm",parser:DQ.parse_motionfuze};
    DQ.motorcarmarketing={suffix:"",parser:DQ.parse_motorcarmarketing};
    DQ.none={suffix:"",parser:DQ.parse_none};
    DQ.prontodealer={suffix:"/inventory.php",parser:DQ.parse_prontodealer};
    DQ.remora={find_link:DQ.find_link,parser:DQ.parse_remora,href_rx:/\/sale\/used-cars/,text_rx:/Pre-Owned|Used/i};
    DQ.v12software={suffix:"/inventory/?per_page=1000",parser:DQ.parse_v12software};
    DQ.waynereaves={find_link:DQ.find_link_waynereaves,parser:DQ.parse_waynereaves};
    DQ.wearefullthrottle={suffix:"/used-inventory",parser:DQ.parse_wearefullthrottle};
    DQ.webstreak={suffix:"/preownedvehicles",parser:DQ.parse_webstreak};
    /* Needs special work */
    DQ.yourcarlot={find_link:DQ.find_link_yourcarlot,parser:DQ.parse_yourcarlot,href_rx:/\/(inventory|view_all)\.php/,text_rx:/Inventory/i};



    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
	    lgb_info=doc.getElementById("lgb_info");
	    b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
		b_caption=b_algo[i].getElementsByClassName("b_caption");
		p_caption="";
		if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
		    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
		}
		console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
		if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name))
                {
                    b1_success=true;
		    break;

                }

            }
	    if(b1_success)
	    {
		/* Do shit */
		resolve(b_url);
		return;
	    }


        }
        catch(error)
	{
	    reject(error);
            return;
        }
	reject("Nothing found");
//        GM_setValue("returnHit",true);
        return;

    }
    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
	    encodeURIComponent(search_str)+"&first=1&rdr=1";
	GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
            onload: function(response) { callback(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }
    function query_promise_then(result) {
    }
    function scrape_then(result) {
        var count=0;
        if(result.url) { console.log("result="+JSON.stringify(result));
                       count=result.count;
                       }
        else { console.log("result="+result); count=result; }
        document.getElementById("websiteVINCount").value=count;
        MTurk.check_and_submit();
    }
    DQ.init_DQ=function(doc,url,resolve,reject,response) {
        var curr_page,curr_url,promise;
      //  console.log(url+", response="+JSON.stringify(response));
        //console.log("init_DQ, url="+url);
        DQ.page_type=DQ.id_page_type(doc,url,resolve,reject);
        if(DQ.dealer_map[DQ.page_type]) DQ.page_type=DQ.dealer_map[DQ.page_type];
        console.log(url+": page_type="+DQ.page_type);
        curr_page=DQ[DQ.page_type];
        //console.log(url+": curr_page="+JSON.stringify(curr_page));
        if(curr_page) {
            curr_url=url.replace(/(https?:\/\/[^\/]+).*$/,"$1");
            if(curr_page.suffix) curr_url=curr_url+curr_page.suffix;
            else if(curr_page.find_link) curr_url=curr_page.find_link(doc,url,resolve,reject,curr_page);
            if(curr_page.parser) promise=MTurkScript.prototype.create_promise(curr_url,curr_page.parser,scrape_then,my_catch_func);
            else if(curr_page.parser_special) curr_page.parser_special(curr_url);
        }
        

    };

    DQ.try_carsforsale=function(doc,url,resolve,reject) {
        var meta=doc.querySelector("meta[http-equiv='refresh']"),curr_page,curr_url,promise;
        if(meta) {
            console.log("meta.content="+meta.content);
            DQ.carSearchShit(DQ.param1,DQ.param2,DQ.param3,doc,url);
            DQ.page_type="carsforsale";
            if((curr_page=DQ[DQ.page_type]) && curr_page.suffix) {
                curr_url=url.replace(/(https?:\/\/[^\/]+).*$/,"$1")+curr_page.suffix;
                console.log("curr_url="+curr_url);
                if(curr_page.parser) {
                    setTimeout(function() {
                        promise=MTurkScript.prototype.create_promise(curr_url,curr_page.parser,scrape_then,my_catch_func); },250);
                    return true;
                }

            }
        }
        return false;
    };
    DQ.id_page_type=function(doc,url,resolve,reject) {
        var page_type="none",i,match,src,copyright,item,links=doc.getElementsByTagName("link");
        var thei=doc.getElementsByTagName("iframe");
        if((match=url.match(DQ.dealer_regex)) &&
           (page_type=match[0].replace(/\/\//,"").replace(/\.[^\.]*$/,"").toLowerCase()
            .replace(/[^\.]+\./,"").replace(/\./g,"_"))) return page_type;
        for(i=0; i < doc.links.length; i++) {
            if((match=doc.links[i].href.match(DQ.dealer_regex)) &&
               (page_type=match[0].replace(/\/\//,"").replace(/\.[^\.]*$/,"").toLowerCase()
                .replace(/[^\.]+\./,"").replace(/\./g,"_"))) return page_type;
            else if(/prontodealer\.com/i.test(doc.links[i].innerText)) return "prontodealer";
        }
        for(i=0; i < doc.scripts.length; i++) {
            // if(doc.scripts[i].src) console.log("doc.scripts["+i+"].src="+doc.scripts[i].src);
            if(doc.scripts[i].src && (match=doc.scripts[i].src.match(DQ.dealer_regex)) &&
               (page_type=match[0].replace(/\.[^\.]*$/,"").toLowerCase().replace(/\//g,"")
                .replace(/[^\.]+\./,"").replace(/\./g,"_"))) return page_type; }
        for(i=0; i < links.length; i++) {
            if(links[i].href && (match=links[i].href.match(DQ.dealer_regex)) &&
               (page_type=match[0].replace(/\/\//,"").replace(/\.[^\.]*$/,"").toLowerCase()
                .replace(/[^\.]+\./,"").replace(/\./g,"_"))) return page_type; }
        for(i=0; i < thei.length; i++) {
            if(thei[i].src && (match=thei[i].src.match(DQ.dealer_regex)) &&
               (page_type=match[0].replace(/\/\//,"").replace(/\.[^\.]*$/,"").toLowerCase()
                .replace(/[^\.]+\./,"").replace(/\./g,"_"))) return page_type; }


        if((copyright=doc.getElementsByClassName("copyrightProvider")).length>0
           && /FordDirect/.test(copyright[0].innerText)) return "FordDirect";
        if((copyright=doc.getElementById("footer-copyright")) &&
           /DealerDirect/.test(copyright.innerText)) return "FordDirect";
        if((copyright=doc.getElementsByName("copyright")).length>0
           && /^AutoCorner/i.test(copyright[0].content)) return "autocorner";
        if((copyright=doc.getElementsByClassName("copyright-wrap")).length>0 &&
           /InterActive DMS/.test(copyright[0].innerText)) return "interactivedms";
        if(doc.querySelector(".legacy-redirect")) return "waynereaves";

        if(/\.hasyourcar\./.test(url)) return "hasyourcar";
        return page_type;
    };
    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function my_catch_func(response) {
        var text="";
        if(response) text=JSON.stringify(response);
        console.log("MOO "+text);
        //document.getElementById("websiteUnavailable").checked=true;
     //   MTurk.check_and_submit();
    }

    function init_UI() {
        var inner_p=document.getElementsByTagName("p");
        inner_p[0].innerHTML="";
    }
    var query_list=["http://www.coronaautosales.net/","http://www.randlmotorseugene.com/",
"http://www.lakejemautosales.com/","http://www.ajcautosales.com/links.aspx",
"http://flahertyusedcars.com/","http://autoexpresscolumbia.com/"];
   function init_Query()
    {


        console.log("in init_query");
        if(!/www\./.test(window.location.href)) init_UI();
        var i;
        var url_list= GM_getValue("url_list",[]),promise;
  /*     for(i=0; i < 10; i++)
        {
            setTimeout(function() {
                var x;
                var v=unsafeWindow;
                for(x in v) {
                    console.log("v["+x+"]=");
                    console.log(v[x]);
                }
            }, i*1000);
        }
        console.log(y);*/
        if(!/trystuff\.com/.test(window.location.href)) {
           var dont=document.getElementsByClassName("dont-break-out")[0].href;
        var well=document.getElementsByClassName("well");
        my_query={url:well[0].innerText.replace(/^www/,"http://www"),name:well[1].innerText};
        if(!/http/.test(my_query.url) && !/www/.test(my_query.url)) my_query.url="http://www."+my_query.url;
        url_list.push(my_query.url);
        GM_setValue("url_list",url_list);
    }
        else {
            my_query={url:"http://channelislandsautosales.com"}; }


        promise=MTurkScript.prototype.create_promise(my_query.url,DQ.init_DQ,query_promise_then,my_catch_func);
       // setTimeout(function() { promise=MTurkScript.prototype.create_promise(query_list[i],DQ.init_DQ,query_promise_then,my_catch_func); },250);



       
    }
    function create_query(i)
    {
        var promise;
        setTimeout(function() { promise=MTurkScript.prototype.create_promise(query_list[i],DQ.init_DQ,query_promise_then,my_catch_func); },250);
    }

    if(/trystuff\.com/.test(window.location.href)) init_Query();


})();