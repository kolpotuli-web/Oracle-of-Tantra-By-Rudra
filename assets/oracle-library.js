import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const supabase = createClient(
  'https://bvnkoglvpljizeogslmp.supabase.co',
  'sb_publishable_ryjVjpVSMXv_HSbDUEsTZA_iZMc_w2G',
);
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>'\"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '\"': '&quot;' })[c],
  );
let texts = [];
let items = [];
const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
function ensureStyles() {
  if (document.getElementById('oracleLibraryStyles')) return;
  const style = document.createElement('style');
  style.id = 'oracleLibraryStyles';
  style.textContent = `.librarySectionTitle{margin:28px 0 10px;border-top:1px solid #a27c55;padding-top:20px;font-weight:normal;font-size:22px}.libraryRecord{padding:16px;border:1px solid #997451;background:rgba(255,240,199,.5);min-height:150px;display:flex;flex-direction:column;justify-content:space-between}.libraryRecord h3{font-weight:normal;margin:0 0 6px}.libraryRecord .meta{font-size:11px;color:#765c47;line-height:1.5}.libraryRecord .desc{font-size:13px;line-height:1.5;color:#5d4737;margin:8px 0}.libraryRecord .recordActions{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.libraryRecord .recordActions a,.libraryRecord .recordActions button{border:1px solid #8b6647;background:#ead2a7;color:#241812;padding:7px 9px;text-decoration:none}.libraryEmpty{padding:14px 0;color:#6d523d}.libraryFilterRow{display:flex;gap:6px;flex-wrap:wrap}.libraryFilterRow button.active{background:#71342b;color:#f8dfb0}.libraryRecord.featured{border-width:2px}`;
  document.head.appendChild(style);
}
function ensureRecordView() {
  let v = document.getElementById('libraryRecordView');
  if (v) return v;
  v = document.createElement('section');
  v.id = 'libraryRecordView';
  v.className = 'view';
  v.innerHTML =
    '<div class="workspace"><div class="workspaceCard"><button class="pageBack secondary" data-close>← Back</button><div class="kicker">Library source</div><h2 id="libraryRecordTitle"></h2><p id="libraryRecordMeta"></p><hr class="rule"><p id="libraryRecordDesc"></p><div id="libraryRecordFacts" class="list"></div><div class="actions" id="libraryRecordActions"></div></div></div>';
  document.body.appendChild(v);
  v.addEventListener('click', (e) => {
    if (e.target === v) v.classList.remove('open');
  });
  return v;
}
function openItem(item) {
  if (!item) return;
  const v = ensureRecordView();
  document.getElementById('libraryRecordTitle').textContent = item.title || 'Untitled source';
  document.getElementById('libraryRecordMeta').textContent = [
    item.author,
    item.item_type,
    item.publication_date ? new Date(item.publication_date).toLocaleDateString() : null,
  ]
    .filter(Boolean)
    .join(' · ');
  document.getElementById('libraryRecordDesc').textContent =
    item.description || 'No description has been added yet.';
  document.getElementById('libraryRecordFacts').innerHTML = [
    ['Rights', item.rights_status],
    ['Review', item.review_status],
    ['Tags', (item.tags || []).join(' · ')],
    ['Curator note', item.review_note],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `<div class="row"><h3>${esc(k)}</h3><p>${esc(v)}</p></div>`)
    .join('');
  const actions = document.getElementById('libraryRecordActions');
  actions.innerHTML = '';
  if (item.url)
    actions.insertAdjacentHTML(
      'beforeend',
      `<a class="secondary" href="${esc(item.url)}" target="_blank" rel="noopener">Open source</a>`,
    );
  if (item.storage_path) {
    const url = supabase.storage.from('oracle-library').getPublicUrl(item.storage_path)
      .data.publicUrl;
    if (url)
      actions.insertAdjacentHTML(
        'beforeend',
        `<a class="secondary" href="${esc(url)}" target="_blank" rel="noopener">Open attached ${esc(item.mime_type || 'file')}</a>`,
      );
  }
  v.classList.add('open');
  v.setAttribute('aria-hidden', 'false');
}
function renderTexts(filter = 'All') {
  const grid = document.getElementById('bookGrid');
  if (!grid) return;
  const list = filter === 'All' ? texts : texts.filter((t) => t.tradition === filter);
  grid.innerHTML =
    list
      .map(
        (t) =>
          `<article class="book"><button data-text-slug="${esc(t.slug)}"><strong>${esc(t.title)}</strong><small>${esc(t.tradition || 'Tradition not catalogued')}<br>${esc(t.period_label || 'Period not catalogued')}</small><span class="tag">Open research record</span></button></article>`,
      )
      .join('') || '<p class="libraryEmpty">No text records match this tradition yet.</p>';
  grid
    .querySelectorAll('[data-text-slug]')
    .forEach(
      (b) =>
        (b.onclick = () =>
          window.oracleTextPages?.open(texts.find((t) => t.slug === b.dataset.textSlug))),
    );
}
function renderLibraryItems() {
  const host = document.getElementById('librarySourcesGrid');
  if (!host) return;
  host.innerHTML = items.length
    ? items
        .map(
          (item) =>
            `<article class="libraryRecord ${item.featured ? 'featured' : ''}"><div><div class="kicker">${esc(item.item_type)}</div><h3>${esc(item.title)}</h3><div class="meta">${esc([item.author, item.publication_date ? new Date(item.publication_date).getFullYear() : null].filter(Boolean).join(' · '))}</div><p class="desc">${esc(item.description || 'No description has been added yet.')}</p><div>${(
              item.tags || []
            )
              .slice(0, 5)
              .map((t) => `<span class="tag">${esc(t)}</span>`)
              .join(
                '',
              )}</div></div><div class="recordActions"><button type="button" data-library-id="${esc(item.id)}">Open record</button>${item.url ? `<a href="${esc(item.url)}" target="_blank" rel="noopener">Open link</a>` : ''}</div></article>`,
        )
        .join('')
    : '<p class="libraryEmpty">No reviewed articles, reports or PDFs have been added to the public catalogue yet. An administrator can add them from the Admin console.</p>';
  host
    .querySelectorAll('[data-library-id]')
    .forEach((b) => (b.onclick = () => openItem(items.find((x) => x.id === b.dataset.libraryId))));
}
function renderFilters() {
  const box = document.getElementById('traditionTabs');
  if (!box) return;
  const vals = ['All', ...new Set(texts.map((t) => t.tradition).filter(Boolean))];
  box.innerHTML = `<div class="libraryFilterRow">${vals.map((x, i) => `<button class="${i === 0 ? 'active' : ''}" data-text-filter="${esc(x)}">${esc(x)}</button>`).join('')}</div>`;
  box.querySelectorAll('[data-text-filter]').forEach(
    (b) =>
      (b.onclick = () => {
        box.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        renderTexts(b.dataset.textFilter);
      }),
  );
}
async function load() {
  try {
    const [tRes, iRes] = await Promise.all([
      supabase.from('texts').select('*').order('title', { ascending: true }),
      supabase
        .from('library_items')
        .select('*')
        .eq('visible', true)
        .eq('review_status', 'approved')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false }),
    ]);
    texts = tRes.data || [];
    items = iRes.data || [];
    ensureSections();
    renderFilters();
    renderTexts();
    renderLibraryItems();
  } catch (err) {
    console.error('Oracle Library load failed', err);
    ensureSections();
    renderFilters();
    renderTexts();
    renderLibraryItems();
  }
}
function ensureSections() {
  const card = document.querySelector('#viewLibrary .workspaceCard');
  if (!card || document.getElementById('librarySourcesGrid')) return;
  card.insertAdjacentHTML(
    'beforeend',
    '<h3 class="librarySectionTitle">Research reports, articles & PDFs</h3><div class="bookGrid" id="librarySourcesGrid"></div>',
  );
}
function install() {
  ensureStyles();
  ensureSections();
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-view="library"]') || e.target.closest('#shelfHit'))
      setTimeout(() => {
        ensureSections();
        load();
      }, 60);
  });
  load();
}
if (document.readyState === 'loading')
  addEventListener('DOMContentLoaded', install, { once: true });
else install();
window.oracleLibrary = { refresh: load, openItem };
