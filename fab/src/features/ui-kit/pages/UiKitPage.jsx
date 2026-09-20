import { useState } from 'react'
import { Download, Mail, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Drawer,
  Dropdown,
  EmptyState,
  Input,
  Modal,
  Progress,
  ProgressRing,
  Select,
  Skeleton,
  SkeletonTable,
  Stepper,
  Switch,
  Tabs,
  Textarea,
  Tooltip,
} from '@/components/ui'
import { toast } from '@/store/toastStore'
import { KitSection } from '../components/KitSection'
import { TokenSwatches } from '../components/TokenSwatches'

const STEPS = [
  { value: 'client', label: 'Client & style' },
  { value: 'matrix', label: 'Size matrix' },
  { value: 'dates', label: 'Dates & T&A' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'review', label: 'Review' },
]

/** Living reference for every primitive, checked in both themes. */
export function UiKitPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [tab, setTab] = useState('overview')
  const [checked, setChecked] = useState(true)
  const [switched, setSwitched] = useState(true)
  const [step, setStep] = useState(2)

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="UI kit"
        description="Every primitive in the design system, rendered against the live theme tokens."
        breadcrumbs={[{ label: 'App', to: '/app/dashboard' }, { label: 'UI kit' }]}
        actions={
          <Button onClick={() => toast.success('Toast fired', 'This is the toast queue.')}>
            Fire a toast
          </Button>
        }
      />

      <div className="grid gap-5">
        <KitSection title="Design tokens" description="Semantic variables, light and dark.">
          <TokenSwatches />
        </KitSection>

        <KitSection title="Buttons" description="Seven variants, six sizes.">
          <div className="flex flex-wrap items-center gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="success">Success</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2">
            <Button size="xs">Extra small</Button>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Add">
              <Plus className="size-4" />
            </Button>
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
            <Button variant="secondary">
              <Download className="size-4" /> Export CSV
            </Button>
          </div>
        </KitSection>

        <KitSection title="Form controls" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Style number" placeholder="NW-2431-A" hint="Client style reference" />
          <Input
            label="Contact email"
            type="email"
            placeholder="buyer@northwind.com"
            leading={<Mail className="size-4" />}
            required
          />
          <Input label="FOB price" defaultValue="8.40" error="Below the approved floor price" />
          <Select
            label="Incoterm"
            placeholder="Select an incoterm"
            options={[
              { value: 'FOB', label: 'FOB — Free on board' },
              { value: 'CIF', label: 'CIF — Cost, insurance, freight' },
              { value: 'DDP', label: 'DDP — Delivered duty paid' },
            ]}
          />
          <Textarea
            label="Approval comment"
            placeholder="Fit is good; tighten the armhole by 0.5 cm."
            containerClassName="sm:col-span-2"
          />
          <div className="flex flex-col gap-3">
            <Checkbox
              label="Requires wash"
              description="Adds the WASHING_EMB production stage"
              checked={checked}
              onChange={(event) => setChecked(event.target.checked)}
            />
            <Switch
              label="Notify the client"
              description="Sends a portal update on every stage change"
              checked={switched}
              onCheckedChange={setSwitched}
            />
          </div>
        </KitSection>

        <KitSection title="Status & identity">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Default</Badge>
            <Badge tone="primary" dot>
              In production
            </Badge>
            <Badge tone="success" dot>
              Delivered
            </Badge>
            <Badge tone="warning" dot>
              At risk
            </Badge>
            <Badge tone="danger" dot>
              Delayed
            </Badge>
            <Badge tone="info">Sampling</Badge>
            <Badge tone="outline">Draft</Badge>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3">
            <Avatar name="Priya Raman" size="xs" />
            <Avatar name="Daniel Osei" size="sm" status="online" />
            <Avatar name="Mei Ling Chan" size="md" />
            <Avatar name="Rafael Costa" size="lg" />
            <Tooltip content="Hover and focus both open this tooltip">
              <Button variant="secondary" size="sm">
                Hover me
              </Button>
            </Tooltip>
            <Dropdown
              trigger={<Button variant="secondary" size="sm">Row actions</Button>}
              items={[
                { heading: 'Manage' },
                { label: 'Edit order', icon: Plus, onSelect: () => toast.info('Edit clicked') },
                { label: 'Export', icon: Download, onSelect: () => toast.info('Export clicked') },
                { separator: true },
                { label: 'Delete', icon: Trash2, danger: true, onSelect: () => toast.error('Deleted') },
              ]}
            />
          </div>
        </KitSection>

        <KitSection title="Progress & navigation" className="grid grid-cols-1 gap-5">
          <Tabs
            tabs={[
              { value: 'overview', label: 'Overview' },
              { value: 'ta', label: 'T&A', count: 7 },
              { value: 'qc', label: 'QC' },
              { value: 'locked', label: 'Finance', disabled: true },
            ]}
            value={tab}
            onChange={setTab}
          />
          <div className="flex flex-wrap items-center gap-6">
            <Progress value={72} label="Stitching" showValue className="max-w-xs" />
            <Progress value={38} tone="warning" label="Finishing" showValue className="max-w-xs" />
            <ProgressRing value={92} tone="success" />
          </div>
          <Stepper steps={STEPS} current={step} onStepClick={setStep} />
        </KitSection>

        <KitSection title="Overlays">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
            Open drawer
          </Button>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Confirm quotation"
            description="This sends version 3 to Northwind Apparel."
            footer={
              <>
                <Button variant="secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setModalOpen(false)}>Send quotation</Button>
              </>
            }
          >
            <p className="text-sm text-muted">
              FOB 8.95 USD/pc across 12,000 pcs. Margin lands at 17.4%.
            </p>
          </Modal>
          <Drawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            title="Edit fabric"
            description="Masters records are edited in a side drawer."
            footer={
              <>
                <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setDrawerOpen(false)}>Save</Button>
              </>
            }
          >
            <div className="flex flex-col gap-4">
              <Input label="Fabric name" defaultValue="Cotton single jersey 180 GSM" />
              <Input label="Composition" defaultValue="100% combed cotton" />
              <Select
                label="Unit"
                options={[
                  { value: 'KG', label: 'Kilogram' },
                  { value: 'MTR', label: 'Metre' },
                ]}
              />
            </div>
          </Drawer>
        </KitSection>

        <KitSection title="Feedback states" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader actions={<Badge tone="primary">Live</Badge>}>
              <CardTitle>Card with header</CardTitle>
              <CardDescription>Used across dashboards and detail tabs.</CardDescription>
            </CardHeader>
            <CardBody className="flex flex-col gap-2">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-60" />
              <Skeleton className="h-3 w-24" />
            </CardBody>
            <CardFooter>
              <Button variant="secondary" size="sm">
                Cancel
              </Button>
              <Button size="sm">Save</Button>
            </CardFooter>
          </Card>
          <Card>
            <EmptyState
              title="No inspections yet"
              description="Inline AQL checks appear here once production reaches stitching."
              action={<Button size="sm">Schedule inspection</Button>}
              compact
            />
          </Card>
          <Card className="overflow-hidden lg:col-span-2">
            <SkeletonTable rows={3} columns={6} />
          </Card>
        </KitSection>
      </div>
    </div>
  )
}
