/**
 * Capa de integración con Puppeteer.
 * - Reutiliza una única instancia de navegador (warm browser) para rendimiento.
 * - Convierte HTML en PDF con opciones sensatas para informes.
 * - Maneja cierre ordenado ante señales (p.ej. en despliegues Cloud Run).
 */

const puppeteer = require('puppeteer');

let browserPromise = null;

// Lanzar/reutilizar el navegador
async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      // Headless moderno
      headless: true,
      // Flags necesarias en entornos containerizados
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=medium'
      ]
    });
  }
  return browserPromise;
}

/**
 * Convierte HTML a PDF.
 * @param {string} html - markup HTML ya renderizado
 * @param {object} options - opciones Puppeteer page.pdf
 * @returns {Promise<Buffer>} - PDF en memoria
 */
async function htmlToPdf(html, options = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  // Establecer contenido y esperar a que la red esté estable
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // CSS para imprimir colores de fondo si el template no los fija
  await page.addStyleTag({
    content: `
      @page { size: A4; margin: 18mm 12mm; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body { font-family: 'Inter', system-ui, Arial, sans-serif; }
    `
  });

  // Generar el PDF
  const pdfBuffer = await page.pdf({
    format: options.format || 'A4',
    printBackground: options.printBackground !== false,
    margin: options.margin || { top: '18mm', right: '12mm', bottom: '18mm', left: '12mm' },
    preferCSSPageSize: true
  });

  await page.close();
  return pdfBuffer;
}

// Cierre ordenado del navegador en señales del contenedor
async function closeBrowser() {
  try {
    const b = await browserPromise;
    if (b) await b.close();
  } catch (_) {
    // ignorar
  }
}

process.on('SIGTERM', closeBrowser);
process.on('SIGINT', closeBrowser);

module.exports = { htmlToPdf };
