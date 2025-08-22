(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["AnalectsSDK"] = factory();
	else
		root["AnalectsSDK"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
return /******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ AnalectsSDK; }
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// 引入样式（由 webpack 处理）


/**
 * AnalectsSDK - 干净可用的最小实现
 * 满足：
 * 1) 章节筛选为单选、隐藏圆圈
 * 2) 默认“全部章节”为选中；选中其它章节时，“全部章节”变为白底
 * 3) 切换章节/筛选时重置分页，杜绝重复或串章数据
 * 4) 初始不自动搜索，只有点击“搜索”后才触发；滚动加载仅在有过搜索后启用
 * 5) 状态条显示“共找到X条结果，滚动或点击加载更多”；全部加载后显示“已加载完毕”
 *
 * 说明：
 * - 通过 Supabase PostgREST 访问：/rest/v1
 * - 服务端过滤：关键词（or=ilike*）、章节（eq），分页（limit/offset）
 * - 关联过滤（人物/论点/谚语）在客户端完成 AND 语义（通过嵌套选择返回的 id 列表判断）
 * - 结果总数通过 Prefer: count=exact + Content-Range 读取
 */
var AnalectsSDK = /*#__PURE__*/function () {
  function AnalectsSDK() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    _classCallCheck(this, AnalectsSDK);
    this.supabaseUrl = config.supabaseUrl || '';
    this.supabaseKey = config.supabaseKey || '';
    this.apiBaseUrl = this.supabaseUrl ? "".concat(this.supabaseUrl, "/rest/v1") : '';
    this.headers = {
      'apikey': this.supabaseKey,
      'Authorization': "Bearer ".concat(this.supabaseKey),
      'Content-Type': 'application/json',
      // 关键：用于拿到 Content-Range 统计总数
      'Prefer': 'return=representation,count=exact'
    };

    // 搜索/分页状态
    this.state = {
      didSearch: false,
      page: 0,
      pageSize: 10,
      hasMore: false,
      totalCount: 0,
      isLoading: false,
      currentFilters: null,
      searchToken: 0
    };

    // 选项缓存
    this.cache = {
      characters: null,
      arguments: null,
      proverbs: null,
      chapters: null
    };

    // 选中项
    this.selected = {
      chapter: {
        id: 'all',
        name: '全部章节'
      },
      characters: new Map(),
      // id -> name
      arguments: new Map(),
      proverbs: new Map()
    };
  }

  // ---------- 基础请求 ----------
  return _createClass(AnalectsSDK, [{
    key: "_fetch",
    value: function () {
      var _fetch2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(url) {
        var res, text, contentRange, total, data;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              if (!(!this.supabaseUrl || !this.supabaseKey)) {
                _context.n = 1;
                break;
              }
              throw new Error('Supabase 配置无效：请在初始化时传入 supabaseUrl 与 supabaseKey');
            case 1:
              _context.n = 2;
              return fetch(url, {
                headers: this.headers
              });
            case 2:
              res = _context.v;
              if (res.ok) {
                _context.n = 4;
                break;
              }
              _context.n = 3;
              return res.text().catch(function () {
                return '';
              });
            case 3:
              text = _context.v;
              throw new Error("\u8BF7\u6C42\u5931\u8D25 ".concat(res.status, ": ").concat(text || res.statusText));
            case 4:
              contentRange = res.headers.get('content-range');
              total = contentRange && contentRange.includes('/') ? parseInt(contentRange.split('/').pop(), 10) : null;
              _context.n = 5;
              return res.json();
            case 5:
              data = _context.v;
              return _context.a(2, {
                data: data,
                total: total
              });
          }
        }, _callee, this);
      }));
      function _fetch(_x) {
        return _fetch2.apply(this, arguments);
      }
      return _fetch;
    }() // ---------- 选项获取（一次性加载并缓存） ----------
  }, {
    key: "_getOptions",
    value: function () {
      var _getOptions2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(endpoint) {
        var pick,
          url,
          _yield$this$_fetch,
          data,
          cleaned,
          _args2 = arguments;
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.n) {
            case 0:
              pick = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : function (r) {
                return {
                  id: r.id,
                  name: r.name || r.title || r.content
                };
              };
              if (!this.cache[endpoint]) {
                _context2.n = 1;
                break;
              }
              return _context2.a(2, this.cache[endpoint]);
            case 1:
              url = "".concat(this.apiBaseUrl, "/").concat(endpoint, "?select=id,name,title,content&order=id.asc&limit=1000");
              _context2.n = 2;
              return this._fetch(url);
            case 2:
              _yield$this$_fetch = _context2.v;
              data = _yield$this$_fetch.data;
              cleaned = (Array.isArray(data) ? data : []).map(pick).filter(function (x) {
                return x && x.id != null;
              });
              this.cache[endpoint] = cleaned;
              return _context2.a(2, cleaned);
          }
        }, _callee2, this);
      }));
      function _getOptions(_x2) {
        return _getOptions2.apply(this, arguments);
      }
      return _getOptions;
    }()
  }, {
    key: "getCharacters",
    value: function getCharacters() {
      return this._getOptions('characters');
    }
  }, {
    key: "getArguments",
    value: function getArguments() {
      return this._getOptions('arguments');
    }
  }, {
    key: "getProverbs",
    value: function getProverbs() {
      return this._getOptions('proverbs');
    }
  }, {
    key: "getChapters",
    value: function () {
      var _getChapters = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
        var url, _yield$this$_fetch2, data, set, chapters;
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.n) {
            case 0:
              if (!this.cache.chapters) {
                _context3.n = 1;
                break;
              }
              return _context3.a(2, this.cache.chapters);
            case 1:
              // 直接从 analects_entries 聚合章节
              url = "".concat(this.apiBaseUrl, "/analects_entries?select=chapter&order=chapter.asc&limit=10000");
              _context3.n = 2;
              return this._fetch(url);
            case 2:
              _yield$this$_fetch2 = _context3.v;
              data = _yield$this$_fetch2.data;
              set = new Set();
              (data || []).forEach(function (r) {
                if (r && r.chapter != null) set.add(String(r.chapter));
              });
              chapters = Array.from(set).map(function (c, i) {
                return {
                  id: c,
                  name: c
                };
              });
              this.cache.chapters = chapters;
              return _context3.a(2, chapters);
          }
        }, _callee3, this);
      }));
      function getChapters() {
        return _getChapters.apply(this, arguments);
      }
      return getChapters;
    }() // ---------- 数据查询 ----------
  }, {
    key: "_buildEntriesUrl",
    value: function _buildEntriesUrl(filters, page, pageSize) {
      var select = 'id,chapter,section_number,original_text,translation,annotation,' + 'entry_characters(character_id),' + 'entry_arguments(argument_id),' + 'entry_proverbs(proverb_id)';
      var url = "".concat(this.apiBaseUrl, "/analects_entries?select=").concat(encodeURIComponent(select), "&order=id.asc");
      var conds = [];

      // 关键词（服务端粗过滤）
      if (filters.keyword) {
        var kw = filters.keyword.trim();
        if (kw) {
          var encoded = encodeURIComponent("(original_text.ilike.*".concat(kw, "*,translation.ilike.*").concat(kw, "*,annotation.ilike.*").concat(kw, "*)"));
          conds.push("or=".concat(encoded));
        }
      }

      // 章节（服务端）
      if (filters.chapter && filters.chapter !== 'all') {
        conds.push("chapter=eq.".concat(encodeURIComponent(filters.chapter)));
      }

      // 分页
      conds.push("limit=".concat(pageSize));
      conds.push("offset=".concat(page * pageSize));
      if (conds.length) url += '&' + conds.join('&');
      return url;
    }
  }, {
    key: "fetchEntries",
    value: function () {
      var _fetchEntries = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(filters) {
        var page,
          pageSize,
          url,
          _yield$this$_fetch3,
          data,
          total,
          list,
          allIn,
          kw,
          _args4 = arguments;
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.n) {
            case 0:
              page = _args4.length > 1 && _args4[1] !== undefined ? _args4[1] : 0;
              pageSize = _args4.length > 2 && _args4[2] !== undefined ? _args4[2] : 10;
              url = this._buildEntriesUrl(filters, page, pageSize);
              _context4.n = 1;
              return this._fetch(url);
            case 1:
              _yield$this$_fetch3 = _context4.v;
              data = _yield$this$_fetch3.data;
              total = _yield$this$_fetch3.total;
              // 客户端 AND 过滤（人物/论点/谚语）
              list = Array.isArray(data) ? data : [];
              allIn = function allIn(selectedIds, entryIds) {
                return _toConsumableArray(selectedIds).every(function (id) {
                  return entryIds.includes(parseInt(id, 10));
                });
              };
              if (filters.characterIds && filters.characterIds.length) {
                list = list.filter(function (e) {
                  var ids = (e.entry_characters || []).map(function (x) {
                    return x.character_id;
                  }).filter(function (x) {
                    return x != null;
                  });
                  return allIn(filters.characterIds, ids);
                });
              }
              if (filters.argumentIds && filters.argumentIds.length) {
                list = list.filter(function (e) {
                  var ids = (e.entry_arguments || []).map(function (x) {
                    return x.argument_id;
                  }).filter(function (x) {
                    return x != null;
                  });
                  return allIn(filters.argumentIds, ids);
                });
              }
              if (filters.proverbIds && filters.proverbIds.length) {
                list = list.filter(function (e) {
                  var ids = (e.entry_proverbs || []).map(function (x) {
                    return x.proverb_id;
                  }).filter(function (x) {
                    return x != null;
                  });
                  return allIn(filters.proverbIds, ids);
                });
              }

              // 关键词二次过滤（保证与服务端一致）
              if (filters.keyword) {
                kw = filters.keyword.trim().toLowerCase();
                list = list.filter(function (e) {
                  var t1 = (e.original_text || '').toLowerCase();
                  var t2 = (e.translation || '').toLowerCase();
                  var t3 = (e.annotation || '').toLowerCase();
                  return t1.includes(kw) || t2.includes(kw) || t3.includes(kw);
                });
              }
              return _context4.a(2, {
                data: list,
                // 注意：total 为服务端（仅关键词+章节）统计值，这里用它作为基数；
                // 客户端 AND 过滤后数量可能更少，因此我们以 list.length 是否等于 pageSize 判断是否“可能还有更多”
                totalCount: typeof total === 'number' ? total : list.length,
                hasMore: list.length === pageSize
              });
          }
        }, _callee4, this);
      }));
      function fetchEntries(_x3) {
        return _fetchEntries.apply(this, arguments);
      }
      return fetchEntries;
    }() // ---------- 每日论语 ----------
  }, {
    key: "renderDailyAnalect",
    value: function () {
      var _renderDailyAnalect = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(container) {
        var countUrl, _yield$this$_fetch4, total, totalCount, today, dayIndex, url, _yield$this$_fetch5, data, item, _t;
        return _regenerator().w(function (_context5) {
          while (1) switch (_context5.p = _context5.n) {
            case 0:
              if (container) {
                _context5.n = 1;
                break;
              }
              return _context5.a(2);
            case 1:
              container.innerHTML = "<div class=\"analects-card\"><div class=\"analects-loading\">\u52A0\u8F7D\u6BCF\u65E5\u8BBA\u8BED...</div></div>";
              _context5.p = 2;
              // 获取总数
              countUrl = "".concat(this.apiBaseUrl, "/analects_entries?select=id");
              _context5.n = 3;
              return this._fetch(countUrl);
            case 3:
              _yield$this$_fetch4 = _context5.v;
              total = _yield$this$_fetch4.total;
              totalCount = typeof total === 'number' ? total : 0;
              if (totalCount) {
                _context5.n = 4;
                break;
              }
              container.innerHTML = "<div class=\"analects-error\">\u6682\u65E0\u6570\u636E</div>";
              return _context5.a(2);
            case 4:
              // 用日期（UTC）决定 offset
              today = new Date();
              dayIndex = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000) % totalCount;
              url = "".concat(this.apiBaseUrl, "/analects_entries?select=id,chapter,section_number,original_text,translation,annotation&order=id.asc&limit=1&offset=").concat(dayIndex);
              _context5.n = 5;
              return this._fetch(url);
            case 5:
              _yield$this$_fetch5 = _context5.v;
              data = _yield$this$_fetch5.data;
              item = (data || [])[0];
              if (item) {
                _context5.n = 6;
                break;
              }
              container.innerHTML = "<div class=\"analects-error\">\u672A\u627E\u5230\u6BCF\u65E5\u8BBA\u8BED</div>";
              return _context5.a(2);
            case 6:
              container.innerHTML = "\n        <div class=\"analects-card\">\n          <div class=\"analects-card-header\">\n            <h3 class=\"analects-card-title\">\uD83D\uDCDC \u6BCF\u65E5\u8BBA\u8BED</h3>\n            <div class=\"analects-card-subtitle\">".concat(this._fmtChapter(item), "</div>\n          </div>\n          <div class=\"analects-card-body\">\n            <div class=\"analects-text\">").concat(this._safe(item.original_text), "</div>\n            ").concat(item.translation ? "<div class=\"analects-subtext\">".concat(this._safe(item.translation), "</div>") : '', "\n            ").concat(item.annotation ? "<div class=\"analects-subtext muted\">".concat(this._safe(item.annotation), "</div>") : '', "\n          </div>\n        </div>\n      ");
              _context5.n = 8;
              break;
            case 7:
              _context5.p = 7;
              _t = _context5.v;
              container.innerHTML = "<div class=\"analects-error\">\u52A0\u8F7D\u5931\u8D25\uFF1A".concat(_t.message, "</div>");
            case 8:
              return _context5.a(2);
          }
        }, _callee5, this, [[2, 7]]);
      }));
      function renderDailyAnalect(_x4) {
        return _renderDailyAnalect.apply(this, arguments);
      }
      return renderDailyAnalect;
    }()
  }, {
    key: "_fmtChapter",
    value: function _fmtChapter(e) {
      var ch = e.chapter != null ? String(e.chapter) : '';
      var sec = e.section_number != null ? String(e.section_number) : '';
      if (ch && sec) return "\u7B2C ".concat(ch, " \u7BC7 \xB7 \u7B2C ").concat(sec, " \u7AE0");
      if (ch) return "\u7B2C ".concat(ch, " \u7BC7");
      return '';
    }
  }, {
    key: "_safe",
    value: function _safe(t) {
      return (t || '').replace(/[&<>]/g, function (s) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;'
        }[s];
      });
    }

    // ---------- 搜索界面 ----------
  }, {
    key: "renderSearchInterface",
    value: function () {
      var _renderSearchInterface = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9(container) {
        var _this = this;
        var keywordInput, searchBtn, results, statusBar, loadMoreBtn, chapterCloud, charCloud, argCloud, provCloud, _yield$Promise$all, _yield$Promise$all2, chapters, characters, argumentsList, proverbs, onScroll;
        return _regenerator().w(function (_context9) {
          while (1) switch (_context9.n) {
            case 0:
              if (container) {
                _context9.n = 1;
                break;
              }
              return _context9.a(2);
            case 1:
              container.innerHTML = this._searchSkeleton();

              // 绑定元素
              keywordInput = container.querySelector('#analects-keyword');
              searchBtn = container.querySelector('#analects-search-btn');
              results = container.querySelector('#analects-results');
              statusBar = container.querySelector('#analects-status');
              loadMoreBtn = container.querySelector('#analects-load-more-btn');
              chapterCloud = container.querySelector('#chapter-filters');
              charCloud = container.querySelector('#character-filters');
              argCloud = container.querySelector('#argument-filters');
              provCloud = container.querySelector('#proverb-filters'); // 初始状态：不搜索
              statusBar.textContent = '请输入关键词或选择筛选后点击“搜索”。';

              // 渲染筛选选项
              _context9.n = 2;
              return Promise.all([this.getChapters(), this.getCharacters(), this.getArguments(), this.getProverbs()]);
            case 2:
              _yield$Promise$all = _context9.v;
              _yield$Promise$all2 = _slicedToArray(_yield$Promise$all, 4);
              chapters = _yield$Promise$all2[0];
              characters = _yield$Promise$all2[1];
              argumentsList = _yield$Promise$all2[2];
              proverbs = _yield$Promise$all2[3];
              // 章节（单选 + “全部章节”）
              this._renderChapterChips(chapterCloud, chapters);

              // 其余为多选
              this._renderMultiChips(charCloud, characters, this.selected.characters);
              this._renderMultiChips(argCloud, argumentsList, this.selected.arguments);
              this._renderMultiChips(provCloud, proverbs, this.selected.proverbs);

              // 点击搜索
              searchBtn.addEventListener('click', /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
                var _this$selected$chapte;
                return _regenerator().w(function (_context6) {
                  while (1) switch (_context6.n) {
                    case 0:
                      _context6.n = 1;
                      return _this._startSearch({
                        keyword: (keywordInput.value || '').trim(),
                        characterIds: Array.from(_this.selected.characters.keys()),
                        argumentIds: Array.from(_this.selected.arguments.keys()),
                        proverbIds: Array.from(_this.selected.proverbs.keys()),
                        chapter: ((_this$selected$chapte = _this.selected.chapter) === null || _this$selected$chapte === void 0 ? void 0 : _this$selected$chapte.id) || 'all'
                      }, {
                        results: results,
                        statusBar: statusBar,
                        loadMoreBtn: loadMoreBtn
                      });
                    case 1:
                      return _context6.a(2);
                  }
                }, _callee6);
              })));

              // 加载更多（点击）
              loadMoreBtn.addEventListener('click', /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7() {
                return _regenerator().w(function (_context7) {
                  while (1) switch (_context7.n) {
                    case 0:
                      _context7.n = 1;
                      return _this._loadMore({
                        results: results,
                        statusBar: statusBar,
                        loadMoreBtn: loadMoreBtn
                      });
                    case 1:
                      return _context7.a(2);
                  }
                }, _callee7);
              })));

              // 滚动加载（仅在已搜索后生效）
              onScroll = /*#__PURE__*/function () {
                var _ref3 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8() {
                  var rect;
                  return _regenerator().w(function (_context8) {
                    while (1) switch (_context8.n) {
                      case 0:
                        if (!(!_this.state.didSearch || _this.state.isLoading || !_this.state.hasMore)) {
                          _context8.n = 1;
                          break;
                        }
                        return _context8.a(2);
                      case 1:
                        rect = loadMoreBtn.getBoundingClientRect(); // 当按钮接近视口底部时触发
                        if (!(rect.top < window.innerHeight + 120)) {
                          _context8.n = 2;
                          break;
                        }
                        _context8.n = 2;
                        return _this._loadMore({
                          results: results,
                          statusBar: statusBar,
                          loadMoreBtn: loadMoreBtn
                        });
                      case 2:
                        return _context8.a(2);
                    }
                  }, _callee8);
                }));
                return function onScroll() {
                  return _ref3.apply(this, arguments);
                };
              }();
              window.addEventListener('scroll', onScroll);
            case 3:
              return _context9.a(2);
          }
        }, _callee9, this);
      }));
      function renderSearchInterface(_x5) {
        return _renderSearchInterface.apply(this, arguments);
      }
      return renderSearchInterface;
    }()
  }, {
    key: "_searchSkeleton",
    value: function _searchSkeleton() {
      return "\n      <div class=\"analects-card\">\n        <div class=\"analects-card-header\">\n          <h3 class=\"analects-card-title\">\uD83D\uDD0E \u8BBA\u8BED\u67E5\u8BE2</h3>\n          <div class=\"analects-searchbar\">\n            <input id=\"analects-keyword\" class=\"analects-input\" placeholder=\"\u8F93\u5165\u5173\u952E\u8BCD\uFF08\u539F\u6587/\u8BD1\u6587/\u6CE8\u91CA\uFF09\">\n            <button id=\"analects-search-btn\" class=\"analects-btn primary\">\u641C\u7D22</button>\n          </div>\n        </div>\n        <div class=\"analects-card-body\">\n          <div class=\"analects-filters\">\n            <div class=\"analects-filter\">\n              <div class=\"analects-filter-title\">\u7AE0\u8282</div>\n              <div id=\"chapter-filters\" class=\"analects-tag-cloud\"></div>\n            </div>\n            <div class=\"analects-filter\">\n              <div class=\"analects-filter-title\">\u4EBA\u7269</div>\n              <div id=\"character-filters\" class=\"analects-tag-cloud\"></div>\n            </div>\n            <div class=\"analects-filter\">\n              <div class=\"analects-filter-title\">\u8BBA\u70B9</div>\n              <div id=\"argument-filters\" class=\"analects-tag-cloud\"></div>\n            </div>\n            <div class=\"analects-filter\">\n              <div class=\"analects-filter-title\">\u8C1A\u8BED</div>\n              <div id=\"proverb-filters\" class=\"analects-tag-cloud\"></div>\n            </div>\n          </div>\n          <div id=\"analects-status\" class=\"analects-status muted\"></div>\n          <div id=\"analects-results\" class=\"analects-results\"></div>\n          <div class=\"analects-loadmore\">\n            <button id=\"analects-load-more-btn\" class=\"analects-btn\">\u52A0\u8F7D\u66F4\u591A</button>\n          </div>\n        </div>\n      </div>\n    ";
    }
  }, {
    key: "_renderChapterChips",
    value: function _renderChapterChips(container, chapters) {
      var _this2 = this;
      container.innerHTML = '';
      // “全部章节”
      var all = this._chip({
        id: 'all',
        name: '全部章节'
      }, true, true);
      container.appendChild(all);
      var setSelected = function setSelected(chip) {
        // 清空所有章节选中
        container.querySelectorAll('.analects-chip').forEach(function (el) {
          return el.classList.remove('selected');
        });
        // 选中当前
        chip.classList.add('selected');
        // 更新 selected.chapter
        _this2.selected.chapter = {
          id: chip.dataset.id,
          name: chip.dataset.name
        };
        // 规则：只有在 selected 时，.all-option 才是绿色；否则为白底
        var allChip = container.querySelector('.analects-chip.all-option');
        if (allChip) {
          if (chip === allChip) allChip.classList.add('selected');else allChip.classList.remove('selected');
        }
        // 切换筛选时：重置分页与搜索状态，但不触发自动搜索（用户需点“搜索”）
        _this2._resetPaging();
      };
      all.addEventListener('click', function () {
        return setSelected(all);
      });
      (chapters || []).forEach(function (ch) {
        var chip = _this2._chip({
          id: String(ch.id),
          name: String(ch.name)
        }, false, false);
        chip.addEventListener('click', function () {
          return setSelected(chip);
        });
        container.appendChild(chip);
      });
    }
  }, {
    key: "_renderMultiChips",
    value: function _renderMultiChips(container, options, storeMap) {
      var _this3 = this;
      container.innerHTML = '';
      (options || []).forEach(function (opt) {
        var chip = _this3._chip({
          id: String(opt.id),
          name: String(opt.name || opt.title || opt.content || opt.id)
        }, false, false);
        chip.addEventListener('click', function () {
          var id = chip.dataset.id;
          var name = chip.dataset.name;
          if (chip.classList.contains('selected')) {
            chip.classList.remove('selected');
            storeMap.delete(id);
          } else {
            chip.classList.add('selected');
            storeMap.set(id, name);
          }
          _this3._resetPaging();
        });
        container.appendChild(chip);
      });
    }
  }, {
    key: "_chip",
    value: function _chip(opt, selected, isAll) {
      var chip = document.createElement('label');
      chip.className = "analects-chip".concat(isAll ? ' all-option' : '').concat(selected ? ' selected' : '');
      chip.dataset.id = String(opt.id);
      chip.dataset.name = String(opt.name);
      // 隐藏的单选/复选输入（供无障碍/键盘使用；样式上隐藏小圆圈/方框）
      chip.innerHTML = "\n      <input type=\"".concat(isAll ? 'radio' : 'checkbox', "\" ").concat(selected ? 'checked' : '', " aria-hidden=\"true\" tabindex=\"-1\">\n      <span>").concat(this._safe(opt.name), "</span>\n    ");
      return chip;
    }
  }, {
    key: "_resetPaging",
    value: function _resetPaging() {
      this.state.page = 0;
      this.state.hasMore = false;
      this.state.totalCount = 0;
      this.state.didSearch = false; // 防止未点击“搜索”时触发滚动加载
    }
  }, {
    key: "_startSearch",
    value: function () {
      var _startSearch2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee0(filters, ctx) {
        var token, _yield$this$fetchEntr, data, totalCount, hasMore, _t2;
        return _regenerator().w(function (_context0) {
          while (1) switch (_context0.p = _context0.n) {
            case 0:
              // 记录本次搜索 token，避免旧结果插队
              token = ++this.state.searchToken;
              this.state.isLoading = true;
              this.state.page = 0;
              this.state.didSearch = true;
              this.state.currentFilters = _objectSpread({}, filters);
              ctx.statusBar.textContent = '🔍 搜索中...';
              ctx.results.innerHTML = '<div class="analects-loading">正在搜索...</div>';
              ctx.loadMoreBtn.disabled = true;
              _context0.p = 1;
              _context0.n = 2;
              return this.fetchEntries(this.state.currentFilters, 0, this.state.pageSize);
            case 2:
              _yield$this$fetchEntr = _context0.v;
              data = _yield$this$fetchEntr.data;
              totalCount = _yield$this$fetchEntr.totalCount;
              hasMore = _yield$this$fetchEntr.hasMore;
              if (!(token !== this.state.searchToken)) {
                _context0.n = 3;
                break;
              }
              return _context0.a(2);
            case 3:
              // 已有新搜索触发

              this.state.page = 1;
              this.state.hasMore = hasMore;
              this.state.totalCount = totalCount || data.length;
              ctx.results.innerHTML = '';
              this._renderList(ctx.results, data);
              if (this.state.hasMore) {
                ctx.statusBar.textContent = "\u5171\u627E\u5230 ".concat(this.state.totalCount, " \u6761\u7ED3\u679C\uFF0C\u6EDA\u52A8\u6216\u8005\u70B9\u51FB\u52A0\u8F7D\u66F4\u591A");
              } else {
                ctx.statusBar.textContent = data.length > 0 ? '已加载完毕' : '未找到匹配的结果';
              }
              ctx.loadMoreBtn.disabled = !this.state.hasMore;
              _context0.n = 5;
              break;
            case 4:
              _context0.p = 4;
              _t2 = _context0.v;
              ctx.results.innerHTML = "<div class=\"analects-error\">\u641C\u7D22\u5931\u8D25\uFF1A".concat(_t2.message, "</div>");
              ctx.statusBar.textContent = '搜索失败';
            case 5:
              _context0.p = 5;
              this.state.isLoading = false;
              return _context0.f(5);
            case 6:
              return _context0.a(2);
          }
        }, _callee0, this, [[1, 4, 5, 6]]);
      }));
      function _startSearch(_x6, _x7) {
        return _startSearch2.apply(this, arguments);
      }
      return _startSearch;
    }()
  }, {
    key: "_loadMore",
    value: function () {
      var _loadMore2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee1(ctx) {
        var token, _yield$this$fetchEntr2, data, hasMore, _t3;
        return _regenerator().w(function (_context1) {
          while (1) switch (_context1.p = _context1.n) {
            case 0:
              if (!(!this.state.didSearch || this.state.isLoading || !this.state.hasMore)) {
                _context1.n = 1;
                break;
              }
              return _context1.a(2);
            case 1:
              token = this.state.searchToken;
              this.state.isLoading = true;
              ctx.loadMoreBtn.disabled = true;
              ctx.loadMoreBtn.textContent = '加载中...';
              _context1.p = 2;
              _context1.n = 3;
              return this.fetchEntries(this.state.currentFilters, this.state.page, this.state.pageSize);
            case 3:
              _yield$this$fetchEntr2 = _context1.v;
              data = _yield$this$fetchEntr2.data;
              hasMore = _yield$this$fetchEntr2.hasMore;
              if (!(token !== this.state.searchToken)) {
                _context1.n = 4;
                break;
              }
              return _context1.a(2);
            case 4:
              this.state.page += 1;
              this.state.hasMore = hasMore;
              this._renderList(ctx.results, data);
              if (this.state.hasMore) {
                ctx.statusBar.textContent = "\u5171\u627E\u5230 ".concat(this.state.totalCount, " \u6761\u7ED3\u679C\uFF0C\u6EDA\u52A8\u6216\u8005\u70B9\u51FB\u52A0\u8F7D\u66F4\u591A");
                ctx.loadMoreBtn.disabled = false;
                ctx.loadMoreBtn.textContent = '加载更多';
              } else {
                ctx.statusBar.textContent = '已加载完毕';
                ctx.loadMoreBtn.textContent = '已加载完毕';
              }
              _context1.n = 6;
              break;
            case 5:
              _context1.p = 5;
              _t3 = _context1.v;
              // 保持体验
              ctx.statusBar.textContent = "\u52A0\u8F7D\u66F4\u591A\u5931\u8D25\uFF1A".concat(_t3.message);
              ctx.loadMoreBtn.disabled = false;
              ctx.loadMoreBtn.textContent = '加载更多';
            case 6:
              _context1.p = 6;
              this.state.isLoading = false;
              return _context1.f(6);
            case 7:
              return _context1.a(2);
          }
        }, _callee1, this, [[2, 5, 6, 7]]);
      }));
      function _loadMore(_x8) {
        return _loadMore2.apply(this, arguments);
      }
      return _loadMore;
    }()
  }, {
    key: "_renderList",
    value: function _renderList(container, items) {
      var _this4 = this;
      var frag = document.createDocumentFragment();
      (items || []).forEach(function (e) {
        var card = document.createElement('div');
        card.className = 'analects-item';
        card.innerHTML = "\n        <div class=\"meta\">".concat(_this4._fmtChapter(e), "</div>\n        <div class=\"text\">").concat(_this4._safe(e.original_text), "</div>\n        ").concat(e.translation ? "<div class=\"subtext\">".concat(_this4._safe(e.translation), "</div>") : '', "\n        ").concat(e.annotation ? "<div class=\"subtext muted\">".concat(_this4._safe(e.annotation), "</div>") : '', "\n      ");
        frag.appendChild(card);
      });
      container.appendChild(frag);
    }
  }]);
}();

__webpack_exports__ = __webpack_exports__["default"];
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=analects.js.map