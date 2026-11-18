/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // node:sqlite is a Node built-in; keep it out of the client bundle.
  serverExternalPackages: [],
};

export default nextConfig;
