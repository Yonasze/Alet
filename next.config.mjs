/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/project',
        destination: '/projects',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
