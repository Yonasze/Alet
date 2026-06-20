import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Handshake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { company } from '@/lib/site'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-primary text-limestone">
      <div className="absolute inset-0 bg-strata-gold opacity-30" aria-hidden="true" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <div className="relative">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            <span className="font-ethiopic">{company.nameAm}</span> · Addis Ababa
          </p>
          <h1 className="font-serif text-5xl font-semibold leading-[1.05] sm:text-6xl lg:text-7xl">
            <span className="block">Strong.</span>
            <span className="block text-gold">Reliable.</span>
            <span className="block">Estate.</span>
          </h1>
          <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-limestone/75">
            We develop and presell premium residential units — building lasting
            value on solid foundations across the capital.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-gold text-primary hover:bg-gold/90"
            >
              <Link href="/project#register">
                Reserve a Unit
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-limestone/30 bg-transparent text-limestone hover:bg-limestone/10 hover:text-limestone"
            >
              <Link href="/partner">
                <Handshake className="size-4" />
                Partner With Us
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-limestone/15 shadow-2xl">
            <Image
              src="/images/hero-building.png"
              alt="Architectural render of an Alet Real Estate residential development"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="absolute -bottom-5 -left-5 hidden rounded-sm border border-gold/30 bg-primary px-6 py-4 shadow-xl sm:block">
            <p className="font-serif text-2xl font-semibold text-gold">100%</p>
            <p className="text-xs uppercase tracking-wider text-limestone/60">
              Built on solid ground
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
