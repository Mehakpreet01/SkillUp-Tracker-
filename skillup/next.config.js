/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // pdfjs-dist optionally depends on 'canvas' (Node.js only).
    // We don't need it in the browser, so tell webpack to ignore it.
    config.resolve.alias.canvas = false;
    return config;
  },
};
module.exports = nextConfig;
