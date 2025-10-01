require("dotenv").config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Base de datos =====
const db = new sqlite3.Database("./formulario.db", (err) => {
  if (err) console.error("Error DB:", err.message);
  else console.log("Conectado a la base de datos SQLite.");
});

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

  db.run(`
    CREATE TABLE IF NOT EXISTS regalos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      regalo TEXT,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Tablas creadas o ya existentes.");
});

// ===== Nodemailer con Brevo =====
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SENDINBLUE_USER,
    pass: process.env.SENDINBLUE_PASS
  }
});

async function enviarEmail(asunto, mensaje) {
  await transporter.sendMail({
    from: `"Invitaciones Elyon" <${process.env.SENDINBLUE_USER}>`,
    to: process.env.SENDINBLUE_TO,
    subject: asunto,
    html: `<div style="font-family:Arial; font-size:16px;">${mensaje}</div>`
  });
  console.log("Email enviado ✅");
}

// ===== Rutas =====

app.post("/rsvp", (req, res) => {
  const { nombre, apellido, asistencia, comida } = req.body;

  db.run(
    `INSERT INTO rsvp (nombre, apellido, asistencia, comida) VALUES (?, ?, ?, ?)`,
    [nombre, apellido, asistencia, comida],
    async function (err) {
      if (err) {
        console.error("Error al guardar RSVP:", err.message);
        return res.status(500).json({ error: err.message });
      }

      console.log("RSVP guardado con ID:", this.lastID);

      const mensaje = `
        <strong>Nuevo RSVP:</strong><br>
        Nombre: ${nombre} ${apellido}<br>
        Asistencia: ${asistencia}<br>
        Comida: ${comida}
      `;

      try {
        await enviarEmail("Nuevo RSVP", mensaje);
      } catch (error) {
        console.error("Error enviando email:", error);
        return res.status(500).json({ error: "Error enviando email" });
      }

      res.json({ success: true, id: this.lastID });
    }
  );
});

app.post("/lista-musica", (req, res) => {
  const { cancion } = req.body;

  db.run(
    `INSERT INTO lista_musica (cancion) VALUES (?)`,
    [cancion],
    async function (err) {
      if (err) {
        console.error("Error al guardar canción:", err.message);
        return res.status(500).json({ error: err.message });
      }

      console.log("Canción guardada con ID:", this.lastID);

      const mensaje = `<strong>Nueva canción añadida:</strong> ${cancion}`;

      try {
        await enviarEmail("Nueva Canción", mensaje);
      } catch (error) {
        console.error("Error enviando email:", error);
        return res.status(500).json({ error: "Error enviando email" });
      }

      res.json({ success: true, id: this.lastID });
    }
  );
});

// ===== NUEVA ruta para regalos =====
app.post("/regalos", (req, res) => {
  const { nombre, email, mensaje, regalo } = req.body;

  db.run(
    `INSERT INTO regalos (regalo) VALUES (?)`,
    [regalo],
    async function (err) {
      if (err) {
        console.error("Error al guardar regalo:", err.message);
        return res.status(500).json({ error: err.message });
      }

      console.log("Regalo guardado con ID:", this.lastID);

      const emailMensaje = `
        <strong>Nuevo regalo confirmado:</strong><br>
        Regalo: ${regalo}<br>
        Nombre: ${nombre}<br>
        Email: ${email}<br>
        Mensaje: ${mensaje || "Sin mensaje"}
      `;

      try {
        await enviarEmail("Nuevo Regalo Confirmado", emailMensaje);
      } catch (error) {
        console.error("Error enviando email:", error);
        return res.status(500).json({ error: "Error enviando email" });
      }

      res.json({ success: true, id: this.lastID });
    }
  );
});


app.get("/ping", (req, res) => {
  res.status(200).send("pong ✅");
});

// ===== Servidor =====
app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
