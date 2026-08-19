const feedback=[
 {sender:'Sarah',type:'question',label:'Question',source:'YouTube',text:'Could you make a video explaining the settings you use for competitive matches?'},
 {sender:'JayFPS',type:'request',label:'Video Request',source:'TikTok',text:'Can you do a full beginner guide for improving aim in FPS games?'},
 {sender:'Mika',type:'suggestion',label:'Suggestion',source:'Instagram',text:'A comparison of your favorite weapons and when to use each one would be really useful.'},
 {sender:'Chris',type:'question',label:'Question',source:'TikTok',text:'What settings would you recommend for someone playing on a low-end PC?'},
 {sender:'Nova',type:'request',label:'Video Request',source:'YouTube',text:'Please make a video breaking down your complete competitive setup.'}
];
const ideas=[
 {title:'Low-end PC FPS optimization guide',text:'Multiple audience messages ask about performance and settings on weaker hardware.',score:'High demand'},
 {title:'Complete competitive settings breakdown',text:'Recurring questions focus on settings, aim, and competitive configuration.',score:'High demand'},
 {title:'FPS weapons comparison',text:'Audience members want practical comparisons and recommendations for different situations.',score:'Growing interest'}
];
const feedbackList=document.getElementById('feedbackList');
const filter=document.getElementById('contentFilter');
function renderFeedback(){const type=filter?.value||'all';const items=type==='all'?feedback:feedback.filter(x=>x.type===type);feedbackList.innerHTML=items.map(x=>`<article class="feedback-item"><div class="feedback-top"><strong>${x.sender}</strong><span class="feedback-source">${x.source}</span></div><p>${x.text}</p><span class="feedback-tag">${x.label}</span></article>`).join('')}
function renderIdeas(){document.getElementById('ideasList').innerHTML=ideas.map((x,i)=>`<article class="idea"><span class="idea-number">IDEA ${i+1}</span><h4>${x.title}</h4><p>${x.text}</p><span class="idea-score">${x.score}</span></article>`).join('')}
filter?.addEventListener('change',renderFeedback);renderFeedback();renderIdeas();
