// ============================================================
// 有限会社 祐晃堂 - フロントエンド スクリプト
// ============================================================

// ---- 設定 -----------------------------------------------------
// GAS Web App をデプロイした後、ここに URL を貼り付けてください。
// 例: 'https://script.google.com/macros/s/AKfy.../exec'
// 空文字のままだと事例セクションは「準備中」表示になります。
const WORKS_API_URL = 'https://script.google.com/macros/s/AKfycbxApwCl_W2I178Yrxw4GaJttOUZQYf6dU3X6PGefP392DxyHQjo5KMV6ViUnpImvM_Y/exec';

// ---- ヘッダーメニュー -----------------------------------------
const menuButton = document.getElementById('menuButton');
const siteNav = document.getElementById('siteNav');
const year = document.getElementById('year');

if (year) {
  year.textContent = new Date().getFullYear();
}

if (menuButton && siteNav) {
  menuButton.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });
}

// ---- スクロール出現アニメーション -----------------------------
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

// ---- 施工事例の読み込み（GAS から JSON 取得） -----------------
const worksContainer = document.getElementById('worksContainer');
const worksLoading = document.getElementById('worksLoading');
const worksError = document.getElementById('worksError');

async function loadWorks() {
  if (!WORKS_API_URL) {
    if (worksLoading) {
      worksLoading.textContent = '施工事例は準備中です。近日公開予定です。';
    }
    return;
  }

  try {
    const res = await fetch(WORKS_API_URL, { method: 'GET' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      if (worksLoading) {
        worksLoading.textContent = '施工事例は準備中です。近日公開予定です。';
      }
      return;
    }

    renderWorks(data);
  } catch (err) {
    console.error('Failed to load works:', err);
    if (worksLoading) worksLoading.hidden = true;
    if (worksError) worksError.hidden = false;
  }
}

function renderWorks(works) {
  if (!worksContainer) return;
  worksContainer.innerHTML = '';

  works.forEach((work, idx) => {
    const card = document.createElement('article');
    card.className = 'work-card reveal';

    const tags = (work.tags || '')
      .split(/[,、]/)
      .map(t => t.trim())
      .filter(Boolean);

    const tagHtml = tags
      .map(t => `<span class="work-tag">${escapeHtml(t)}</span>`)
      .join('');

    const detailRows = [];
    if (work.location) detailRows.push(['施工場所', work.location]);
    if (work.duration) detailRows.push(['工期', work.duration]);
    if (work.material) detailRows.push(['使用素材', work.material]);

    const detailsHtml = detailRows.length === 0 ? '' : `
      <dl class="work-details">
        ${detailRows.map(([k, v]) => `
          <div>
            <dt>${escapeHtml(k)}</dt>
            <dd>${escapeHtml(v)}</dd>
          </div>
        `).join('')}
      </dl>
    `;

    card.innerHTML = `
      <div class="ba-slider" data-ba-slider>
        <img class="ba-img ba-img-before" src="${escapeAttr(work.beforeImage)}" alt="ビフォー: ${escapeAttr(work.title || '')}">
        <img class="ba-img ba-img-after" src="${escapeAttr(work.afterImage)}" alt="アフター: ${escapeAttr(work.title || '')}">
        <span class="ba-label ba-label-before">BEFORE</span>
        <span class="ba-label ba-label-after">AFTER</span>
        <div class="ba-handle"></div>
      </div>
      <div class="work-body">
        ${tagHtml ? `<div class="work-meta">${tagHtml}</div>` : ''}
        <h3>${escapeHtml(work.title || '施工事例')}</h3>
        <p class="work-description">${escapeHtml(work.description || '')}</p>
        ${detailsHtml}
      </div>
    `;

    worksContainer.appendChild(card);
    observer.observe(card);

    const slider = card.querySelector('[data-ba-slider]');
    if (slider) initBeforeAfterSlider(slider);
  });
}

// ---- ビフォーアフタースライダー -------------------------------
function initBeforeAfterSlider(slider) {
  const afterImg = slider.querySelector('.ba-img-after');
  const handle = slider.querySelector('.ba-handle');
  let dragging = false;

  function setPosition(percent) {
    const p = Math.max(0, Math.min(100, percent));
    afterImg.style.clipPath = `inset(0 0 0 ${p}%)`;
    handle.style.left = p + '%';
  }

  function pointerMove(clientX) {
    const rect = slider.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = (x / rect.width) * 100;
    setPosition(percent);
  }

  // マウス操作
  slider.addEventListener('mousedown', (e) => {
    dragging = true;
    pointerMove(e.clientX);
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (dragging) pointerMove(e.clientX);
  });
  document.addEventListener('mouseup', () => { dragging = false; });

  // タッチ操作
  slider.addEventListener('touchstart', (e) => {
    dragging = true;
    pointerMove(e.touches[0].clientX);
  }, { passive: true });
  slider.addEventListener('touchmove', (e) => {
    if (dragging) pointerMove(e.touches[0].clientX);
  }, { passive: true });
  slider.addEventListener('touchend', () => { dragging = false; });

  // クリック移動（タップした位置にハンドルが移動）
  slider.addEventListener('click', (e) => {
    if (e.target.closest('.ba-handle')) return;
    pointerMove(e.clientX);
  });

  // 初期位置
  setPosition(50);
}

// ---- ヘルパー -------------------------------------------------
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function escapeAttr(str) {
  return escapeHtml(str);
}

// ---- 起動 -----------------------------------------------------
loadWorks();
