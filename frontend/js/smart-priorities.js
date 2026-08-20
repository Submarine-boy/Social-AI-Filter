const planLimit=2;
const list=document.getElementById('priorityList');
const limit=document.getElementById('limitText');
let client=null;
let currentUser=null;
let priorities=[];

function escapeHtml(value=''){
  return String(value).replace(/[&<>'"]/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  }[char]));
}

function render(){
  limit.textContent=`${priorities.length} / ${planLimit}`;
  list.innerHTML=priorities.length
    ? priorities.map(p=>`<article class="priority-card">
        <div class="priority-card-head">
          <strong>${escapeHtml(p.name||p.title||'Smart Priority')}</strong>
          <span class="priority-badge">${p.is_active===false?'Inactive':'Active'}</span>
        </div>
        ${p.title?`<small class="priority-title">${escapeHtml(p.title)}</small>`:''}
        <p>${escapeHtml(p.instruction)}</p>
        <div class="priority-card-actions">
          <button data-toggle="${escapeHtml(p.id)}">${p.is_active===false?'Enable':'Disable'}</button>
          <button data-delete="${escapeHtml(p.id)}">Delete</button>
        </div>
      </article>`).join('')
    : '<p class="muted">No Smart Priorities yet. Create an objective to teach the AI what matters to you.</p>';

  list.querySelectorAll('[data-toggle]').forEach(button=>button.addEventListener('click',async()=>{
    const priority=priorities.find(p=>String(p.id)===String(button.dataset.toggle));
    if(!priority)return;
    button.disabled=true;
    const next=!priority.is_active;
    const {data,error}=await client.from('smart_priorities')
      .update({is_active:next,updated_at:new Date().toISOString()})
      .eq('id',priority.id)
      .eq('user_id',currentUser.id)
      .select('*')
      .single();
    if(error){alert(error.message);button.disabled=false;return;}
    priority.is_active=data.is_active;
    render();
  }));

  list.querySelectorAll('[data-delete]').forEach(button=>button.addEventListener('click',async()=>{
    const priority=priorities.find(p=>String(p.id)===String(button.dataset.delete));
    if(!priority)return;
    button.disabled=true;
    const {error}=await client.from('smart_priorities')
      .update({is_active:false,updated_at:new Date().toISOString()})
      .eq('id',priority.id)
      .eq('user_id',currentUser.id);
    if(error){alert(error.message);button.disabled=false;return;}
    priorities=priorities.filter(p=>String(p.id)!==String(priority.id));
    render();
  }));
}

async function loadPriorities(){
  const {data,error}=await client.from('smart_priorities')
    .select('id,user_id,name,instruction,title,is_active,updated_at,created_at')
    .eq('user_id',currentUser.id)
    .order('created_at',{ascending:true});
  if(error)throw error;
  priorities=data||[];
  render();
}

document.getElementById('addPriority')?.addEventListener('click',()=>{
  if(priorities.length>=planLimit){
    alert('You have reached your Smart Priorities limit. Upgrade your plan to add more.');
    return;
  }
  document.getElementById('priorityName').focus();
});

document.getElementById('savePriority')?.addEventListener('click',async()=>{
  if(priorities.length>=planLimit){
    alert('You have reached your Smart Priorities limit. Upgrade your plan to add more.');
    return;
  }

  const name=document.getElementById('priorityName').value.trim();
  const instruction=document.getElementById('priorityInstruction').value.trim();
  const level=document.getElementById('priorityLevel').value;
  const button=document.getElementById('savePriority');

  if(!name||!instruction){
    alert('Enter a priority name and tell the AI what to prioritize.');
    return;
  }

  button.disabled=true;
  button.textContent='Saving...';

  const title=name;
  const fullInstruction=`Importance: ${level}. ${instruction}`;
  const {data,error}=await client.from('smart_priorities').insert({
    user_id:currentUser.id,
    name,
    instruction:fullInstruction,
    title,
    is_active:true,
    created_at:new Date().toISOString(),
    updated_at:new Date().toISOString()
  }).select('*').single();

  if(error){
    alert(error.message);
    button.disabled=false;
    button.textContent='Save Smart Priority';
    return;
  }

  priorities.push(data);
  document.getElementById('priorityName').value='';
  document.getElementById('priorityInstruction').value='';
  document.getElementById('priorityLevel').value='High';
  button.disabled=false;
  button.textContent='Save Smart Priority';
  render();
});

(async()=>{
  try{
    client=await ensureSupabaseLoaded();
    const {data:{user},error}=await client.auth.getUser();
    if(error)throw error;
    if(!user){window.location.href='login.html';return;}
    currentUser=user;
    await loadPriorities();
  }catch(error){
    console.error('Unable to load Smart Priorities:',error);
    list.innerHTML=`<p class="muted">Unable to load Smart Priorities: ${escapeHtml(error.message||'Unknown error')}</p>`;
  }
})();
