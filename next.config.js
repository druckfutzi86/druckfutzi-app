// next.config.js
module.exports = {
  experimental: {
    turbopack: false, // Deaktiviert Turbopack
  },
  webpack: (config, { isServer }) => {
    return config; // Wenn du benutzerdefinierte Webpack-Konfigurationen hast, hier hinzufügen
  },
};