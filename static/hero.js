'use strict';

(function () {
  const SOURCE_LABEL = {
    bluesky: 'Bluesky',
    youtube: 'YouTube',
    mastodon: 'Mastodon',
    reddit: 'Reddit',
    hackernews: 'Hacker News',
    lemmy: 'Lemmy',
  };
  const SOURCE_ICON = {
    bluesky: '🦋',
    youtube: '▶',
    mastodon: '🐘',
    reddit: '🟠',
    hackernews: '🔶',
    lemmy: '🐭',
  };

  // earth-embed.html (iframe) は earth_globe を一切改変せず読み込む。
  // 親側から CSS を inject して、 地球以外の UI 部品 (上部メニュー・検索・ヒント等) だけ非表示にする。
  const iframe = document.getElementById('hero-earth-iframe');
  if (iframe) {
    iframe.addEventListener('load', () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        const style = doc.createElement('style');
        style.textContent = `
          #top, #hint, #search, #card { display: none !important; }
          #boot { background: transparent !important; }
          body { background: transparent !important; }
        `;
        doc.head.appendChild(style);
      } catch (e) { /* same origin only */ }
    });
  }

  // 演出シーケンス
  setTimeout(populate, 2000);
  setTimeout(showTitle, 4500);
  setTimeout(showScroll, 5400);

  async function populate() {
    const layer = document.getElementById('hero-bubbles');
    if (!layer) return;
    let items = [];
    try {
      const res = await fetch('data/oyoyo-feed.json', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        items = Array.isArray(data.items) ? data.items : [];
      }
    } catch (e) { /* noop */ }
    const isMobile = window.innerWidth < 720;
    const slots = isMobile ? mobileSlots() : desktopSlots();
    const usable = pickItems(items, slots.length);
    slots.forEach((slot, idx) => {
      const item = usable[idx];
      if (!item) return;
      const b = buildBubble(item);
      b.style.left = slot.left;
      b.style.top = slot.top;
      layer.appendChild(b);
      setTimeout(() => b.classList.add('is-shown'), idx * 110);
    });
  }

  function pickItems(items, count) {
    const bySource = {};
    items.forEach(it => { (bySource[it.source] = bySource[it.source] || []).push(it); });
    const sources = Object.keys(bySource);
    const picked = [];
    let safety = 0;
    while (picked.length < count && safety < count * 4) {
      for (const src of sources) {
        if (picked.length >= count) break;
        const next = bySource[src].shift();
        if (next) picked.push(next);
      }
      safety++;
      if (sources.every(s => bySource[s].length === 0)) break;
    }
    return picked;
  }

  function buildBubble(item) {
    const b = document.createElement('div');
    b.className = 'hero-bubble';
    const head = document.createElement('div');
    head.className = 'hero-bubble-head';
    const icon = document.createElement('span');
    icon.className = 'hero-bubble-icon';
    icon.textContent = SOURCE_ICON[item.source] || '✦';
    const label = document.createElement('span');
    label.className = 'hero-bubble-label';
    label.textContent = (SOURCE_LABEL[item.source] || item.source) + 'のコメント';
    head.appendChild(icon);
    head.appendChild(label);
    const body = document.createElement('div');
    body.className = 'hero-bubble-body';
    body.textContent = clip(item.text, 80);
    b.appendChild(head);
    b.appendChild(body);
    if (item.author) {
      const author = document.createElement('div');
      author.className = 'hero-bubble-author';
      author.textContent = item.author;
      b.appendChild(author);
    }
    return b;
  }

  function clip(s, n) {
    if (!s) return '';
    const t = String(s).replace(/\s+/g, ' ').trim();
    return t.length > n ? t.slice(0, n) + '…' : t;
  }

  function showTitle() {
    const el = document.getElementById('hero-content');
    if (el) el.classList.add('is-shown');
  }
  function showScroll() {
    const el = document.querySelector('.hero-scroll');
    if (el) el.classList.add('is-shown');
  }

  function desktopSlots() {
    return [
      { left: '3%',  top: '10%' },
      { left: '20%', top: '4%'  },
      { left: '40%', top: '2%'  },
      { left: '60%', top: '3%'  },
      { left: '78%', top: '10%' },
      { left: '1%',  top: '34%' },
      { left: '82%', top: '30%' },
      { left: '0%',  top: '60%' },
      { left: '84%', top: '56%' },
      { left: '5%',  top: '82%' },
      { left: '22%', top: '92%' },
      { left: '46%', top: '94%' },
      { left: '66%', top: '92%' },
      { left: '80%', top: '82%' },
    ];
  }
  function mobileSlots() {
    return [
      { left: '2%',  top: '8%'  },
      { left: '54%', top: '4%'  },
      { left: '64%', top: '22%' },
      { left: '0%',  top: '40%' },
      { left: '62%', top: '58%' },
      { left: '2%',  top: '66%' },
      { left: '38%', top: '86%' },
      { left: '64%', top: '90%' },
    ];
  }
})();
