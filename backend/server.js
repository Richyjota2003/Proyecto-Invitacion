require("dotenv").config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Servidor funcionando ✅");
});

// ================= BASE DE DATOS =================
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

  console.log("Tablas creadas o ya existentes.");
});

// ================= NODEMAILER =================
const transporter = nodemailer.createTransport({
  service: "gmail", // más fácil que host+puerto
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // debe ser "contraseña de aplicación"
  },
});

// Verificar conexión con Gmail
transporter.verify((error, success) => {
  if (error) {
    console.error("Error de conexión SMTP:", error);
  } else {
    console.log("Servidor listo para enviar correos ✅");
  }
});

// Función de envío
async function enviarEmailIndividual(asunto, mensaje) {
  const mailOptions = {
    from: `"Invitaciones" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    subject: asunto,
    html: `<div style="font-size:16px; font-family:Arial, sans-serif; color:#000;">
            ${mensaje}
           </div>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email enviado:", info.response);
    return info.response;
  } catch (err) {
    console.error("Error enviando email:", err);
    throw err;
  }
}

// ================= RUTAS =================
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

      const mensaje = `Nuevo RSVP:<br>
        Nombre: ${nombre} ${apellido}<br>
        Asistencia: ${asistencia}<br>
        Comida: ${comida}`;

      try {
        await enviarEmailIndividual("Nuevo RSVP", mensaje);
      } catch (error) {
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

      const mensaje = `Nueva canción añadida: ${cancion}`;

      try {
        await enviarEmailIndividual("Nueva Canción", mensaje);
      } catch (error) {
        return res.status(500).json({ error: "Error enviando email" });
      }

      res.json({ success: true, id: this.lastID });
    }
  );
});

// ================= SERVIDOR =================
app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
