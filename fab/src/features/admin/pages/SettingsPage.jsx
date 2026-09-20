import { useState } from 'react'
import { DatabaseBackup, RotateCcw, Save } from 'lucide-react'
import {
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmModal,
  Input,
  Select,
  Switch,
} from '@/components/ui'
import { PageHeader } from '@/components/shared'
import { useCan } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { DEFAULT_SETTINGS, loadSettings, recordAudit, saveSettings } from '@/services/adminService'
import { dbMeta, hasLocalChanges, resetDemoData } from '@/mocks/db'
import { useNotificationStore } from '@/store/notificationStore'
import { formatDate } from '@/utils/format'

/** Admin → Settings: company-wide defaults plus the demo-data controls. */
export function SettingsPage() {
  const can = useCan()
  const readOnly = !can('admin', 'edit')
  const [settings, setSettings] = useState(() => loadSettings())
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const resetNotifications = useNotificationStore((state) => state.reset)

  const set = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }))
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    saveSettings(settings)
    await recordAudit({
      action: 'SETTINGS_UPDATED',
      module: 'admin',
      entity: 'company settings',
      description: 'Updated the company-wide settings',
    })
    setDirty(false)
    setSaving(false)
    toast.success('Settings saved')
  }

  const restoreDefaults = () => {
    setSettings({ ...DEFAULT_SETTINGS })
    setDirty(true)
    toast.show('Defaults restored', 'Save to apply them.')
  }

  const wipeDemoData = () => {
    resetDemoData()
    resetNotifications()
    setResetOpen(false)
    toast.success('Demo data reset', 'Reloading with the shipped seed…')
    setTimeout(() => window.location.reload(), 700)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Settings"
        description="Defaults that apply across orders, costing, quality and finance."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Settings' }]}
        actions={
          !readOnly && (
            <>
              <Button variant="secondary" onClick={restoreDefaults}>
                <RotateCcw className="size-4" /> Restore defaults
              </Button>
              <Button onClick={save} loading={saving} disabled={!dirty}>
                <Save className="size-4" /> Save
              </Button>
            </>
          )
        }
      />

      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Commercial defaults</CardTitle>
            <CardDescription>Pre-filled on new orders, quotations and invoices.</CardDescription>
          </CardHeader>
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Company name"
              value={settings.companyName}
              onChange={(event) => set('companyName', event.target.value)}
              disabled={readOnly}
              containerClassName="sm:col-span-2"
            />
            <Select
              label="Base currency"
              value={settings.baseCurrency}
              onChange={(event) => set('baseCurrency', event.target.value)}
              disabled={readOnly}
              options={[
                { value: 'INR', label: 'INR — Indian Rupee' },
                { value: 'USD', label: 'USD — US Dollar' },
              ]}
            />
            <Select
              label="Export currency"
              value={settings.exportCurrency}
              onChange={(event) => set('exportCurrency', event.target.value)}
              disabled={readOnly}
              options={[
                { value: 'USD', label: 'USD — US Dollar' },
                { value: 'EUR', label: 'EUR — Euro' },
                { value: 'GBP', label: 'GBP — Pound Sterling' },
              ]}
            />
            <Select
              label="Default incoterm"
              value={settings.defaultIncoterm}
              onChange={(event) => set('defaultIncoterm', event.target.value)}
              disabled={readOnly}
              options={['FOB', 'CIF', 'CFR', 'DDP', 'DAP', 'EXW'].map((value) => ({ value, label: value }))}
            />
            <Select
              label="Default payment terms"
              value={settings.defaultPaymentTerm}
              onChange={(event) => set('defaultPaymentTerm', event.target.value)}
              disabled={readOnly}
              options={['TT 30', 'TT 45', 'TT 60', 'LC 60', 'LC 90', '30/70', 'Advance'].map((value) => ({ value, label: value }))}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operations thresholds</CardTitle>
            <CardDescription>
              How many days of slippage before an order is flagged at risk or delayed.
            </CardDescription>
          </CardHeader>
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Input
              type="number"
              label="At-risk threshold (days)"
              value={settings.riskThresholdDays}
              onChange={(event) => set('riskThresholdDays', Number(event.target.value))}
              disabled={readOnly}
            />
            <Input
              type="number"
              label="Delayed threshold (days)"
              value={settings.delayThresholdDays}
              onChange={(event) => set('delayThresholdDays', Number(event.target.value))}
              disabled={readOnly}
            />
            <Select
              label="Default AQL"
              value={settings.defaultAql}
              onChange={(event) => set('defaultAql', event.target.value)}
              disabled={readOnly}
              options={['1.5', '2.5', '4.0'].map((value) => ({ value, label: value }))}
            />
            <Select
              label="Week starts on"
              value={settings.weekStart}
              onChange={(event) => set('weekStart', event.target.value)}
              disabled={readOnly}
              options={[
                { value: 'monday', label: 'Monday' },
                { value: 'sunday', label: 'Sunday' },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>What raises an alert in the notifications panel.</CardDescription>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <Switch
              label="Sample approved or rejected"
              description="Tell the merchandiser as soon as the brand decides."
              checked={settings.notifyOnSampleDecision}
              onCheckedChange={(value) => set('notifyOnSampleDecision', value)}
              disabled={readOnly}
            />
            <Switch
              label="Production stage delayed"
              description={`Raised once a stage slips past ${settings.delayThresholdDays} days.`}
              checked={settings.notifyOnStageDelay}
              onCheckedChange={(value) => set('notifyOnStageDelay', value)}
              disabled={readOnly}
            />
            <Switch
              label="Invoice overdue"
              description="Alert finance the day an invoice passes its due date."
              checked={settings.notifyOnInvoiceOverdue}
              onCheckedChange={(value) => set('notifyOnInvoiceOverdue', value)}
              disabled={readOnly}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demo data</CardTitle>
            <CardDescription>
              Seeded {formatDate(dbMeta.generatedAt)} · dates shifted forward {dbMeta.shiftDays} day
              {dbMeta.shiftDays === 1 ? '' : 's'} · {hasLocalChanges() ? 'this session has unsaved edits' : 'currently unmodified'}
            </CardDescription>
          </CardHeader>
          <CardBody>
            <p className="mb-3 text-sm text-muted">
              Everything you create, edit or delete is kept in this browser only. Resetting drops
              those changes and reloads the shipped seed.
            </p>
            <Button variant="danger" onClick={() => setResetOpen(true)}>
              <DatabaseBackup className="size-4" /> Reset demo data
            </Button>
          </CardBody>
        </Card>
      </div>

      <ConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={wipeDemoData}
        title="Reset all demo data?"
        description="Every record you have added, edited or deleted in this browser will be discarded and the page will reload."
        confirmLabel="Reset everything"
      />
    </div>
  )
}
