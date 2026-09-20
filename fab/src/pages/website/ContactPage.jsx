import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Clock, Mail, MapPin, Phone } from 'lucide-react'
import { Button, Input, Select, Textarea } from '@/components/ui'
import { leadService } from '@/services/crmService'
import { Section, SectionHeading } from './components/Section'

const SEGMENTS = [
  'Casual basics',
  'Knitwear',
  'Wovens & shirting',
  'Denim',
  'Kidswear',
  'Activewear',
  'Womenswear',
  'Outerwear',
  'Something else',
]

const VOLUMES = [
  { value: '5000', label: 'Under 10,000 pcs a season' },
  { value: '25000', label: '10,000 – 50,000 pcs a season' },
  { value: '75000', label: '50,000 – 100,000 pcs a season' },
  { value: '150000', label: 'Over 100,000 pcs a season' },
]

/** @param {number} days @returns {string} YYYY-MM-DD — module scope keeps render pure. */
function inDays(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
}

const schema = z.object({
  company: z.string().min(2, 'Company name is required'),
  contactName: z.string().min(2, 'Your name is required'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().optional().or(z.literal('')),
  country: z.string().min(2, 'Country is required'),
  segment: z.string().min(1, 'Pick the closest product area'),
  estimatedQuantity: z.string().min(1, 'Give us a rough volume'),
  message: z.string().min(20, 'A couple of sentences about the programme helps us reply properly'),
})

/** The public contact form. A submission becomes a real lead in the CRM. */
export function ContactPage() {
  const [submitted, setSubmitted] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      company: '',
      contactName: '',
      email: '',
      phone: '',
      country: '',
      segment: '',
      estimatedQuantity: '25000',
      message: '',
    },
  })

  const onSubmit = async (values) => {
    const quantity = Number(values.estimatedQuantity)
    const lead = await leadService.create({
      company: values.company,
      contactName: values.contactName,
      contactTitle: '',
      email: values.email,
      phone: values.phone,
      country: values.country,
      city: '',
      segment: values.segment,
      source: 'Website contact form',
      stage: 'NEW',
      estimatedValueUsd: quantity * 9,
      estimatedQuantity: quantity,
      probability: 10,
      ownerId: 'EMP-005',
      nextAction: 'Reply within one business day with the capability deck',
      nextActionDate: inDays(1),
      convertedEnquiryId: null,
      notes: values.message,
    })
    setSubmitted({ lead, name: values.contactName })
  }

  if (submitted) {
    return (
      <Section>
        <div className="mx-auto max-w-xl rounded-lg border border-border bg-surface p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-success-soft">
            <CheckCircle2 className="size-6 text-success" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-text">
            Thanks, {submitted.name.split(' ')[0]} — we have it
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Your enquiry has been logged as{' '}
            <span className="font-medium text-text">{submitted.lead.id}</span> and assigned to a
            merchandiser. In a live setup you would hear back within one business day.
          </p>
          <p className="mt-4 rounded-lg border border-border bg-surface-2/40 p-3 text-xs text-muted">
            This is a demo: your enquiry was written into the mock CRM. Sign in and open{' '}
            <span className="font-medium text-text">CRM → Leads</span> to see it at the top of the
            New column.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button as={Link} to="/login">
              Sign in to see the lead
            </Button>
            <Button as={Link} to="/" variant="secondary">
              Back to the site
            </Button>
          </div>
        </div>
      </Section>
    )
  }

  return (
    <Section>
      <SectionHeading
        eyebrow="Contact"
        title="Tell us what you're developing"
        lead="The more you can share — product, volume, target price, delivery window — the more useful our first reply will be."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 rounded-lg border border-border bg-surface p-6 sm:grid-cols-2"
        >
          <Input
            label="Company"
            required
            placeholder="Copper Row Supply"
            error={errors.company?.message}
            {...register('company')}
          />
          <Input
            label="Your name"
            required
            placeholder="Tessa Hollins"
            error={errors.contactName?.message}
            {...register('contactName')}
          />
          <Input
            label="Email"
            type="email"
            required
            placeholder="you@yourbrand.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input label="Phone" placeholder="+1 303 555 0142" {...register('phone')} />
          <Input
            label="Country"
            required
            placeholder="United States"
            error={errors.country?.message}
            {...register('country')}
          />
          <Select
            label="Product area"
            required
            placeholder="Choose the closest…"
            options={SEGMENTS.map((segment) => ({ value: segment, label: segment }))}
            error={errors.segment?.message}
            {...register('segment')}
          />
          <Select
            label="Rough seasonal volume"
            required
            options={VOLUMES}
            error={errors.estimatedQuantity?.message}
            containerClassName="sm:col-span-2"
            {...register('estimatedQuantity')}
          />
          <Textarea
            label="About the programme"
            required
            rows={5}
            placeholder="We're developing a heavyweight organic tee for AW27 — 12,000 pcs across three colours, target FOB around $8.50, ex-factory by the end of June."
            error={errors.message?.message}
            containerClassName="sm:col-span-2"
            {...register('message')}
          />
          <div className="sm:col-span-2">
            <Button type="submit" size="lg" loading={isSubmitting}>
              Send enquiry
            </Button>
            <p className="mt-3 text-xs text-muted">
              This demo form writes a real lead into the mock CRM — no email is sent.
            </p>
          </div>
        </form>

        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-text">Sourcing office</h2>
            <dl className="mt-3 flex flex-col gap-3 text-sm">
              <div className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                <dd className="text-muted">
                  14 Avinashi Road, Peelamedu
                  <br />
                  Tiruppur, Tamil Nadu 641603
                  <br />
                  India
                </dd>
              </div>
              <div className="flex gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                <dd className="text-muted">hello@apparelflow.com</dd>
              </div>
              <div className="flex gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                <dd className="text-muted">+91 421 4501 200</dd>
              </div>
              <div className="flex gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                <dd className="text-muted">
                  Mon–Sat, 09:00–18:00 IST
                  <br />
                  We reply within one business day
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-surface-2/40 p-5">
            <h2 className="text-sm font-semibold text-text">Already a client?</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Sign in to your portal for sample approvals, production progress and shipment
              tracking.
            </p>
            <Button as={Link} to="/login" variant="secondary" size="sm" className="mt-3">
              Client sign in
            </Button>
          </div>
        </aside>
      </div>
    </Section>
  )
}
