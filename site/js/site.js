/* Off the Binder — small progressive enhancements. No libraries. */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobileQuery = window.matchMedia ? window.matchMedia('(max-width: 860px)') : { matches: false };
  var isMobile = function () { return mobileQuery.matches; };
  var onReady = function (fn) {
    fn();
    window.addEventListener('load', fn);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fn);
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fn, 150); });
  };

  // Mobile menu (hamburger)
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }

  // Year in footer
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // Cards appear on scroll (CSS turns this off with prefers-reduced-motion)
  var reveals = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduce) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  // Before / after: the "after" image wipes over the "before" as you scroll
  var ba = document.querySelector('[data-ba]');
  if (ba && !reduce) {
    var onScroll = function () {
      var r = ba.getBoundingClientRect(), vh = window.innerHeight;
      var t = (vh - r.top) / (vh + r.height);           // 0 when entering, 1 when leaving
      var pct = Math.max(0, Math.min(1, (t - 0.25) / 0.45));
      ba.style.setProperty('--reveal', (100 - pct * 100).toFixed(1) + '%');
    };
    ba.style.setProperty('--reveal', '100%');
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Demo spec card: quantities roll to the new batch size, in a 9-character column
  var demo = document.querySelector('[data-demo]');
  if (demo) {
    var base = [[60, 'White Rum'], [30, 'Lime Juice'], [20, 'Sugar Syrup 1:1']];
    var pre = demo.querySelector('[data-spec]');
    var current = 1, raf = null;
    var fmt = function (ml) {
      var q = ml >= 1000 ? (Math.round(ml / 100) / 10) + 'L' : Math.round(ml) + 'ml';
      return (q + '         ').slice(0, 9);
    };
    var paint = function (n) {
      pre.textContent = base.map(function (r) { return fmt(r[0] * n) + r[1]; }).join('\n');
    };
    demo.querySelectorAll('[data-serves]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var to = parseInt(btn.getAttribute('data-serves'), 10), from = current;
        demo.querySelectorAll('[data-serves]').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        current = to;
        if (raf) cancelAnimationFrame(raf);
        if (reduce || !window.requestAnimationFrame) { paint(to); return; }
        var t0 = null, dur = 650;
        var step = function (t) {
          if (t0 === null) t0 = t;
          var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
          paint(from + (to - from) * e);
          if (k < 1) raf = requestAnimationFrame(step); else paint(to);
        };
        raf = requestAnimationFrame(step);
      });
    });
  }

  // Animated phone: types a search, filters the list, opens the recipe page, loops
  var phone = document.querySelector('[data-phone]');
  if (phone) {
    var qEl = phone.querySelector('[data-phone-query]');
    var rows = [].slice.call(phone.querySelectorAll('[data-phone-list] li'));
    var page = phone.querySelector('[data-phone-page]');
    var pages = {
      daiquiri: ['Daiquiri', 'Shake', 'Coupe', 'None', ['60ml     White Rum', '30ml     Lime Juice', '20ml     Sugar Syrup 1:1']],
      negroni: ['Negroni', 'Stir', 'Rocks', 'Orange', ['30ml     Gin', '30ml     Sweet Vermouth', '30ml     Red Bitter']],
      collins: ['Tom Collins', 'Build', 'Highball', 'Lemon', ['45ml     Gin', '30ml     Lemon Juice', '15ml     Sugar Syrup 1:1', 'Top      Soda Water']],
      martini: ['Dry Martini', 'Stir', 'Martini', 'Olive', ['60ml     Gin', '10ml     Dry Vermouth']],
      syrup: ['Sugar Syrup 1:1', 'Stir', '1.2 L', '14 days', ['600g     White Sugar', '600ml    Hot Water']]
    };
    var show = function (key) {
      var d = pages[key]; if (!d || !page) return;
      page.querySelector('[data-pp-title]').textContent = d[0];
      page.querySelector('[data-pp-method]').textContent = d[1];
      page.querySelector('[data-pp-glass]').textContent = d[2];
      page.querySelector('[data-pp-garnish]').textContent = d[3];
      page.querySelector('[data-pp-spec]').textContent = d[4].join('\n');
      page.classList.add('is-open');
    };
    var filter = function (q) {
      var first = null;
      rows.forEach(function (li) {
        var hit = !q || li.getAttribute('data-k').indexOf(q) !== -1;
        li.classList.toggle('is-out', !hit);
        li.classList.toggle('is-hit', !!q && hit);
        if (hit && q && !first) first = li;
      });
      return first;
    };
    if (reduce) {
      qEl.textContent = 'negroni'; filter('negroni'); show('negroni');
    } else {
      var queries = ['negroni', 'syrup', 'collins', 'daiquiri'];
      var qi = 0;
      var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
      var loop = async function () {
        while (true) {
          var q = queries[qi % queries.length]; qi++;
          var first = null;
          for (var i = 1; i <= q.length; i++) { qEl.textContent = q.slice(0, i); first = filter(q.slice(0, i)); await wait(150); }
          await wait(700);
          if (first) show(first.getAttribute('data-page'));
          await wait(2600);
          page.classList.remove('is-open');
          await wait(500);
          for (var j = q.length - 1; j >= 0; j--) { qEl.textContent = q.slice(0, j); await wait(45); }
          filter(''); await wait(800);
        }
      };
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e, o) { if (e[0].isIntersecting) { loop(); o.disconnect(); } }).observe(phone);
      } else { loop(); }
    }
  }

  // Swipe cards (mobile): dots under the track, optional start card
  document.querySelectorAll('[data-swipe]').forEach(function (track) {
    var items = [].slice.call(track.children);
    if (items.length < 2) return;
    var dots = document.createElement('div');
    dots.className = 'swipe-dots';
    dots.setAttribute('aria-hidden', 'true');
    items.forEach(function () { dots.appendChild(document.createElement('i')); });
    track.parentNode.insertBefore(dots, track.nextSibling);
    var marks = [].slice.call(dots.children);
    var update = function () {
      var mid = track.scrollLeft + track.clientWidth / 2, best = 0, dist = Infinity;
      items.forEach(function (it, i) {
        var d = Math.abs(it.offsetLeft + it.offsetWidth / 2 - mid);
        if (d < dist) { dist = d; best = i; }
      });
      marks.forEach(function (m, i) { m.classList.toggle('on', i === best); });
    };
    track.addEventListener('scroll', update, { passive: true });
    var startSel = track.getAttribute('data-swipe-start'), placed = false;
    onReady(function () {
      if (!placed && startSel && isMobile() && track.scrollWidth > track.clientWidth) {
        var start = track.querySelector(startSel);
        if (start) { track.scrollLeft = start.offsetLeft - (track.clientWidth - start.offsetWidth) / 2; placed = true; }
      }
      update();
    });
  });

  // Stacking cards (mobile): same height for every card so each one covers the last
  document.querySelectorAll('[data-stack]').forEach(function (stack) {
    var items = [].slice.call(stack.children);
    onReady(function () {
      items.forEach(function (it) { it.style.minHeight = ''; });
      if (!isMobile()) return;
      var h = 0;
      items.forEach(function (it) { h = Math.max(h, it.offsetHeight); });
      items.forEach(function (it) { it.style.minHeight = h + 'px'; });
    });
  });

  // Flip cards (mobile): tap to turn the card over
  document.querySelectorAll('[data-flip]').forEach(function (card) {
    var flip = function () {
      if (!isMobile()) return;
      var on = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', on ? 'true' : 'false');
    };
    var setRole = function () {
      if (isMobile()) {
        card.setAttribute('role', 'button'); card.setAttribute('tabindex', '0');
        card.setAttribute('aria-pressed', card.classList.contains('is-flipped') ? 'true' : 'false');
        card.setAttribute('aria-label', 'Flip the card');
      } else {
        card.classList.remove('is-flipped');
        ['role', 'tabindex', 'aria-pressed', 'aria-label'].forEach(function (a) { card.removeAttribute(a); });
      }
    };
    card.addEventListener('click', flip);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
    });
    onReady(setRole);
  });

  // Fit a heading line on one row (mobile): shrink the type a little, never below 26px
  document.querySelectorAll('[data-fit]').forEach(function (el) {
    var heading = el.closest('h1, h2, h3') || el;
    onReady(function () {
      heading.style.fontSize = ''; el.style.whiteSpace = '';
      if (!isMobile()) return;
      var box = heading.parentNode.clientWidth;
      var size = parseFloat(getComputedStyle(heading).fontSize);
      el.style.whiteSpace = 'nowrap';
      var width = function () { return el === heading ? heading.scrollWidth : el.getBoundingClientRect().width; };
      while (width() > box + 0.5 && size > 26) { size -= 1; heading.style.fontSize = size + 'px'; }
      if (width() > box + 0.5) { heading.style.fontSize = ''; el.style.whiteSpace = ''; }
    });
  });

  // Products page: render the list from /data/products.js
  var grid = document.querySelector('[data-products]');
  if (grid) {
    var s = document.createElement('script');
    s.src = '/data/products.js';
    s.onload = function () { renderProducts(window.OTB_PRODUCTS || []); };
    document.head.appendChild(s);
  }

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text) n.textContent = text;
    return n;
  }

  function renderProducts(list) {
    if (!list.length) return;
    var aud = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
    list.forEach(function (p) {
      var card = el('article', { 'class': 'product reveal is-in' });
      if (p.image) card.appendChild(el('img', { src: p.image, alt: p.alt || '', loading: 'lazy', width: '800', height: '600' }));
      var body = el('div', { 'class': 'product-body' });
      body.appendChild(el('h3', {}, p.name));
      body.appendChild(el('p', { 'class': 'product-price' }, aud.format(p.price) + ' AUD'));
      if (p.blurb) body.appendChild(el('p', {}, p.blurb));
      if (p.affiliate) body.appendChild(el('p', { 'class': 'muted', style: 'font-size:13px' }, 'Affiliate link: I may earn a commission if you buy, at no extra cost to you.'));
      var rel = p.affiliate ? 'sponsored noopener' : 'noopener';
      body.appendChild(el('a', { 'class': 'btn btn-primary', href: p.url, rel: rel, target: '_blank' }, 'Buy on ' + (p.platform || 'the shop') + ' ↗'));
      card.appendChild(body);
      grid.appendChild(card);
    });
    var section = document.getElementById('products');
    var soon = document.getElementById('coming-soon');
    if (section) section.hidden = false;
    if (soon) soon.hidden = true;
  }
})();
