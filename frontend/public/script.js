let ws;
let connected = false;
let currentUser = '';

// Vistas
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
// Inputs y botones
const messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const status = document.getElementById('status');
const themeToggle = document.getElementById('themeToggle');
// Login inputs y botones
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');

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

// 2. Función para manejar la autenticación
async function authenticate(mode) {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        alert("Por favor rellena todos los campos");
        return;
    }

    try {
        let userCredential;
        if (mode === 'login') {
            userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        } else {
            userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        }

        // Obtener el Token de Seguridad
        const token = await userCredential.user.getIdToken();
        const username = userCredential.user.email.split('@')[0]; // Usar parte del email como nombre

        // Conectar al WebSocket enviando el token
        currentUser = username;
        connectWebSocket(username, token);
        
        loginScreen.classList.add('d-none');
        chatScreen.classList.remove('d-none');

    } catch (error) {
        alert("Error de autenticación: " + error.message);
    }
}

loginBtn.addEventListener('click', () => authenticate('login'));
registerBtn.addEventListener('click', () => authenticate('register'));

// 3. Conexión WebSocket con token de autenticación
function connectWebSocket(username, token) {
    // Pasamos el token en la URL como query parameter para que el backend lo valide
    ws = new WebSocket(`ws://localhost:3001?username=${username}&token=${token}`);

    ws.onopen = () => {
        connected = true;
        status.textContent = 'Conectado';
        status.classList.remove('bg-secondary');
        status.classList.add('bg-success');
    };

    ws.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        addMessage(data.username, data.text, data.timestamp);
    });

    ws.onclose = () => {
        connected = false;
        status.textContent = 'Desconectado';
        status.classList.remove('bg-success');
        status.classList.add('bg-secondary');
        console.log('Conexión cerrada');
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
    addMessage(currentUser, text, timestamp);
    messageInput.value = '';
}

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Focus inicial en la pantalla de login
emailInput.focus();