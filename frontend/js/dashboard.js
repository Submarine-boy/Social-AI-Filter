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
