require("dotenv").config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta raíz de prueba
app.get("/", (req, res) => {
  res.send("Servidor funcionando ✅");
});

// Crear base de datos SQLite
const db = new sqlite3.Database("./formulario.db", (err) => {
  if (err) return console.error("Error DB:", err.message);
  console.log("Conectado a la base de datos SQLite.");
});

// Crear tablas
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS rsvp (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      apellido TEXT,
      asistencia TEXT,
      comida TEXT,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS lista_musica (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cancion TEXT,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Tablas creadas o ya existentes.");
});

// Configurar Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Función para enviar email
function enviarEmailIndividual(asunto, mensaje) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO,
    subject: asunto,
    html: `<div style="font-size:16px; font-family:Arial, sans-serif; color:#000;">${mensaje}</div>`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error("Error enviando email:", error);
    else console.log("Email enviado:", info.response);
  });
}

// Guardar RSVP
app.post("/rsvp", (req, res) => {
  const { nombre, apellido, asistencia, comida } = req.body;

  db.run(
    `INSERT INTO rsvp (nombre, apellido, asistencia, comida) VALUES (?, ?, ?, ?)`,
    [nombre, apellido, asistencia, comida],
    function (err) {
      if (err) {
        console.error("Error al guardar RSVP:", err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log("RSVP guardado con ID:", this.lastID);

      const mensaje = `Nuevo RSVP:<br>Nombre: ${nombre} ${apellido}<br>Asistencia: ${asistencia}<br>Comida: ${comida}`;
      enviarEmailIndividual("Nuevo RSVP", mensaje);

      res.json({ success: true, id: this.lastID });
    }
  );
});

// Guardar Lista de Música
app.post("/lista-musica", (req, res) => {
  const { cancion } = req.body;

  db.run(
    `INSERT INTO lista_musica (cancion) VALUES (?)`,
    [cancion],
    function (err) {
      if (err) {
        console.error("Error al guardar canción:", err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log("Canción guardada con ID:", this.lastID);

      const mensaje = `Nueva canción añadida: ${cancion}`;
      enviarEmailIndividual("Nueva Canción", mensaje);

      res.json({ success: true, id: this.lastID });
    }
  );
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
