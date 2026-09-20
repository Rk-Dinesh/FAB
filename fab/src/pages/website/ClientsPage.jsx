import { Link } from 'react-router-dom'
import { Quote } from 'lucide-react'
import { Button } from '@/components/ui'
import { Section, SectionHeading, Stat } from './components/Section'

const CLIENTS = [
  {
    name: 'Northwind Apparel',
    location: 'Portland, US',
    segment: 'Casual basics',
    since: '2021',
    body: 'Two seasonal drops plus a replenishment programme on heavyweight tees and pique polos. Our largest account by volume.',
  },
  {
    name: 'Blue Harbor Co.',
    location: 'Charleston, US',
    segment: 'Coastal lifestyle',
    since: '2022',
    body: 'Garment-dyed sweats and washed cotton shirting, where shade continuity across repeat orders matters more than anything.',
  },
  {
    name: 'Urban Loom',
    location: 'Manchester, UK',
    segment: 'Street & workwear',
    since: '2023',
    body: 'Canvas chore jackets and selvedge-look denim, produced in short, frequent runs.',
  },
  {
    name: 'Verde Kids',
    location: 'Barcelona, ES',
    segment: 'Sustainable kidswear',
    since: '2024',
    body: 'GOTS organic cotton throughout, with EN 14682 safety auditing and AQL 1.5 on every style.',
  },
  {
    name: 'Atlas Active',
    location: 'Munich, DE',
    segment: 'Performance activewear',
    since: '2025',
    body: 'Recycled polyester only, with GRS transaction certificates issued against every shipment.',
  },
  {
    name: 'Maison Rue',
    location: 'Paris, FR',
    segment: 'Contemporary womenswear',
    since: '2026',
    body: 'Small runs in viscose and linen blends, on tight ex-factory windows and high fabric standards.',
  },
]

const TESTIMONIALS = [
  {
    quote:
      'They told us about a fabric delay four weeks before it would have hit us, with a revised date and a recovery plan. That one call is why we moved our whole knit programme across.',
    name: 'Ellie Brandt',
    title: 'Sourcing Director, Northwind Apparel',
  },
  {
    quote:
      'The costing is the most transparent we have seen from any agent. We can argue about the CM line instead of guessing at a black box.',
    name: 'Jonas Weber',
    title: 'Sourcing Lead, Atlas Active',
  },
  {
    quote:
      'Our team approves samples in the portal in the morning and the factory has the comments the same day. It removed a week from every development cycle.',
    name: 'Lucía Fernández',
    title: 'Product Director, Verde Kids',
  },
]

export function ClientsPage() {
  return (
    <>
      <Section>
        <SectionHeading
          eyebrow="Clients"
          title="Six brands, long programmes, few surprises"
          lead="We would rather run six accounts properly than thirty badly. Every brand here has been with us for at least a full season."
        />
        <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-4">
          <Stat value="6" label="Active brand accounts" />
          <Stat value="30" label="Live orders right now" />
          <Stat value="4" label="Countries shipped to" />
          <Stat value="92%" label="On-time delivery" />
        </dl>
      </Section>

      <Section muted>
        <SectionHeading title="Who we produce for" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CLIENTS.map((client) => (
            <article key={client.name} className="rounded-lg border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-text">{client.name}</h3>
                  <p className="text-xs text-muted">{client.location}</p>
                </div>
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">
                  since {client.since}
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-primary">{client.segment}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{client.body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading title="What they say" />
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <figure
              key={testimonial.name}
              className="flex flex-col rounded-lg border border-border bg-surface p-6"
            >
              <Quote className="size-5 text-primary" aria-hidden="true" />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-text">
                {testimonial.quote}
              </blockquote>
              <figcaption className="mt-4 border-t border-border pt-3">
                <p className="text-sm font-medium text-text">{testimonial.name}</p>
                <p className="text-xs text-muted">{testimonial.title}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted">
          Brands and quotes on this page are fictional — this is a demonstration environment.
        </p>
      </Section>

      <Section muted>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-text">
              We have room for one or two more programmes
            </h2>
            <p className="mt-2 text-sm text-muted">
              Tell us what you are developing for next season.
            </p>
          </div>
          <Button as={Link} to="/contact" size="lg">
            Start a conversation
          </Button>
        </div>
      </Section>
    </>
  )
}
