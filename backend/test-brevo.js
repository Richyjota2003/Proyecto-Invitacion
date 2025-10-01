require("dotenv").config();

const nodemailer = require("nodemailer");

// 📌 Verificar variables de entorno
console.log("USER:", process.env.SENDINBLUE_USER);
console.log("PASS:", process.env.SENDINBLUE_PASS ? "*****" : null);
console.log("PORT:", process.env.SMTP_PORT);

// 📌 Crear transporter Nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true solo para puerto 465
  auth: {
    user: process.env.SENDINBLUE_USER,
    pass: process.env.SENDINBLUE_PASS
  }
});

// 📌 Verificar conexión SMTP
transporter.verify((error, success) => {
  if (error) {
    console.error("Error conexión SMTP:", error);
  } else {
    console.log("Servidor SMTP listo ✅", success);

    // 📌 Enviar mail de prueba
    transporter.sendMail({
      from: `"Invitaciones Elyon" <${process.env.SENDINBLUE_USER}>`,
      to: process.env.SENDINBLUE_TO,
      subject: "Prueba SMTP Brevo",
      html: `<h2>Correo de prueba enviado desde Nodemailer con Brevo</h2>
             <p>Si ves esto, SMTP funciona correctamente 👍</p>`
    }, (err, info) => {
      if (err) {
        console.error("Error enviando email:", err);
      } else {
        console.log("Email enviado correctamente ✅", info);
      }
    });
  }
});
