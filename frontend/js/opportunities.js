const opportunities=[
 {company:'GameCore Studios',type:'Sponsorship',title:'Gaming content sponsorship',platform:'TikTok',score:95,status:'New',date:'12 min ago',text:'We would like to discuss a sponsorship for your upcoming gaming content.'},
 {company:'Nova Gear',type:'Brand Deal',title:'Product partnership enquiry',platform:'TikTok',score:81,status:'Reviewing',date:'2 hrs ago',text:'We are interested in discussing a product partnership with your channel.'},
 {company:'AlexGaming',type:'Collaboration',title:'FPS tournament collaboration',platform:'Instagram',score:87,status:'New',date:'42 min ago',text:'I am organizing an FPS tournament and would love to collaborate with you.'},
 {company:'Pixel Arena',type:'Business',title:'Creator partnership discussion',platform:'YouTube',score:76,status:'Reviewing',date:'Yesterday',text:'We are exploring creator partnerships for our upcoming gaming campaign.'}
];
const grid=document.getElementById('opportunityGrid');
const tabs=document.getElementById('oppsTabs');
function renderOpportunities(type='all'){
 const items=type==='all'?opportunities:opportunities.filter(o=>o.type===type);
 grid.innerHTML=items.length?items.map(o=>`<article class="opp-card"><div class="opp-top"><div class="opp-company"><div class="opp-icon">✦</div><div><strong>${o.company}</strong><small>${o.platform} · ${o.type}</small></div></div><span class="opp-score">${o.score}/100</span></div><h3>${o.title}</h3><p>${o.text}</p><div class="opp-bottom"><div><span class="opp-status ${o.status==='Reviewing'?'reviewing':''}">${o.status}</span><span class="opp-date"> · ${o.date}</span></div><div class="opp-actions"><button data-action="archive">Archive</button><button class="primary" data-action="review">Review</button></div></div></article>`).join(''):'<div class="no-opps">No opportunities found in this category.</div>';
 grid.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>{btn.textContent=btn.dataset.action==='archive'?'Archived':'Opened';btn.disabled=true}));
}
tabs?.addEventListener('click',e=>{const b=e.target.closest('.opp-tab');if(!b)return;document.querySelectorAll('.opp-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderOpportunities(b.dataset.type)});
renderOpportunities();
