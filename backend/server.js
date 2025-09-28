require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

// Configurar el transportador de email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Función para enviar un email con datos individuales
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

// Guardar datos del formulario RSVP
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

// Guardar datos de la lista de música
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

app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
