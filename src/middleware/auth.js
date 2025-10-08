
/**
+ * Middleware de autenticación (Supabase JWT).
+ * - Verifica Bearer JWT con JWKS público de Supabase (RS256) si AUTH_JWKS_URL está definido.
+ * - Hace fallback a HS256 con SUPABASE_JWT_SECRET si se proporciona.
+ */
const { createRemoteJWKSet, jwtVerify } = require('jose');

const authJwksUrl = process.env.AUTH_JWKS_URL; // ej: https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
const issuer = process.env.AUTH_ISSUER;        // opcional: ej: https://<project-ref>.supabase.co/auth/v1
const audience = process.env.AUTH_AUDIENCE;    // opcional: ej: authenticated
const hsSecret = process.env.SUPABASE_JWT_SECRET; // opcional (fallback HS256)

let jwks;
if (authJwksUrl) {
  try { jwks = createRemoteJWKSet(new URL(authJwksUrl)); } catch { /* ignore */ }
}

module.exports = async function auth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: true, message: 'Falta Bearer token.' });

    // 1) Intentar verificación con JWKS (RS256)
    if (jwks) {
      try {
        const { payload } = await jwtVerify(token, jwks, {
          issuer: issuer || undefined,
          audience: audience || undefined,
        });
        req.user = payload;
        return next();
      } catch {/* fallback */}
    }

    // 2) Fallback HS256 con secreto compartido (proyectos legacy)
    if (hsSecret) {
      const enc = new TextEncoder().encode(hsSecret);
      const { payload } = await jwtVerify(token, enc, {
        issuer: issuer || undefined,
        audience: audience || undefined,
      });
      req.user = payload;
      return next();
    }

    return res.status(401).json({ error: true, message: 'Token inválido o configuración de claves ausente.' });
  } catch (e) {
    return res.status(401).json({ error: true, message: 'Token inválido o expirado.' });
  }
};
