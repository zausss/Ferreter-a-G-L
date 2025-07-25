const express = require('express');
const app = express();
const path = require('path');

// Sirve archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Define una ruta para tu página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'registro.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
