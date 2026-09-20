import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Boxes,
  ClipboardCheck,
  Factory,
  PencilRuler,
  Ship,
  Table2,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { FeatureCard, Section, SectionHeading, Stat } from './components/Section'

const SERVICES = [
  {
    icon: PencilRuler,
    title: 'Design & development',
    body: 'Concept boards, tech packs and the full sample ladder — proto, fit, size set and PP — to your block or ours.',
  },
  {
    icon: Table2,
    title: 'Costing & quotation',
    body: 'Transparent FOB build-ups: fabric, trims, CM, wash, overhead and freight, with the margin shown openly.',
  },
  {
    icon: Boxes,
    title: 'Material sourcing',
    body: 'Fabric and trims from an audited mill base, quoted competitively and inspected on the 4-point system.',
  },
  {
    icon: Factory,
    title: 'Production management',
    body: 'Factory allocation, stage-by-stage tracking from fabric in-house to final inspection, and honest delay reporting.',
  },
  {
    icon: ClipboardCheck,
    title: 'Quality assurance',
    body: 'Inline and final inspections at AQL 2.5, with a defect log and corrective actions you can see.',
  },
  {
    icon: Ship,
    title: 'Export logistics',
    body: 'Booking, customs, the full document set and door-to-door tracking from Chennai or Tuticorin.',
  },
]

const LIFECYCLE = [
  ['Enquiry', 'We take your brief, target price and delivery window.'],
  ['Design', 'Tech packs and samples until the fit and shade are signed off.'],
  ['Costing', 'An open FOB build-up and a quotation you can interrogate.'],
  ['Sourcing', 'Fabric and trims ordered against an awarded RFQ.'],
  ['Production', 'Allocated, tracked and reported stage by stage.'],
  ['Quality', 'AQL 2.5 inline and final inspections before anything ships.'],
  ['Shipping', 'Booked, documented and tracked to the consignee.'],
]

/** The public home page. */
export function HomePage() {
  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-sm font-semibold text-primary">
            Apparel sourcing &amp; buying house · Tiruppur, India
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-text sm:text-5xl">
            From enquiry to export, managed on one thread.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            ApparelFlow takes brand orders, designs and samples them, sources fabric, trims
            and factories, tracks every production stage, inspects to AQL 2.5 and ships —
            with your team watching progress in their own portal the whole way.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button as={Link} to="/contact" size="lg">
              Start an enquiry <ArrowRight className="size-4" />
            </Button>
            <Button as={Link} to="/capabilities" size="lg" variant="secondary">
              See our capabilities
            </Button>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-6 border-t border-border pt-10 sm:grid-cols-4">
            <Stat value="16 yrs" label="Sourcing out of Tiruppur" />
            <Stat value="25" label="Audited mills, factories & units" />
            <Stat value="6M+" label="Pieces shipped a year" />
            <Stat value="92%" label="On-time delivery" />
          </dl>
        </div>
      </section>

      <Section>
        <SectionHeading
          eyebrow="What we do"
          title="A buying house that carries the whole order"
          lead="We don't own factories. We own the outcome — which means choosing the right unit for your style, then staying on it until the cartons are on the water."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <FeatureCard key={service.title} icon={service.icon} title={service.title}>
              {service.body}
            </FeatureCard>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHeading
          eyebrow="How it works"
          title="Seven stages, all visible to you"
          lead="Every order moves through the same lifecycle, and you can see exactly where yours is at any point."
        />
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LIFECYCLE.map(([title, body], index) => (
            <li key={title} className="rounded-lg border border-border bg-surface p-5">
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-fg">
                {index + 1}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-text">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <div className="rounded-lg border border-border bg-surface p-8 sm:p-12">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
              Your own portal, from the first sample
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Every client gets a login. Approve or reject samples with comments, follow the
              production stages, see the revised date the moment something slips, and track
              the shipment to your door — without asking anyone for an update.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button as={Link} to="/login">
                Sign in to the portal
              </Button>
              <Button as={Link} to="/contact" variant="secondary">
                Talk to us first
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
