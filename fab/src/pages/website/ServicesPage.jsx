import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui'
import { Section, SectionHeading } from './components/Section'

const SERVICES = [
  {
    title: 'Design & product development',
    lead: 'From a mood board or from your tech pack — either way you get a PP sample you can sign off on.',
    points: [
      'Concept boards and CAD artwork to your brand direction',
      'Full tech packs: construction, graded measurements and BOM',
      'The sample ladder — proto, fit, size set and PP',
      'Lab dips and strike-offs against your approved standards',
      'Pattern making and grading in-house',
    ],
  },
  {
    title: 'Costing & quotation',
    lead: 'An FOB you can take apart, so a price-down conversation is about the right line.',
    points: [
      'Per-piece build-up across fabric, trims, CM, wash, overhead and freight',
      'Consumption calculated from the marker, not estimated',
      'Margin stated openly on every sheet',
      'Versioned quotations with the reason for each revision',
      'Order-wise P&L shared after delivery',
    ],
  },
  {
    title: 'Material sourcing',
    lead: 'Fabric and trims bought competitively from mills we have audited and use repeatedly.',
    points: [
      'RFQs to at least three mills on every fabric',
      'Quote comparison on price, lead time and terms — not price alone',
      'GOTS, OEKO-TEX and GRS certified options',
      '4-point fabric inspection on receipt, with shortfalls reported',
      'Trims consolidated so nothing holds the line up',
    ],
  },
  {
    title: 'Production management',
    lead: 'We place the order with the right unit and then stay on it, stage by stage.',
    points: [
      'Factory allocation matched to product type and line capacity',
      'Stage tracking: fabric in-house, cutting, stitching, wash, finishing, packing',
      'Daily output against target with efficiency reporting',
      'A time-and-action calendar you can see, not one we keep to ourselves',
      'Revised dates the day a stage slips',
    ],
  },
  {
    title: 'Quality assurance',
    lead: 'Inline while it can still be fixed, and final before anything is offered.',
    points: [
      'AQL 2.5 general inspection level II as standard',
      'AQL 1.5 and safety testing on kidswear',
      'Inline audits during stitching, not only at the end',
      'Defect log with severity, root cause and corrective action',
      'Third-party inspection coordinated when you want it',
    ],
  },
  {
    title: 'Export logistics & documentation',
    lead: 'Booked, documented and tracked, so your warehouse knows what is coming and when.',
    points: [
      'Sea and air bookings from Chennai, Tuticorin and Cochin',
      'Commercial invoice, packing list, B/L or AWB, COO and inspection certificate',
      'Customs clearance and CHA coordination',
      'Carton marking and packing ratios to your spec',
      'Door-to-door tracking visible in your portal',
    ],
  },
]

export function ServicesPage() {
  return (
    <>
      <Section>
        <SectionHeading
          eyebrow="Services"
          title="Everything between your brief and your warehouse"
          lead="Take the whole chain or the parts you need. Most brands start with development and costing, then hand us production once they trust the numbers."
        />
      </Section>

      <Section muted className="!pt-0 sm:!pt-0">
        <div className="grid gap-4 lg:grid-cols-2">
          {SERVICES.map((service) => (
            <article key={service.title} className="rounded-lg border border-border bg-surface p-6">
              <h2 className="text-lg font-semibold text-text">{service.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{service.lead}</p>
              <ul className="mt-4 flex flex-col gap-2">
                {service.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                    <span className="text-sm text-muted">{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-surface p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-text">
              Not sure which parts you need?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Tell us the style and the volume and we'll tell you honestly where we add value.
            </p>
          </div>
          <Button as={Link} to="/contact" size="lg">
            Send us a brief
          </Button>
        </div>
      </Section>
    </>
  )
}
