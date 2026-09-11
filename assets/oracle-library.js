import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(
  'https://bvnkoglvpljizeogslmp.supabase.co',
  'sb_publishable_ryjVjpVSMXv_HSbDUEsTZA_iZMc_w2G',
);

const esc = (s) =>
  String(s ?? '').replace(
    /[&<>'\"]/g,
    (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '\"': '&quot;',
    })[c],
  );

let texts = [];
let items = [];
let activeTextFilter = 'All';
let activeItemFilter = 'all';
let itemQuery = '';

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
  style.textContent = `
    .librarySectionTitle {
      margin: 42px 0 8px;
      padding-top: 24px;
      border-top: 1px solid #a27c55;
      font-weight: normal;
      font-size: 24px;
    }

    .librarySectionIntro {
      margin: 0 0 16px;
      color: #6d523d;
      line-height: 1.55;
    }

    .libraryToolbar {
      display: grid;
      gap: 10px;
      margin: 0 0 18px;
      padding: 14px;
      border: 1px solid #a27c55;
      background: rgba(255, 240, 199, 0.34);
    }

    .librarySearch {
      width: 100%;
      border: 1px solid #896442;
      background: #f3dfb6;
      color: #241812;
      padding: 11px 13px;
    }

    .libraryFormatFilters {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .libraryFormatFilters button {
      border: 1px solid #8b6647;
      background: #ead2a7;
      color: #241812;
      padding: 7px 10px;
    }

    .libraryFormatFilters button.active {
      background: #71342b;
      color: #f8dfb0;
    }

    .libraryCount {
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #765c47;
    }

    .libraryRecord {
      min-height: 170px;
      padding: 17px;
      border: 1px solid #997451;
      background: rgba(255, 240, 199, 0.5);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .libraryRecord.featured {
      border-width: 2px;
    }

    .libraryRecord h3 {
      margin: 0 0 6px;
      font-weight: normal;
      line-height: 1.25;
    }

    .libraryRecord .meta {
      font-size: 11px;
      color: #765c47;
      line-height: 1.5;
    }

    .libraryRecord .desc {
      margin: 9px 0;
      color: #5d4737;
      font-size: 13px;
      line-height: 1.55;
    }

    .libraryRecord .recordActions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 12px;
    }

    .libraryRecord .recordActions a,
    .libraryRecord .recordActions button {
      border: 1px solid #8b6647;
      background: #ead2a7;
      color: #241812;
      padding: 7px 9px;
      text-decoration: none;
    }

    .libraryRecord .recordActions .primaryRecordAction {
      background: #71342b;
      color: #f8dfb0;
      border-color: #71342b;
    }

    .libraryEmpty {
      padding: 16px 0;
      color: #6d523d;
    }

    .libraryFilterRow {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .libraryFilterRow button.active {
      background: #71342b;
      color: #f8dfb0;
    }

    @media (max-width: 650px) {
      .librarySectionTitle {
        font-size: 21px;
        margin-top: 32px;
      }
    }
  `;

  document.head.appendChild(style);
}

function ensureRecordView() {
  let view = document.getElementById('libraryRecordView');
  if (view) return view;

  view = document.createElement('section');
  view.id = 'libraryRecordView';
  view.className = 'view';
  view.setAttribute('aria-hidden', 'true');
  view.innerHTML = `
    <div class="workspace">
      <div class="workspaceCard">
        <button class="pageBack secondary" data-close>← Back</button>
        <div class="kicker">Library source</div>
        <h2 id="libraryRecordTitle"></h2>
        <p id="libraryRecordMeta"></p>
        <hr class="rule">
        <p id="libraryRecordDesc"></p>
        <div id="libraryRecordFacts" class="list"></div>
        <div class="actions" id="libraryRecordActions"></div>
      </div>
    </div>
  `;

  document.body.appendChild(view);

  view.addEventListener('click', (event) => {
    if (event.target === view) {
      view.classList.remove('open');
      view.setAttribute('aria-hidden', 'true');
    }
  });

  return view;
}

function openItem(item) {
  if (!item) return;

  const view = ensureRecordView();

  document.getElementById('libraryRecordTitle').textContent =
    item.title || 'Untitled source';

  document.getElementById('libraryRecordMeta').textContent = [
    item.author,
    item.item_type,
    item.publication_date
      ? new Date(item.publication_date).toLocaleDateString()
      : null,
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
    .filter(([, value]) => value)
    .map(
      ([key, value]) =>
        `<div class="row"><h3>${esc(key)}</h3><p>${esc(value)}</p></div>`,
    )
    .join('');

  const actions = document.getElementById('libraryRecordActions');
  actions.innerHTML = '';

  if (item.url) {
    const isPdf = /\.pdf(?:$|[?#])/i.test(item.url) || item.item_type === 'pdf';
    actions.insertAdjacentHTML(
      'beforeend',
      `<a class="primaryRecordAction" href="${esc(item.url)}" target="_blank" rel="noopener">${
        isPdf ? 'Open PDF' : 'Open source'
      }</a>`,
    );
  }

  if (item.storage_path) {
    const url = supabase.storage
      .from('oracle-library')
      .getPublicUrl(item.storage_path).data.publicUrl;

    if (url) {
      actions.insertAdjacentHTML(
        'beforeend',
        `<a class="secondary" href="${esc(url)}" target="_blank" rel="noopener">Open attached ${esc(
          item.mime_type || 'file',
        )}</a>`,
      );
    }
  }

  view.classList.add('open');
  view.setAttribute('aria-hidden', 'false');
}

function renderTexts(filter = 'All') {
  const grid = document.getElementById('bookGrid');
  if (!grid) return;

  const list = filter === 'All' ? texts : texts.filter((t) => t.tradition === filter);

  grid.innerHTML =
    list
      .map(
        (text) => `
          <article class="book">
            <button data-text-slug="${esc(text.slug)}">
              <strong>${esc(text.title)}</strong>
              <small>
                ${esc(text.tradition || 'Tradition not catalogued')}<br>
                ${esc(text.period_label || 'Period not catalogued')}
              </small>
              <span class="tag">Open research record</span>
            </button>
          </article>
        `,
      )
      .join('') || '<p class="libraryEmpty">No text records match this tradition yet.</p>';

  grid.querySelectorAll('[data-text-slug]').forEach((button) => {
    button.onclick = () => {
      window.oracleTextPages?.open(
        texts.find((text) => text.slug === button.dataset.textSlug),
      );
    };
  });
}

function getFilteredItems() {
  const query = itemQuery.trim().toLowerCase();

  return items.filter((item) => {
    const matchesType =
      activeItemFilter === 'all' || item.item_type === activeItemFilter;

    if (!matchesType) return false;
    if (!query) return true;

    const haystack = [
      item.title,
      item.author,
      item.description,
      item.item_type,
      ...(item.tags || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

function renderLibraryItems() {
  const host = document.getElementById('librarySourcesGrid');
  const count = document.getElementById('libraryItemCount');
  if (!host) return;

  const filtered = getFilteredItems();

  if (count) {
    count.textContent = `${filtered.length} catalogue item${filtered.length === 1 ? '' : 's'}`;
  }

  host.innerHTML = filtered.length
    ? filtered
        .map(
          (item) => `
            <article class="libraryRecord ${item.featured ? 'featured' : ''}">
              <div>
                <div class="kicker">${esc(item.item_type)}</div>
                <h3>${esc(item.title)}</h3>
                <div class="meta">
                  ${esc(
                    [
                      item.author,
                      item.publication_date
                        ? new Date(item.publication_date).getFullYear()
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · '),
                  )}
                </div>
                <p class="desc">${esc(
                  item.description || 'No description has been added yet.',
                )}</p>
                <div>
                  ${(item.tags || [])
                    .slice(0, 5)
                    .map((tag) => `<span class="tag">${esc(tag)}</span>`)
                    .join('')}
                </div>
              </div>
              <div class="recordActions">
                <button type="button" class="primaryRecordAction" data-library-id="${esc(
                  item.id,
                )}">Open record</button>
                ${
                  item.url
                    ? `<a href="${esc(item.url)}" target="_blank" rel="noopener">${
                        item.item_type === 'pdf' ? 'PDF' : 'Source'
                      }</a>`
                    : ''
                }
              </div>
            </article>
          `,
        )
        .join('')
    : '<p class="libraryEmpty">No catalogue items match this search or format.</p>';

  host.querySelectorAll('[data-library-id]').forEach((button) => {
    button.onclick = () =>
      openItem(items.find((item) => item.id === button.dataset.libraryId));
  });
}

function renderFilters() {
  const box = document.getElementById('traditionTabs');
  if (!box) return;

  const values = ['All', ...new Set(texts.map((text) => text.tradition).filter(Boolean))];

  box.innerHTML = `
    <div class="libraryFilterRow">
      ${values
        .map(
          (value, index) =>
            `<button class="${index === 0 ? 'active' : ''}" data-text-filter="${esc(
              value,
            )}">${esc(value)}</button>`,
        )
        .join('')}
    </div>
  `;

  box.querySelectorAll('[data-text-filter]').forEach((button) => {
    button.onclick = () => {
      box
        .querySelectorAll('button')
        .forEach((node) => node.classList.remove('active'));
      button.classList.add('active');
      activeTextFilter = button.dataset.textFilter || 'All';
      renderTexts(activeTextFilter);
    };
  });
}

function ensureSections() {
  const card = document.querySelector('#viewLibrary .workspaceCard');
  if (!card || document.getElementById('librarySourcesGrid')) return;

  card.insertAdjacentHTML(
    'beforeend',
    `
      <section aria-labelledby="libraryResearchHeading">
        <h3 class="librarySectionTitle" id="libraryResearchHeading">
          Research reports, articles & PDFs
        </h3>
        <p class="librarySectionIntro">
          Curated scholarly material approved by the Oracle's source governance layer.
          Open records lead to the lawful publisher or attached licensed/public-domain file.
        </p>
        <div class="libraryToolbar">
          <input
            class="librarySearch"
            id="librarySearch"
            type="search"
            autocomplete="off"
            placeholder="Search reports, articles, authors, subjects…"
            aria-label="Search the Library research catalogue"
          >
          <div class="libraryFormatFilters" id="libraryFormatFilters" role="group" aria-label="Filter research material by format"></div>
          <div class="libraryCount" id="libraryItemCount"></div>
        </div>
        <div class="bookGrid" id="librarySourcesGrid"></div>
      </section>
    `,
  );

  const search = document.getElementById('librarySearch');
  search?.addEventListener('input', () => {
    itemQuery = search.value;
    renderLibraryItems();
  });

  const filterBox = document.getElementById('libraryFormatFilters');
  const formats = [
    ['all', 'All'],
    ['article', 'Articles'],
    ['pdf', 'PDFs'],
    ['report', 'Reports'],
    ['book', 'Books'],
    ['paper', 'Papers'],
  ];

  filterBox.innerHTML = formats
    .map(
      ([value, label], index) =>
        `<button class="${index === 0 ? 'active' : ''}" data-item-filter="${value}">${label}</button>`,
    )
    .join('');

  filterBox.querySelectorAll('[data-item-filter]').forEach((button) => {
    button.onclick = () => {
      filterBox
        .querySelectorAll('button')
        .forEach((node) => node.classList.remove('active'));
      button.classList.add('active');
      activeItemFilter = button.dataset.itemFilter || 'all';
      renderLibraryItems();
    };
  });
}

async function load() {
  try {
    const [textResult, itemResult] = await Promise.all([
      supabase.from('texts').select('*').order('title', { ascending: true }),
      supabase
        .from('library_items')
        .select('*')
        .eq('visible', true)
        .eq('review_status', 'approved')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false }),
    ]);

    if (textResult.error) console.warn('Text catalogue load:', textResult.error.message);
    if (itemResult.error) console.warn('Research catalogue load:', itemResult.error.message);

    texts = textResult.data || [];
    items = itemResult.data || [];

    ensureSections();
    renderFilters();
    renderTexts(activeTextFilter);
    renderLibraryItems();
  } catch (error) {
    console.error('Oracle Library load failed', error);
    ensureSections();
    renderFilters();
    renderTexts(activeTextFilter);
    renderLibraryItems();
  }
}

function install() {
  ensureStyles();
  ensureSections();

  document.addEventListener('click', (event) => {
    if (
      event.target.closest('[data-view="library"]') ||
      event.target.closest('#shelfHit')
    ) {
      setTimeout(() => {
        ensureSections();
        load();
      }, 60);
    }
  });

  load();
}

if (document.readyState === 'loading') {
  addEventListener('DOMContentLoaded', install, { once: true });
} else {
  install();
}

window.oracleLibrary = {
  refresh: load,
  openItem,
};
