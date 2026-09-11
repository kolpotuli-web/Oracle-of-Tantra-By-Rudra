import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL='https://bvnkoglvpljizeogslmp.supabase.co';
const SUPABASE_KEY='sb_publishable_ryjVjpVSMXv_HSbDUEsTZA_iZMc_w2G';
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY);
window.oracleAuth={supabase};

const style=document.createElement('style');
style.textContent=`.authBackdrop{position:fixed;inset:0;z-index:150;background:rgba(18,11,8,.78);display:none;align-items:center;justify-content:center;padding:18px}.authBackdrop.open{display:flex}.authCard{width:min(460px,100%);background:#f0d9ad;border:1px solid #765039;box-shadow:0 20px 80px rgba(0,0,0,.55);padding:26px;color:#241812}.authCard h2{font-weight:normal;margin:5px 0 8px;font-size:30px}.authCard p{line-height:1.5;color:#5d4737}.authCard input,.authCard select{display:block;width:100%;margin:8px 0;padding:11px;border:1px solid #896442;background:#f7e5bd;color:#241812}.authActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.authActions button{padding:10px 13px;border:1px solid #765039;background:transparent;color:#241812}.authActions .primaryAuth{background:#71342b;color:#f5dfb5}.authMessage{min-height:20px;font-size:12px;color:#8d342c;margin-top:10px}.authUser{font-size:12px;margin-top:14px;padding-top:12px;border-top:1px solid #a27c55}.authPrefs{margin-top:16px;padding-top:14px;border-top:1px solid #a27c55}`;
document.head.appendChild(style);

const backdrop=document.createElement('div');
backdrop.className='authBackdrop';
backdrop.innerHTML=`<div class="authCard"><button id="authX" style="float:right;border:0;background:none;font-size:28px">×</button><div style="font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#8d342c">Researcher access</div><h2 id="authTitle">Enter the library</h2><p>Create a private researcher account to sync notes, bookmarks and conversations across devices.</p><input id="authEmail" type="email" autocomplete="email" placeholder="Email"><input id="authPassword" type="password" autocomplete="current-password" placeholder="Password"><div class="authActions"><button class="primaryAuth" id="authSubmit">Sign in</button><button id="authSignup">Create account</button><button id="authForgot">Forgot password?</button><button id="authGoogle">Continue with Google</button><button id="authSignout" style="display:none">Sign out</button></div><div class="authPrefs" id="authPrefs" style="display:none"><label for="authDisplayName">Display name</label><input id="authDisplayName" placeholder="Researcher"><label for="authLanguage">Preferred language</label><select id="authLanguage"><option value="en">English</option><option value="bn">বাংলা</option><option value="hi">हिन्दी</option><option value="sa">संस्कृत</option><option value="zh">中文</option><option value="es">Español</option></select><button class="primaryAuth" id="authSavePrefs">Save researcher settings</button></div><div class="authMessage" id="authMessage"></div><div class="authUser" id="authUser"></div></div>`;
document.body.appendChild(backdrop);
const $=id=>document.getElementById(id);
function message(text,error=false){$('authMessage').textContent=text;$('authMessage').style.color=error?'#8d342c':'#5f573f'}
function openAuth(){backdrop.classList.add('open');updateAuthUI()}
function closeAuth(){backdrop.classList.remove('open')}
async function profileSync(user){
  const name=localStorage.getItem('oracleName')||user.user_metadata?.full_name||user.email?.split('@')[0]||'Researcher';
  const lang=localStorage.getItem('oracleLang')||'en';
  await supabase.from('profiles').upsert({id:user.id,display_name:name,preferred_language:lang,updated_at:new Date().toISOString()});
}
async function updateAuthUI(){
  const {data}=await supabase.auth.getUser();const user=data.user;
  $('authSignout').style.display=user?'inline-block':'none';$('authSubmit').style.display=user?'none':'inline-block';$('authSignup').style.display=user?'none':'inline-block';$('authForgot').style.display=user?'none':'inline-block';$('authGoogle').style.display=user?'none':'inline-block';$('authPrefs').style.display=user?'block':'none';$('authTitle').textContent=user?'Researcher account':'Enter the library';
  $('authUser').textContent=user?`Signed in as ${user.email}. Your private workspace can sync across devices.`:'';
  if(user){const {data:p}=await supabase.from('profiles').select('display_name,preferred_language').eq('id',user.id).maybeSingle();$('authDisplayName').value=p?.display_name||user.user_metadata?.full_name||'';$('authLanguage').value=p?.preferred_language||localStorage.getItem('oracleLang')||'en';}
  const profileBtn=document.getElementById('profileBtn');if(profileBtn)profileBtn.textContent=user?'Researcher':'Profile';
}
async function syncLocalNotes(user){
  const local=JSON.parse(localStorage.getItem('oracleNotes')||'[]');if(!local.length)return;
  const rows=local.map(n=>({user_id:user.id,title:n.title,body:n.body,created_at:new Date(n.time||Date.now()).toISOString(),updated_at:new Date().toISOString()}));
  const {error}=await supabase.from('notes').insert(rows);if(!error)localStorage.removeItem('oracleNotes');
}
async function restoreNotes(user){
  const {data,error}=await supabase.from('notes').select('title,body,created_at').order('created_at',{ascending:false}).limit(100);if(error||!data)return;
  localStorage.setItem('oracleNotes',JSON.stringify(data.map(n=>({title:n.title,body:n.body,time:Date.parse(n.created_at)}))));if(typeof window.renderNotes==='function')window.renderNotes();
}
async function signIn(){const email=$('authEmail').value.trim(),password=$('authPassword').value;if(!email||!password)return message('Enter both email and password.',true);const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)return message(error.message,true);await profileSync(data.user);await restoreNotes(data.user);message('Signed in.');await updateAuthUI()}
async function signUp(){const email=$('authEmail').value.trim(),password=$('authPassword').value;if(!email||password.length<8)return message('Use a valid email and a password of at least 8 characters.',true);const {data,error}=await supabase.auth.signUp({email,password});if(error)return message(error.message,true);if(data.user){await profileSync(data.user);await syncLocalNotes(data.user);message(data.session?'Account created and signed in.':'Account created. Check your email if confirmation is required.');await updateAuthUI()}}
async function forgot(){const email=$('authEmail').value.trim();if(!email)return message('Enter your email first, then choose Forgot password.',true);const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)return message(error.message,true);message('Password reset email sent. Check your inbox.');}
async function google(){const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});if(error)message(error.message,true)}
async function signOut(){const {error}=await supabase.auth.signOut();if(error)message(error.message,true);else{message('Signed out.');await updateAuthUI()}}
async function savePrefs(){const {data}=await supabase.auth.getUser();const user=data.user;if(!user)return;const name=$('authDisplayName').value.trim()||'Researcher';const lang=$('authLanguage').value;const {error}=await supabase.from('profiles').upsert({id:user.id,display_name:name,preferred_language:lang,updated_at:new Date().toISOString()});if(error)return message(error.message,true);localStorage.setItem('oracleName',name);localStorage.setItem('oracleLang',lang);const r=document.getElementById('researchLanguage');if(r)r.value=lang;const status=document.getElementById('status');if(status)status.textContent=name+' · synced workspace';message('Researcher settings saved.')}
$('authX').onclick=closeAuth;$('authSubmit').onclick=signIn;$('authSignup').onclick=signUp;$('authForgot').onclick=forgot;$('authGoogle').onclick=google;$('authSignout').onclick=signOut;$('authSavePrefs').onclick=savePrefs;backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeAuth()});const profileButton=document.getElementById('profileBtn');if(profileButton)profileButton.onclick=e=>{e.preventDefault();openAuth()};supabase.auth.onAuthStateChange(async(_event,session)=>{if(session?.user){await profileSync(session.user);await syncLocalNotes(session.user);await restoreNotes(session.user)}await updateAuthUI()});updateAuthUI();
