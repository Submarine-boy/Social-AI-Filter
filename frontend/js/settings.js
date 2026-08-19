const links=document.querySelectorAll('.settings-link');const sections=document.querySelectorAll('.settings-section');
links.forEach(link=>link.addEventListener('click',()=>{links.forEach(x=>x.classList.remove('active'));sections.forEach(x=>x.classList.remove('active'));link.classList.add('active');document.getElementById(link.dataset.section)?.classList.add('active')}));

document.querySelectorAll('[data-save]').forEach(button=>button.addEventListener('click',()=>{const original=button.textContent;button.textContent='Saved';button.disabled=true;setTimeout(()=>{button.textContent=original;button.disabled=false},1200)}));
document.querySelectorAll('.account-card button').forEach(button=>button.addEventListener('click',()=>{button.textContent='Coming soon';button.disabled=true}));
const applyTheme=theme=>{document.documentElement.dataset.theme=theme;localStorage.setItem('sai-theme',theme);document.querySelectorAll('[data-theme-choice]').forEach(b=>b.classList.toggle('active',b.dataset.themeChoice===theme))};
document.querySelectorAll('[data-theme-choice]').forEach(button=>button.addEventListener('click',()=>applyTheme(button.dataset.themeChoice)));applyTheme(document.documentElement.dataset.theme||localStorage.getItem('sai-theme')||'light');

function setProfileUi(profile,user){
  const name=profile?.full_name||user?.user_metadata?.full_name||user?.email?.split('@')[0]||'User';
  const role=profile?.creator_type||'Creator';
  document.getElementById('displayName').value=profile?.full_name||'';
  document.getElementById('creatorType').value=profile?.creator_type||'';
  document.getElementById('niche').value=profile?.content_description||'';
  document.getElementById('topics').value=profile?.content_topics||'';
  document.querySelectorAll('.profile-name').forEach(el=>el.textContent=name);
  document.querySelectorAll('.profile-role').forEach(el=>el.textContent=role);
  document.querySelectorAll('.profile-avatar').forEach(el=>el.textContent=name.charAt(0).toUpperCase());
}

(async()=>{
  const status=document.getElementById('profileStatus');
  const saveButton=document.getElementById('saveProfile');
  try{
    const client=await ensureSupabaseLoaded();
    const {data:{user}}=await client.auth.getUser();
    if(!user){window.location.href='login.html';return;}
    const {data:profile,error}=await client.from('profiles').select('full_name,creator_type,content_description,content_topics').eq('id',user.id).single();
    if(error&&error.code!=='PGRST116') throw error;
    setProfileUi(profile,user);
    saveButton.addEventListener('click',async()=>{
      const original=saveButton.textContent;
      const full_name=document.getElementById('displayName').value.trim();
      const creator_type=document.getElementById('creatorType').value;
      const content_description=document.getElementById('niche').value.trim();
      const content_topics=document.getElementById('topics').value.trim();
      if(!full_name||!creator_type||!content_description||!content_topics){status.textContent='Please complete all creator profile fields.';return;}
      saveButton.disabled=true;saveButton.textContent='Saving...';status.textContent='';
      const {data,error}=await client.from('profiles').update({full_name,creator_type,content_description,content_topics,updated_at:new Date().toISOString()}).eq('id',user.id).select().single();
      if(error){status.textContent=error.message;saveButton.disabled=false;saveButton.textContent=original;return;}
      setProfileUi(data,user);
      status.textContent='Profile updated successfully.';
      saveButton.textContent='Saved';
      setTimeout(()=>{saveButton.textContent=original;saveButton.disabled=false;},1200);
    });
  }catch(error){console.error(error);if(status)status.textContent=error.message||'Unable to load your profile.';}
})();