import Image from 'next/image'
import { MapPin, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SectionHeading } from '@/components/site/section-heading'
import { RegisterForm } from '@/components/site/register-form'
import { project } from '@/lib/site'

const gallery = [
  { src: '/images/hero-building.png', alt: 'Building exterior render', span: 'sm:col-span-2 sm:row-span-2' },
  { src: '/images/project-interior.png', alt: 'Apartment interior render', span: '' },
  { src: '/images/project-lobby.png', alt: 'Lobby render', span: '' },
  { src: '/images/project-facade.png', alt: 'Facade detail render', span: '' },
  { src: '/images/project-aerial.png', alt: 'Aerial masterplan render', span: '' },
]

const unitTypes = [
  { name: 'Studio', size: '42 m²', price: 'from ETB 4.2M', desc: 'Efficient open-plan living, ideal for first-time buyers and investors.' },
  { name: '1 Bedroom', size: '58 m²', price: 'from ETB 5.8M', desc: 'A bright bedroom, full kitchen, and private balcony with city views.' },
  { name: '2 Bedroom', size: '86 m²', price: 'from ETB 8.4M', desc: 'Family-friendly layout with two bedrooms and a generous living area.' },
  { name: '3 Bedroom', size: '120 m²', price: 'from ETB 12.5M', desc: 'Premium corner residences with expansive space and dual aspect light.' },
]

const payment = [
  { step: 'Reservation', pct: 'Deposit', desc: 'Secure your unit with a refundable reservation deposit.' },
  { step: 'Stage 1', pct: '30%', desc: 'Paid upon signing the sales agreement.' },
  { step: 'Stage 2', pct: '30%', desc: 'Paid at the construction mid-point milestone.' },
  { step: 'Handover', pct: '40%', desc: 'Final balance settled on completion and key handover.' },
]

const milestones = [
  { label: 'Groundbreaking', status: 'done' },
  { label: 'Foundation', status: 'done' },
  { label: 'Structure', status: 'active' },
  { label: 'Finishing', status: 'upcoming' },
  { label: 'Handover', status: 'upcoming' },
]

export default function ProjectPage() {
  return (
    <>
      {/* Intro */}
      <section className="border-b border-border bg-primary py-16 text-limestone sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Badge className="mb-4 border-gold/30 bg-gold/15 text-gold hover:bg-gold/15">
            Now Preselling
          </Badge>
          <h1 className="max-w-3xl text-balance font-serif text-4xl font-semibold leading-tight text-limestone sm:text-5xl">
            {project.name}
          </h1>
          <p className="mt-3 flex items-center gap-2 text-limestone/70">
            <MapPin className="size-4 text-gold" />
            {project.location}
          </p>
          <p className="mt-5 max-w-2xl text-pretty leading-relaxed text-limestone/75">
            {project.description}
          </p>
        </div>
      </section>

      {/* Gallery */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:grid-cols-4">
            {gallery.map((g) => (
              <div
                key={g.src}
                className={`relative overflow-hidden rounded-sm border border-border ${g.span}`}
              >
                <Image src={g.src} alt={g.alt} fill className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Unit types */}
      <section className="bg-secondary/60 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Residences"
            title="Choose the home that fits your life"
            description="A range of thoughtfully designed units, each delivered with quality finishes and flexible payment terms."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {unitTypes.map((u) => (
              <div key={u.name} className="flex flex-col rounded-sm border border-border bg-card p-6">
                <h3 className="font-serif text-xl font-semibold text-primary">{u.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{u.size}</p>
                <p className="mt-4 font-serif text-lg font-semibold text-accent">{u.price}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{u.desc}</p>
                <Badge className="mt-5 w-fit border-0 bg-sage/20 text-[color:var(--navy)] hover:bg-sage/20">
                  Available
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment schedule */}
      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Presale Schedule"
            title="A clear, structured payment plan"
            description="Spread across the build, your payments are tied to real progress — never ahead of it."
          />
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {payment.map((p, i) => (
              <li key={p.step} className="relative rounded-sm border border-border bg-card p-6">
                <span className="font-serif text-sm text-accent">Step {i + 1}</span>
                <p className="mt-1 font-serif text-2xl font-semibold text-primary">{p.pct}</p>
                <p className="mt-1 text-sm font-medium text-foreground/80">{p.step}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Milestones */}
      <section className="bg-secondary/60 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Construction Progress"
            title="Where we are today"
          />
          <div className="mt-12 overflow-x-auto">
            <div className="flex min-w-[640px] items-start">
              {milestones.map((m, i) => (
                <div key={m.label} className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    <span className={`h-0.5 flex-1 ${i === 0 ? 'opacity-0' : m.status === 'upcoming' ? 'bg-border' : 'bg-accent'}`} />
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 ${
                        m.status === 'done'
                          ? 'border-accent bg-accent text-primary'
                          : m.status === 'active'
                            ? 'border-accent bg-card text-accent'
                            : 'border-border bg-card text-muted-foreground'
                      }`}
                    >
                      {m.status === 'done' ? <Check className="size-5" /> : <span className="size-2.5 rounded-full bg-current" />}
                    </span>
                    <span className={`h-0.5 flex-1 ${i === milestones.length - 1 ? 'opacity-0' : m.status === 'done' ? 'bg-accent' : 'bg-border'}`} />
                  </div>
                  <p className={`mt-3 text-center text-sm font-medium ${m.status === 'upcoming' ? 'text-muted-foreground' : 'text-primary'}`}>
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <SectionHeading
            eyebrow="Location"
            title="At the centre of it all in Bole"
            description="Minutes from Bole International Airport, premier shopping, schools, and the business district — Alet Heights places everyday convenience at your door."
          />
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-sm border border-border bg-secondary bg-strata">
            <div className="flex flex-col items-center text-muted-foreground">
              <MapPin className="size-8 text-accent" />
              <span className="mt-2 text-sm">Map placeholder — {project.location}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Register interest */}
      <section id="register" className="scroll-mt-24 bg-primary py-20 text-limestone sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading
            align="center"
            invert
            eyebrow="Register Interest"
            title="Reserve your place at Alet Heights"
            description="Share your details and our team will reach out with availability, pricing, and next steps."
          />
          <div className="mt-10 rounded-sm border border-limestone/15 bg-card p-6 text-foreground sm:p-8">
            <RegisterForm />
          </div>
        </div>
      </section>
    </>
  )
}
