import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const supabase = createClient(
  'https://bvnkoglvpljizeogslmp.supabase.co',
  'sb_publishable_ryjVjpVSMXv_HSbDUEsTZA_iZMc_w2G',
);
const esc = (s) =>
  String(s || '').replace(
    /[&<>'"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c],
  );
function styles() {
  const s = document.createElement('style');
  s.textContent = `.projectView{position:fixed;inset:0;z-index:65;background:rgba(28,18,13,.9);display:none;overflow:auto}.projectView.open{display:block}.projectCard{max-width:1120px;margin:70px auto 40px;background:#efdab2;border:1px solid #765039;box-shadow:0 20px 80px rgba(0,0,0,.55);padding:28px}.projectClose{float:right;border:0;background:none;font-size:28px}.projectGrid{display:grid;grid-template-columns:.8fr 1.2fr;gap:18px}.projectList{border-top:1px solid #a27c55}.projectRow{padding:14px 0;border-bottom:1px solid #b08b61}.projectRow h3{margin:0;font-weight:normal}.projectRow p{margin:5px 0;color:#5d4737;line-height:1.5}.projectBadge{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#8d342c}.projectForm input,.projectForm textarea{width:100%;border:1px solid #896442;background:#f3dfb6;color:#241812;padding:10px}.projectForm textarea{min-height:120px;resize:vertical}.projectActions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}@media(max-width:700px){.projectCard{margin:10px;padding:18px}.projectGrid{grid-template-columns:1fr}}`;
  document.head.appendChild(s);
}
function addNav() {
  const rail = document.querySelector('.rail');
  if (!rail || rail.querySelector('[data-project-nav]')) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = 'Projects';
  b.dataset.projectNav = '1';
  rail.appendChild(b);
  b.onclick = openView;
}
function openView() {
  document.getElementById('oracleProjects')?.classList.add('open');
  loadProjects();
}
function closeView() {
  document.getElementById('oracleProjects')?.classList.remove('open');
}
async function user() {
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}
async function loadProjects() {
  const list = document.getElementById('projectList');
  if (!list) return;
  const u = await user();
  if (!u) {
    list.innerHTML =
      '<p class="sourceHint">Sign in from Profile to save projects across devices.</p>';
    return;
  }
  const { data, error } = await supabase
    .from('research_projects')
    .select('id,title,question,status,created_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(50);
  if (error) {
    list.innerHTML = '<p class="sourceHint">Unable to load projects.</p>';
    return;
  }
  list.innerHTML = data?.length
    ? data
        .map(
          (p) =>
            `<article class="projectRow"><h3>${esc(p.title)}</h3><div class="projectBadge">${esc(p.status)}${window.oracleActiveProjectId === p.id ? ' · current' : ''}</div><p>${esc(p.question || 'No research question yet.')}</p><div class="projectActions"><button class="secondary" data-project="${p.id}">Open in Research</button><button class="secondary" data-project-archive="${p.id}" data-next-status="${p.status === 'active' ? 'archived' : 'active'}">${p.status === 'active' ? 'Archive' : 'Reactivate'}</button><button class="secondary" data-project-delete="${p.id}">Delete</button></div></article>`,
        )
        .join('')
    : '<p class="sourceHint">No projects yet.</p>';
  list
    .querySelectorAll('[data-project]')
    .forEach((b) => (b.onclick = () => openResearch(b.dataset.project, data || [])));
  list
    .querySelectorAll('[data-project-archive]')
    .forEach((b) => (b.onclick = () => setStatus(b.dataset.projectArchive, b.dataset.nextStatus)));
  list
    .querySelectorAll('[data-project-delete]')
    .forEach((b) => (b.onclick = () => deleteProject(b.dataset.projectDelete)));
}
async function createProject(e) {
  e.preventDefault();
  const u = await user(),
    msg = document.getElementById('projectMessage');
  if (!u) {
    msg.textContent = 'Sign in from Profile before creating a project.';
    return;
  }
  const title = document.getElementById('projectTitle').value.trim(),
    question = document.getElementById('projectQuestion').value.trim();
  if (!title) {
    msg.textContent = 'Project title is required.';
    return;
  }
  const { error } = await supabase
    .from('research_projects')
    .insert({ user_id: u.id, title, question: question || null, status: 'active' });
  msg.textContent = error ? error.message : 'Project created.';
  if (!error) {
    document.getElementById('projectForm').reset();
    loadProjects();
  }
}
async function setStatus(id, status) {
  const u = await user();
  if (!u) return;
  const { error } = await supabase
    .from('research_projects')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', u.id);
  if (error) alert(error.message);
  else loadProjects();
}
async function deleteProject(id) {
  const u = await user();
  if (
    !u ||
    !confirm(
      'Delete this research project? Linked notes remain, but the project grouping will be removed.',
    )
  )
    return;
  const { error } = await supabase
    .from('research_projects')
    .delete()
    .eq('id', id)
    .eq('user_id', u.id);
  if (error) alert(error.message);
  else {
    if (window.oracleActiveProjectId === id) {
      window.oracleActiveProjectId = null;
      window.oracleActiveProjectTitle = null;
    }
    loadProjects();
  }
}
function openResearch(id, projects) {
  const p = projects.find((x) => x.id === id);
  if (!p) return;
  document.getElementById('oracleProjects').classList.remove('open');
  const view = document.getElementById('viewResearch');
  if (view) {
    view.classList.add('open');
    document
      .querySelectorAll('.rail button')
      .forEach((b) => b.classList.toggle('active', b.dataset.view === 'research'));
    const q = document.getElementById('researchQuestion');
    if (q) q.value = p.question || '';
    window.oracleActiveProjectId = id;
    window.oracleActiveProjectTitle = p.title;
  }
}
function build() {
  styles();
  addNav();
  const v = document.createElement('section');
  v.id = 'oracleProjects';
  v.className = 'projectView';
  v.innerHTML = `<div class="projectCard"><button class="projectClose" id="projectClose">×</button><div class="kicker">Research notebook</div><h2>Projects</h2><p class="sourceHint">Keep questions, notes, sources and Oracle conversations grouped into persistent research projects.</p><div class="projectGrid"><form class="projectForm" id="projectForm"><div class="field"><label>Project title</label><input id="projectTitle" placeholder="e.g. The 112 dhāraṇās"></div><div class="field"><label>Research question</label><textarea id="projectQuestion" placeholder="What do you want to investigate?"></textarea></div><button class="primary" type="submit">Create project</button><span id="projectMessage" class="sourceHint"></span></form><div><div class="kicker">Your projects</div><div id="projectList" class="projectList"><p class="sourceHint">Sign in to load projects.</p></div></div></div></div>`;
  document.body.appendChild(v);
  document.getElementById('projectClose').onclick = closeView;
  document.getElementById('projectForm').onsubmit = createProject;
}
addEventListener('DOMContentLoaded', build, { once: true });
