import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const supabase = createClient(
  'https://bvnkoglvpljizeogslmp.supabase.co',
  'sb_publishable_ryjVjpVSMXv_HSbDUEsTZA_iZMc_w2G',
);
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>'"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c],
  );
let editingId = null;
function styles() {
  if (document.getElementById('oracleAdminStyles')) return;
  const s = document.createElement('style');
  s.id = 'oracleAdminStyles';
  s.textContent = `.adminView{position:fixed;inset:0;z-index:68;background:rgba(28,18,13,.94);display:none;overflow:auto}.adminView.open{display:block}.adminCard{max-width:1180px;margin:50px auto 40px;background:#efdab2;border:1px solid #765039;box-shadow:0 20px 80px rgba(0,0,0,.55);padding:28px}.adminClose{float:right;border:0;background:none;font-size:28px}.adminRow{padding:15px 0;border-bottom:1px solid #b08b61}.adminRow h3{font-weight:normal;margin:0 0 6px}.adminMeta{font-size:11px;color:#765c47}.adminActions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.adminBadge{display:inline-block;font-size:10px;text-transform:uppercase;letter-spacing:.12em;border:1px solid #9a7452;padding:4px 7px;color:#8d342c}.adminEmpty{padding:20px 0;color:#6d523d}.adminReviewNote,.adminEditor input,.adminEditor textarea,.adminEditor select{width:100%;border:1px solid #896442;background:#f3dfb6;color:#241812;padding:9px}.adminReviewNote{min-height:72px;margin-top:9px;resize:vertical}.adminEditor{border:1px solid #a27c55;background:rgba(255,240,199,.4);padding:16px;margin:18px 0}.adminEditorGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.adminEditor label{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#765c47;margin-bottom:4px}.adminAudit{font-size:11px;color:#765c47;margin-top:7px}.adminFile{margin-top:4px;font-size:11px}.adminSectionTitle{margin:24px 0 8px;font-weight:normal;font-size:22px;border-top:1px solid #a27c55;padding-top:20px}@media(max-width:700px){.adminCard{margin:10px;padding:18px}.adminEditorGrid{grid-template-columns:1fr}}`;
  document.head.appendChild(s);
}
async function isAdmin() {
  const { data, error } = await supabase.rpc('is_admin');
  return !error && data === true;
}
function editorHtml() {
  return `<div class="adminEditor" id="libraryEditor"><div class="kicker">Library catalogue</div><h3 style="font-weight:normal;margin:6px 0 14px">${editingId ? 'Edit library item' : 'Add a report, article or PDF'}</h3><div class="adminEditorGrid"><div><label>Title</label><input id="libTitle"></div><div><label>Author / organisation</label><input id="libAuthor"></div><div><label>Type</label><select id="libType"><option>article</option><option>report</option><option>pdf</option><option>book</option><option>paper</option><option>source</option></select></div><div><label>Publication date</label><input id="libDate" type="date"></div><div><label>Rights</label><select id="libRights"><option value="unknown">unknown</option><option value="public_domain">public_domain</option><option value="licensed">licensed</option><option value="restricted">restricted</option></select></div><div><label>Tags (comma separated)</label><input id="libTags" placeholder="Tantra, history, ritual"></div><div style="grid-column:1/-1"><label>Description</label><textarea id="libDescription" rows="4"></textarea></div><div style="grid-column:1/-1"><label>Lawful source URL (for articles / external PDFs)</label><input id="libUrl" type="url" placeholder="https://…"></div><div style="grid-column:1/-1"><label>Attach public-domain / licensed PDF or document</label><input id="libFile" type="file" accept="application/pdf,text/plain,text/markdown,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"></div><div><label>Visible in public Library</label><select id="libVisible"><option value="false">No — keep in curator queue</option><option value="true">Yes</option></select></div><div><label>Featured</label><select id="libFeatured"><option value="false">No</option><option value="true">Yes</option></select></div></div><div class="adminActions"><button class="primary" id="libSave">${editingId ? 'Save changes' : 'Add to Library'}</button><button class="secondary" id="libCancel">Cancel</button></div><p class="adminMeta">Restricted or unknown material can remain in the curator database with a lawful link, but it will not be published as a downloadable library file.</p></div>`;
}
function showEditor(row = null) {
  editingId = row?.id || null;
  const host = document.getElementById('libraryEditorHost');
  host.innerHTML = editorHtml();
  if (row) {
    for (const [id, val] of [
      ['libTitle', row.title],
      ['libAuthor', row.author],
      ['libDate', row.publication_date || ''],
      ['libTags', (row.tags || []).join(', ')],
      ['libDescription', row.description],
      ['libUrl', row.url],
    ]) {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    }
    document.getElementById('libType').value = row.item_type || 'article';
    document.getElementById('libRights').value = row.rights_status || 'unknown';
    document.getElementById('libVisible').value = String(!!row.visible);
    document.getElementById('libFeatured').value = String(!!row.featured);
  }
  document.getElementById('libSave').onclick = saveLibraryItem;
  document.getElementById('libCancel').onclick = () => {
    editingId = null;
    host.innerHTML = '';
  };
  host.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
async function saveLibraryItem() {
  if (!(await isAdmin())) return;
  const title = document.getElementById('libTitle').value.trim();
  if (!title) {
    alert('Title is required.');
    return;
  }
  const rights = document.getElementById('libRights').value;
  const file = document.getElementById('libFile')?.files?.[0] || null;
  if (file && !['public_domain', 'licensed'].includes(rights)) {
    alert('Attached public library files require public-domain or licensed rights.');
    return;
  }
  let storage_path = null;
  let mime_type = file?.type || null;
  if (file) {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-');
    storage_path = `${crypto.randomUUID()}-${safe}`;
    const up = await supabase.storage
      .from('oracle-library')
      .upload(storage_path, file, {
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      });
    if (up.error) {
      alert(up.error.message);
      return;
    }
  }
  const payload = {
    title,
    author: document.getElementById('libAuthor').value.trim() || null,
    item_type: document.getElementById('libType').value,
    publication_date: document.getElementById('libDate').value || null,
    description: document.getElementById('libDescription').value.trim() || null,
    url: document.getElementById('libUrl').value.trim() || null,
    rights_status: rights,
    tags: document
      .getElementById('libTags')
      .value.split(',')
      .map((x) => x.trim())
      .filter(Boolean),
    featured: document.getElementById('libFeatured').value === 'true',
    visible: document.getElementById('libVisible').value === 'true',
    review_status: rights === 'restricted' || rights === 'unknown' ? 'needs_review' : 'approved',
    review_note: null,
    ...(storage_path ? { storage_path, mime_type } : {}),
  };
  let result;
  if (editingId) {
    result = await supabase.from('library_items').update(payload).eq('id', editingId);
  } else {
    const { data: userData } = await supabase.auth.getUser();
    payload.created_by = userData.user?.id || null;
    result = await supabase.from('library_items').insert(payload);
  }
  if (result.error) {
    if (storage_path) await supabase.storage.from('oracle-library').remove([storage_path]);
    alert(result.error.message);
    return;
  }
  editingId = null;
  document.getElementById('libraryEditorHost').innerHTML = '';
  await loadLibraryItems();
  window.oracleLibrary?.refresh();
  alert('Library catalogue updated.');
}
async function deleteLibraryItem(id) {
  if (!(await isAdmin())) return;
  if (!confirm('Remove this Library record?')) return;
  const { data: r } = await supabase
    .from('library_items')
    .select('storage_path')
    .eq('id', id)
    .single();
  const { error } = await supabase.from('library_items').delete().eq('id', id);
  if (error) {
    alert(error.message);
    return;
  }
  if (r?.storage_path) await supabase.storage.from('oracle-library').remove([r.storage_path]);
  loadLibraryItems();
  window.oracleLibrary?.refresh();
}
async function loadLibraryItems() {
  const host = document.getElementById('adminLibraryList');
  if (!host) return;
  const { data, error } = await supabase
    .from('library_items')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    host.innerHTML = '<p class="adminEmpty">Unable to load Library catalogue.</p>';
    return;
  }
  host.innerHTML = data?.length
    ? data
        .map(
          (r) =>
            `<article class="adminRow"><h3>${esc(r.title)}</h3><div class="adminMeta">${esc(r.author || 'Unknown')} · ${esc(r.item_type)} · rights: ${esc(r.rights_status)} · <span class="adminBadge">${esc(r.review_status)}</span> · ${r.visible ? 'public' : 'hidden'}</div><p>${esc(r.description || 'No description.')}</p>${r.url ? `<p><a href="${esc(r.url)}" target="_blank" rel="noopener">Open lawful source</a></p>` : ''}${r.storage_path ? `<p class="adminFile">Attached file: ${esc(r.storage_path)}</p>` : ''}<div class="adminActions"><button class="secondary" data-edit-library="${r.id}">Edit</button><button class="secondary" data-delete-library="${r.id}">Delete</button></div>${r.updated_at ? `<div class="adminAudit">Updated ${new Date(r.updated_at).toLocaleString()}</div>` : ''}</article>`,
        )
        .join('')
    : '<p class="adminEmpty">No Library records yet.</p>';
  host.querySelectorAll('[data-edit-library]').forEach(
    (b) =>
      (b.onclick = async () => {
        const { data: r } = await supabase
          .from('library_items')
          .select('*')
          .eq('id', b.dataset.editLibrary)
          .single();
        if (r) showEditor(r);
      }),
  );
  host
    .querySelectorAll('[data-delete-library]')
    .forEach((b) => (b.onclick = () => deleteLibraryItem(b.dataset.deleteLibrary)));
}
async function loadSources() {
  const list = document.getElementById('adminList');
  if (!list) return;
  if (!(await isAdmin())) {
    list.innerHTML =
      '<p class="adminEmpty">Admin access is not enabled for this researcher account.</p>';
    return;
  }
  const { data, error } = await supabase
    .from('source_submissions')
    .select(
      'id,user_id,title,author,source_type,rights_status,review_status,url,description,storage_path,created_at,reviewed_at,review_note',
    )
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    list.innerHTML = '<p class="adminEmpty">Unable to load source submissions.</p>';
    return;
  }
  list.innerHTML = data?.length
    ? data
        .map((r) => {
          const canApprove = ['public_domain', 'licensed'].includes(r.rights_status);
          return `<article class="adminRow"><h3>${esc(r.title)}</h3><div class="adminMeta">${esc(r.author || 'Unknown author')} · ${esc(r.source_type)} · rights: ${esc(r.rights_status)} · <span class="adminBadge">${esc(r.review_status)}</span></div><p>${esc(r.description || 'No research note provided.')}</p>${r.url ? `<p><a href="${esc(r.url)}" target="_blank" rel="noopener">Open lawful source</a></p>` : ''}${r.storage_path ? '<p class="adminMeta">Private source file attached.</p>' : ''}<textarea class="adminReviewNote" data-review-note="${r.id}" placeholder="Curator review note (optional)…">${esc(r.review_note || '')}</textarea><div class="adminActions"><button class="primary" data-review="approved" data-id="${r.id}" ${canApprove ? '' : 'disabled title="Only public-domain/licensed sources may be approved for corpus"'}>Approve for corpus</button><button class="secondary" data-review="rejected" data-id="${r.id}">Reject</button><button class="secondary" data-review="needs_review" data-id="${r.id}">Needs review</button></div>${r.reviewed_at ? `<div class="adminAudit">Last review: ${new Date(r.reviewed_at).toLocaleString()}</div>` : ''}</article>`;
        })
        .join('')
    : '<p class="adminEmpty">No source submissions.</p>';
  list
    .querySelectorAll('[data-review]')
    .forEach((b) => (b.onclick = () => review(b.dataset.id, b.dataset.review)));
}
async function review(id, status) {
  if (!(await isAdmin())) return;
  const note =
    document.querySelector(`[data-review-note="${CSS.escape(id)}"]`)?.value.trim() || null;
  if (status === 'approved') {
    const { data: r } = await supabase
      .from('source_submissions')
      .select('rights_status')
      .eq('id', id)
      .single();
    if (!r || !['public_domain', 'licensed'].includes(r.rights_status)) {
      alert('Only public-domain or licensed sources can be approved for corpus use.');
      return;
    }
  }
  const { error } = await supabase
    .from('source_submissions')
    .update({ review_status: status, review_note: note, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) alert(error.message);
  else loadSources();
}
async function load() {
  const list = document.getElementById('adminList');
  if (!list) return;
  if (!(await isAdmin())) {
    list.innerHTML =
      '<p class="adminEmpty">Admin access is not enabled for this researcher account.</p>';
    return;
  }
  const host = document.getElementById('libraryEditorHost');
  if (!host.innerHTML) showEditor();
  loadLibraryItems();
  loadSources();
}
function build() {
  styles();
  const rail = document.querySelector('.rail');
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = 'Admin';
  b.hidden = true;
  b.dataset.adminNav = '1';
  rail?.appendChild(b);
  const v = document.createElement('section');
  v.id = 'oracleAdmin';
  v.className = 'adminView';
  v.innerHTML =
    '<div class="adminCard"><button class="adminClose" id="adminClose">×</button><div class="kicker">Curator console</div><h2>Library & source governance</h2><p class="sourceHint">Add real reports, articles, papers, books and PDFs to the catalogue. Public-domain or licensed uploads can be published as Library files; restricted or unknown works stay as metadata/lawful links until reviewed.</p><div id="libraryEditorHost"></div><h3 class="adminSectionTitle">Library catalogue</h3><div id="adminLibraryList"></div><h3 class="adminSectionTitle">Source submissions</h3><div id="adminList"></div></div></section>';
  document.body.appendChild(v);
  b.onclick = () => {
    v.classList.add('open');
    load();
  };
  document.getElementById('adminClose').onclick = () => v.classList.remove('open');
  v.addEventListener('click', (e) => {
    if (e.target === v) v.classList.remove('open');
  });
  supabase.auth.onAuthStateChange(() => refreshNav());
  refreshNav();
}
async function refreshNav() {
  const b = document.querySelector('[data-admin-nav]');
  if (!b) return;
  b.hidden = !(await isAdmin());
}
if (document.readyState === 'loading') addEventListener('DOMContentLoaded', build, { once: true });
else build();
