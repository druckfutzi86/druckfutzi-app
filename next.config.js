// next.config.js
module.exports = {
  experimental: {
    turbopack: false,  // Deaktiviert Turbopack
  },
  webpack: (config) => {
    // Optional: Passe die Webpack-Konfiguration an, wenn notwendig
    return config;
  },
};