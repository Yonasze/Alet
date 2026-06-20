import { SectionHeading } from '@/components/site/section-heading'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    q: 'How are presale payments handled?',
    a: 'Payments follow a structured schedule tied to construction progress: a reservation deposit, 30% on signing, 30% at the mid-point milestone, and 40% on handover. Each instalment is documented and receipted, so you always know what you have paid and what remains.',
  },
  {
    q: 'What does the contract process look like?',
    a: 'After you reserve a unit, we prepare a formal sales agreement that clearly sets out the unit, price, payment schedule, specifications, and expected handover. You review it at your own pace, and we are happy to walk through every clause before you sign.',
  },
  {
    q: 'What happens if the project changes?',
    a: 'Material changes are communicated to all buyers in writing. Your agreement defines what is fixed and what may be adjusted. If a significant change affects your unit, we work with you on a fair resolution — including agreed remedies set out in the contract.',
  },
  {
    q: 'What timeline should I expect?',
    a: 'Each project has a published construction timeline with key milestones — groundbreaking, foundation, structure, finishing, and handover. We share regular progress updates, and our payment schedule is aligned to these milestones rather than fixed dates alone.',
  },
  {
    q: 'Is my reservation deposit refundable?',
    a: 'Yes — the reservation deposit secures your unit and is refundable up to the point of signing the sales agreement, subject to the terms shared at reservation. Our team explains this clearly before you commit.',
  },
  {
    q: 'How do landowner partnerships work?',
    a: 'Through our co-development model, the landowner contributes the land while Alet Real Estate provides development expertise and capital. Presale revenue funds construction, and the completed value is shared per a mutually agreed arrangement. Visit our Partner With Us page to start a conversation.',
  },
]

export default function FaqPage() {
  return (
    <>
      <section className="border-b border-border bg-primary py-16 text-limestone sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            Process &amp; FAQ
          </p>
          <h1 className="max-w-3xl text-balance font-serif text-4xl font-semibold leading-tight sm:text-5xl">
            Clear answers, every step of the way
          </h1>
        </div>
      </section>

      <section className="bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Common Questions"
            title="What buyers and partners ask us most"
            className="mb-10"
          />
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left font-serif text-lg text-primary">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-pretty leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  )
}
