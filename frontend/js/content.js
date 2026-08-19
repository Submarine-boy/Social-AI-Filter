const feedback=[];
const ideas=[];
const feedbackList=document.getElementById('feedbackList');
const filter=document.getElementById('contentFilter');
function renderFeedback(){const type=filter?.value||'all';const items=feedback.filter(x=>type==='all'||x.type===type);feedbackList.innerHTML=items.length?items.map(x=>`<article class="feedback-item"><div class="feedback-top"><strong>${x.sender}</strong><span class="feedback-source">${x.source}</span></div><p>${x.text}</p><span class="feedback-tag">${x.label}</span></article>`).join(''):'<div class="no-feedback">No audience feedback yet. Messages containing content questions, requests, and suggestions will appear here.</div>'}
function renderIdeas(){document.getElementById('ideasList').innerHTML=ideas.length?ideas.map((x,i)=>`<article class="idea"><span class="idea-number">IDEA ${i+1}</span><h4>${x.title}</h4><p>${x.text}</p><span class="idea-score">${x.score}</span></article>`).join(''):'<div class="no-feedback">No content ideas yet. AI-generated ideas will appear here as audience feedback is collected.</div>'}
filter?.addEventListener('change',renderFeedback);renderFeedback();renderIdeas();
