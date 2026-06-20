'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/site/logo'
import { siteNav } from '@/lib/site'

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {siteNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/project#register">Reserve a Unit</Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-10 items-center justify-center rounded-sm text-primary lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav
            className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6"
            aria-label="Mobile"
          >
            {siteNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-sm px-3 py-3 text-base font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            <Button
              asChild
              className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link href="/project#register" onClick={() => setOpen(false)}>
                Reserve a Unit
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
