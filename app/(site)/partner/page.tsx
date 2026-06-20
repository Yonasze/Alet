import { LandPlot, Hammer, TrendingUp } from 'lucide-react'
import { SectionHeading } from '@/components/site/section-heading'
import { PartnerForm } from '@/components/site/partner-form'

const steps = [
  {
    icon: LandPlot,
    title: '1. You contribute the land',
    body: 'You bring your land to the table. We assess its potential and agree on fair, transparent terms together.',
  },
  {
    icon: Hammer,
    title: '2. We develop it',
    body: 'Alet Real Estate provides the development expertise, design, capital, and project management to build.',
  },
  {
    icon: TrendingUp,
    title: '3. We share the rewards',
    body: 'Presale revenue funds construction, and the completed value is shared according to our agreement.',
  },
]

export default function PartnerPage() {
  return (
    <>
      <section className="border-b border-border bg-primary py-16 text-limestone sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            Partner With Us
          </p>
          <h1 className="max-w-3xl text-balance font-serif text-4xl font-semibold leading-tight sm:text-5xl">
            Turn your land into lasting value
          </h1>
          <p className="mt-5 max-w-2xl text-pretty leading-relaxed text-limestone/75">
            Our co-development model is built for landowners. You contribute the
            land, we contribute development expertise and capital, and presale
            revenue funds construction — a true partnership from foundation to
            handover.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            align="center"
            eyebrow="How It Works"
            title="A partnership in three steps"
            className="mb-12"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.title} className="rounded-sm border border-border bg-card p-7">
                <span className="flex size-12 items-center justify-center rounded-sm bg-accent text-accent-foreground">
                  <s.icon className="size-6" />
                </span>
                <h3 className="mt-5 font-serif text-lg font-semibold text-primary">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="bg-secondary/60 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading
            align="center"
            eyebrow="Get In Touch"
            title="Tell us about your land"
            description="Share a few details and our development team will follow up to explore the opportunity with you."
          />
          <div className="mt-10 rounded-sm border border-border bg-card p-6 sm:p-8">
            <PartnerForm />
          </div>
        </div>
      </section>
    </>
  )
}
