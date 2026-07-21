import Link from 'next/link'
import { ArrowRight, Building2, CalendarDays, MapPin } from 'lucide-react'
import { Logo } from '@/components/site/logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatEtb, formatPhase, getPublicProjects } from '@/services/projects/supabase-project-service'

export const revalidate=60

export default async function PublicProjectsPage(){
  const projects=await getPublicProjects()
  return <main className="min-h-screen bg-background text-primary">
    <header className="border-b border-primary/10 bg-card/90 shadow-sm backdrop-blur"><div className="mx-auto flex min-h-20 max-w-7xl items-center px-5 lg:px-8"><Logo/></div></header>
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
      <div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[.22em] text-gold">Our developments</p><h1 className="mt-4 font-serif text-5xl font-semibold leading-tight md:text-6xl">Projects built to endure.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-primary/70">Explore approved Alet projects, their location, construction progress, homes and commercial spaces.</p></div>
      {projects.length===0?<Card className="mt-12 border-dashed bg-card/70"><CardContent className="py-14 text-center"><Building2 className="mx-auto size-10 text-gold"/><h2 className="mt-5 font-serif text-2xl font-semibold">Projects are being prepared</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Approved project information will appear here automatically after publication in Alet ERP.</p></CardContent></Card>:<div className="mt-12 grid gap-7 lg:grid-cols-2">{projects.map(project=><article key={project.id} className="group overflow-hidden rounded-2xl border border-primary/10 bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="relative aspect-[16/9] overflow-hidden bg-secondary">{project.hero_image_url?<img src={project.hero_image_url} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"/>:<div className="flex h-full items-center justify-center"><Building2 className="size-14 text-primary/30"/></div>}<Badge className="absolute left-5 top-5 bg-card text-primary hover:bg-card">{formatPhase(project.phase)}</Badge></div><div className="p-6 lg:p-8"><div className="flex items-start justify-between gap-5"><div><h2 className="font-serif text-3xl font-semibold">{project.name}</h2><p className="mt-2 flex items-center gap-2 text-sm text-primary/65"><MapPin className="size-4"/>{[project.subcity,project.city].filter(Boolean).join(', ')}</p></div><p className="shrink-0 text-right text-sm text-primary/60">From<span className="mt-1 block font-semibold text-primary">{formatEtb(project.starting_price_etb)}</span></p></div><p className="mt-5 line-clamp-3 text-sm leading-6 text-primary/70">{project.short_description??project.description}</p><div className="mt-6 flex flex-wrap gap-4 border-t border-primary/10 pt-5 text-sm"><span className="font-medium">{project.progress_label}</span>{project.expected_completion_date?<span className="flex items-center gap-2 text-primary/65"><CalendarDays className="size-4"/>Completion {new Date(project.expected_completion_date).toLocaleDateString('en-ET',{year:'numeric',month:'short'})}</span>:null}</div><Button asChild className="mt-7 w-full bg-primary text-primary-foreground hover:bg-primary/90"><Link href={`/projects/${project.slug}`}>View project<ArrowRight className="size-4"/></Link></Button></div></article>)}</div>}
    </section>
  </main>
}
