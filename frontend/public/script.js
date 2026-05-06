let ws;
let connected = false;
let currentUser = '';

const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const usernameInput = document.getElementById('usernameInput');
const enterChatBtn = document.getElementById('enterChatBtn');
const sendBtn = document.getElementById('sendBtn');
const status = document.getElementById('status');
const themeToggle = document.getElementById('themeToggle');

// 1. Lógica del Tema (Claro / Oscuro)
themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    if (html.getAttribute('data-bs-theme') === 'light') {
        html.setAttribute('data-bs-theme', 'dark');
        themeToggle.textContent = 'Modo Claro';
        themeToggle.classList.replace('btn-outline-secondary', 'btn-outline-light');
    } else {
        html.setAttribute('data-bs-theme', 'light');
        themeToggle.textContent = 'Modo Oscuro';
        themeToggle.classList.replace('btn-outline-light', 'btn-outline-secondary');
    }
});

// 2. Lógica de Ingreso (Validar usuario y mostrar chat)
function enterChat() {
    const username = usernameInput.value.trim();
    if (!username) {
        alert('Por favor ingresa tu nombre de usuario para continuar.');
        usernameInput.focus();
        return;
    }
    currentUser = username;

    // Ocultar login, mostrar chat
    loginScreen.classList.add('d-none');
    chatScreen.classList.remove('d-none');

    // Iniciar conexión y preparar input
    connect();
    messageInput.focus();
}

enterChatBtn.addEventListener('click', enterChat);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') enterChat();
});

// 3. Conexión WebSocket
function connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const backendPort = 3001;
    ws = new WebSocket(`${protocol}//${location.hostname}:${backendPort}`);

    ws.onopen = () => {
        connected = true;
        status.textContent = 'En línea';
        status.className = 'badge bg-success';
        sendBtn.disabled = false;
    };

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        addMessage(msg.username, msg.text, msg.timestamp);
    };

    ws.onclose = () => {
        connected = false;
        status.textContent = 'Reconectando...';
        status.className = 'badge bg-danger';
        sendBtn.disabled = true;
        setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
        console.error('Error WebSocket:', error);
    };
}

// 4. Agregar y acumular mensajes en la interfaz
function addMessage(username, text, timestamp) {
    const msgDiv = document.createElement('div');
    const isSentByMe = username === currentUser;

    // Definir estilos según quién envía: Enviados a la izquierda, recibidos a la derecha
    msgDiv.className = `message-bubble ${isSentByMe ? 'msg-sent' : 'msg-received'}`;

    // Si la marca de tiempo no viene del servidor, creamos una
    const timeToDisplay = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msgDiv.innerHTML = `
        <span class="username-label">${username}</span> 
        <div class="message-text">${text}</div>
        <span class="timestamp">${timeToDisplay}</span>
    `;

    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight; // Auto-scroll al fondo
}

// 5. Enviar Mensaje
function sendMessage() {
    const text = messageInput.value.trim();

    if (!text) {
        messageInput.focus();
        return;
    }

    if (!connected) {
        alert('No hay conexión al servidor');
        return;
    }

    // Se asume que el servidor repite el mensaje con un timestamp
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    ws.send(JSON.stringify({ username: currentUser, text, timestamp }));
    messageInput.value = '';
}

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Focus inicial en la pantalla de login
usernameInput.focus();