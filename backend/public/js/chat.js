const socket = io();

const chat_box = document.getElementById('chat-box');
const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');

function add_message(msg) {
  let div = document.createElement('div');
  div.className = 'chat-message';


  div.innerHTML = `<span class="name" style="color:${msg.name_color}">${msg.display_name}</span><span class="time">[${msg.timestamp}]</span><span class="body">${msg.body}</span>`;
  chat_box.appendChild(div);
  chat_box.scrollTop = chat_box.scrollHeight;
}

// Load history
fetch('/api/chat')
  .then(r => r.json())
  .then(messages => messages.forEach(add_message));

// Real-time updates
socket.on('chat_message', add_message);

// Send message
form.addEventListener('submit', e => {
  e.preventDefault();
  if (input.value.trim()) {
    socket.emit('chat_message', input.value);
    input.value = '';
  }
});
