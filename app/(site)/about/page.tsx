import Image from 'next/image'
import { Target, Eye, Gem } from 'lucide-react'
import { SectionHeading } from '@/components/site/section-heading'

const pillars = [
  { icon: Target, title: 'Our Mission', body: 'To develop honest, high-quality homes that create lasting value for buyers, partners, and the communities we build in.' },
  { icon: Eye, title: 'Our Vision', body: 'To become Addis Ababa\u2019s most trusted name in residential development — known for delivering exactly what we promise.' },
  { icon: Gem, title: 'Our Values', body: 'Integrity, craftsmanship, and transparency guide every decision, from the land we acquire to the keys we hand over.' },
]

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-border bg-primary py-16 text-limestone sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            Our Story
          </p>
          <h1 className="max-w-3xl text-balance font-serif text-4xl font-semibold leading-tight sm:text-5xl">
            Building on solid ground in Addis Ababa
          </h1>
        </div>
      </section>

      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div className="space-y-5 text-pretty leading-relaxed text-foreground/80">
            <p>
              Alet Real Estate is a newly established development company with a
              simple ambition: to build homes the right way. We acquire land to
              develop, or partner with landowners to co-develop, and presell
              units before and during construction.
            </p>
            <p>
              This model lets us deliver quality residences while keeping the
              process transparent and aligned with our buyers. Every payment is
              tied to real progress, every contract is clear, and every home is
              built to last.
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-border shadow-lg">
            <Image
              src="/images/project-lobby.png"
              alt="Render of an Alet Real Estate development lobby"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Meaning of the name */}
      <section className="bg-secondary/60 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="font-ethiopic text-5xl font-semibold text-accent">አለት</p>
          <SectionHeading
            align="center"
            className="mt-6"
            eyebrow="The Meaning of Alet"
            title="Alet means rock"
            description="In Amharic, Alet is the word for rock — a symbol of foundation, strength, and permanence. It captures everything we stand for: homes built to endure and a company you can rely on for the long term."
          />
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map((p) => (
              <div key={p.title} className="rounded-sm border border-border bg-card p-7">
                <span className="flex size-12 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                  <p.icon className="size-6" />
                </span>
                <h3 className="mt-5 font-serif text-xl font-semibold text-primary">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
