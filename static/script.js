'use strict';

(function () {
  // 年表記
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ハンバーガーメニュー
  const btn = document.getElementById('hamburger-btn');
  const nav = document.getElementById('site-nav');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const opened = nav.classList.toggle('is-open');
      btn.classList.toggle('is-open', opened);
      btn.setAttribute('aria-expanded', opened ? 'true' : 'false');
      btn.setAttribute('aria-label', opened ? 'メニューを閉じる' : 'メニューを開く');
    });
    // メニュー内リンクで自動クローズ
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        btn.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // セクションのスクロール時フェードイン
  const fadeTargets = document.querySelectorAll('.section, .info-card, .aix-card, .contact-form');
  if ('IntersectionObserver' in window) {
    fadeTargets.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.9s ease-out, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)';
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.style.opacity = '1';
          el.style.transform = 'none';
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
    // ヒーロー入場(2.6s)が終わってから observe
    setTimeout(() => {
      fadeTargets.forEach(el => observer.observe(el));
    }, 2600);
    // フォールバック (7秒経過したら強制表示)
    setTimeout(() => {
      fadeTargets.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    }, 7000);
  }
})();
