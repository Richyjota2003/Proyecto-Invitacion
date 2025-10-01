require("dotenv").config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const SibApiV3Sdk = require("sib-api-v3-sdk");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Base de datos =====
const db = new sqlite3.Database("./formulario.db", (err) => {
  if (err) console.error("Error DB:", err.message);
  else console.log("Conectado a SQLite");
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS rsvp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    apellido TEXT,
    asistencia TEXT,
    comida TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS lista_musica (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cancion TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS regalos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    regalo TEXT,
    nombre TEXT,
    email TEXT,
    mensaje TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  console.log("Tablas creadas o existentes");
});

// ===== Brevo API setup =====
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.SENDINBLUE_PASS;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

async function enviarEmail(asunto, mensaje) {
  let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
sendSmtpEmail.sender = { name: "Invitaciones Elyon", email: "contacto@passionjuvenil.com" };
  sendSmtpEmail.to = [{ email: process.env.SENDINBLUE_TO }];
  sendSmtpEmail.subject = asunto;
  sendSmtpEmail.htmlContent = `<div style="font-family:Arial; font-size:16px;">${mensaje}</div>`;
  await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log("Email enviado ✅");
}

// ===== Rutas =====

// RSVP
app.post("/rsvp", (req, res) => {
  const { nombre, apellido, asistencia, comida } = req.body;
  db.run(
    `INSERT INTO rsvp (nombre, apellido, asistencia, comida) VALUES (?, ?, ?, ?)`,
    [nombre, apellido, asistencia, comida],
    async function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const mensaje = `<strong>Nuevo RSVP:</strong><br>Nombre: ${nombre} ${apellido}<br>Asistencia: ${asistencia}<br>Comida: ${comida}`;
      try { await enviarEmail("Nuevo RSVP", mensaje); } 
      catch (error) { return res.status(500).json({ error: "Error enviando email" }); }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Lista música
app.post("/lista-musica", (req, res) => {
  const { cancion } = req.body;
  db.run(
    `INSERT INTO lista_musica (cancion) VALUES (?)`,
    [cancion],
    async function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const mensaje = `<strong>Nueva canción añadida:</strong> ${cancion}`;
      try { await enviarEmail("Nueva Canción", mensaje); }
      catch (error) { return res.status(500).json({ error: "Error enviando email" }); }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Regalos
app.post("/regalos", (req, res) => {
  const { nombre, email, mensaje, regalo } = req.body;
  db.run(
    `INSERT INTO regalos (regalo, nombre, email, mensaje) VALUES (?, ?, ?, ?)`,
    [regalo, nombre, email, mensaje],
    async function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const emailMensaje = `<strong>Nuevo regalo confirmado:</strong><br>Regalo: ${regalo}<br>Nombre: ${nombre}<br>Email: ${email}<br>Mensaje: ${mensaje || "Sin mensaje"}`;
      try { await enviarEmail("Nuevo Regalo Confirmado", emailMensaje); }
      catch (error) { return res.status(500).json({ error: "Error enviando email" }); }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Ping
app.get("/ping", (req, res) => res.status(200).send("pong ✅"));

// Test email
app.get("/test-email", async (req, res) => {
  try {
    await enviarEmail("Email de prueba Brevo", "Esto es un correo de prueba usando la API HTTP de Brevo.");
    res.send("Email de prueba enviado ✅");
  } catch (err) {
    console.error("Error enviando email:", err);
    res.status(500).send("Error enviando email");
  }
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
