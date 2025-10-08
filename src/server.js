/**
 * Servidor Express principal.
 * - Configura motor de vistas EJS.
 * - Define middlewares y rutas.
 * - Incluye endpoints de salud y arranque seguro para Cloud Run.
 */

const path = require('path');
const express = require('express');

const app = express();

// Cloud Run inyecta PORT; por defecto 8080
const PORT = process.env.PORT || 8080;

// Body parser para JSON (ajusta el límite si necesitas HTML muy grande)
app.use(express.json({ limit: '2mb' }));

// Motor de plantillas EJS para renderizar las vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', '..', 'views'));

// Endpoints de salud (útiles para readiness/liveness en Cloud Run)
app.get('/', (req, res) => {
  res.json({
    service: 'finai-html-to-pdf',
    status: 'ok',
    version: require('../../package.json').version
  });
});

app.get('/_ah/health', (req, res) => res.status(200).send('ok'));

// Ruta principal de generación de PDFs
const generatePdfRouter = require('./routes/generate-pdf');
app.use('/generate-pdf', generatePdfRouter);

// Manejador de errores global
// Devuelve JSON consistente si algo falla
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Error interno al generar el PDF.'
  });
});

// Arranque del servidor
app.listen(PORT, () => {
  console.log(`[finai-html-to-pdf] Servidor escuchando en puerto ${PORT}`);
});
