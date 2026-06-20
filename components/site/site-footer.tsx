import Link from 'next/link'
import { Globe, Camera, Briefcase, Send, Mail, Phone, MapPin } from 'lucide-react'
import { Logo } from '@/components/site/logo'
import { company, siteNav } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="bg-primary text-limestone">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-3">
        <div className="space-y-4">
          <Logo invert />
          <p className="max-w-xs text-sm leading-relaxed text-limestone/60">
            {company.tagline} Building lasting value through quality
            development in Addis Ababa.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <SocialLink href={company.social.facebook} label="Facebook">
              <Globe className="size-4" />
            </SocialLink>
            <SocialLink href={company.social.instagram} label="Instagram">
              <Camera className="size-4" />
            </SocialLink>
            <SocialLink href={company.social.linkedin} label="LinkedIn">
              <Briefcase className="size-4" />
            </SocialLink>
            <SocialLink href={company.social.telegram} label="Telegram">
              <Send className="size-4" />
            </SocialLink>
          </div>
        </div>

        <div>
          <h3 className="font-serif text-sm uppercase tracking-widest text-gold">
            Explore
          </h3>
          <ul className="mt-4 space-y-3">
            {siteNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-limestone/70 transition-colors hover:text-gold"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-serif text-sm uppercase tracking-widest text-gold">
            Contact
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-limestone/70">
            <li className="flex items-center gap-3">
              <Phone className="size-4 text-gold/70" />
              <a href={`tel:${company.phone}`} className="hover:text-gold">
                {company.phone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="size-4 text-gold/70" />
              <a href={`mailto:${company.email}`} className="hover:text-gold">
                {company.email}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 text-gold/70" />
              <span>{company.address}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-limestone/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-limestone/50 sm:flex-row sm:px-6">
          <p>
            &copy; {new Date().getFullYear()} {company.name} ·{' '}
            <span className="font-ethiopic">{company.nameAm}</span>
          </p>
          <Link href="/admin/login" className="hover:text-gold">
            Staff Login
          </Link>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-sm border border-limestone/20 text-limestone/70 transition-colors hover:border-gold hover:text-gold"
    >
      {children}
    </a>
  )
}
