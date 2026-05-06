const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Servir solo archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// Redirigir rutas del cliente al HTML principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Frontend corriendo en http://localhost:${PORT}`);
});
