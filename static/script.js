'use strict';

(function () {
  // 年表記
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- 世界中の今日のoyoyo フィード ----
  loadOyoyoFeed();

  async function loadOyoyoFeed() {
    const meta = document.getElementById('oyoyo-meta');
    const feed = document.getElementById('oyoyo-feed');
    if (!meta || !feed) return;
    try {
      const res = await fetch('data/oyoyo-feed.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('feed not available');
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      if (data.updated_at) {
        const d = new Date(data.updated_at);
        const fmt = d.toLocaleString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        meta.textContent = `${fmt} 時点（Bluesky / YouTube から自動収集）`;
      } else {
        meta.textContent = '（自動収集はまだ動いていません）';
      }
      if (items.length === 0) {
        feed.innerHTML = '<div class="oyoyo-empty">今日はまだ何も拾えていません。</div>';
        return;
      }
      feed.innerHTML = '';
      items.forEach(item => feed.appendChild(buildItem(item)));
    } catch (err) {
      meta.textContent = '';
      feed.innerHTML = '<div class="oyoyo-empty">フィードを読み込めませんでした。</div>';
    }
  }

  function buildItem(item) {
    const a = document.createElement('a');
    a.className = 'oyoyo-item';
    a.href = item.url || '#';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    const head = document.createElement('div');
    head.className = 'oyoyo-item-head';
    const source = document.createElement('span');
    const isYt = item.source === 'youtube';
    source.className = 'oyoyo-source oyoyo-source-' + (isYt ? 'youtube' : 'bluesky');
    source.textContent = isYt ? 'YouTube' : 'Bluesky';
    head.appendChild(source);
    if (item.author) {
      const author = document.createElement('span');
      author.className = 'oyoyo-author';
      author.textContent = item.author;
      head.appendChild(author);
    }
    if (item.posted_at) {
      const when = document.createElement('span');
      when.className = 'oyoyo-when';
      when.textContent = relativeTime(item.posted_at);
      head.appendChild(when);
    }
    a.appendChild(head);

    const text = document.createElement('div');
    text.className = 'oyoyo-text';
    text.innerHTML = highlightKeyword(item.text || '');
    a.appendChild(text);

    if (isYt && item.video_title) {
      const vt = document.createElement('div');
      vt.className = 'oyoyo-video-title';
      vt.textContent = '🎬 ' + item.video_title;
      a.appendChild(vt);
    }
    return a;
  }

  function highlightKeyword(text) {
    const escaped = String(text).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[c]));
    return escaped.replace(/(oyoyo|オヨヨ|ｵﾖﾖ)/gi, '<mark>$1</mark>');
  }

  function relativeTime(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'たった今';
    if (diff < 3600) return Math.floor(diff / 60) + '分前';
    if (diff < 86400) return Math.floor(diff / 3600) + '時間前';
    return Math.floor(diff / 86400) + '日前';
  }

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
          showToast('送信しました。', 'success');
          form.reset();
        } else {
          const data = await res.json().catch(() => ({}));
          const msg = (data.errors && data.errors[0] && data.errors[0].message)
            ? data.errors[0].message
            : '送信に失敗しました。少し時間をおいて再度お試しください。';
          showToast('送信に失敗しました。', 'error');
        }
      } catch (err) {
        showToast('通信エラーが発生しました。', 'error');
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
