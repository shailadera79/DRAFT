/*
 * browser-tizen 0.1.0 — TizenBrew universal site-mod module
 * Desktop Windows/Chrome 95 identity + TV-remote browser controls.
 * Browser identity does not upgrade Tizen's actual Chromium engine.
 */
(function () {
  'use strict';
  if (window.__browserTizenInstalled) return;
  window.__browserTizenInstalled = true;

  var VERSION = '0.1.0';
  var HOME = 'https://example.com/';
  var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36';
  var BROWSER = { mouse: false, scroll: false, toolbar: false, home: false,
    x: -1, y: -1, cursor: null, root: null, bar: null, hint: null, input: null };
  var KEYS = { red: 403, green: 404, yellow: 405, blue: 406, back: 10009,
    left: 37, up: 38, right: 39, down: 40, enter: 13 };
  var STORAGE_KEY = 'browserTizenPrefsV1';

  function safe(fn) { try { return fn(); } catch (_) { return undefined; } }
  function define(obj, name, value) {
    try { Object.defineProperty(obj, name, { configurable: true, get: function () { return value; } }); return true; }
    catch (_) { return false; }
  }
  function desktopIdentity() {
    var nav = navigator;
    var proto = safe(function () { return Object.getPrototypeOf(nav); });
    var targets = [nav, proto];
    for (var i = 0; i < targets.length; i++) {
      if (!targets[i]) continue;
      define(targets[i], 'userAgent', UA);
      define(targets[i], 'platform', 'Win32');
      define(targets[i], 'appVersion', '5.0 (Windows NT 10.0; Win64; x64)');
      define(targets[i], 'vendor', 'Google Inc.');
      define(targets[i], 'maxTouchPoints', 0);
    }
    var hints = {
      brands: [{ brand: 'Google Chrome', version: '95' }, { brand: 'Chromium', version: '95' },
        { brand: 'Not A;Brand', version: '99' }],
      mobile: false, platform: 'Windows',
      getHighEntropyValues: function () {
        return Promise.resolve({
          architecture: 'x86', bitness: '64', mobile: false, model: '', platform: 'Windows',
          platformVersion: '10.0.0', uaFullVersion: '95.0.4638.69',
          fullVersionList: [{ brand: 'Google Chrome', version: '95.0.4638.69' },
            { brand: 'Chromium', version: '95.0.4638.69' }]
        });
      }, toJSON: function () { return { brands: this.brands, mobile: this.mobile, platform: this.platform }; }
    };
    define(nav, 'userAgentData', hints);
    // Desktop pointer media answers for sites using hover detection.
    if (typeof window.matchMedia === 'function') {
      var nativeMatch = window.matchMedia;
      window.matchMedia = function (q) {
        var query = String(q).replace(/\s+/g, '').toLowerCase();
        var val = null;
        if (query === '(hover:hover)' || query === '(any-hover:hover)' ||
            query === '(pointer:fine)' || query === '(any-pointer:fine)') val = true;
        else if (query === '(hover:none)' || query === '(any-hover:none)' ||
                 query === '(pointer:coarse)' || query === '(any-pointer:coarse)' ||
                 query === '(pointer:none)' || query === '(any-pointer:none)') val = false;
        if (val === null) return nativeMatch.apply(window, arguments);
        return { matches: val, media: q, onchange: null,
          addListener: function () {}, removeListener: function () {},
          addEventListener: function () {}, removeEventListener: function () {},
          dispatchEvent: function () { return false; } };
      };
    }
  }
  desktopIdentity();

  // A new origin means different localStorage. A harmless preference can be
  // restored from window.name where supported; no private browsing data stored.
  function restore() {
    var pref = safe(function () { return sessionStorage.getItem(STORAGE_KEY); });
    if (!pref) pref = safe(function () {
      return window.name.indexOf('btp1:') === 0 ? window.name.substring(5) : '';
    });
    if (!pref) return;
    safe(function () {
      var o = JSON.parse(pref);
      BROWSER.mouse = o.mouse === true;
      BROWSER.scroll = o.scroll === true;
    });
  }
  function persist() {
    var pref = JSON.stringify({ mouse: BROWSER.mouse, scroll: BROWSER.scroll });
    safe(function () { sessionStorage.setItem(STORAGE_KEY, pref); });
    if (!window.name || window.name.indexOf('btp1:') === 0) {
      safe(function () { window.name = 'btp1:' + pref; });
    }
  }
  restore();

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(label, action, cls) {
    var b = el('button', 'bt-button' + (cls ? ' ' + cls : ''), label);
    b.type = 'button';
    b.addEventListener('click', action);
    return b;
  }
  function viewport() {
    return { w: Math.max(1, window.innerWidth || 1280),
      h: Math.max(1, window.innerHeight || 720) };
  }
  function isHome() {
    return (location.hostname === 'example.com' || location.hostname === 'www.example.com') &&
      (location.pathname === '/' || location.pathname === '');
  }
  function formatURL(text) {
    var raw = String(text || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^[a-z]+:/i.test(raw)) return '';
    if (/\s/.test(raw) || raw.indexOf('.') < 0 || raw.charAt(0) === '.') {
      return 'https://www.google.com/search?q=' + encodeURIComponent(raw);
    }
    return 'https://' + raw;
  }
  function navigate(text) {
    var url = formatURL(text);
    if (!url) { updateHint('Only HTTP/HTTPS websites are allowed'); return; }
    location.assign(url);
  }
  function goHome() { location.assign(HOME); }

  var css = [
    '#bt-browser-root, #bt-browser-root *{box-sizing:border-box}',
    '#bt-browser-root{all:initial;position:fixed;inset:0;z-index:2147483645;color:#f4f5ff;font-family:Arial,sans-serif;pointer-events:none;font-size:16px}',
    '#bt-browser-root button,#bt-browser-root input{font:inherit}',
    '#bt-browser-root .bt-home{position:absolute;inset:0;overflow:auto;pointer-events:auto;background:radial-gradient(ellipse at 75% 0%,#253465 0%,#11182a 48%,#080c16 100%);padding:6vh 6vw}',
    '#bt-browser-root .bt-brand{color:#a6bdff;font-size:14px;letter-spacing:4px;font-weight:bold}',
    '#bt-browser-root .bt-title{font-weight:bold;font-size:clamp(34px,5.3vw,78px);margin:30px 0 10px;letter-spacing:-2px}',
    '#bt-browser-root .bt-sub{color:#c1c9e0;font-size:18px;max-width:900px;line-height:1.55}',
    '#bt-browser-root .bt-search{display:flex;gap:12px;margin:36px 0;max-width:1080px}',
    '#bt-browser-root .bt-input{min-width:0;flex:1;padding:16px 19px;background:#101a30;color:#fff;border:2px solid #526489;border-radius:13px;outline:none}',
    '#bt-browser-root .bt-input:focus{border-color:#8fb5ff}',
    '#bt-browser-root .bt-button{border:1px solid #627399;background:#233250;color:#fff;padding:13px 18px;border-radius:12px;cursor:pointer;min-height:49px}',
    '#bt-browser-root .bt-button:focus{outline:3px solid #7bb9ff;outline-offset:2px}',
    '#bt-browser-root .bt-button:hover{background:#3f527d}',
    '#bt-browser-root .bt-primary{background:#416cdb;border-color:#83a3ff}',
    '#bt-browser-root .bt-shortcuts{display:flex;flex-wrap:wrap;gap:15px;margin-top:20px}',
    '#bt-browser-root .bt-shortcuts .bt-button{min-width:160px;min-height:70px;font-size:19px}',
    '#bt-browser-root .bt-foot{margin-top:32px;color:#9daacc;line-height:1.7}',
    '#bt-browser-root .bt-bar{position:absolute;top:14px;left:3vw;right:3vw;display:none;align-items:center;gap:8px;padding:12px;background:rgba(10,18,35,.98);border:1px solid #8399ca;border-radius:16px;box-shadow:0 10px 35px #000b;pointer-events:auto}',
    '#bt-browser-root .bt-bar.bt-open{display:flex}',
    '#bt-browser-root .bt-bar .bt-input{padding:11px 13px}',
    '#bt-browser-root .bt-bar .bt-button{min-width:55px;padding:9px 12px}',
    '#bt-browser-root .bt-hint{position:absolute;right:20px;bottom:17px;max-width:80vw;background:rgba(5,15,31,.9);color:#d7e6ff;padding:10px 15px;border:1px solid #5479bb;border-radius:12px;pointer-events:none;display:none}',
    '#bt-browser-root .bt-hint.bt-active{display:block}',
    '#bt-remote-cursor{position:fixed;z-index:2147483647;pointer-events:none;width:27px;height:27px;border:3px solid white;border-radius:50%;background:rgba(58,142,255,.30);box-shadow:0 0 0 2px #347cff,0 2px 12px #000;transform:translate(-50%,-50%);display:none}'
  ].join('\n');

  function updateHint(message) {
    if (!BROWSER.hint) return;
    BROWSER.hint.textContent = message || (BROWSER.scroll ?
      'GREEN: exit scroll  |  UP / DOWN: page scroll  |  BLUE: address bar' :
      BROWSER.mouse ? 'RED: mouse off  |  D-pad: move  |  OK: click  |  GREEN: scroll mode' : '');
    BROWSER.hint.className = 'bt-hint' +
      ((message || BROWSER.mouse || BROWSER.scroll) ? ' bt-active' : '');
  }
  function build() {
    if (BROWSER.root || !document.body) return;
    var style = el('style');
    style.id = 'bt-browser-style';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
    var root = el('div');
    root.id = 'bt-browser-root';
    document.body.appendChild(root);
    BROWSER.root = root;
    BROWSER.home = isHome();

    if (BROWSER.home) {
      var page = el('div', 'bt-home');
      page.appendChild(el('div', 'bt-brand', 'BROWSER · TIZEN'));
      page.appendChild(el('h1', 'bt-title', 'Your TV. The open web.'));
      page.appendChild(el('p', 'bt-sub',
        'Desktop-style browser for Samsung TizenBrew. Red: mouse cursor. Green: scroll mode. Blue: address bar. Yellow: home.'));
      var search = el('div', 'bt-search');
      var field = el('input', 'bt-input');
      field.type = 'text';
      field.placeholder = 'Enter website URL or search the web';
      field.setAttribute('aria-label', 'Search or enter a URL');
      field.addEventListener('keydown', function (e) {
        if (e.keyCode === KEYS.enter) { e.preventDefault(); navigate(field.value); }
      });
      search.appendChild(field);
      search.appendChild(button('Go', function () { navigate(field.value); }, 'bt-primary'));
      page.appendChild(search);
      page.appendChild(el('h2', '', 'Quick links'));
      var shortcuts = el('div', 'bt-shortcuts');
      var links = [
        ['Google', 'https://www.google.com/'],
        ['YouTube', 'https://www.youtube.com/'],
        ['Wikipedia', 'https://www.wikipedia.org/'],
        ['Bing', 'https://www.bing.com/'],
        ['GitHub', 'https://github.com/'],
        ['DuckDuckGo', 'https://duckduckgo.com/']
      ];
      for (var i = 0; i < links.length; i++) {
        (function (entry) {
          shortcuts.appendChild(button(entry[0], function () { navigate(entry[1]); }));
        })(links[i]);
      }
      page.appendChild(shortcuts);
      page.appendChild(el('div', 'bt-foot',
        'Reported: Windows 10 · Chrome 95 | Actual web engine remains the one built into your Samsung TV. Some websites may not work on older Tizen browsers.'));
      root.appendChild(page);
    }

    var bar = el('div', 'bt-bar');
    bar.appendChild(button('Home', goHome));
    bar.appendChild(button('Back', function () { history.back(); }));
    bar.appendChild(button('Next', function () { history.forward(); }));
    bar.appendChild(button('Reload', function () { location.reload(); }));
    var address = el('input', 'bt-input');
    address.type = 'text';
    address.placeholder = 'URL or search';
    address.value = location.href;
    address.setAttribute('aria-label', 'Address bar');
    address.addEventListener('keydown', function (e) {
      if (e.keyCode === KEYS.enter) { e.preventDefault(); navigate(address.value); }
    });
    bar.appendChild(address);
    bar.appendChild(button('Go', function () { navigate(address.value); }, 'bt-primary'));
    bar.appendChild(button('Close', function () { toggleBar(false); }));
    root.appendChild(bar);
    BROWSER.bar = bar;
    BROWSER.input = address;
    var hint = el('div', 'bt-hint');
    root.appendChild(hint);
    BROWSER.hint = hint;
    var cursor = el('div');
    cursor.id = 'bt-remote-cursor';
    document.body.appendChild(cursor);
    BROWSER.cursor = cursor;
    redrawCursor();
    updateHint();
  }

  function toggleBar(open) {
    if (!BROWSER.root) build();
    if (!BROWSER.bar) return;
    BROWSER.toolbar = (typeof open === 'boolean') ? open : !BROWSER.toolbar;
    BROWSER.bar.className = 'bt-bar' + (BROWSER.toolbar ? ' bt-open' : '');
    if (BROWSER.toolbar && BROWSER.input) {
      BROWSER.input.value = location.href;
      safe(function () { BROWSER.input.focus(); BROWSER.input.select(); });
    } else {
      safe(function () { if (BROWSER.input) BROWSER.input.blur(); });
    }
  }
  function redrawCursor() {
    if (!BROWSER.cursor) return;
    var vp = viewport();
    if (BROWSER.x < 0 || BROWSER.y < 0) {
      BROWSER.x = Math.floor(vp.w / 2);
      BROWSER.y = Math.floor(vp.h / 2);
    }
    BROWSER.x = Math.max(1, Math.min(vp.w - 1, BROWSER.x));
    BROWSER.y = Math.max(1, Math.min(vp.h - 1, BROWSER.y));
    BROWSER.cursor.style.left = BROWSER.x + 'px';
    BROWSER.cursor.style.top = BROWSER.y + 'px';
    BROWSER.cursor.style.display = BROWSER.mouse ? 'block' : 'none';
  }
  function mouseEvent(target, type, pressed, dx, dy) {
    if (!target) return;
    var options = { bubbles: true, cancelable: true, clientX: BROWSER.x, clientY: BROWSER.y,
      screenX: BROWSER.x, screenY: BROWSER.y, button: 0, buttons: pressed ? 1 : 0, view: window };
    safe(function () {
      var pointerType = type.indexOf('pointer') === 0;
      var evt;
      if (pointerType) {
        if (typeof PointerEvent !== 'function') return;
        options.pointerType = 'mouse'; options.pointerId = 1; options.isPrimary = true;
        evt = new PointerEvent(type, options);
      } else {
        evt = new MouseEvent(type, options);
      }
      safe(function () { Object.defineProperty(evt, 'movementX', { value: dx || 0 }); });
      safe(function () { Object.defineProperty(evt, 'movementY', { value: dy || 0 }); });
      target.dispatchEvent(evt);
    });
  }
  function underCursor() {
    return document.elementFromPoint(BROWSER.x, BROWSER.y) || document.body;
  }
  function move(dx, dy) {
    var oldX = BROWSER.x, oldY = BROWSER.y, vp = viewport();
    BROWSER.x = Math.max(1, Math.min(vp.w - 1, oldX + dx));
    BROWSER.y = Math.max(1, Math.min(vp.h - 1, oldY + dy));
    redrawCursor();
    var target = underCursor();
    mouseEvent(target, 'pointermove', false, BROWSER.x - oldX, BROWSER.y - oldY);
    mouseEvent(target, 'mousemove', false, BROWSER.x - oldX, BROWSER.y - oldY);
  }
  function click() {
    var target = underCursor();
    mouseEvent(target, 'pointerdown', true);
    mouseEvent(target, 'mousedown', true);
    mouseEvent(target, 'pointerup', false);
    mouseEvent(target, 'mouseup', false);
    safe(function () {
      if (typeof target.click === 'function') target.click();
      else mouseEvent(target, 'click', false);
    });
  }
  function toggleMouse() {
    BROWSER.mouse = !BROWSER.mouse;
    if (BROWSER.mouse) BROWSER.scroll = false;
    redrawCursor();
    updateHint();
    persist();
  }
  function toggleScroll() {
    BROWSER.scroll = !BROWSER.scroll;
    if (BROWSER.scroll) BROWSER.mouse = false;
    redrawCursor();
    updateHint();
    persist();
  }
  function scrollPage(dx, dy) {
    // Prefer a scrolling ancestor under the previous cursor, then page.
    var target = document.activeElement;
    if (target && target !== document.body && target !== document.documentElement &&
      target.scrollHeight > target.clientHeight + 10 && dy) {
      target.scrollTop += dy;
      return;
    }
    safe(function () { window.scrollBy(dx, dy); });
    if (BROWSER.home) {
      var homeEl = BROWSER.root && BROWSER.root.querySelector('.bt-home');
      if (homeEl) homeEl.scrollTop += dy;
    }
  }

  function handleKeys(e) {
    var code = e.keyCode || e.which;
    if (code === KEYS.red) {
      e.preventDefault(); e.stopImmediatePropagation(); toggleMouse(); return;
    }
    if (code === KEYS.green) {
      e.preventDefault(); e.stopImmediatePropagation(); toggleScroll(); return;
    }
    if (code === KEYS.blue) {
      e.preventDefault(); e.stopImmediatePropagation(); toggleBar(); return;
    }
    if (code === KEYS.yellow) {
      e.preventDefault(); e.stopImmediatePropagation(); goHome(); return;
    }
    if (code === KEYS.back) {
      if (BROWSER.toolbar) {
        e.preventDefault(); e.stopImmediatePropagation(); toggleBar(false);
      } else if (!BROWSER.home) {
        e.preventDefault(); e.stopImmediatePropagation(); history.back();
      }
      return;
    }
    if ((!BROWSER.mouse && !BROWSER.scroll) || BROWSER.toolbar) return;
    var step = e.repeat ? 55 : 34;
    var dx = 0, dy = 0;
    if (code === KEYS.left) dx = -step;
    else if (code === KEYS.right) dx = step;
    else if (code === KEYS.up) dy = -step;
    else if (code === KEYS.down) dy = step;
    else if (code !== KEYS.enter) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (BROWSER.scroll) {
      if (dx || dy) scrollPage(dx ? dx * 12 : 0, dy ? dy * 14 : 0);
    } else if (dx || dy) {
      move(dx, dy);
    } else if (!e.repeat) {
      click();
    }
  }

  window.addEventListener('keydown', handleKeys, true);
  window.addEventListener('resize', redrawCursor);
  window.addEventListener('pageshow', function () { build(); redrawCursor(); updateHint(); });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
  window.__browserTizen = {
    version: VERSION,
    toggleMouse: toggleMouse,
    toggleScroll: toggleScroll,
    addressBar: toggleBar,
    goHome: goHome
  };
})();