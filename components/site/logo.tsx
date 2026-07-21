import Link from 'next/link'
import Image from 'next/image'
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
      <span className={cn('relative flex size-14 shrink-0 items-center justify-center overflow-visible rounded-xl border p-1',invert?'border-gold/30 bg-white/5':'border-primary/10 bg-white shadow-sm')} aria-hidden="true">
        <Image src="/brand/alet-mark-full-transparent.png" alt="" width={52} height={52} className="h-12 w-12 object-contain" priority/>
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
