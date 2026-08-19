const priorityMessages = [
  {sender:'GameCore Studios', category:'Sponsorship', score:95, text:'We would like to discuss a possible sponsorship for your upcoming gaming content.', time:'12 min ago'},
  {sender:'AlexGaming', category:'Collaboration', score:87, text:'I am organizing an FPS tournament and would love to collaborate with you.', time:'42 min ago'},
  {sender:'Sarah', category:'Content Question', score:72, text:'Could you make a video explaining the settings you use for competitive matches?', time:'1 hr ago'},
  {sender:'Nova Gear', category:'Business', score:81, text:'We are interested in discussing a product partnership with your channel.', time:'2 hrs ago'}
];

const priorityContainer = document.getElementById('priorityMessages');
if (priorityContainer) {
  priorityContainer.innerHTML = priorityMessages.map(message => `
    <article class="message-item">
      <div><strong>${message.sender}</strong><div class="message-meta">${message.category} · ${message.time}</div></div>
      <div class="priority-score">${message.score}</div>
      <p>${message.text}</p>
    </article>
  `).join('');
}

(async () => {
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  try {
    const client = await ensureSupabaseLoaded();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) {
      window.location.href = 'login.html';
      return;
    }

    const { data: profile, error } = await client
      .from('profiles')
      .select('full_name, username, avatar_url, creator_type, content_description, content_topics, onboarding_completed, plan_id')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!profile) {
      window.location.href = 'onboarding.html';
      return;
    }

    if (!profile.onboarding_completed) {
      window.location.href = 'onboarding.html';
      return;
    }

    const name = profile.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator';
    const firstName = name.trim().split(/\s+/)[0];
    const creatorType = profile.creator_type || 'Creator';

    setText('welcomeName', `Good afternoon, ${firstName}.`);
    setText('sidebarName', name);
    setText('sidebarCreatorType', creatorType);
    setText('profileCreatorType', creatorType);
    setText('profileDescription', profile.content_description || 'No content description added yet.');
    setText('profileTopics', profile.content_topics ? `Topics: ${profile.content_topics}` : 'No topics added yet.');

    const initial = name.charAt(0).toUpperCase() || '?';
    document.querySelectorAll('#sidebarAvatar, #topbarAvatar').forEach(el => {
      el.textContent = initial;
      if (profile.avatar_url) el.style.backgroundImage = `url("${profile.avatar_url}")`;
    });
  } catch (error) {
    console.error('Unable to load dashboard profile:', error);
  }
})();
