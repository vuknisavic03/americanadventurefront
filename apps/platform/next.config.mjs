import { withPayload } from '@payloadcms/next/withPayload'

import { securityHeaders } from './security-headers.mjs'

const isDevelopment = process.env.NODE_ENV !== 'production'
const enableHSTS = process.env.SECURITY_ENABLE_HSTS === 'true'

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        headers: securityHeaders({ enableHSTS, isDevelopment }),
        source: '/:path*',
      },
    ]
  },
  output: 'standalone',
  outputFileTracingIncludes: {
    '/api/admin/contracts/generate': ['./node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf'],
    '/api/contracts/*/download': ['./node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf'],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ['tesseract.js', 'sharp', 'exceljs', 'pdf-lib', '@pdf-lib/fontkit'],
}

export default withPayload(nextConfig)

