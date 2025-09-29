require("dotenv").config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const { Resend } = require("resend");

const app = express();
const PORT = process.env.PORT || 3000;

// ================= MIDDLEWARE =================
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

// ================= RESEND EMAIL =================
const EMAIL_FROM = process.env.EMAIL_FROM;

async function enviarEmailIndividual(asunto, mensaje) {
  const email = await resend.emails.send({
    from: EMAIL_FROM,
    to: process.env.EMAIL_TO,
    subject: asunto,
    html: `<div style="font-size:16px; font-family:Arial, sans-serif; color:#000;">
            ${mensaje}
           </div>`,
  });
  console.log("Email enviado ✅", email);
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

      const mensaje = `
        Nuevo RSVP:<br>
        Nombre: ${nombre} ${apellido}<br>
        Asistencia: ${asistencia}<br>
        Comida: ${comida}
      `;

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

// ================= RUTA DE PRUEBA =================
app.get("/test-email", async (req, res) => {
  try {
    await enviarEmailIndividual("Prueba", "Este es un email de prueba desde Resend.");
    res.send("Email de prueba enviado ✅");
  } catch (err) {
    res.status(500).send("Error enviando email");
  }
});

// ================= SERVIDOR =================
app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
