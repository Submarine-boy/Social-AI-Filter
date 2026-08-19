const inboxMessages = [
  {id:1,sender:'GameCore Studios',platform:'TikTok',category:'Sponsorship',priority:95,relevance:98,type:'important',needsReply:true,time:'12 min ago',text:'We would like to discuss a possible sponsorship for your upcoming gaming content.',reason:'Potential sponsorship opportunity directly related to the creator’s gaming niche.'},
  {id:2,sender:'AlexGaming',platform:'Instagram',category:'Collaboration',priority:87,relevance:92,type:'important',needsReply:true,time:'42 min ago',text:'I am organizing an FPS tournament and would love to collaborate with you.',reason:'A collaboration request closely matches the creator’s FPS content.'},
  {id:3,sender:'Sarah',platform:'YouTube',category:'Content Question',priority:72,relevance:88,type:'relevant',needsReply:true,time:'1 hr ago',text:'Could you make a video explaining the settings you use for competitive matches?',reason:'Useful audience feedback that can inform future content.'},
  {id:4,sender:'Nova Gear',platform:'TikTok',category:'Business',priority:81,relevance:90,type:'important',needsReply:false,time:'2 hrs ago',text:'We are interested in discussing a product partnership with your channel.',reason:'Potential commercial partnership relevant to the creator’s audience.'},
  {id:5,sender:'Chris',platform:'Instagram',category:'General',priority:35,relevance:45,type:'general',needsReply:false,time:'3 hrs ago',text:'Great video! Keep up the good work.',reason:'Positive audience engagement, but no action appears necessary.'},
  {id:6,sender:'Promo Deals',platform:'TikTok',category:'Spam',priority:8,relevance:4,type:'spam',needsReply:false,time:'4 hrs ago',text:'Click our profile for an amazing promotion and guaranteed growth.',reason:'Generic promotional message with low relevance.'}
];

const list = document.getElementById('messageList');
const search = document.getElementById('messageSearch');
const platform = document.getElementById('platformFilter');
const sort = document.getElementById('sortFilter');
const detail = document.getElementById('detailPanel');
let activeFilter = 'all';

function initials(name){return name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}
function filteredMessages(){
  const q=(search?.value||'').trim().toLowerCase();
  let items=inboxMessages.filter(m=>{
    const filterMatch=activeFilter==='all'||m.type===activeFilter;
    const platformMatch=platform?.value==='all'||m.platform===platform?.value;
    const textMatch=!q||`${m.sender} ${m.category} ${m.text}`.toLowerCase().includes(q);
    return filterMatch&&platformMatch&&textMatch;
  });
  if(sort?.value==='recent') return items;
  return items.sort((a,b)=>b.priority-a.priority);
}
function renderList(){
  if(!list)return;
  const items=filteredMessages();
  list.innerHTML=items.length?items.map(m=>`<article class="inbox-row" data-id="${m.id}" tabindex="0"><div class="sender-avatar">${initials(m.sender)}</div><div class="row-main"><div class="row-top"><strong>${m.sender}</strong><span class="platform">${m.platform}</span></div><p class="row-preview">${m.text}</p><span class="category-pill">${m.category}</span></div><div class="row-side"><span class="score">${m.priority}</span><span class="row-time">${m.time}</span></div></article>`).join(''):'<div class="no-results">No messages match these filters.</div>';
  list.querySelectorAll('.inbox-row').forEach(row=>{row.addEventListener('click',()=>showDetail(Number(row.dataset.id)));row.addEventListener('keydown',e=>{if(e.key==='Enter')showDetail(Number(row.dataset.id))})});
}
function showDetail(id){
  const m=inboxMessages.find(x=>x.id===id); if(!m||!detail)return;
  detail.innerHTML=`<div class="detail-mobile-header"><button type="button" class="close-detail" id="closeDetail" aria-label="Close message">← <span>Back to inbox</span></button></div><div class="detail-head"><div><h3>${m.sender}</h3><p class="detail-meta">${m.platform} · ${m.category} · ${m.time}</p></div><strong class="score">${m.priority}/100</strong></div><div class="detail-message">${m.text}</div><div class="analysis-grid"><div class="analysis-item"><small>Priority</small><strong>${m.priority}/100</strong></div><div class="analysis-item"><small>Relevance</small><strong>${m.relevance}/100</strong></div><div class="analysis-item"><small>Needs reply</small><strong>${m.needsReply?'Yes':'No'}</strong></div><div class="analysis-item"><small>Category</small><strong>${m.category}</strong></div></div><p class="detail-reason"><strong>Why it matters:</strong> ${m.reason}</p><div class="detail-actions"><button class="primary" data-action="important">Mark Important</button><button data-action="not-important">Mark Not Important</button><button data-action="spam">Mark as Spam</button><button data-action="similar">Prioritize Similar Messages</button></div>`;
  detail.classList.add('mobile-open');
  document.body.classList.add('detail-view-open');
  document.getElementById('closeDetail')?.addEventListener('click',closeDetail);
  detail.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>{btn.textContent='Saved';btn.disabled=true}));
}
function closeDetail(){detail?.classList.remove('mobile-open');document.body.classList.remove('detail-view-open')}
document.getElementById('filterTabs')?.addEventListener('click',e=>{const btn=e.target.closest('.filter-tab');if(!btn)return;document.querySelectorAll('.filter-tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');activeFilter=btn.dataset.filter;renderList()});
search?.addEventListener('input',renderList);platform?.addEventListener('change',renderList);sort?.addEventListener('change',renderList);renderList();
