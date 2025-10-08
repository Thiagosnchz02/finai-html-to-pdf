# Imagen base ligera de Node
FROM node:20-slim

# Evitar prompts en apt-get
ENV DEBIAN_FRONTEND=noninteractive

# Instalar dependencias del sistema necesarias para Chromium/Puppeteer
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    fonts-noto-color-emoji \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libu2f-udev \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    wget \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*

# Crear directorio de la app
WORKDIR /app

# Copiar manifest e instalar dependencias (mejor caché)
COPY package.json ./
RUN npm ci --omit=dev

# Copiar el resto del código
COPY . .

# Variables de entorno estándar para Cloud Run
ENV NODE_ENV=production
# IMPORTANTE en Cloud Run para Chrome
ENV PUPPETEER_SKIP_DOWNLOAD=false

# Exponer el puerto de Cloud Run (se sobreescribe con $PORT)
EXPOSE 8080

# Ejecutar como usuario no root
USER node

# Comando de arranque
CMD ["npm", "start"]
