import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient('https://bvnkoglvpljizeogslmp.supabase.co', 'sb_publishable_ryjVjpVSMXv_HSbDUEsTZA_iZMc_w2G');

async function user(){const {data}=await supabase.auth.getUser();return data.user||null}
async function syncLocal(){
  const u=await user(); if(!u)return;
  const ids=JSON.parse(localStorage.getItem('oracleBookmarks')||'[]'); if(!ids.length)return;
  const {data:texts}=await supabase.from('texts').select('id,slug'); if(!texts)return;
  const rows=ids.map(slug=>texts.find(t=>t.slug===slug)).filter(Boolean).map(t=>({user_id:u.id,text_id:t.id})); if(!rows.length)return;
  await supabase.from('bookmarks').upsert(rows,{onConflict:'user_id,text_id'}); 
}
async function restore(){
  const u=await user(); if(!u)return;
  const {data}=await supabase.from('bookmarks').select('text_id, texts(slug)').order('created_at',{ascending:false}).limit(200); if(!data)return;
  const ids=data.map(x=>x.texts?.slug).filter(Boolean); localStorage.setItem('oracleBookmarks',JSON.stringify(ids));
}
function addPanel(){
  const rail=document.querySelector('.rail'); if(!rail||rail.querySelector('[data-bookmark-nav]'))return;
  const b=document.createElement('button'); b.type='button'; b.textContent='Bookmarks'; b.dataset.bookmarkNav='1'; rail.appendChild(b); b.onclick=()=>open();
}
function open(){
  const v=document.getElementById('oracleBookmarks'); if(v)v.classList.add('open'); render();
}
function close(){document.getElementById('oracleBookmarks')?.classList.remove('open')}
function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function render(){
  let v=document.getElementById('oracleBookmarks'); if(!v)return;
  const ids=JSON.parse(localStorage.getItem('oracleBookmarks')||'[]');
  const starter=window.oracleTextCatalogue||[];
  const rows=ids.map(id=>starter.find(t=>t.id===id||t.slug===id)||null).filter(Boolean);
  const list=v.querySelector('#bookmarkList');
  list.innerHTML=rows.length?rows.map(t=>`<div class="row"><h3>${esc(t.title)}</h3><p>${esc(t.tradition||'')} · ${esc(t.period||t.period_label||'')}</p><button class="secondary" data-bm-book="${esc(t.id||t.slug)}">Open text</button></div>`).join(''):'<p class="sourceHint">No bookmarked texts yet.</p>';
  list.querySelectorAll('[data-bm-book]').forEach(b=>b.onclick=()=>{const id=b.dataset.bmBook;const t=starter.find(x=>(x.id||x.slug)===id);if(t&&typeof window.oracleOpenText==='function'){close();window.oracleOpenText(t)}});
}
function styles(){const s=document.createElement('style');s.textContent=`.bookmarkView{position:fixed;inset:0;z-index:64;background:rgba(28,18,13,.9);display:none;overflow:auto}.bookmarkView.open{display:block}.bookmarkCard{max-width:900px;margin:70px auto 40px;background:#efdab2;border:1px solid #765039;box-shadow:0 20px 80px rgba(0,0,0,.55);padding:28px}.bookmarkClose{float:right;border:0;background:none;font-size:28px}@media(max-width:700px){.bookmarkCard{margin:10px;padding:18px}}`;document.head.appendChild(s)}
function build(){styles();addPanel();const v=document.createElement('section');v.id='oracleBookmarks';v.className='bookmarkView';v.innerHTML='<div class="bookmarkCard"><button class="bookmarkClose" id="bookmarkClose">×</button><div class="kicker">Saved texts</div><h2>Bookmarks</h2><p class="sourceHint">Your bookmarked texts sync to your researcher account when signed in.</p><div id="bookmarkList" class="list"></div></div>';document.body.appendChild(v);document.getElementById('bookmarkClose').onclick=close;restore().then(render)}
supabase.auth.onAuthStateChange(async (_e,session)=>{if(session?.user){await syncLocal();await restore();render()}});
addEventListener('DOMContentLoaded',build,{once:true});
