const list=document.getElementById('priorityList');
const limit=document.getElementById('limitText');
let client=null;
let currentUser=null;
let priorities=[];
let planLimit=2;
let planName='Free';

function escapeHtml(value=''){
  return String(value).replace(/[&<>'"]/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  }[char]));
}

function isUnlimited(){
  return planLimit===null || planLimit===undefined || planLimit>=999999;
}

function render(){
  limit.textContent=isUnlimited()?`${priorities.length} / Unlimited`:`${priorities.length} / ${planLimit}`;
  list.innerHTML=priorities.length
    ? priorities.map(p=>`<article class="priority-card">
        <div class="priority-card-head">
          <strong>${escapeHtml(p.title||'Smart Priority')}</strong>
          <span class="priority-badge">${p.is_active===false?'Inactive':'Active'}</span>
        </div>
        <p>${escapeHtml(p.instruction||'')}</p>
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

async function loadPlan(){
  const {data:subscription,error:subscriptionError}=await client.from('user_subscriptions')
    .select('id,plan_id,status,current_period_end')
    .eq('user_id',currentUser.id)
    .eq('status','active')
    .maybeSingle();

  if(subscriptionError)throw subscriptionError;

  if(!subscription){
    // Users without a subscription are treated as Free until billing is connected.
    planName='Free';
    const {data:freePlan,error:freeError}=await client.from('subscription_plans')
      .select('name,smart_priorities_limit')
      .eq('name','Free')
      .eq('active',true)
      .maybeSingle();
    if(freeError)throw freeError;
    planLimit=freePlan?.smart_priorities_limit ?? 2;
    return;
  }

  if(subscription.current_period_end && new Date(subscription.current_period_end)<new Date()){
    planName='Free';
    planLimit=2;
    return;
  }

  const {data:plan,error:planError}=await client.from('subscription_plans')
    .select('name,smart_priorities_limit')
    .eq('id',subscription.plan_id)
    .eq('active',true)
    .single();

  if(planError)throw planError;
  planName=plan.name||'Free';
  planLimit=plan.smart_priorities_limit ?? 2;
}

async function loadPriorities(){
  const {data,error}=await client.from('smart_priorities')
    .select('id,user_id,instruction,title,is_active,updated_at,created_at')
    .eq('user_id',currentUser.id)
    .order('created_at',{ascending:true});
  if(error)throw error;
  priorities=data||[];
  render();
}

function canCreatePriority(){
  return isUnlimited() || priorities.length<planLimit;
}

document.getElementById('addPriority')?.addEventListener('click',()=>{
  if(!canCreatePriority()){
    alert(`Your ${planName} plan allows ${planLimit} Smart Priorities. Upgrade your plan to add more.`);
    return;
  }
  document.getElementById('priorityName').focus();
});

document.getElementById('savePriority')?.addEventListener('click',async()=>{
  if(!canCreatePriority()){
    alert(`Your ${planName} plan allows ${planLimit} Smart Priorities. Upgrade your plan to add more.`);
    return;
  }

  const title=document.getElementById('priorityName').value.trim();
  const instruction=document.getElementById('priorityInstruction').value.trim();
  const level=document.getElementById('priorityLevel').value;
  const button=document.getElementById('savePriority');

  if(!title||!instruction){
    alert('Enter a priority name and tell the AI what to prioritize.');
    return;
  }

  button.disabled=true;
  button.textContent='Saving...';

  const fullInstruction=`Importance: ${level}. ${instruction}`;
  const {data,error}=await client.from('smart_priorities').insert({
    user_id:currentUser.id,
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
    if(typeof ensureSupabaseLoaded!=='function'){
      throw new Error('Supabase client loader is unavailable.');
    }
    client=await ensureSupabaseLoaded();
    const {data:{user},error}=await client.auth.getUser();
    if(error)throw error;
    if(!user){window.location.href='login.html';return;}
    currentUser=user;
    await loadPlan();
    await loadPriorities();
  }catch(error){
    console.error('Unable to load Smart Priorities:',error);
    list.innerHTML=`<p class="muted">Unable to load Smart Priorities: ${escapeHtml(error.message||'Unknown error')}</p>`;
  }
})();
