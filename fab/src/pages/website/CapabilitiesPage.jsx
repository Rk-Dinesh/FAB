import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { Section, SectionHeading, Stat } from './components/Section'

const PRODUCT_GROUPS = [
  {
    group: 'Knitwear',
    items: ['Tees and tanks', 'Polos', 'Sweatshirts and hoodies', 'Joggers and shorts', 'Long sleeve and henleys'],
    moq: '1,000 pcs / colour',
    lead: '60–75 days',
  },
  {
    group: 'Wovens',
    items: ['Casual shirts', 'Camp collars', 'Chinos and cargos', 'Overshirts', 'Dresses and skirts'],
    moq: '800 pcs / colour',
    lead: '75–90 days',
  },
  {
    group: 'Denim',
    items: ['5-pocket jeans', 'Denim jackets', 'Skirts and shorts', 'Washed and raw finishes'],
    moq: '1,200 pcs / wash',
    lead: '85–100 days',
  },
  {
    group: 'Kidswear',
    items: ['Infant bodysuits', 'Toddler sets', 'Youth tees and hoodies', 'Organic and GOTS programmes'],
    moq: '1,500 pcs / colour',
    lead: '65–80 days',
  },
  {
    group: 'Performance',
    items: ['Training tees', 'Leggings and shorts', 'Recycled polyester programmes', 'Seamless and bonded trims'],
    moq: '1,000 pcs / colour',
    lead: '70–85 days',
  },
  {
    group: 'Outerwear',
    items: ['Chore and canvas jackets', 'Quilted gilets', 'Unlined overshirts'],
    moq: '600 pcs / colour',
    lead: '90–110 days',
  },
]

const FABRICS = [
  ['Knit', 'Single jersey, interlock, pique, rib, french terry, brushed fleece — 140 to 340 GSM'],
  ['Woven', 'Poplin, oxford, twill, canvas, viscose challis, linen blends — 100 to 260 GSM'],
  ['Denim', '9 to 13 oz, rigid and stretch, from an audited Hyderabad mill base'],
  ['Sustainable', 'GOTS organic cotton, GRS recycled polyester, LENZING viscose, BCI cotton'],
]

const COMPLIANCE = [
  ['SEDEX / SMETA', 'Every garment unit we place with holds a current 4-pillar audit.'],
  ['WRAP', 'Certified on the four factories that carry our largest programmes.'],
  ['OEKO-TEX Standard 100', 'Held across the mill base for all direct-to-skin product.'],
  ['GOTS', 'Scope certificates on the organic cotton chain, transaction certificates per shipment.'],
  ['GRS', 'Recycled polyester traced from chip to garment for our activewear programmes.'],
]

export function CapabilitiesPage() {
  return (
    <>
      <Section>
        <SectionHeading
          eyebrow="Capabilities"
          title="What we make, in what volumes, and how fast"
          lead="Honest numbers rather than best-case ones. Lead times run from PO confirmation to ex-factory, assuming samples are approved on schedule."
        />
        <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-4">
          <Stat value="6M+" label="Annual capacity in pieces" />
          <Stat value="25" label="Audited vendor units" />
          <Stat value="8" label="Garment factories" />
          <Stat value="7" label="Fabric mills" />
        </dl>
      </Section>

      <Section muted>
        <SectionHeading title="Product groups" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_GROUPS.map((group) => (
            <article key={group.group} className="rounded-lg border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text">{group.group}</h3>
              <ul className="mt-3 flex flex-col gap-1">
                {group.items.map((item) => (
                  <li key={item} className="text-sm text-muted">
                    · {item}
                  </li>
                ))}
              </ul>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
                <div>
                  <dt className="text-[11px] text-muted">MOQ</dt>
                  <dd className="text-sm font-medium text-text">{group.moq}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted">Lead time</dt>
                  <dd className="text-sm font-medium text-text">{group.lead}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading title="Fabric base" />
        <dl className="mt-8 divide-y divide-border rounded-lg border border-border">
          {FABRICS.map(([name, description]) => (
            <div key={name} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:gap-6">
              <dt className="w-32 shrink-0 text-sm font-semibold text-text">{name}</dt>
              <dd className="text-sm leading-relaxed text-muted">{description}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section muted>
        <SectionHeading
          title="Compliance & certification"
          lead="We will send the current certificates before you ask for them."
        />
        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          {COMPLIANCE.map(([name, description]) => (
            <div key={name} className="rounded-lg border border-border bg-surface p-5">
              <dt className="text-sm font-semibold text-text">{name}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted">{description}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section>
        <div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-surface p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-text">
              Have a style outside this list?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Ask anyway. If we can't make it well, we'll tell you who can.
            </p>
          </div>
          <Button as={Link} to="/contact" size="lg">
            Get in touch
          </Button>
        </div>
      </Section>
    </>
  )
}
