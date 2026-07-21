import Link from 'next/link'
import { BrandMark } from '@/components/brand-mark'
import { cn } from '@/lib/utils'
import { company } from '@/lib/site'

export function Logo({
  className,
  invert = false,
}: {
  className?: string
  invert?: boolean
}) {
  return (
    <Link
      href="/"
      className={cn('group flex items-center gap-3', className)}
      aria-label={`${company.name} home`}
    >
      <span className={cn('flex size-16 shrink-0 items-center justify-center rounded-2xl border',invert?'border-gold/30 bg-white/5':'border-primary/10 bg-white shadow-sm')}>
        <BrandMark inverted={invert} />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-serif text-lg font-semibold tracking-[0.08em]',
            invert ? 'text-limestone' : 'text-primary',
          )}
        >
          ALET REAL ESTATE
        </span>
        <span
          className={cn(
            'font-ethiopic mt-0.5 text-xs tracking-wide',
            invert ? 'text-limestone/60' : 'text-muted-foreground',
          )}
        >
          {company.nameAm}
        </span>
      </span>
    </Link>
  )
}
