import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function HomePage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <p className="text-sm font-semibold text-primary">Apparel sourcing & buying house</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-text sm:text-5xl">
        From enquiry to export, managed on one thread.
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">
        ApparelFlow takes brand orders, designs and samples them, sources fabric, trims and
        factories, tracks every production stage, inspects to AQL 2.5 and ships — with the
        client watching progress in their own portal.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button as={Link} to="/contact" size="lg">
          Start an enquiry <ArrowRight className="size-4" />
        </Button>
        <Button as={Link} to="/services" size="lg" variant="secondary">
          Our services
        </Button>
      </div>
    </section>
  )
}
