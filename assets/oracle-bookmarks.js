import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient('https://bvnkoglvpljizeogslmp.supabase.co', 'sb_publishable_ryjVjpVSMXv_HSbDUEsTZA_iZMc_w2G');
const slugById = {vbt:'vijnana-bhairava-tantra',tantraloka:'tantraloka',kularnava:'kularnava-tantra',devimahatmya:'devi-mahatmya',hevajra:'hevajra-tantra',shaktisangama:'shaktisangama-tantra'};

async function user(){const {data}=await supabase.auth.getUser();return data.user||null}
async function syncLocal(){
  const u=await user(); if(!u)return;
  const ids=JSON.parse(localStorage.getItem('oracleBookmarks')||'[]'); if(!ids.length)return;
  const slugs=ids.map(id=>slugById[id]||id);
  const {data:texts}=await supabase.from('texts').select('id,slug').in('slug',slugs); if(!texts)return;
  const rows=texts.map(t=>({user_id:u.id,text_id:t.id}));
  if(rows.length) await supabase.from('bookmarks').upsert(rows,{onConflict:'user_id,text_id'});
}
async function restore(){
  const u=await user(); if(!u)return;
  const {data}=await supabase.from('bookmarks').select('text_id,texts(slug)').order('created_at',{ascending:false}).limit(200); if(!data)return;
  const reverse=Object.fromEntries(Object.entries(slugById).map(([id,slug])=>[slug,id]));
  const ids=data.map(x=>reverse[x.texts?.slug]||x.texts?.slug).filter(Boolean);
  localStorage.setItem('oracleBookmarks',JSON.stringify(ids));
}
function styles(){const s=document.createElement('style');s.textContent=`.bookmarkView{position:fixed;inset:0;z-index:64;background:rgba(28,18,13,.9);display:none;overflow:auto}.bookmarkView.open{display:block}.bookmarkCard{max-width:900px;margin:70px auto 40px;background:#efdab2;border:1px solid #765039;box-shadow:0 20px 80px rgba(0,0,0,.55);padding:28px}.bookmarkClose{float:right;border:0;background:none;font-size:28px}.bookmarkEmpty{color:#6d523d}@media(max-width:700px){.bookmarkCard{margin:10px;padding:18px}}`;document.head.appendChild(s)}
function addPanel(){const rail=document.querySelector('.rail');if(!rail||rail.querySelector('[data-bookmark-nav]'))return;const b=document.createElement('button');b.type='button';b.textContent='Bookmarks';b.dataset.bookmarkNav='1';rail.appendChild(b);b.onclick=open}
function open(){document.getElementById('oracleBookmarks')?.classList.add('open');render()}
function close(){document.getElementById('oracleBookmarks')?.classList.remove('open')}
async function render(){const list=document.getElementById('bookmarkList');if(!list)return;const ids=JSON.parse(localStorage.getItem('oracleBookmarks')||'[]');if(!ids.length){list.innerHTML='<p class="bookmarkEmpty">No bookmarked texts yet.</p>';return}const slugs=ids.map(id=>slugById[id]||id);const {data}=await supabase.from('texts').select('slug,title,tradition,period_label').in('slug',slugs);const bySlug=new Map((data||[]).map(x=>[x.slug,x]));list.innerHTML=ids.map(id=>{const r=bySlug.get(slugById[id]||id);return r?`<div class="row"><h3>${esc(r.title)}</h3><p>${esc(r.tradition||'')} · ${esc(r.period_label||'')}</p><button class="secondary" data-bm-open="${esc(id)}">Open in Library</button></div>`:''}).join('')||'<p class="bookmarkEmpty">Your saved records are not in the catalogue yet.</p>';list.querySelectorAll('[data-bm-open]').forEach(b=>b.onclick=()=>openText(b.dataset.bmOpen))}
function openText(id){close();const nav=[...document.querySelectorAll('.rail button')].find(b=>b.dataset.view==='library');if(nav)nav.click();setTimeout(()=>{const b=document.querySelector(`[data-book="${CSS.escape(id)}"]`);if(b)b.click()},80)}
function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function build(){styles();addPanel();const v=document.createElement('section');v.id='oracleBookmarks';v.className='bookmarkView';v.innerHTML='<div class="bookmarkCard"><button class="bookmarkClose" id="bookmarkClose">×</button><div class="kicker">Saved texts</div><h2>Bookmarks</h2><p class="sourceHint">Your bookmarked texts sync to your researcher account when signed in.</p><div id="bookmarkList" class="list"></div></div>';document.body.appendChild(v);document.getElementById('bookmarkClose').onclick=close;restore().then(render)}
supabase.auth.onAuthStateChange(async(_e,session)=>{if(session?.user){await syncLocal();await restore();render()}});
addEventListener('DOMContentLoaded',build,{once:true});
