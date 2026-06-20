import { Phone, Mail, MapPin } from 'lucide-react'
import { SectionHeading } from '@/components/site/section-heading'
import { ContactForm } from '@/components/site/contact-form'
import { company } from '@/lib/site'

const details = [
  { icon: Phone, label: 'Phone', value: company.phone, href: `tel:${company.phone}` },
  { icon: Mail, label: 'Email', value: company.email, href: `mailto:${company.email}` },
  { icon: MapPin, label: 'Office', value: company.address },
]

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-border bg-primary py-16 text-limestone sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            Contact
          </p>
          <h1 className="max-w-3xl text-balance font-serif text-4xl font-semibold leading-tight sm:text-5xl">
            Let&apos;s talk about your next home
          </h1>
        </div>
      </section>

      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHeading
              eyebrow="Get In Touch"
              title="We'd love to hear from you"
              description="Reach out with any question about our project, the presale process, or partnership opportunities."
            />
            <ul className="mt-8 space-y-5">
              {details.map((d) => (
                <li key={d.label} className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-secondary text-primary">
                    <d.icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {d.label}
                    </p>
                    {d.href ? (
                      <a href={d.href} className="text-foreground transition-colors hover:text-accent">
                        {d.value}
                      </a>
                    ) : (
                      <p className="text-foreground">{d.value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="relative mt-8 flex aspect-[3/2] items-center justify-center overflow-hidden rounded-sm border border-border bg-secondary bg-strata">
              <div className="flex flex-col items-center text-muted-foreground">
                <MapPin className="size-8 text-accent" />
                <span className="mt-2 text-sm">Map placeholder</span>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-border bg-card p-6 sm:p-8">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  )
}
