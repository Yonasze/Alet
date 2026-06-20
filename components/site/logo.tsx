import Link from 'next/link'
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
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-sm border',
          invert
            ? 'border-gold/40 bg-gold/10 text-gold'
            : 'border-primary/20 bg-primary text-primary-foreground',
        )}
        aria-hidden="true"
      >
        {/* Stylized rock / strata mark */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        >
          <path d="M12 3 4 8.5 12 14l8-5.5L12 3Z" />
          <path d="M4 12.5 12 18l8-5.5" opacity="0.55" />
          <path d="M4 16.5 12 22l8-5.5" opacity="0.3" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-serif text-lg font-semibold tracking-tight',
            invert ? 'text-limestone' : 'text-primary',
          )}
        >
          {company.name}
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
