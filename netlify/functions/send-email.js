// netlify/functions/send-email.js
import nodemailer from 'nodemailer';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    if (data.website) return { statusCode: 200, body: 'OK' };

    const required = ['prenom','nom','naissance','email','ville'];
    for (const k of required) {
      if (!data[k] || String(data[k]).trim() === '') {
        return { statusCode: 400, body: `Champ manquant: ${k}` };
      }
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.MAIL_FROM || user || 'no-reply@example.com';
    const to   = process.env.DEST_EMAIL;

    if (!host || !to) {
      return { statusCode: 500, body: 'Config SMTP incomplète (SMTP_HOST / DEST_EMAIL)' };
    }

    const transportConfig = {
      host,
      port,
      secure: port === 465,
    };
    if (user && pass) transportConfig.auth = { user, pass };

    const transporter = nodemailer.createTransport(transportConfig);

    const subject = 'Fiche renseignement';
    const text =
      `Nom: ${data.nom}\n` +
      `Prénom: ${data.prenom}\n` +
      `Date de naissance: ${data.naissance}\n` +
      `Email: ${data.email}\n` +
      `Ville: ${data.ville}`;

    await transporter.sendMail({ from, to, subject, text });
    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    return { statusCode: 500, body: 'Erreur serveur: ' + (err?.message || String(err)) };
  }
}
