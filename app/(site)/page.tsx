import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ShieldCheck, Building2, HandCoins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Hero } from '@/components/site/hero'
import { SectionHeading } from '@/components/site/section-heading'
import { project } from '@/lib/site'

const values = [
  {
    icon: ShieldCheck,
    title: 'Strong',
    body: 'Every project starts with a solid foundation — secured land, sound engineering, and transparent contracts you can trust.',
  },
  {
    icon: Building2,
    title: 'Reliable',
    body: 'We presell with clear milestones and a structured payment schedule, so you always know exactly where your investment stands.',
  },
  {
    icon: HandCoins,
    title: 'Estate',
    body: 'Whether you buy or partner with us as a landowner, we build lasting value designed to grow for generations.',
  },
]

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Values */}
      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Why Alet"
            title="A name that means rock — and a promise we build on"
            description="Alet is Amharic for rock. It reflects how we work: deliberate, durable, and dependable from the ground up."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {values.map((v) => (
              <div
                key={v.title}
                className="group rounded-sm border border-border bg-card p-7 transition-colors hover:border-accent"
              >
                <span className="flex size-12 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                  <v.icon className="size-6" />
                </span>
                <h3 className="mt-5 font-serif text-xl font-semibold text-primary">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flagship teaser */}
      <section className="bg-secondary/60 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div className="relative order-2 aspect-[4/3] overflow-hidden rounded-sm border border-border shadow-lg lg:order-1">
            <Image
              src="/images/project-facade.png"
              alt={`Render of ${project.name} facade`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="order-1 lg:order-2">
            <SectionHeading
              eyebrow="Flagship Project"
              title={project.name}
              description={project.description}
            />
            <ul className="mt-6 space-y-3 text-sm text-foreground/80">
              <li className="flex items-center gap-3">
                <span className="size-1.5 rounded-full bg-accent" />
                Prime location in {project.location}
              </li>
              <li className="flex items-center gap-3">
                <span className="size-1.5 rounded-full bg-accent" />
                Studio, 1, 2 &amp; 3-bedroom units available
              </li>
              <li className="flex items-center gap-3">
                <span className="size-1.5 rounded-full bg-accent" />
                Flexible presale payment schedule
              </li>
            </ul>
            <Button asChild size="lg" className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/project">
                View Project
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Partner CTA */}
      <section className="relative overflow-hidden bg-primary py-20 text-limestone sm:py-24">
        <div className="absolute inset-0 bg-strata opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <SectionHeading
            align="center"
            invert
            eyebrow="For Landowners"
            title="Own land? Let's build something lasting together."
            description="Through our co-development model, you contribute the land and we bring the expertise, capital, and presale strategy. Shared foundations, shared rewards."
          />
          <Button asChild size="lg" className="mt-8 bg-gold text-primary hover:bg-gold/90">
            <Link href="/partner">
              Partner With Us
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  )
}
