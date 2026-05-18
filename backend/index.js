const WebSocket = require('ws');
const admin = require('firebase-admin')
const url = require('url');
require('dotenv').config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Reemplazar los saltos de línea de la clave privada
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  })
});

const db = admin.firestore();
const PORT = process.env.PORT || 3001;

// Crear servidor WebSocket independiente para la lógica backend
const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`🚀 WebSocket backend corriendo en ws://localhost:${PORT}`);
});

// Almacenar conexiones activas
const clients = new Set();

wss.on('connection', async (ws, req) => {
  // Extraer parámetros de la URL (ws://localhost:3001?token=...)
  const parameters = url.parse(req.url, true).query;
  const token = parameters.token;
  const username = parameters.username;

  // Requisito: Validar dominio (opcional)
  const origin = req.headers.origin;
  // if (origin !== 'http://tu-dominio-permitido.com') { 
  //    ws.close(4003, 'Dominio no autorizado'); 
  //    return; 
  // }

  try {
    // VALIDACIÓN DEL TOKEN
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log(`✅ Conexión autorizada para: ${decodedToken.email}`);

    ws.user = { uid: decodedToken.uid, email: decodedToken.email, username: username };
    // RECUPERAR HISTORIAL DE MENSAJES
    try {
      const snapshot = await db.collection('messages')
        .orderBy('timestamp', 'asc') // Orden cronológico
        .limitToLast(30)            // Solo los últimos 30 para no saturar
        .get();

      const history = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          username: data.username,
          text: data.text,
          // Formatear el timestamp para el frontend
          timestamp: new Date(data.timestamp).toLocaleTimeString()
        };
      });

      // Enviar el historial solo al usuario que se acaba de conectar
      ws.send(JSON.stringify({ type: 'history', data: history }));

    } catch (err) {
      console.error('Error recuperando historial:', err);
    }
    clients.add(ws);

    ws.on('message', async (data) => {
      try {
        const messageData = JSON.parse(data);

        const newMessage = {
          username: ws.user.username,
          text: messageData.text,
          timestamp: new Date().toISOString(), // Usar ISO para la DB
          uid: ws.user.uid
        };

        // GUARDAR EN FIRESTORE (Persistencia)
        await db.collection('messages').add(newMessage);

        // Reenviar a todos excepto al remitente
        const broadcastData = JSON.stringify({
          ...newMessage,
          timestamp: new Date().toLocaleTimeString() // Formato legible para el cliente
        });

        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN && client !== ws) {
            client.send(broadcastData);
          }
        });
      } catch (err) {
        console.error('Error procesando mensaje:', err);
      }
    });

  } catch (error) {
    console.error('❌ Token inválido o expirado:', error.message);
    ws.close(4001, 'No autorizado');
    return;
  }

  ws.on('close', () => clients.delete(ws));
});
