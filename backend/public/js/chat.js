// public/js/chat.js
// handles client side part of socket.io
// called from chat.hbs

const socket = io();

const chat_box = document.getElementById('chat-box');
const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');

function add_message(msg) {
  let div = document.createElement('div');
  div.className = 'chat-message';

  // enter the message contents
  div.innerHTML = `<span class="name" style="color:${msg.name_color}">${msg.display_name}</span><span class="time">[${msg.timestamp}]</span><span class="body">${msg.body}</span>`;
  chat_box.appendChild(div);
  chat_box.scrollTop = chat_box.scrollHeight;
}

// Load history
fetch('/api/chat')
  .then(r => r.json())
  .then(messages => messages.forEach(add_message));

// when anybody sends a chat message, add the message to our html
socket.on('chat_message', add_message);

// when we submit, send to server
// we handle our rendering above
form.addEventListener('submit', e => {
  e.preventDefault();
  if (input.value.trim()) {
    socket.emit('chat_message', input.value);
    input.value = '';
  }
});
