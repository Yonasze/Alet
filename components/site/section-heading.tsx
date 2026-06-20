import { cn } from '@/lib/utils'

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
  invert = false,
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  className?: string
  invert?: boolean
}) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow && (
        <div
          className={cn(
            'mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em]',
            align === 'center' && 'justify-center',
            invert ? 'text-gold' : 'text-accent',
          )}
        >
          <span className="h-px w-8 bg-current" aria-hidden="true" />
          {eyebrow}
        </div>
      )}
      <h2
        className={cn(
          'text-balance font-serif text-3xl font-semibold leading-tight sm:text-4xl',
          invert ? 'text-limestone' : 'text-primary',
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'mt-4 text-pretty leading-relaxed',
            invert ? 'text-limestone/70' : 'text-muted-foreground',
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}
