require("dotenv").config();
const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Servidor funcionando ✅");
});

app.post("/rsvp", (req, res) => {
  const { nombre, apellido, asistencia, comida } = req.body;
  const registro = { nombre, apellido, asistencia, comida, fecha: new Date() };

  fs.readFile("rsvps.json", "utf8", (err, data) => {
    let rsvps = [];
    if (!err) rsvps = JSON.parse(data);

    rsvps.push(registro);

    fs.writeFile("rsvps.json", JSON.stringify(rsvps, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Error guardando RSVP" });

      console.log("RSVP guardado:", registro);
      res.json({ success: true });
    });
  });
});

app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));


require("dotenv").config();
const nodemailer = require("nodemailer");
const fs = require("fs");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

fs.readFile("rsvps.json", "utf8", async (err, data) => {
  if (err) return console.error("Error leyendo archivo:", err);

  const rsvps = JSON.parse(data);
  const ultimo = rsvps[rsvps.length - 1]; // tomar el último RSVP

  const mensaje = `
    Nuevo RSVP:<br>
    Nombre: ${ultimo.nombre} ${ultimo.apellido}<br>
    Asistencia: ${ultimo.asistencia}<br>
    Comida: ${ultimo.comida}<br>
    Fecha: ${ultimo.fecha}
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO,
    subject: "Nuevo RSVP",
    html: mensaje
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error("Error enviando email:", error);
    else console.log("Email enviado:", info.response);
  });
});
