let ws;
let connected = false;

const messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const usernameInput = document.getElementById('usernameInput');
const sendBtn = document.getElementById('sendBtn');
const status = document.getElementById('status');

function connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const backendPort = 3001;
    ws = new WebSocket(`${protocol}//${location.hostname}:${backendPort}`);

    ws.onopen = () => {
        connected = true;
        status.textContent = 'Conectado';
        status.style.color = 'green';
        sendBtn.disabled = false;
    };

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        addMessage(msg.username, msg.text, msg.timestamp);
    };

    ws.onclose = () => {
        connected = false;
        status.textContent = 'Desconectado - Intentando reconectar...';
        status.style.color = 'red';
        sendBtn.disabled = true;
        setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
        console.error('Error WebSocket:', error);
    };
}

function addMessage(username, text, timestamp) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    msgDiv.innerHTML = `
                <span class="username">${username}:</span> 
                ${text}
                <span class="timestamp">${timestamp}</span>
            `;
    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
}

function sendMessage() {
    const username = usernameInput.value.trim();
    const text = messageInput.value.trim();

    if (!username) {
        alert('Por favor ingresa tu nombre de usuario');
        usernameInput.focus();
        return;
    }

    if (!text) {
        messageInput.focus();
        return;
    }

    if (!connected) {
        alert('No hay conexión al servidor');
        return;
    }

    ws.send(JSON.stringify({ username, text }));
    messageInput.value = '';
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        messageInput.focus();
    }
});

// Inicializar conexión
connect();

// Focus inicial
usernameInput.focus();