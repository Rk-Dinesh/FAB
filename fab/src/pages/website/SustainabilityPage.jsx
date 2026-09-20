import { Link } from 'react-router-dom'
import { Droplets, Leaf, Recycle, ScrollText, Users, Wind } from 'lucide-react'
import { Button } from '@/components/ui'
import { FeatureCard, Section, SectionHeading, Stat } from './components/Section'

const PILLARS = [
  {
    icon: Leaf,
    title: 'Materials',
    body: 'GOTS organic cotton, GRS recycled polyester, BCI cotton and LENZING viscose, with scope and transaction certificates issued per shipment.',
  },
  {
    icon: Droplets,
    title: 'Water',
    body: 'Ozone and low-liquor-ratio washing at two of our four laundries, cutting water use on denim programmes by around 60% against conventional stone wash.',
  },
  {
    icon: Recycle,
    title: 'Waste',
    body: 'Cut waste is collected and sold to a recycler rather than landfilled. Packaging moved to recycled LDPE polybags and FSC cartons across all accounts.',
  },
  {
    icon: Users,
    title: 'People',
    body: 'Every garment unit holds a current SMETA 4-pillar audit. We publish the audit date and the corrective-action status to clients on request.',
  },
  {
    icon: Wind,
    title: 'Energy',
    body: 'Rooftop solar on three units covers a meaningful share of daytime load. We report unit-level energy intensity annually to the brands that ask.',
  },
  {
    icon: ScrollText,
    title: 'Chemistry',
    body: 'ZDHC MRSL conformance on the dye houses we use, with third-party wastewater testing twice a year.',
  },
]

const COMMITMENTS = [
  ['Traceability to the mill on every order', 'In place'],
  ['Recycled or FSC packaging across all accounts', 'In place'],
  ['SMETA 4-pillar audit on every garment unit', 'In place'],
  ['Ozone or low-water wash on all denim', 'In progress — 2 of 4 laundries'],
  ['Unit-level energy reporting to every client', 'In progress'],
  ['Traceability to the ginner on organic cotton', 'Planned'],
]

export function SustainabilityPage() {
  return (
    <>
      <Section>
        <SectionHeading
          eyebrow="Sustainability"
          title="What we actually do, and what we are still working on"
          lead="A buying house does not own the factories, so it is easy to make claims about them. Everything below is something we can evidence with a certificate or an audit report."
        />
        <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-4">
          <Stat value="100%" label="Garment units SMETA audited" />
          <Stat value="60%" label="Water saved on ozone-washed denim" />
          <Stat value="4" label="Mills with GOTS scope certificates" />
          <Stat value="3" label="Units with rooftop solar" />
        </dl>
      </Section>

      <Section muted>
        <SectionHeading title="Six areas we work on" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((pillar) => (
            <FeatureCard key={pillar.title} icon={pillar.icon} title={pillar.title}>
              {pillar.body}
            </FeatureCard>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading
          title="Where each commitment stands"
          lead="Status as of this season. We would rather show the ones still in progress than only the finished ones."
        />
        <ul className="mt-8 divide-y divide-border rounded-lg border border-border">
          {COMMITMENTS.map(([commitment, status]) => (
            <li
              key={commitment}
              className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <span className="text-sm text-text">{commitment}</span>
              <span
                className={
                  status === 'In place'
                    ? 'shrink-0 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success'
                    : status === 'Planned'
                      ? 'shrink-0 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted'
                      : 'shrink-0 rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning'
                }
              >
                {status}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section muted>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-text">
              Need certificates for a specific programme?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Tell us the fabric and the unit and we'll send the current documents.
            </p>
          </div>
          <Button as={Link} to="/contact" size="lg">
            Request documentation
          </Button>
        </div>
      </Section>
    </>
  )
}
