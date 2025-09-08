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
/******/ 	var __webpack_modules__ = ({

/***/ 954:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

/* module decorator */ module = __webpack_require__.hmd(module);
var _excluded = ["count"];
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// 引入样式文件


// 论语 SDK - 优化清理版
var AnalectsSDK = /*#__PURE__*/function () {
  function AnalectsSDK() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    _classCallCheck(this, AnalectsSDK);
    this.supabaseUrl = config.supabaseUrl || 'https://your-project.supabase.co';
    this.supabaseKey = config.supabaseKey || 'your-anon-key';
    this.apiBaseUrl = "".concat(this.supabaseUrl, "/rest/v1");
    this.headers = {
      'apikey': this.supabaseKey,
      'Authorization': "Bearer ".concat(this.supabaseKey),
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    // 缓存数据
    this.cache = {
      characters: null,
      arguments: null,
      proverbs: null,
      chapters: null
    };

    // 选中项目管理
    this.selectedItems = {
      characters: new Map(),
      arguments: new Map(),
      proverbs: new Map(),
      chapter: {
        id: 'all',
        name: '全部章节'
      }
    };

    // 分页参数
    this.pagination = {
      pageSize: 10,
      currentPage: 0,
      totalLoaded: 0,
      isLoading: false,
      hasMore: true,
      totalCount: 0,
      loadedIds: new Set()
    };

    // 搜索状态管理
    this.currentFilters = {};
    this.isSearchInitialized = false;
    this.scrollListener = null;
    this.isAutoLoadingEnabled = false;
    this.searchConditionsChanged = false;
  }

  // 验证配置
  return _createClass(AnalectsSDK, [{
    key: "validateConfig",
    value: function validateConfig() {
      if (!this.supabaseUrl || this.supabaseUrl.includes('your-project')) {
        throw new Error('请先配置正确的 Supabase URL');
      }
      if (!this.supabaseKey || this.supabaseKey.includes('your-anon-key')) {
        throw new Error('请先配置正确的 Supabase Key');
      }
    }

    // API请求方法
  }, {
    key: "apiRequest",
    value: function () {
      var _apiRequest = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(endpoint) {
        var params,
          count,
          urlParams,
          url,
          headers,
          existingPrefer,
          response,
          errorText,
          data,
          contentRange,
          match,
          _args = arguments;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              params = _args.length > 1 && _args[1] !== undefined ? _args[1] : {};
              this.validateConfig();
              count = params.count, urlParams = _objectWithoutProperties(params, _excluded);
              url = "".concat(this.apiBaseUrl, "/").concat(endpoint);
              if (Object.keys(urlParams).length > 0) {
                url += '?' + new URLSearchParams(urlParams).toString();
              }
              headers = _objectSpread({}, this.headers);
              if (count) {
                existingPrefer = headers['Prefer'] || '';
                headers['Prefer'] = existingPrefer ? "".concat(existingPrefer, ", count=").concat(count) : "count=".concat(count);
              }
              _context.n = 1;
              return fetch(url, {
                method: 'GET',
                headers: headers,
                mode: 'cors'
              });
            case 1:
              response = _context.v;
              if (response.ok) {
                _context.n = 3;
                break;
              }
              _context.n = 2;
              return response.text();
            case 2:
              errorText = _context.v;
              console.error('API错误详情:', response.status, response.statusText, errorText);
              throw new Error("API\u8BF7\u6C42\u5931\u8D25: ".concat(response.status, " ").concat(response.statusText));
            case 3:
              _context.n = 4;
              return response.json();
            case 4:
              data = _context.v;
              if (count) {
                contentRange = response.headers.get('Content-Range');
                if (contentRange) {
                  match = contentRange.match(/\/(\d+)$/);
                  if (match) {
                    data.count = parseInt(match[1], 10);
                  }
                }
              }
              return _context.a(2, data);
          }
        }, _callee, this);
      }));
      function apiRequest(_x) {
        return _apiRequest.apply(this, arguments);
      }
      return apiRequest;
    }() // 分页数据获取
  }, {
    key: "fetchAnalects",
    value: function () {
      var _fetchAnalects = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
        var filters,
          page,
          pageSize,
          params,
          data,
          uniqueData,
          totalLoadedSoFar,
          hasMore,
          _args2 = arguments,
          _t;
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.p = _context2.n) {
            case 0:
              filters = _args2.length > 0 && _args2[0] !== undefined ? _args2[0] : {};
              page = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : 0;
              pageSize = _args2.length > 2 && _args2[2] !== undefined ? _args2[2] : 10;
              _context2.p = 1;
              params = this.buildQueryParams(filters, page, pageSize);
              _context2.n = 2;
              return this.apiRequest('analects_entries_expanded', params);
            case 2:
              data = _context2.v;
              uniqueData = this.removeDuplicates(data);
              if (!(page === 0)) {
                _context2.n = 4;
                break;
              }
              _context2.n = 3;
              return this.getTotalCount(filters);
            case 3:
              this.pagination.totalCount = _context2.v;
            case 4:
              totalLoadedSoFar = page * pageSize + uniqueData.length;
              hasMore = totalLoadedSoFar < this.pagination.totalCount;
              return _context2.a(2, {
                data: uniqueData,
                hasMore: hasMore,
                total: uniqueData.length,
                totalCount: this.pagination.totalCount
              });
            case 5:
              _context2.p = 5;
              _t = _context2.v;
              console.error('获取论语数据失败:', _t);
              throw _t;
            case 6:
              return _context2.a(2);
          }
        }, _callee2, this, [[1, 5]]);
      }));
      function fetchAnalects() {
        return _fetchAnalects.apply(this, arguments);
      }
      return fetchAnalects;
    }() // 构建查询参数
  }, {
    key: "buildQueryParams",
    value: function buildQueryParams(filters, page, pageSize) {
      var params = {
        select: "*,entry_characters(character_id,characters(id,name)),entry_arguments(argument_id,arguments(id,title)),entry_proverbs(proverbs(*))",
        order: 'id.asc',
        limit: pageSize,
        offset: page * pageSize
      };
      if (filters.chapter && filters.chapter !== 'all' && filters.chapter.trim()) {
        params.chapter = "eq.".concat(filters.chapter.trim());
      }
      if (filters.characterIds && filters.characterIds.length > 0) {
        params.character_ids = "cs.{".concat(filters.characterIds.join(','), "}");
      }
      if (filters.argumentIds && filters.argumentIds.length > 0) {
        params.argument_ids = "cs.{".concat(filters.argumentIds.join(','), "}");
      }
      if (filters.proverbIds && filters.proverbIds.length > 0) {
        params.proverb_ids = "cs.{".concat(filters.proverbIds.join(','), "}");
      }

      // 关键字处理 - 多关键字 AND 逻辑
      if (filters.keyword && filters.keyword.trim()) {
        var rawKeyword = filters.keyword.trim().replace(/%/g, '');
        var keywords = rawKeyword.split(/\s+/).filter(function (k) {
          return k.length > 0;
        });
        if (keywords.length > 0) {
          var keywordGroups = keywords.map(function (kw) {
            var searchFields = ["original_text.ilike.*".concat(kw, "*"), "translation.ilike.*".concat(kw, "*"), "annotation.ilike.*".concat(kw, "*"), "personal_insight.ilike.*".concat(kw, "*")];
            return "or(".concat(searchFields.join(','), ")");
          });
          params.and = "(".concat(keywordGroups.join(','), ")");
        }
      }
      return params;
    }

    // 关键字高亮处理
  }, {
    key: "highlightKeywords",
    value: function highlightKeywords(text, keyword) {
      var _this = this;
      if (!text || !keyword) {
        return this.escapeHtml(text || '');
      }
      var escapedText = this.escapeHtml(text);
      var keywords = keyword.trim().split(/\s+/).filter(function (k) {
        return k.length > 0;
      });
      if (keywords.length === 0) {
        return escapedText;
      }
      keywords.forEach(function (kw) {
        if (kw.length > 0) {
          var escapedKeyword = _this.escapeHtml(kw);
          var regex = new RegExp("(".concat(_this.escapeRegExp(escapedKeyword), ")"), 'gi');
          escapedText = escapedText.replace(regex, '<mark class="keyword-highlight">$1</mark>');
        }
      });
      return escapedText;
    }

    // HTML转义
  }, {
    key: "escapeHtml",
    value: function escapeHtml(text) {
      if (!text) return '';
      var div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // 正则表达式特殊字符转义
  }, {
    key: "escapeRegExp",
    value: function escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // 去重处理
  }, {
    key: "removeDuplicates",
    value: function removeDuplicates(data) {
      var uniqueData = [];
      var seenIds = new Set();
      var _iterator = _createForOfIteratorHelper(data),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var entry = _step.value;
          if (entry.id && !seenIds.has(entry.id)) {
            seenIds.add(entry.id);
            uniqueData.push(entry);
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      return uniqueData;
    }

    // 获取总数
  }, {
    key: "getTotalCount",
    value: function () {
      var _getTotalCount = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(filters) {
        var params, rawKeyword, keywords, keywordGroups, result, _t2;
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.p = _context3.n) {
            case 0:
              _context3.p = 0;
              params = {
                select: 'id',
                count: 'exact',
                limit: 0
              };
              if (filters.chapter && filters.chapter !== 'all' && filters.chapter.trim()) {
                params.chapter = "eq.".concat(filters.chapter.trim());
              }
              if (filters.characterIds && filters.characterIds.length > 0) {
                params.character_ids = "cs.{".concat(filters.characterIds.join(','), "}");
              }
              if (filters.argumentIds && filters.argumentIds.length > 0) {
                params.argument_ids = "cs.{".concat(filters.argumentIds.join(','), "}");
              }
              if (filters.proverbIds && filters.proverbIds.length > 0) {
                params.proverb_ids = "cs.{".concat(filters.proverbIds.join(','), "}");
              }
              if (filters.keyword && filters.keyword.trim()) {
                rawKeyword = filters.keyword.trim().replace(/%/g, '');
                keywords = rawKeyword.split(/\s+/).filter(function (k) {
                  return k.length > 0;
                });
                if (keywords.length > 0) {
                  keywordGroups = keywords.map(function (kw) {
                    var searchFields = ["original_text.ilike.*".concat(kw, "*"), "translation.ilike.*".concat(kw, "*"), "annotation.ilike.*".concat(kw, "*"), "personal_insight.ilike.*".concat(kw, "*")];
                    return "or(".concat(searchFields.join(','), ")");
                  });
                  params.and = "(".concat(keywordGroups.join(','), ")");
                }
              }
              _context3.n = 1;
              return this.apiRequest('analects_entries_expanded', params);
            case 1:
              result = _context3.v;
              return _context3.a(2, result.count || 0);
            case 2:
              _context3.p = 2;
              _t2 = _context3.v;
              console.error('获取总数失败:', _t2);
              return _context3.a(2, 0);
          }
        }, _callee3, this, [[0, 2]]);
      }));
      function getTotalCount(_x2) {
        return _getTotalCount.apply(this, arguments);
      }
      return getTotalCount;
    }() // 中文拼音排序
  }, {
    key: "sortByPinyin",
    value: function sortByPinyin(items, field) {
      return items.sort(function (a, b) {
        var textA = a[field] || '';
        var textB = b[field] || '';
        return textA.localeCompare(textB, 'zh-CN', {
          numeric: true,
          sensitivity: 'base'
        });
      });
    }

    // 章节排序
  }, {
    key: "sortChaptersByNumber",
    value: function sortChaptersByNumber(chapters) {
      var _this2 = this;
      return chapters.sort(function (a, b) {
        var getChapterNumber = function getChapterNumber(chapterName) {
          var match = chapterName.match(/第([一二三四五六七八九十百千万]+|[0-9]+)/);
          if (!match) return 0;
          var numStr = match[1];
          if (/^\d+$/.test(numStr)) {
            return parseInt(numStr, 10);
          }
          return _this2.chineseToNumber(numStr);
        };
        return getChapterNumber(a.name || a) - getChapterNumber(b.name || b);
      });
    }

    // 中文数字转阿拉伯数字
  }, {
    key: "chineseToNumber",
    value: function chineseToNumber(chineseNum) {
      var chineseNumbers = {
        '零': 0,
        '一': 1,
        '二': 2,
        '三': 3,
        '四': 4,
        '五': 5,
        '六': 6,
        '七': 7,
        '八': 8,
        '九': 9,
        '十': 10,
        '百': 100,
        '千': 1000,
        '万': 10000
      };
      if (chineseNumbers[chineseNum]) {
        return chineseNumbers[chineseNum];
      }
      var result = 0;
      var temp = 0;
      if (chineseNum.startsWith('十')) {
        result = 10;
        chineseNum = chineseNum.substring(1);
      }
      for (var i = 0; i < chineseNum.length; i++) {
        var char = chineseNum[i];
        var num = chineseNumbers[char];
        if (num < 10) {
          temp = num;
        } else if (num === 10) {
          if (temp === 0) temp = 1;
          result += temp * 10;
          temp = 0;
        } else if (num === 100) {
          if (temp === 0) temp = 1;
          result += temp * 100;
          temp = 0;
        } else if (num === 1000) {
          if (temp === 0) temp = 1;
          result += temp * 1000;
          temp = 0;
        } else if (num === 10000) {
          if (temp === 0) temp = 1;
          result = (result + temp) * 10000;
          temp = 0;
        }
      }
      result += temp;
      return result;
    }

    // 获取数据
  }, {
    key: "getData",
    value: function () {
      var _getData = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(type) {
        var endpoints, data, uniqueChapters, sortField, _t3;
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.p = _context4.n) {
            case 0:
              if (!this.cache[type]) {
                _context4.n = 1;
                break;
              }
              return _context4.a(2, this.cache[type]);
            case 1:
              endpoints = {
                characters: 'characters?order=name.asc',
                arguments: 'arguments?order=title.asc',
                proverbs: 'proverbs?order=content.asc',
                chapters: 'analects_entries?select=chapter&order=chapter.asc'
              };
              _context4.p = 2;
              _context4.n = 3;
              return this.apiRequest(endpoints[type].split('?')[0], Object.fromEntries(new URLSearchParams(endpoints[type].split('?')[1] || '')));
            case 3:
              data = _context4.v;
              if (type === 'chapters') {
                uniqueChapters = _toConsumableArray(new Set(data.map(function (item) {
                  return item.chapter;
                }))).filter(function (chapter) {
                  return chapter && typeof chapter === 'string' && chapter.trim();
                }).map(function (chapter) {
                  return {
                    id: chapter,
                    name: chapter
                  };
                });
                data = this.sortChaptersByNumber(uniqueChapters);
              } else {
                sortField = type === 'characters' ? 'name' : type === 'arguments' ? 'title' : type === 'proverbs' ? 'content' : null;
                if (sortField) {
                  data = this.sortByPinyin(data, sortField);
                }
              }
              this.cache[type] = data;
              return _context4.a(2, data);
            case 4:
              _context4.p = 4;
              _t3 = _context4.v;
              console.error("\u83B7\u53D6".concat(type, "\u5217\u8868\u5931\u8D25:"), _t3);
              if (!(_t3.message === 'Failed to fetch')) {
                _context4.n = 5;
                break;
              }
              throw new Error('网络连接失败，请检查 Supabase 配置和网络连接');
            case 5:
              throw _t3;
            case 6:
              return _context4.a(2);
          }
        }, _callee4, this, [[2, 4]]);
      }));
      function getData(_x3) {
        return _getData.apply(this, arguments);
      }
      return getData;
    }() // 便捷方法
  }, {
    key: "getCharacters",
    value: function () {
      var _getCharacters = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
        return _regenerator().w(function (_context5) {
          while (1) switch (_context5.n) {
            case 0:
              return _context5.a(2, this.getData('characters'));
          }
        }, _callee5, this);
      }));
      function getCharacters() {
        return _getCharacters.apply(this, arguments);
      }
      return getCharacters;
    }()
  }, {
    key: "getArguments",
    value: function () {
      var _getArguments = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
        return _regenerator().w(function (_context6) {
          while (1) switch (_context6.n) {
            case 0:
              return _context6.a(2, this.getData('arguments'));
          }
        }, _callee6, this);
      }));
      function getArguments() {
        return _getArguments.apply(this, arguments);
      }
      return getArguments;
    }()
  }, {
    key: "getProverbs",
    value: function () {
      var _getProverbs = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7() {
        return _regenerator().w(function (_context7) {
          while (1) switch (_context7.n) {
            case 0:
              return _context7.a(2, this.getData('proverbs'));
          }
        }, _callee7, this);
      }));
      function getProverbs() {
        return _getProverbs.apply(this, arguments);
      }
      return getProverbs;
    }()
  }, {
    key: "getChapters",
    value: function () {
      var _getChapters = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8() {
        return _regenerator().w(function (_context8) {
          while (1) switch (_context8.n) {
            case 0:
              return _context8.a(2, this.getData('chapters'));
          }
        }, _callee8, this);
      }));
      function getChapters() {
        return _getChapters.apply(this, arguments);
      }
      return getChapters;
    }() // 获取每日论语
  }, {
    key: "getDailyAnalect",
    value: function () {
      var _getDailyAnalect = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9() {
        var data, randomIndex, _t4;
        return _regenerator().w(function (_context9) {
          while (1) switch (_context9.p = _context9.n) {
            case 0:
              _context9.p = 0;
              _context9.n = 1;
              return this.apiRequest('analects_entries_expanded', {
                select: 'chapter,section_number,original_text,translation',
                'show_in_daily': 'eq.true'
              });
            case 1:
              data = _context9.v;
              if (!(data.length === 0)) {
                _context9.n = 2;
                break;
              }
              return _context9.a(2, null);
            case 2:
              randomIndex = Math.floor(Math.random() * data.length);
              return _context9.a(2, data[randomIndex]);
            case 3:
              _context9.p = 3;
              _t4 = _context9.v;
              console.error('获取每日论语失败:', _t4);
              throw _t4;
            case 4:
              return _context9.a(2);
          }
        }, _callee9, this, [[0, 3]]);
      }));
      function getDailyAnalect() {
        return _getDailyAnalect.apply(this, arguments);
      }
      return getDailyAnalect;
    }() // 高级搜索
  }, {
    key: "advancedSearch",
    value: function () {
      var _advancedSearch = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee0() {
        var filters,
          result,
          _args0 = arguments;
        return _regenerator().w(function (_context0) {
          while (1) switch (_context0.n) {
            case 0:
              filters = _args0.length > 0 && _args0[0] !== undefined ? _args0[0] : {};
              _context0.n = 1;
              return this.fetchAnalects(filters, 0, 1000);
            case 1:
              result = _context0.v;
              return _context0.a(2, result.data);
          }
        }, _callee0, this);
      }));
      function advancedSearch() {
        return _advancedSearch.apply(this, arguments);
      }
      return advancedSearch;
    }() // 格式化日期
  }, {
    key: "formatDate",
    value: function formatDate() {
      var date = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date();
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      var day = date.getDate();
      var weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      var weekday = weekdays[date.getDay()];
      return {
        full: "".concat(year, "\u5E74").concat(month, "\u6708").concat(day, "\u65E5"),
        weekday: weekday,
        iso: date.toISOString().split('T')[0]
      };
    }

    // 生成分享链接
  }, {
    key: "generateShareLinks",
    value: function generateShareLinks(entry) {
      var currentUrl = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window.location.href;
      var text = "\u6BCF\u65E5\u8BBA\u8BED\uFF1A".concat(entry.original_text);
      var url = currentUrl;
      return {
        twitter: "https://twitter.com/intent/tweet?text=".concat(encodeURIComponent(text), "&url=").concat(encodeURIComponent(url)),
        facebook: "https://www.facebook.com/sharer/sharer.php?u=".concat(encodeURIComponent(url)),
        copy: text + ' - ' + url,
        email: "mailto:?subject=".concat(encodeURIComponent('每日论语分享'), "&body=").concat(encodeURIComponent(text + ' - ' + url))
      };
    }

    // 复制到剪贴板
  }, {
    key: "copyToClipboard",
    value: function () {
      var _copyToClipboard = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee1(text) {
        var textArea, successful, _t5;
        return _regenerator().w(function (_context1) {
          while (1) switch (_context1.p = _context1.n) {
            case 0:
              _context1.p = 0;
              if (!navigator.clipboard) {
                _context1.n = 2;
                break;
              }
              _context1.n = 1;
              return navigator.clipboard.writeText(text);
            case 1:
              return _context1.a(2, true);
            case 2:
              textArea = document.createElement('textarea');
              textArea.value = text;
              Object.assign(textArea.style, {
                position: 'fixed',
                left: '-999999px',
                top: '-999999px'
              });
              document.body.appendChild(textArea);
              textArea.focus();
              textArea.select();
              successful = document.execCommand('copy');
              document.body.removeChild(textArea);
              return _context1.a(2, successful);
            case 3:
              _context1.n = 5;
              break;
            case 4:
              _context1.p = 4;
              _t5 = _context1.v;
              console.error('复制失败:', _t5);
              return _context1.a(2, false);
            case 5:
              return _context1.a(2);
          }
        }, _callee1, null, [[0, 4]]);
      }));
      function copyToClipboard(_x4) {
        return _copyToClipboard.apply(this, arguments);
      }
      return copyToClipboard;
    }() // 渲染论语卡片
  }, {
    key: "renderAnalectCard",
    value: function renderAnalectCard(entry, container) {
      if (!container) {
        console.error('未找到容器元素');
        return;
      }
      var card = document.createElement('div');
      card.className = 'analects-result-card';
      card.innerHTML = this.generateResultCardHTML(entry);
      container.appendChild(card);
      setTimeout(function () {
        return card.classList.add('animate-in');
      }, 10);
    }

    // 生成结果卡片HTML
  }, {
    key: "generateResultCardHTML",
    value: function generateResultCardHTML(entry) {
      var _this$currentFilters,
        _this3 = this;
      var currentKeyword = ((_this$currentFilters = this.currentFilters) === null || _this$currentFilters === void 0 ? void 0 : _this$currentFilters.keyword) || '';
      var getRelatedData = function getRelatedData(items, field) {
        return (items || []).map(function (item) {
          var _item$field, _item$field2, _item$field3;
          return ((_item$field = item[field]) === null || _item$field === void 0 ? void 0 : _item$field.name) || ((_item$field2 = item[field]) === null || _item$field2 === void 0 ? void 0 : _item$field2.title) || ((_item$field3 = item[field]) === null || _item$field3 === void 0 ? void 0 : _item$field3.content);
        }).filter(Boolean);
      };
      var characters = getRelatedData(entry.entry_characters, 'characters');
      var argumentsList = getRelatedData(entry.entry_arguments, 'arguments');
      var proverbs = getRelatedData(entry.entry_proverbs, 'proverbs');
      var createTagGroup = function createTagGroup(label, items, className) {
        return items.length > 0 ? "\n        <div class=\"analects-result-tag-group\">\n          <span class=\"analects-result-tag-label\">".concat(label, ":</span>\n          ").concat(items.map(function (item) {
          return "<span class=\"analects-result-tag ".concat(className, "\">").concat(_this3.escapeHtml(item), "</span>");
        }).join(''), "\n        </div>\n      ") : '';
      };
      var highlightedOriginal = this.highlightKeywords(entry.original_text, currentKeyword);
      var highlightedTranslation = entry.translation ? this.highlightKeywords(entry.translation, currentKeyword) : '';
      var highlightedAnnotation = entry.annotation ? this.highlightKeywords(entry.annotation, currentKeyword) : '';
      return "\n      <div class=\"analects-result-header\">\n        <span class=\"analects-result-chapter\">".concat(this.escapeHtml(entry.chapter || ''), "</span>\n        <span class=\"analects-result-section\">\u7B2C").concat(this.escapeHtml(entry.section_number || ''), "\u8282</span>\n      </div>\n    \n      <div class=\"analects-result-content\">\n        <div class=\"analects-result-original\">").concat(highlightedOriginal, "</div>\n        ").concat(highlightedTranslation ? "<div class=\"analects-result-translation\">".concat(highlightedTranslation, "</div>") : '', "\n        ").concat(highlightedAnnotation ? "<div class=\"analects-result-annotation\">".concat(highlightedAnnotation, "</div>") : '', "\n      </div>\n\n      <div class=\"analects-result-tags\">\n        ").concat(createTagGroup('人物', characters, 'character'), "\n        ").concat(createTagGroup('论点', argumentsList, 'argument'), "\n        ").concat(createTagGroup('谚语', proverbs, 'proverb'), "\n      </div>\n    ");
    }

    // 渲染搜索界面
  }, {
    key: "renderSearchInterface",
    value: function renderSearchInterface(container) {
      if (!container) {
        console.error('未找到容器元素');
        return;
      }
      container.innerHTML = this.getSearchInterfaceHTML();
      this.initializeSearchEvents();
      this.loadSearchOptions();
      this.initializeScrollFeatures();
      this.isSearchInitialized = true;
    }

    // 获取搜索界面HTML
  }, {
    key: "getSearchInterfaceHTML",
    value: function getSearchInterfaceHTML() {
      return "\n      <div class=\"analects-search\">\n        <div class=\"analects-search-header\">\n          <h1 class=\"analects-search-title\">\u8BBA\u8BED\u641C\u7D22</h1>\n          <p class=\"analects-search-subtitle\">Search in the Analects of Confucius</p>\n        </div>\n\n        <div class=\"analects-search-form\">\n          <div class=\"analects-keyword-section\">\n            <label class=\"analects-keyword-label\" for=\"analects-keyword\">\uD83D\uDD0D \u5173\u952E\u8BCD\u641C\u7D22</label>\n            <input type=\"text\" id=\"analects-keyword\" class=\"analects-input\" \n                   placeholder=\"\u8F93\u5165\u5173\u952E\u8BCD\u641C\u7D22\u8BBA\u8BED\u539F\u6587\u3001\u7FFB\u8BD1\u6216\u6CE8\u91CA... \u6309\u56DE\u8F66\u6216\u70B9\u51FB\u5F00\u59CB\u641C\u7D22\">\n            \n            <div class=\"analects-selected-items\" id=\"selected-items-container\" style=\"display: none;\">\n              <h4>\u5DF2\u9009\u62E9\u7684\u641C\u7D22\u6761\u4EF6</h4>\n              <div class=\"analects-selected-tags\" id=\"selected-tags-container\">\n                <div class=\"analects-selected-empty\">\u6682\u65E0\u9009\u62E9\u7684\u641C\u7D22\u6761\u4EF6</div>\n              </div>\n            </div>\n          </div>\n\n          <div class=\"analects-advanced-filters\">\n            <h3 class=\"analects-advanced-title\">\u9AD8\u7EA7\u641C\u7D22</h3>\n            \n            ".concat(this.createSearchSection('chapter', '章节', 'single-column'), "\n            \n            <div class=\"analects-filters-grid\">\n              ").concat(this.createSearchSection('character', '人物'), "\n              ").concat(this.createSearchSection('argument', '论点'), "\n            </div>\n\n            <div class=\"analects-filters-grid\" style=\"margin-top: 24px;\">\n              ").concat(this.createSearchSection('proverb', '谚语', 'full-width'), "\n            </div>\n          </div>\n\n          <div class=\"analects-search-actions\">\n            <button id=\"analects-search-btn\" class=\"analects-btn\">\uD83D\uDD0D \u5F00\u59CB\u641C\u7D22</button>\n            <button id=\"analects-reset-btn\" class=\"analects-btn analects-btn-clear\">\uD83D\uDD04 \u91CD\u7F6E\u641C\u7D22</button>\n          </div>\n        </div>\n        \n        <div id=\"analects-search-status\" class=\"analects-search-status\"></div>\n\n        <div class=\"analects-results\">\n          <div id=\"analects-results-container\" class=\"analects-results-container\"></div>\n          <div id=\"analects-loading-more\" style=\"display:none; text-align:center; margin:10px; color:#666;\">\n            \u52A0\u8F7D\u4E2D...\n          </div>\n          <div id=\"analects-load-complete\" style=\"display:none; text-align:center; margin:20px; color:#888;\">\n            \u2014\u2014 \u2728 \u5DF2\u5168\u90E8\u663E\u793A\u5B8C\u6BD5 \u2728 \u2014\u2014\n          </div>\n        </div>\n\n        <div id=\"scroll-to-top\" class=\"analects-scroll-indicator\">\u2191</div>\n      </div>\n    ");
    }

    // 创建搜索区域HTML
  }, {
    key: "createSearchSection",
    value: function createSearchSection(type, title) {
      var className = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
      var types = {
        chapter: 'chapters',
        character: 'characters',
        argument: 'arguments',
        proverb: 'proverbs'
      };
      var containerClass = className === 'single-column' ? 'analects-filters-grid single-column' : className === 'full-width' ? 'analects-filter-section' : 'analects-filter-section';
      var wrapperStyle = className === 'full-width' ? 'style="grid-column: 1 / -1;"' : '';
      return "\n      <div class=\"".concat(containerClass, "\" ").concat(wrapperStyle, ">\n        <div class=\"analects-filter-section\">\n          <div class=\"analects-filter-header\">\n            <h4 class=\"analects-filter-title ").concat(types[type], "\">").concat(title, "</h4>\n            <span class=\"analects-filter-count\" id=\"").concat(type, "-count\">0</span>\n          </div>\n          <div class=\"analects-filter-search\">\n            <input type=\"text\" id=\"").concat(type, "-search\" placeholder=\"\u641C\u7D22").concat(title.replace('搜索', ''), "...\">\n          </div>\n          <div id=\"").concat(type, "-filters\" class=\"analects-filter-options\">\n            <div class=\"analects-loading\">\u52A0\u8F7D\u4E2D...</div>\n          </div>\n        </div>\n      </div>\n    ");
    }

    // 渲染每日论语组件
  }, {
    key: "renderDailyAnalect",
    value: function renderDailyAnalect(container) {
      var _this4 = this;
      if (!container) {
        console.error('未找到容器元素');
        return;
      }
      container.innerHTML = '<div class="analects-loading">加载每日论语...</div>';
      this.getDailyAnalect().then(function (entry) {
        if (!entry) {
          container.innerHTML = '<div class="analects-daily-empty">暂无每日论语</div>';
          return;
        }
        var dateInfo = _this4.formatDate();
        var shareLinks = _this4.generateShareLinks(entry);
        container.innerHTML = _this4.getDailyAnalectHTML(entry, dateInfo, shareLinks);
      }).catch(function (error) {
        console.error('渲染每日论语失败:', error);
        container.innerHTML = '<div class="analects-daily-error">加载每日论语失败，请检查配置</div>';
      });
    }

    // 获取每日论语HTML
  }, {
    key: "getDailyAnalectHTML",
    value: function getDailyAnalectHTML(entry, dateInfo, shareLinks) {
      return "\n      <div class=\"analects-daily\">\n        <div class=\"analects-daily-header\">\n          <h1 class=\"analects-daily-title\">\u6BCF\u65E5\u8BBA\u8BED</h1>\n          <p class=\"analects-daily-subtitle\">Daily Analects of Confucius</p>\n          <div class=\"analects-daily-date\">".concat(dateInfo.full, " \xB7 ").concat(dateInfo.weekday, "</div>\n        </div>\n\n        <div class=\"analects-daily-card\">\n          <div class=\"analects-daily-original\">").concat(entry.original_text, "</div>\n          ").concat(entry.translation ? "<div class=\"analects-daily-translation\">".concat(entry.translation, "</div>") : '', "\n          <div class=\"analects-daily-reference\">").concat(entry.chapter, " \xB7 \u7B2C").concat(entry.section_number || '', "\u8282</div>\n        </div>\n\n        <div class=\"analects-daily-share\">\n          <span class=\"analects-daily-share-label\">\u5206\u4EAB\uFF1A</span>\n          <div class=\"analects-share-buttons\">\n            ").concat(this.createShareButton('twitter', shareLinks.twitter, '分享到 Twitter'), "\n            ").concat(this.createShareButton('facebook', shareLinks.facebook, '分享到 Facebook', true), "\n            ").concat(this.createShareButton('copy', null, '复制分享内容', false, shareLinks.copy), "\n            ").concat(this.createShareButton('email', shareLinks.email, '通过邮件分享'), "\n          </div>\n        </div>\n      </div>\n    ");
    }

    // 创建分享按钮
  }, {
    key: "createShareButton",
    value: function createShareButton(type, href, title) {
      var popup = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      var copyText = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
      var icons = {
        twitter: '<path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>',
        facebook: '<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>',
        copy: '<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>',
        email: '<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>'
      };
      if (type === 'copy') {
        return "\n        <button class=\"analects-share-btn copy\" \n                onclick=\"window.AnalectsSDK.copyText('".concat(copyText.replace(/'/g, "\\'"), "', this)\"\n                title=\"").concat(title, "\">\n          <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"currentColor\">").concat(icons[type], "</svg>\n        </button>\n      ");
      }
      var popupHandler = popup ? "onclick=\"return window.open(this.href, '".concat(type, "-share', 'width=626,height=436,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes')\"") : '';
      return "\n      <a href=\"".concat(href, "\" class=\"analects-share-btn ").concat(type, "\" target=\"_blank\" rel=\"noopener noreferrer\" \n         ").concat(popupHandler, " title=\"").concat(title, "\">\n        <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"currentColor\">").concat(icons[type], "</svg>\n      </a>\n    ");
    }

    // 初始化搜索事件
  }, {
    key: "initializeSearchEvents",
    value: function initializeSearchEvents() {
      var _this5 = this;
      var eventMap = {
        'analects-search-btn': function analectsSearchBtn() {
          return _this5.performSearch();
        },
        'analects-reset-btn': function analectsResetBtn() {
          return _this5.resetSearch();
        }
      };
      Object.entries(eventMap).forEach(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
          id = _ref2[0],
          handler = _ref2[1];
        var element = document.getElementById(id);
        if (element) element.addEventListener('click', handler);
      });

      // 回车键搜索
      var keywordInput = document.getElementById('analects-keyword');
      if (keywordInput) {
        keywordInput.addEventListener('keypress', function (e) {
          if (e.key === 'Enter') _this5.performSearch();
        });
        keywordInput.addEventListener('input', function () {
          _this5.markSearchConditionsChanged();
        });
      }

      // 实时搜索过滤器
      ['character', 'argument', 'proverb', 'chapter'].forEach(function (type) {
        var searchInput = document.getElementById("".concat(type, "-search"));
        if (searchInput) {
          searchInput.addEventListener('input', function (e) {
            _this5.filterOptions(type, e.target.value);
          });
        }
      });
    }

    // 标记搜索条件已改变
  }, {
    key: "markSearchConditionsChanged",
    value: function markSearchConditionsChanged() {
      this.searchConditionsChanged = true;
      var searchBtn = document.getElementById('analects-search-btn');
      if (searchBtn && this.searchConditionsChanged) {
        searchBtn.classList.add('search-changed');
      }
    }

    // 初始化滚动功能
  }, {
    key: "initializeScrollFeatures",
    value: function initializeScrollFeatures() {
      var scrollToTopBtn = document.getElementById('scroll-to-top');
      if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', function () {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        });
        window.addEventListener('scroll', function () {
          scrollToTopBtn.classList.toggle('visible', window.scrollY > 300);
        });
      }
      this.setupAutoLoad();
    }

    // 设置自动加载功能
  }, {
    key: "setupAutoLoad",
    value: function setupAutoLoad() {
      var _this6 = this;
      // 如果之前存在监听器，先从 window 移除
      if (this.scrollListener) {
        window.removeEventListener('scroll', this.scrollListener);
      }
      this.scrollListener = function () {
        // 检查是否应该加载
        if (!_this6.isAutoLoadingEnabled || _this6.pagination.isLoading || !_this6.pagination.hasMore || _this6.pagination.totalLoaded === 0) {
          return;
        }

        // 获取结果容器元素
        var resultsContainer = document.getElementById('analects-results-container');
        if (!resultsContainer) {
          return; // 如果容器不存在，则不执行任何操作
        }

        // 关键修改：检查 resultsContainer 元素的位置
        var rect = resultsContainer.getBoundingClientRect();

        // 当结果容器的底部进入视口，并且距离视口底部小于等于 200px 时，加载更多
        // rect.bottom 是容器底部相对于视口顶部的距离
        // window.innerHeight 是视口的高度
        if (rect.bottom <= window.innerHeight + 200) {
          _this6.loadMoreResults();
        }
      };

      // 监听器仍然绑定在 window 对象上
      window.addEventListener('scroll', this.scrollListener, {
        passive: true
      });
    }

    // 加载搜索选项
  }, {
    key: "loadSearchOptions",
    value: function () {
      var _loadSearchOptions = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee10() {
        var _this7 = this;
        var statusDiv, _yield$Promise$all, _yield$Promise$all2, characters, argumentsList, proverbs, chapters, searchData, _t6;
        return _regenerator().w(function (_context10) {
          while (1) switch (_context10.p = _context10.n) {
            case 0:
              _context10.p = 0;
              statusDiv = document.getElementById('analects-search-status');
              if (statusDiv) {
                statusDiv.innerHTML = '<div class="analects-info">📄 加载搜索选项...</div>';
              }
              _context10.n = 1;
              return Promise.all([this.getCharacters(), this.getArguments(), this.getProverbs(), this.getChapters()]);
            case 1:
              _yield$Promise$all = _context10.v;
              _yield$Promise$all2 = _slicedToArray(_yield$Promise$all, 4);
              characters = _yield$Promise$all2[0];
              argumentsList = _yield$Promise$all2[1];
              proverbs = _yield$Promise$all2[2];
              chapters = _yield$Promise$all2[3];
              searchData = {
                character: characters,
                argument: argumentsList,
                proverb: proverbs,
                chapter: chapters
              };
              Object.entries(searchData).forEach(function (_ref3) {
                var _ref4 = _slicedToArray(_ref3, 2),
                  type = _ref4[0],
                  data = _ref4[1];
                _this7.updateSearchCount(type, data.length);
                _this7.renderSearchOptions("".concat(type, "-filters"), data, type);
              });
              if (statusDiv) {
                statusDiv.innerHTML = '<div class="analects-success">✅ 搜索选项加载完成</div>';
                setTimeout(function () {
                  return statusDiv.innerHTML = '';
                }, 2000);
              }
              _context10.n = 3;
              break;
            case 2:
              _context10.p = 2;
              _t6 = _context10.v;
              console.error('加载搜索选项失败:', _t6);
              this.showSearchLoadError(_t6);
            case 3:
              return _context10.a(2);
          }
        }, _callee10, this, [[0, 2]]);
      }));
      function loadSearchOptions() {
        return _loadSearchOptions.apply(this, arguments);
      }
      return loadSearchOptions;
    }() // 显示搜索加载错误
  }, {
    key: "showSearchLoadError",
    value: function showSearchLoadError(error) {
      var statusDiv = document.getElementById('analects-search-status');
      if (statusDiv) {
        statusDiv.innerHTML = '<div class="analects-error">❌ 加载搜索选项失败，请检查配置</div>';
      }
      ['character', 'argument', 'proverb', 'chapter'].forEach(function (type) {
        var container = document.getElementById("".concat(type, "-filters"));
        if (container) {
          container.innerHTML = '<div class="analects-no-options">数据加载失败</div>';
        }
      });
    }

    // 更新搜索计数
  }, {
    key: "updateSearchCount",
    value: function updateSearchCount(type, count) {
      var countElement = document.getElementById("".concat(type, "-count"));
      if (countElement) {
        countElement.textContent = count;
      }
    }

    // 渲染搜索选项
  }, {
    key: "renderSearchOptions",
    value: function renderSearchOptions(containerId, options, type) {
      var _this8 = this;
      var container = document.getElementById(containerId);
      if (!container || !Array.isArray(options)) {
        console.error('渲染搜索选项失败:', {
          containerId: containerId,
          options: options,
          type: type
        });
        if (container) {
          container.innerHTML = '<div class="analects-no-options">数据格式错误</div>';
        }
        return;
      }
      if (options.length === 0) {
        container.innerHTML = '<div class="analects-no-options">暂无选项</div>';
        return;
      }
      var tagCloud = document.createElement('div');
      tagCloud.className = 'analects-tag-cloud';
      tagCloud.setAttribute('data-type', type);

      // 为章节添加"全部"选项
      if (type === 'chapter') {
        var allTag = this.createOptionTag('all', '全部章节', type, true);
        tagCloud.appendChild(allTag);
        this.selectedItems.chapter = {
          id: 'all',
          name: '全部章节'
        };
      }
      options.forEach(function (option) {
        if (!option || !option.id && option.id !== 0) {
          console.warn('选项缺少id:', option);
          return;
        }
        var displayName = option.name || option.title || option.content || "\u9009\u9879".concat(option.id);
        var tag = _this8.createOptionTag(option.id, displayName, type, false);
        tagCloud.appendChild(tag);
      });
      container.innerHTML = '';
      container.appendChild(tagCloud);
    }

    // 创建选项标签
  }, {
    key: "createOptionTag",
    value: function createOptionTag(id, displayName, type) {
      var _this9 = this;
      var isSelected = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      var tag = document.createElement('label');
      tag.className = "analects-option-tag ".concat(isSelected ? 'selected' : '');
      tag.setAttribute('data-id', id);
      tag.setAttribute('data-name', displayName.toLowerCase());
      tag.innerHTML = "\n      <input type=\"checkbox\" value=\"".concat(id, "\" data-type=\"").concat(type, "\" ").concat(isSelected ? 'checked' : '', ">\n      <span>").concat(displayName, "</span>\n    ");
      tag.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        _this9.handleOptionClick(tag, type, id, displayName);
      });
      return tag;
    }

    // 处理选项点击
  }, {
    key: "handleOptionClick",
    value: function handleOptionClick(tag, type, id, displayName) {
      var checkbox = tag.querySelector('input[type="checkbox"]');
      var tagCloud = tag.closest('.analects-tag-cloud');
      if (type === 'chapter') {
        // 章节单选逻辑
        tagCloud.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
          cb.checked = false;
          cb.closest('.analects-option-tag').classList.remove('selected');
        });
        checkbox.checked = true;
        tag.classList.add('selected');
        this.selectedItems.chapter = {
          id: id,
          name: displayName
        };
      } else {
        // 其他类型多选逻辑
        var wasChecked = checkbox.checked;
        checkbox.checked = !wasChecked;
        tag.classList.toggle('selected', checkbox.checked);
        if (checkbox.checked) {
          this.addSelectedItem(type, id, displayName);
        } else {
          this.removeSelectedItem(type, id);
        }
      }
      this.markSearchConditionsChanged();
      this.renderSelectedItems();
    }

    // 选中项目管理方法
  }, {
    key: "addSelectedItem",
    value: function addSelectedItem(type, id, name) {
      var key = type + 's';
      this.selectedItems[key].set(parseInt(id), name);
    }
  }, {
    key: "removeSelectedItem",
    value: function removeSelectedItem(type, id) {
      var key = type + 's';
      this.selectedItems[key].delete(parseInt(id));
    }

    // 渲染已选择的项目
  }, {
    key: "renderSelectedItems",
    value: function renderSelectedItems() {
      var _this0 = this;
      var selectedContainer = document.getElementById('selected-items-container');
      var tagsContainer = document.getElementById('selected-tags-container');
      if (!selectedContainer || !tagsContainer) return;
      var totalSelected = this.selectedItems.characters.size + this.selectedItems.arguments.size + this.selectedItems.proverbs.size + (this.selectedItems.chapter && this.selectedItems.chapter.id !== 'all' ? 1 : 0);
      if (totalSelected === 0) {
        selectedContainer.style.display = 'none';
        return;
      }
      selectedContainer.style.display = 'block';
      tagsContainer.innerHTML = '';

      // 渲染章节标签（仅当不是"全部"时）
      if (this.selectedItems.chapter && this.selectedItems.chapter.id !== 'all') {
        var tag = this.createSelectedTag('chapter', this.selectedItems.chapter.id, this.selectedItems.chapter.name);
        tagsContainer.appendChild(tag);
      }

      // 渲染其他类型的标签
      ['characters', 'arguments', 'proverbs'].forEach(function (type) {
        _this0.selectedItems[type].forEach(function (name, id) {
          var tag = _this0.createSelectedTag(type.slice(0, -1), id, name);
          tagsContainer.appendChild(tag);
        });
      });
    }

    // 创建已选择的标签
  }, {
    key: "createSelectedTag",
    value: function createSelectedTag(type, id, name) {
      var _this1 = this;
      var tag = document.createElement('div');
      tag.className = "analects-selected-tag ".concat(type);
      tag.innerHTML = "\n      <span>".concat(name, "</span>\n      <span class=\"remove-tag\" data-type=\"").concat(type, "\" data-id=\"").concat(id, "\">\xD7</span>\n    ");
      tag.querySelector('.remove-tag').addEventListener('click', function (e) {
        e.stopPropagation();
        _this1.removeSelectedItemById(type, id);
      });
      return tag;
    }

    // 通过ID移除选中项目
  }, {
    key: "removeSelectedItemById",
    value: function removeSelectedItemById(type, id) {
      if (type === 'chapter') {
        this.selectedItems.chapter = {
          id: 'all',
          name: '全部章节'
        };
        var allCheckbox = document.querySelector('input[data-type="chapter"][value="all"]');
        var currentCheckbox = document.querySelector("input[data-type=\"chapter\"][value=\"".concat(id, "\"]"));
        if (allCheckbox) {
          allCheckbox.checked = true;
          allCheckbox.closest('.analects-option-tag').classList.add('selected');
        }
        if (currentCheckbox) {
          currentCheckbox.checked = false;
          currentCheckbox.closest('.analects-option-tag').classList.remove('selected');
        }
      } else {
        this.removeSelectedItem(type, id);
        var checkbox = document.querySelector("input[data-type=\"".concat(type, "\"][value=\"").concat(id, "\"]"));
        if (checkbox) {
          checkbox.checked = false;
          var tag = checkbox.closest('.analects-option-tag');
          if (tag) {
            tag.classList.remove('selected');
          }
        }
      }
      this.markSearchConditionsChanged();
      this.renderSelectedItems();
    }

    // 过滤选项
  }, {
    key: "filterOptions",
    value: function filterOptions(type, searchTerm) {
      var container = document.getElementById("".concat(type, "-filters"));
      if (!container) return;
      var tags = container.querySelectorAll('.analects-option-tag');
      var term = searchTerm.toLowerCase().trim();
      var visibleCount = 0;
      tags.forEach(function (tag) {
        var name = tag.getAttribute('data-name');
        var shouldShow = !term || name.includes(term);
        tag.style.display = shouldShow ? 'inline-flex' : 'none';
        if (shouldShow) visibleCount++;
      });
      var countElement = document.getElementById("".concat(type, "-count"));
      if (countElement) {
        var totalCount = tags.length;
        countElement.textContent = term ? "".concat(visibleCount, "/").concat(totalCount) : totalCount;
      }
    }

    // 执行搜索
  }, {
    key: "performSearch",
    value: function () {
      var _performSearch = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee11() {
        var _document$getElementB, _this$selectedItems$c, _this$selectedItems$c2;
        var keyword, resultsContainer, statusDiv, loadCompleteDiv, loadingMoreDiv, selectedCharacters, selectedArguments, selectedProverbs, selectedChapter, searchBtn, result, _t7;
        return _regenerator().w(function (_context11) {
          while (1) switch (_context11.p = _context11.n) {
            case 0:
              if (this.isSearchInitialized) {
                _context11.n = 1;
                break;
              }
              return _context11.a(2);
            case 1:
              keyword = (_document$getElementB = document.getElementById('analects-keyword')) === null || _document$getElementB === void 0 ? void 0 : _document$getElementB.value;
              resultsContainer = document.getElementById('analects-results-container');
              statusDiv = document.getElementById('analects-search-status');
              loadCompleteDiv = document.getElementById('analects-load-complete');
              loadingMoreDiv = document.getElementById('analects-loading-more');
              if (resultsContainer) {
                _context11.n = 2;
                break;
              }
              return _context11.a(2);
            case 2:
              selectedCharacters = Array.from(this.selectedItems.characters.keys());
              selectedArguments = Array.from(this.selectedItems.arguments.keys());
              selectedProverbs = Array.from(this.selectedItems.proverbs.keys());
              selectedChapter = ((_this$selectedItems$c = this.selectedItems.chapter) === null || _this$selectedItems$c === void 0 ? void 0 : _this$selectedItems$c.id) === 'all' ? 'all' : ((_this$selectedItems$c2 = this.selectedItems.chapter) === null || _this$selectedItems$c2 === void 0 ? void 0 : _this$selectedItems$c2.id) || 'all';
              this.currentFilters = {
                keyword: keyword === null || keyword === void 0 ? void 0 : keyword.trim(),
                characterIds: selectedCharacters,
                argumentIds: selectedArguments,
                proverbIds: selectedProverbs,
                chapter: selectedChapter
              };
              this.resetPagination();
              this.searchConditionsChanged = false;
              this.isAutoLoadingEnabled = false;
              searchBtn = document.getElementById('analects-search-btn');
              if (searchBtn) {
                searchBtn.classList.remove('search-changed');
              }
              if (loadCompleteDiv) loadCompleteDiv.style.display = 'none';
              if (loadingMoreDiv) loadingMoreDiv.style.display = 'none';
              if (statusDiv) statusDiv.innerHTML = '<div class="analects-info">🔍 搜索中...</div>';
              resultsContainer.innerHTML = '';
              _context11.p = 3;
              _context11.n = 4;
              return this.fetchAnalects(this.currentFilters, 0, this.pagination.pageSize);
            case 4:
              result = _context11.v;
              this.isAutoLoadingEnabled = true;
              this.handleFirstSearchResult(result, statusDiv, resultsContainer);
              _context11.n = 6;
              break;
            case 5:
              _context11.p = 5;
              _t7 = _context11.v;
              console.error('搜索失败:', _t7);
              this.handleSearchError(_t7, statusDiv, resultsContainer);
            case 6:
              return _context11.a(2);
          }
        }, _callee11, this, [[3, 5]]);
      }));
      function performSearch() {
        return _performSearch.apply(this, arguments);
      }
      return performSearch;
    }() // 处理首次搜索结果
  }, {
    key: "handleFirstSearchResult",
    value: function () {
      var _handleFirstSearchResult = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee12(result, statusDiv, resultsContainer) {
        var _this10 = this;
        var uniqueResults, totalCount, loadCompleteDiv;
        return _regenerator().w(function (_context12) {
          while (1) switch (_context12.n) {
            case 0:
              if (!(result.data.length === 0)) {
                _context12.n = 1;
                break;
              }
              if (statusDiv) {
                statusDiv.innerHTML = '<div class="analects-warning">⚠️ 未找到匹配的章节</div>';
              }
              this.isAutoLoadingEnabled = false;
              return _context12.a(2);
            case 1:
              uniqueResults = result.data.filter(function (entry) {
                if (!entry.id || _this10.pagination.loadedIds.has(entry.id)) {
                  return false;
                }
                _this10.pagination.loadedIds.add(entry.id);
                return true;
              });
              this.pagination.currentPage = 1;
              this.pagination.totalLoaded = uniqueResults.length;
              this.pagination.hasMore = this.pagination.totalLoaded < this.pagination.totalCount;
              if (statusDiv) {
                totalCount = this.pagination.totalCount > 0 ? this.pagination.totalCount : uniqueResults.length;
                if (this.pagination.hasMore) {
                  statusDiv.innerHTML = "<div class=\"analects-success\">\u2705 \u627E\u5230 ".concat(totalCount, " \u6761\u7ED3\u679C\uFF0C\u6BCF\u6B21\u52A0\u8F7D ").concat(this.pagination.pageSize, " \u6761\uFF0C\u6EDA\u52A8\u81EA\u52A8\u52A0\u8F7D\u66F4\u591A</div>");
                } else {
                  statusDiv.innerHTML = "<div class=\"analects-success\">\u2705 \u5DF2\u627E\u5230\u5168\u90E8 ".concat(totalCount, " \u6761\u7ED3\u679C</div>");
                  loadCompleteDiv = document.getElementById('analects-load-complete');
                  if (loadCompleteDiv) {
                    loadCompleteDiv.style.display = 'block';
                  }
                }
              }
              uniqueResults.forEach(function (entry, index) {
                setTimeout(function () {
                  _this10.renderAnalectCard(entry, resultsContainer);
                }, index * 50);
              });
            case 2:
              return _context12.a(2);
          }
        }, _callee12, this);
      }));
      function handleFirstSearchResult(_x5, _x6, _x7) {
        return _handleFirstSearchResult.apply(this, arguments);
      }
      return handleFirstSearchResult;
    }() // 重置分页参数
  }, {
    key: "resetPagination",
    value: function resetPagination() {
      Object.assign(this.pagination, {
        currentPage: 0,
        totalLoaded: 0,
        hasMore: true,
        isLoading: false,
        totalCount: 0
      });
      this.pagination.loadedIds.clear();
    }

    // 处理搜索错误
  }, {
    key: "handleSearchError",
    value: function handleSearchError(error, statusDiv, resultsContainer) {
      if (statusDiv) {
        statusDiv.innerHTML = "<div class=\"analects-error\">\u274C \u641C\u7D22\u5931\u8D25\uFF1A".concat(error.message, "</div>");
      }
      resultsContainer.innerHTML = "\n      <div class=\"analects-error\">\n        <h3>\u641C\u7D22\u5931\u8D25</h3>\n        <p>".concat(error.message, "</p>\n        <p style=\"font-size: 14px; color: #666; margin-top: 12px;\">\n          \u8BF7\u68C0\u67E5Supabase\u914D\u7F6E\u662F\u5426\u6B63\u786E\uFF0C\u6216\u67E5\u770B\u63A7\u5236\u53F0\u4E86\u89E3\u8BE6\u7EC6\u9519\u8BEF\u4FE1\u606F\u3002\n        </p>\n      </div>\n    ");
      this.isAutoLoadingEnabled = false;
    }

    // 滚动加载更多
  }, {
    key: "loadMoreResults",
    value: function () {
      var _loadMoreResults = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee13() {
        var _this11 = this;
        var loadingMoreDiv, result, uniqueResults, resultsContainer, statusDiv, _t8;
        return _regenerator().w(function (_context13) {
          while (1) switch (_context13.p = _context13.n) {
            case 0:
              if (!(this.pagination.isLoading || !this.pagination.hasMore || !this.isAutoLoadingEnabled)) {
                _context13.n = 1;
                break;
              }
              return _context13.a(2);
            case 1:
              this.pagination.isLoading = true;
              loadingMoreDiv = document.getElementById('analects-loading-more');
              if (loadingMoreDiv) loadingMoreDiv.style.display = 'block';
              _context13.p = 2;
              _context13.n = 3;
              return this.fetchAnalects(this.currentFilters, this.pagination.currentPage, this.pagination.pageSize);
            case 3:
              result = _context13.v;
              uniqueResults = result.data.filter(function (entry) {
                if (!entry.id || _this11.pagination.loadedIds.has(entry.id)) {
                  return false;
                }
                _this11.pagination.loadedIds.add(entry.id);
                return true;
              });
              resultsContainer = document.getElementById('analects-results-container');
              uniqueResults.forEach(function (entry, index) {
                setTimeout(function () {
                  _this11.renderAnalectCard(entry, resultsContainer);
                }, index * 50);
              });
              this.pagination.currentPage++;
              this.pagination.totalLoaded += uniqueResults.length;
              this.pagination.hasMore = this.pagination.totalLoaded < this.pagination.totalCount;
              this.updateScrollStatus();
              _context13.n = 5;
              break;
            case 4:
              _context13.p = 4;
              _t8 = _context13.v;
              console.error('加载更多结果失败:', _t8);
              statusDiv = document.getElementById('analects-search-status');
              if (statusDiv) {
                statusDiv.innerHTML = '<div class="analects-error">❌ 加载更多结果失败，请稍后重试</div>';
              }
            case 5:
              _context13.p = 5;
              this.pagination.isLoading = false;
              if (loadingMoreDiv) loadingMoreDiv.style.display = 'none';
              return _context13.f(5);
            case 6:
              return _context13.a(2);
          }
        }, _callee13, this, [[2, 4, 5, 6]]);
      }));
      function loadMoreResults() {
        return _loadMoreResults.apply(this, arguments);
      }
      return loadMoreResults;
    }() // 滚动加载时的状态更新
  }, {
    key: "updateScrollStatus",
    value: function updateScrollStatus() {
      var statusDiv = document.getElementById('analects-search-status');
      var loadCompleteDiv = document.getElementById('analects-load-complete');
      if (!statusDiv || this.pagination.totalLoaded === 0) return;
      var displayedCount = this.pagination.totalLoaded;
      var totalCount = this.pagination.totalCount;
      if (this.pagination.hasMore) {
        statusDiv.innerHTML = "\n        <div class=\"analects-success\">\n          \u2705 \u627E\u5230 ".concat(totalCount, " \u6761\u7ED3\u679C\uFF0C\u5DF2\u663E\u793A ").concat(displayedCount, " \u6761\uFF0C\u6EDA\u52A8\u81EA\u52A8\u52A0\u8F7D\u66F4\u591A\n        </div>");
      } else {
        statusDiv.innerHTML = "\n        <div class=\"analects-success\">\n          \u2705 \u5171\u627E\u5230 ".concat(totalCount, " \u6761\u7ED3\u679C\uFF0C\u5DF2\u5168\u90E8\u663E\u793A\u5B8C\u6BD5\n        </div>");
        this.isAutoLoadingEnabled = false;
        if (loadCompleteDiv) {
          loadCompleteDiv.style.display = 'block';
        }
      }
    }

    // 重置所有搜索内容
  }, {
    key: "resetSearch",
    value: function resetSearch() {
      var _this12 = this;
      // 清空关键词
      var keywordInput = document.getElementById('analects-keyword');
      if (keywordInput) keywordInput.value = '';

      // 清空搜索框
      ['character-search', 'argument-search', 'proverb-search', 'chapter-search'].forEach(function (id) {
        var input = document.getElementById(id);
        if (input) {
          input.value = '';
          _this12.filterOptions(id.split('-')[0], '');
        }
      });

      // 取消所有选中状态
      var checkboxes = document.querySelectorAll('.analects-tag-cloud input[type="checkbox"]');
      var tags = document.querySelectorAll('.analects-option-tag');
      checkboxes.forEach(function (cb) {
        return cb.checked = false;
      });
      tags.forEach(function (tag) {
        return tag.classList.remove('selected');
      });

      // 章节重置为"全部"
      var allCheckbox = document.querySelector('input[data-type="chapter"][value="all"]');
      if (allCheckbox) {
        allCheckbox.checked = true;
        allCheckbox.closest('.analects-option-tag').classList.add('selected');
      }

      // 清空内部选中项目存储
      this.selectedItems.characters.clear();
      this.selectedItems.arguments.clear();
      this.selectedItems.proverbs.clear();
      this.selectedItems.chapter = {
        id: 'all',
        name: '全部章节'
      };

      // 清空结果
      var resultsContainer = document.getElementById('analects-results-container');
      var loadCompleteDiv = document.getElementById('analects-load-complete');
      if (resultsContainer) resultsContainer.innerHTML = '';
      if (loadCompleteDiv) loadCompleteDiv.style.display = 'none';

      // 重置分页和状态
      this.resetPagination();
      this.isAutoLoadingEnabled = false;
      this.searchConditionsChanged = false;

      // 清除搜索按钮的视觉提示
      var searchBtn = document.getElementById('analects-search-btn');
      if (searchBtn) {
        searchBtn.classList.remove('search-changed');
      }

      // 更新渲染
      this.renderSelectedItems();
      this.showStatusMessage('🔄 已重置所有搜索条件', 'success');
    }

    // 显示状态消息
  }, {
    key: "showStatusMessage",
    value: function showStatusMessage(message) {
      var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'info';
      var duration = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 2000;
      var statusDiv = document.getElementById('analects-search-status');
      if (statusDiv) {
        var className = type === 'success' ? 'analects-success' : type === 'error' ? 'analects-error' : 'analects-info';
        statusDiv.innerHTML = "<div class=\"".concat(className, "\">").concat(message, "</div>");
        if (duration > 0) {
          setTimeout(function () {
            return statusDiv.innerHTML = '';
          }, duration);
        }
      }
    }

    // 测试连接方法
  }, {
    key: "testConnection",
    value: function () {
      var _testConnection = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee14() {
        var data, _t9;
        return _regenerator().w(function (_context14) {
          while (1) switch (_context14.p = _context14.n) {
            case 0:
              _context14.p = 0;
              _context14.n = 1;
              return this.apiRequest('characters', {
                limit: '1'
              });
            case 1:
              data = _context14.v;
              return _context14.a(2, {
                success: true,
                message: '连接测试成功',
                sampleData: data
              });
            case 2:
              _context14.p = 2;
              _t9 = _context14.v;
              console.error('连接测试失败:', _t9);
              return _context14.a(2, {
                success: false,
                message: _t9.message,
                error: _t9
              });
          }
        }, _callee14, this, [[0, 2]]);
      }));
      function testConnection() {
        return _testConnection.apply(this, arguments);
      }
      return testConnection;
    }()
  }]);
}(); // 全局复制方法
if (typeof window !== 'undefined') {
  window.AnalectsSDK = AnalectsSDK;
  window.AnalectsSDK.copyText = /*#__PURE__*/function () {
    var _ref5 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee15(text, button) {
      var originalTitle, textArea, successful, _t0;
      return _regenerator().w(function (_context15) {
        while (1) switch (_context15.p = _context15.n) {
          case 0:
            originalTitle = button.title;
            _context15.p = 1;
            if (!navigator.clipboard) {
              _context15.n = 3;
              break;
            }
            _context15.n = 2;
            return navigator.clipboard.writeText(text);
          case 2:
            _context15.n = 4;
            break;
          case 3:
            textArea = document.createElement('textarea');
            textArea.value = text;
            Object.assign(textArea.style, {
              position: 'fixed',
              left: '-999999px',
              top: '-999999px'
            });
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) {
              _context15.n = 4;
              break;
            }
            throw new Error('Copy command failed');
          case 4:
            button.title = '已复制！';
            setTimeout(function () {
              return button.title = originalTitle;
            }, 2000);
            _context15.n = 6;
            break;
          case 5:
            _context15.p = 5;
            _t0 = _context15.v;
            console.error('复制失败:', _t0);
            button.title = '复制失败';
            setTimeout(function () {
              return button.title = originalTitle;
            }, 2000);
          case 6:
            return _context15.a(2);
        }
      }, _callee15, null, [[1, 5]]);
    }));
    return function (_x8, _x9) {
      return _ref5.apply(this, arguments);
    };
  }();
  window.initAnalects = function (config) {
    return new AnalectsSDK(config);
  };
}

// 自动初始化
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    var autoInit = document.querySelector('[data-analects-auto-init]');
    if (!autoInit) return;
    var supabaseUrl = autoInit.getAttribute('data-supabase-url');
    var supabaseKey = autoInit.getAttribute('data-supabase-key');
    if (supabaseUrl && supabaseKey) {
      var config = {
        supabaseUrl: supabaseUrl,
        supabaseKey: supabaseKey
      };
      var sdk = new AnalectsSDK(config);
      document.querySelectorAll('[data-analects-search]').forEach(function (container) {
        return sdk.renderSearchInterface(container);
      });
      document.querySelectorAll('[data-analects-daily]').forEach(function (container) {
        return sdk.renderDailyAnalect(container);
      });
    }
  });
}

// 模块导出
if ( true && module.exports) {
  module.exports = AnalectsSDK;
}
/* harmony default export */ __webpack_exports__["default"] = (AnalectsSDK);

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/harmony module decorator */
/******/ 	!function() {
/******/ 		__webpack_require__.hmd = function(module) {
/******/ 			module = Object.create(module);
/******/ 			if (!module.children) module.children = [];
/******/ 			Object.defineProperty(module, 'exports', {
/******/ 				enumerable: true,
/******/ 				set: function() {
/******/ 					throw new Error('ES Modules may not assign module.exports or exports.*, Use ESM export syntax, instead: ' + module.id);
/******/ 				}
/******/ 			});
/******/ 			return module;
/******/ 		};
/******/ 	}();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(954);
/******/ 	__webpack_exports__ = __webpack_exports__["default"];
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=analects.js.map