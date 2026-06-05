'use strict';

(function () {
  // 年表記
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- お問い合わせフォーム AJAX 送信 ----
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('.btn-submit');
      const originalLabel = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '送信中…';
      }
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' },
        });
        if (res.ok) {
          showToast('送信しました。担当者から2〜3営業日以内にご連絡します。', 'success');
          form.reset();
        } else {
          const data = await res.json().catch(() => ({}));
          const msg = (data.errors && data.errors[0] && data.errors[0].message)
            ? data.errors[0].message
            : '送信に失敗しました。少し時間をおいて再度お試しください。';
          showToast(msg, 'error');
        }
      } catch (err) {
        showToast('通信エラーが発生しました。少し時間をおいて再度お試しください。', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
      }
    });
  }

  function showToast(message, variant) {
    // 既存トーストがあれば消す
    const existing = document.getElementById('contact-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'contact-toast';
    toast.className = 'toast toast-' + (variant || 'success');
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <span class="toast-icon">${variant === 'error' ? '⚠' : '✓'}</span>
      <span class="toast-message"></span>
      <button class="toast-close" aria-label="閉じる">×</button>
    `;
    toast.querySelector('.toast-message').textContent = message;
    document.body.appendChild(toast);
    // 表示遷移
    requestAnimationFrame(() => toast.classList.add('is-shown'));
    // 閉じる
    const close = () => {
      toast.classList.remove('is-shown');
      setTimeout(() => toast.remove(), 350);
    };
    toast.querySelector('.toast-close').addEventListener('click', close);
    // 6秒で自動クローズ
    setTimeout(close, 6000);
  }

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
