import { cn } from '@/lib/utils'

export function BrandMark({
  className,
  inverted = false,
}: {
  className?: string
  inverted?: boolean
}) {
  return (
    <span
      className={cn('relative block h-12 w-10 shrink-0', className)}
      aria-hidden="true"
    >
      <span
        className={cn(
          'absolute inset-x-1 bottom-0 top-2 rounded-t-full border-[4px] border-b-0',
          inverted ? 'border-limestone' : 'border-primary',
        )}
      />
      <span className="absolute left-1/2 top-0 z-10 h-3.5 w-3.5 -translate-x-1/2 bg-gold [clip-path:polygon(10%_0,90%_0,72%_100%,28%_100%)]" />
    </span>
  )
}
