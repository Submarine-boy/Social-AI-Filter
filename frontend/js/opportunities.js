const opportunities=[];
const grid=document.getElementById('opportunityGrid');
const tabs=document.getElementById('oppsTabs');
function renderOpportunities(type='all'){
 const items=opportunities.filter(o=>type==='all'||o.type===type);
 grid.innerHTML=items.length?items.map(o=>`<article class="opp-card"><div class="opp-top"><div class="opp-company"><div class="opp-icon">✦</div><div><strong>${o.company}</strong><small>${o.platform} · ${o.type}</small></div></div><span class="opp-score">${o.score}/100</span></div><h3>${o.title}</h3><p>${o.text}</p><div class="opp-bottom"><div><span class="opp-status ${o.status==='Reviewing'?'reviewing':''}">${o.status}</span><span class="opp-date"> · ${o.date}</span></div><div class="opp-actions"><button data-action="archive">Archive</button><button class="primary" data-action="review">Review</button></div></div></article>`).join(''):'<div class="no-opps">No opportunities yet. Opportunities detected from your connected messages will appear here.</div>';
}
tabs?.addEventListener('click',e=>{const b=e.target.closest('.opp-tab');if(!b)return;document.querySelectorAll('.opp-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderOpportunities(b.dataset.type)});
renderOpportunities();
