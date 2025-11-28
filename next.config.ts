import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // Cela exporte des fichiers HTML/JS statiques
  images: {
    unoptimized: true  // Requis pour l'exportation statique
  }
};

export default nextConfig;