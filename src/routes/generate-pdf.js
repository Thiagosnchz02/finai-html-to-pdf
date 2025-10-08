/**
 * Ruta POST /generate-pdf
 * Espera JSON: { templateName: string, templateData: object }
 * 1) Valida input y sanitiza templateName
 * 2) Renderiza EJS -> HTML
 * 3) Convierte HTML -> PDF (Buffer) con Puppeteer
 * 4) Devuelve el PDF con Content-Type application/pdf
 */

const path = require('path');
const fs = require('fs');
const express = require('express');
const ejs = require('ejs');
const { htmlToPdf } = require('../lib/pdf');

const router = express.Router();

const VIEWS_DIR = path.join(__dirname, '..', '..', 'views');

// Utilidad simple para asegurar que el nombre de plantilla sea seguro
const isSafeTemplateName = (name) => /^[a-zA-Z0-9\-_]+$/.test(name);

router.post('/', async (req, res, next) => {
  try {
    const { templateName, templateData } = req.body || {};

    // Validaciones básicas
    if (!templateName || typeof templateName !== 'string') {
      const err = new Error('Falta "templateName" (string).');
      err.status = 400;
      throw err;
    }
    if (templateData != null && typeof templateData !== 'object') {
      const err = new Error('"templateData" debe ser un objeto JSON.');
      err.status = 400;
      throw err;
    }
    if (!isSafeTemplateName(templateName)) {
      const err = new Error('Nombre de plantilla inválido. Usa sólo letras, números, guiones (-) o guiones bajos (_).');
      err.status = 400;
      throw err;
    }

    const templatePath = path.join(VIEWS_DIR, `${templateName}.ejs`);

    // Evitar Path Traversal y comprobar existencia
    const resolved = path.resolve(templatePath);
    if (!resolved.startsWith(path.resolve(VIEWS_DIR))) {
      const err = new Error('Acceso a plantilla no permitido.');
      err.status = 403;
      throw err;
    }
    if (!fs.existsSync(resolved)) {
      const err = new Error(`La plantilla "${templateName}.ejs" no existe.`);
      err.status = 404;
      throw err;
    }

    // Render EJS -> HTML
    const html = await ejs.renderFile(resolved, templateData || {}, {
      // Cache en producción para rendimiento
      cache: process.env.NODE_ENV === 'production',
      async: true
    });

    // HTML -> PDF
    const pdfBuffer = await htmlToPdf(html, {
      // puedes ajustar márgenes/formato si lo deseas
      format: 'A4',
      printBackground: true
    });

    // Responder con el PDF en el body
    const filename = `${templateName}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    // attachment -> descarga; inline -> previsualiza
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(pdfBuffer));
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
