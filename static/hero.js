// Hero 演出制御
import { createEarth } from './earth.js';

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

init();

async function init() {
  const container = document.getElementById('hero-earth');
  if (!container) return;

  // 地球を初期化
  const earth = createEarth(container);

  // コメントを取得
  const items = await loadFeedItems();

  // 演出シーケンス
  // 0.4s: 地球出現
  // 2.0s ~: コメント順次 pop-in
  // 4.5s: タイトル fade-in
  setTimeout(() => earth.enter(), 400);
  setTimeout(() => populateBubbles(items), 2000);
  setTimeout(() => showTitle(), 4500);
}

async function loadFeedItems() {
  try {
    const res = await fetch('data/oyoyo-feed.json', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch (e) {
    return [];
  }
}

function populateBubbles(items) {
  const layer = document.getElementById('hero-bubbles');
  if (!layer) return;
  const isMobile = window.innerWidth < 720;
  const slots = isMobile ? mobileSlots() : desktopSlots();
  const usable = pickItems(items, slots.length);

  slots.forEach((slot, idx) => {
    const item = usable[idx];
    if (!item) return;
    const bubble = buildBubble(item);
    bubble.style.left = slot.left;
    bubble.style.top = slot.top;
    bubble.style.transformOrigin = slot.origin || 'center';
    layer.appendChild(bubble);
    // 順番に pop-in
    setTimeout(() => bubble.classList.add('is-shown'), idx * 110);
  });
}

function pickItems(items, count) {
  // 各ソースから均等に取って多様性確保
  const bySource = {};
  items.forEach(it => {
    (bySource[it.source] = bySource[it.source] || []).push(it);
  });
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

  const author = document.createElement('div');
  author.className = 'hero-bubble-author';
  author.textContent = item.author || '';

  b.appendChild(head);
  b.appendChild(body);
  if (item.author) b.appendChild(author);
  return b;
}

function clip(s, n) {
  if (!s) return '';
  const t = String(s).replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n) + '…' : t;
}

function showTitle() {
  const title = document.getElementById('hero-title');
  if (title) title.classList.add('is-shown');
}

// 配置スロット: 地球を中心とした周囲のグリッド位置（vw/vh ベース）
function desktopSlots() {
  return [
    { left: '4%',  top: '14%' },
    { left: '20%', top: '6%' },
    { left: '40%', top: '4%' },
    { left: '60%', top: '5%' },
    { left: '78%', top: '12%' },
    { left: '2%',  top: '36%' },
    { left: '82%', top: '32%' },
    { left: '0%',  top: '58%' },
    { left: '84%', top: '54%' },
    { left: '6%',  top: '78%' },
    { left: '22%', top: '88%' },
    { left: '44%', top: '90%' },
    { left: '64%', top: '88%' },
    { left: '80%', top: '78%' },
  ];
}

function mobileSlots() {
  return [
    { left: '3%',  top: '10%' },
    { left: '50%', top: '4%' },
    { left: '60%', top: '20%' },
    { left: '2%',  top: '36%' },
    { left: '62%', top: '54%' },
    { left: '4%',  top: '60%' },
    { left: '40%', top: '82%' },
    { left: '60%', top: '88%' },
  ];
}
