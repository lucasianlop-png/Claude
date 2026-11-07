/* Off the Binder — small progressive enhancements. No libraries. */
(function () {
  'use strict';

  // Mobile menu
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Close' : 'Menu';
    });
  }

  // Year in footer
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // Cards appear on scroll (CSS turns this off with prefers-reduced-motion)
  var reveals = document.querySelectorAll('.reveal');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
      body.appendChild(el('a', { 'class': 'btn btn-primary', href: p.url, rel: rel }, 'Buy on ' + (p.platform || 'the shop') + ' ↗'));
      card.appendChild(body);
      grid.appendChild(card);
    });
    var section = document.getElementById('products');
    var soon = document.getElementById('coming-soon');
    if (section) section.hidden = false;
    if (soon) soon.hidden = true;
  }
})();
