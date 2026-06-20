import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Playfair_Display, Noto_Sans_Ethiopic } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})
const notoEthiopic = Noto_Sans_Ethiopic({
  variable: '--font-noto-ethiopic',
  subsets: ['ethiopic'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Alet Real Estate | Strong. Reliable. Estate.',
  description:
    'Alet Real Estate (አለት ሪልስቴት) develops premium residential projects in Addis Ababa, Ethiopia. Reserve a unit or partner with us as a landowner.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#1B3A4B',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`light ${geistSans.variable} ${playfair.variable} ${notoEthiopic.variable}`}
    >
      <body className="font-sans antialiased bg-background">
        {children}
        <Toaster position="top-center" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
