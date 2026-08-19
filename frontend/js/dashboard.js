const priorityContainer = document.getElementById('priorityMessages');
const opportunityContainer = document.getElementById('dashboardOpportunities');
const esc = value => { const d=document.createElement('div'); d.textContent=value ?? ''; return d.innerHTML; };
const setText = (id, value) => { const el=document.getElementById(id); if(el) el.textContent=value; };
const relativeTime = date => { if(!date) return ''; const s=Math.max(0,Math.floor((Date.now()-new Date(date).getTime())/1000)); if(s<60)return 'Just now'; if(s<3600)return `${Math.floor(s/60)} min ago`; if(s<86400)return `${Math.floor(s/3600)} hr ago`; return new Date(date).toLocaleDateString(); };
const categoryOf = m => m.is_spam ? 'Spam' : (m.category || 'General');
const scoreOf = m => Number(m.priority_score ?? 0);

(async () => {
  try {
    const client = await ensureSupabaseLoaded();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) { window.location.href='login.html'; return; }

    const { data: profile, error: profileError } = await client.from('profiles').select('full_name, username, avatar_url, creator_type, content_description, content_topics, onboarding_completed, plan_id').eq('id', user.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || !profile.onboarding_completed) { window.location.href='onboarding.html'; return; }

    const name = profile.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator';
    setText('welcomeName', `Good afternoon, ${name.trim().split(/\s+/)[0]}.`);
    setText('sidebarName', name);
    setText('sidebarCreatorType', profile.creator_type || 'Creator');
    setText('profileCreatorType', profile.creator_type || 'Creator');
    setText('profileEmail', user.email || '');
    setText('profileDescription', profile.content_description || 'No content description added yet.');
    setText('profileTopics', profile.content_topics ? `Topics: ${profile.content_topics}` : 'No topics added yet.');
    const initial=name.charAt(0).toUpperCase()||'?';
    document.querySelectorAll('#sidebarAvatar,#topbarAvatar').forEach(el=>{el.textContent=initial;if(profile.avatar_url)el.style.backgroundImage=`url("${profile.avatar_url}")`;});

    const { data: messages, error: messageError } = await client.from('messages').select('id,sender_name,sender_username,message_text,category,priority_score,priority_level,relevance_score,is_spam,needs_reply,received_at,created_at,direction').eq('user_id',user.id).eq('direction','incoming').order('received_at',{ascending:false});
    if(messageError) throw messageError;
    const all=messages||[];
    const important=all.filter(m=>!m.is_spam && (m.priority_level==='high'||scoreOf(m)>=75));
    const needsReply=all.filter(m=>m.needs_reply&&!m.is_spam);
    const spam=all.filter(m=>m.is_spam);
    const opportunities=all.filter(m=>!m.is_spam && /sponsor|brand|deal|collab|business|partner|opportunity/i.test(`${m.category||''} ${m.message_text||''}`));
    setText('importantCount',important.length);setText('replyCount',needsReply.length);setText('opportunityCount',opportunities.length);setText('spamCount',spam.length);
    setText('importantChange',important.length?'Current high-signal messages':'No high-signal messages');
    setText('replyChange',needsReply.length?'Messages waiting for you':'No replies needed');
    setText('opportunityChange',opportunities.length?'Detected from your messages':'No opportunities yet');
    setText('spamChange',spam.length?'Messages filtered':'No spam filtered');

    const priority=important.slice(0,5);
    if(priorityContainer) priorityContainer.innerHTML=priority.length?priority.map(m=>`<article class="message-item"><div><strong>${esc(m.sender_name||m.sender_username||'Unknown sender')}</strong><div class="message-meta">${esc(categoryOf(m))} · ${esc(relativeTime(m.received_at||m.created_at))}</div></div><div class="priority-score">${scoreOf(m)}</div><p>${esc(m.message_text||'')}</p></article>`).join(''):'<div class="empty-state"><p>No priority messages yet.</p></div>';

    const topOpp=opportunities.slice(0,4);
    if(opportunityContainer) opportunityContainer.innerHTML=topOpp.length?topOpp.map((m,i)=>`<div class="opportunity-card"><div class="opportunity-icon">${i===0?'✦':i===1?'↗':'$'}</div><div><strong>${esc(m.sender_name||m.sender_username||'Unknown sender')}</strong><p>${esc(m.category||'Opportunity')}</p><span>Priority ${scoreOf(m)}</span></div></div>`).join(''):'<div class="empty-state"><p>No opportunities yet.</p></div>';
  } catch(error) { console.error('Unable to load dashboard:',error); if(priorityContainer) priorityContainer.innerHTML='<div class="empty-state"><p>Unable to load messages.</p></div>'; if(opportunityContainer) opportunityContainer.innerHTML='<div class="empty-state"><p>Unable to load opportunities.</p></div>'; }
})();