import { Link } from 'react-router-dom'
import { Eye, Handshake, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'
import { FeatureCard, Section, SectionHeading, Stat } from './components/Section'

const VALUES = [
  {
    icon: Eye,
    title: 'Tell you early',
    body: 'A delay you hear about in week two is a problem. A delay you hear about in week six is a crisis. We flag slippage the day it happens, with a revised date.',
  },
  {
    icon: Handshake,
    title: 'Open costing',
    body: 'Our quotations show the build-up — fabric, trims, CM, wash, overhead, freight — and the margin we are taking. No line called "sundries".',
  },
  {
    icon: ShieldCheck,
    title: 'Audit what we claim',
    body: 'Every unit we place with is SEDEX or WRAP audited, and every lot is inspected to AQL 2.5 before it is offered for shipment.',
  },
  {
    icon: Sparkles,
    title: 'Fewer, better partners',
    body: 'Twenty-five vendors, not two hundred. We know their lines, their strengths and what they should not be asked to make.',
  },
]

const TIMELINE = [
  ['2009', 'Started as a three-person merchandising office in Tiruppur, servicing two US knitwear brands.'],
  ['2013', 'Added an in-house design and CAD team, and moved from order-taking to full development.'],
  ['2017', 'Opened the Bengaluru office to cover woven and dress production.'],
  ['2021', 'Built the audited vendor base to twenty-five units and introduced 4-point fabric inspection across the board.'],
  ['2024', 'Launched the client portal — sample approvals and live production tracking for every brand we work with.'],
]

export function AboutPage() {
  return (
    <>
      <Section>
        <SectionHeading
          eyebrow="About us"
          title="A sourcing office that behaves like part of your team"
          lead="ApparelFlow is a buying house in Tiruppur, India. We take orders from fashion brands, develop and cost them, place them with the right unit, and stay on them until they land."
        />
        <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-4">
          <Stat value="2009" label="Founded" />
          <Stat value="45" label="People across three offices" />
          <Stat value="6" label="Brands under long-term programmes" />
          <Stat value="4" label="Countries shipped to weekly" />
        </dl>
      </Section>

      <Section muted>
        <SectionHeading eyebrow="How we work" title="Four things we hold ourselves to" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {VALUES.map((value) => (
            <FeatureCard key={value.title} icon={value.icon} title={value.title}>
              {value.body}
            </FeatureCard>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="History" title="How we got here" />
        <ol className="mt-10 flex flex-col">
          {TIMELINE.map(([year, body], index) => (
            <li key={year} className="relative flex gap-5 pb-8 last:pb-0">
              {index < TIMELINE.length - 1 && (
                <span
                  className="absolute left-[27px] top-12 h-[calc(100%-2.5rem)] w-px bg-border"
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold text-primary">
                {year}
              </span>
              <p className="pt-4 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section muted>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-text">
              Want to see how we'd run your programme?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Send us a tech pack and a target price. We'll come back with an open costing.
            </p>
          </div>
          <Button as={Link} to="/contact" size="lg">
            Start an enquiry
          </Button>
        </div>
      </Section>
    </>
  )
}
