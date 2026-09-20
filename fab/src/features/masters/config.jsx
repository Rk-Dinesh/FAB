import { z } from 'zod'
import { mastersServices } from '@/services/mastersService'
import { active, boolean, count, money, name, number, swatch, tags, text } from './columns'

const requiredText = (label) => z.string().min(1, `${label} is required`)
const optionalText = z.string().optional().or(z.literal(''))
const flag = z.boolean().default(true)

const UOM_OPTIONS = ['PCS', 'KG', 'MTR', 'YRD', 'DOZ', 'GROSS', 'CONE', 'SET'].map((value) => ({
  value,
  label: value,
}))

/**
 * One entry per masters route segment. `MastersCRUD` reads the columns, the zod
 * schema and the field list from here — adding a master is a config change only.
 *
 * @typedef {Object} MasterConfig
 * @property {string} title
 * @property {string} singular
 * @property {string} description
 * @property {object} service
 * @property {Array<object>} columns
 * @property {import('zod').ZodTypeAny} schema
 * @property {Array<object>} fields
 * @property {object} defaults
 * @property {boolean} [singleton] company-style single record
 */

/** @type {Record<string, MasterConfig>} */
export const mastersConfig = {
  company: {
    title: 'Company',
    singular: 'company profile',
    description: 'The legal entity that raises invoices and files export documents.',
    service: mastersServices.company,
    singleton: true,
    columns: [name('name'), text('city'), text('country'), text('gstin', 'GSTIN'), text('email')],
    schema: z.object({
      name: requiredText('Name'),
      legalName: requiredText('Legal name'),
      gstin: requiredText('GSTIN'),
      iec: optionalText,
      addressLine1: requiredText('Address'),
      city: requiredText('City'),
      state: optionalText,
      country: requiredText('Country'),
      postcode: optionalText,
      phone: optionalText,
      email: z.string().email('Enter a valid email'),
      website: optionalText,
      baseCurrency: requiredText('Base currency'),
      exportCurrency: requiredText('Export currency'),
    }),
    fields: [
      { name: 'name', label: 'Trading name', required: true },
      { name: 'legalName', label: 'Legal name', required: true },
      { name: 'gstin', label: 'GSTIN', required: true },
      { name: 'iec', label: 'IEC' },
      { name: 'addressLine1', label: 'Address', required: true, full: true },
      { name: 'city', label: 'City', required: true },
      { name: 'state', label: 'State' },
      { name: 'country', label: 'Country', required: true },
      { name: 'postcode', label: 'Postcode' },
      { name: 'phone', label: 'Phone' },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'website', label: 'Website' },
      { name: 'baseCurrency', label: 'Base currency', type: 'select', options: [{ value: 'INR', label: 'INR' }, { value: 'USD', label: 'USD' }], required: true },
      { name: 'exportCurrency', label: 'Export currency', type: 'select', options: [{ value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }, { value: 'GBP', label: 'GBP' }], required: true },
    ],
    defaults: { name: '', legalName: '', gstin: '', addressLine1: '', city: '', country: 'India', email: '', baseCurrency: 'INR', exportCurrency: 'USD' },
  },

  categories: {
    title: 'Product categories',
    singular: 'category',
    description: 'How styles are grouped for costing, capacity planning and reporting.',
    service: mastersServices.categories,
    columns: [name('name'), text('group', 'Group'), text('description'), active()],
    schema: z.object({
      name: requiredText('Name'),
      group: requiredText('Group'),
      description: optionalText,
      active: flag,
    }),
    fields: [
      { name: 'name', label: 'Category', required: true },
      { name: 'group', label: 'Group', type: 'select', required: true, options: ['Knitwear', 'Wovens', 'Outerwear', 'Performance', 'Kids', 'Accessories'].map((value) => ({ value, label: value })) },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'active', label: 'Active', type: 'switch' },
    ],
    defaults: { name: '', group: 'Knitwear', description: '', active: true },
  },

  fabrics: {
    title: 'Fabrics',
    singular: 'fabric',
    description: 'Base qualities with their standard rate — the starting point of every cost sheet.',
    service: mastersServices.fabrics,
    columns: [name('name'), text('composition'), number('gsm', 'GSM'), text('uom', 'UOM'), money('standardRate', 'Standard rate'), text('group'), active()],
    schema: z.object({
      name: requiredText('Name'),
      composition: requiredText('Composition'),
      gsm: z.coerce.number().min(30, 'GSM looks too low').max(800, 'GSM looks too high'),
      uom: requiredText('UOM'),
      standardRate: z.coerce.number().min(0, 'Rate cannot be negative'),
      currency: requiredText('Currency'),
      group: requiredText('Group'),
      active: flag,
    }),
    fields: [
      { name: 'name', label: 'Fabric', required: true, full: true },
      { name: 'composition', label: 'Composition', required: true, full: true },
      { name: 'gsm', label: 'GSM', type: 'number', required: true },
      { name: 'uom', label: 'Unit', type: 'select', options: UOM_OPTIONS, required: true },
      { name: 'standardRate', label: 'Standard rate', type: 'number', step: 0.01, required: true },
      { name: 'currency', label: 'Currency', type: 'select', options: [{ value: 'USD', label: 'USD' }, { value: 'INR', label: 'INR' }], required: true },
      { name: 'group', label: 'Group', type: 'select', options: ['Knit', 'Woven', 'Performance'].map((value) => ({ value, label: value })), required: true },
      { name: 'active', label: 'Active', type: 'switch' },
    ],
    defaults: { name: '', composition: '', gsm: 180, uom: 'KG', standardRate: 0, currency: 'USD', group: 'Knit', active: true },
  },

  trims: {
    title: 'Trims',
    singular: 'trim',
    description: 'Labels, packaging, threads and hardware costed per garment.',
    service: mastersServices.trims,
    columns: [name('name'), text('group'), text('uom', 'UOM'), money('standardRate', 'Standard rate'), active()],
    schema: z.object({
      name: requiredText('Name'),
      group: requiredText('Group'),
      uom: requiredText('UOM'),
      standardRate: z.coerce.number().min(0),
      currency: requiredText('Currency'),
      active: flag,
    }),
    fields: [
      { name: 'name', label: 'Trim', required: true, full: true },
      { name: 'group', label: 'Group', type: 'select', required: true, options: ['Label', 'Packaging', 'Thread', 'Button', 'Zipper', 'Cord', 'Elastic', 'Hardware'].map((value) => ({ value, label: value })) },
      { name: 'uom', label: 'Unit', type: 'select', options: UOM_OPTIONS, required: true },
      { name: 'standardRate', label: 'Standard rate', type: 'number', step: 0.001, required: true },
      { name: 'currency', label: 'Currency', type: 'select', options: [{ value: 'USD', label: 'USD' }, { value: 'INR', label: 'INR' }], required: true },
      { name: 'active', label: 'Active', type: 'switch' },
    ],
    defaults: { name: '', group: 'Label', uom: 'PCS', standardRate: 0, currency: 'USD', active: true },
  },

  colors: {
    title: 'Colours',
    singular: 'colour',
    description: 'The approved colour card, with Pantone references for lab dips.',
    service: mastersServices.colors,
    columns: [name('name'), swatch(), text('pantone', 'Pantone'), active()],
    schema: z.object({
      name: requiredText('Name'),
      hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex value, e.g. #1F2A44'), // audit-ignore: example colour value
      pantone: optionalText,
      active: flag,
    }),
    fields: [
      { name: 'name', label: 'Colour name', required: true },
      { name: 'hex', label: 'Hex', required: true, placeholder: '#1F2A44' }, // audit-ignore: example colour value
      { name: 'pantone', label: 'Pantone', placeholder: '19-4028 TCX' },
      { name: 'active', label: 'Active', type: 'switch' },
    ],
    defaults: { name: '', hex: '#1F2A44', pantone: '', active: true }, // audit-ignore: default colour value
  },

  'size-sets': {
    title: 'Size sets',
    singular: 'size set',
    description: 'Size runs used by the colour × size order matrix.',
    service: mastersServices['size-sets'],
    columns: [name('name'), tags('sizes', 'Sizes'), text('region'), active()],
    schema: z.object({
      name: requiredText('Name'),
      sizes: z.array(z.string()).min(2, 'Add at least two sizes'),
      region: requiredText('Region'),
      active: flag,
    }),
    fields: [
      { name: 'name', label: 'Size set', required: true },
      { name: 'region', label: 'Region', required: true, placeholder: 'US/EU' },
      { name: 'sizes', label: 'Sizes', type: 'tags', required: true, placeholder: 'XS, S, M, L, XL' },
      { name: 'active', label: 'Active', type: 'switch' },
    ],
    defaults: { name: '', sizes: [], region: 'US/EU', active: true },
  },

  uom: {
    title: 'Units of measure',
    singular: 'unit',
    description: 'Units used across materials, purchase orders and GRNs.',
    service: mastersServices.uom,
    columns: [name('code', 'Code'), text('name'), number('decimals', 'Decimals'), active()],
    schema: z.object({
      code: requiredText('Code'),
      name: requiredText('Name'),
      decimals: z.coerce.number().int().min(0).max(4),
      active: flag,
    }),
    fields: [
      { name: 'code', label: 'Code', required: true },
      { name: 'name', label: 'Name', required: true },
      { name: 'decimals', label: 'Decimal places', type: 'number' },
      { name: 'active', label: 'Active', type: 'switch' },
    ],
    defaults: { code: '', name: '', decimals: 0, active: true },
  },

  currencies: {
    title: 'Currencies',
    singular: 'currency',
    description: 'Export and internal currencies with their working rates.',
    service: mastersServices.currencies,
    columns: [name('code', 'Code'), text('name'), text('symbol'), number('perUsd', 'Per USD', 2), number('inrRate', 'INR rate', 2), active()],
    schema: z.object({
      code: requiredText('Code').max(3, 'Use the 3-letter ISO code'),
      name: requiredText('Name'),
      symbol: requiredText('Symbol'),
      perUsd: z.coerce.number().positive('Rate must be positive'),
      inrRate: z.coerce.number().positive('Rate must be positive'),
      active: flag,
    }),
    fields: [
      { name: 'code', label: 'ISO code', required: true },
      { name: 'name', label: 'Name', required: true },
      { name: 'symbol', label: 'Symbol', required: true },
      { name: 'perUsd', label: 'Units per USD', type: 'number', step: 0.0001, required: true },
      { name: 'inrRate', label: 'INR per unit', type: 'number', step: 0.01, required: true },
      { name: 'active', label: 'Active', type: 'switch' },
    ],
    defaults: { code: '', name: '', symbol: '', perUsd: 1, inrRate: 88.4, active: true },
  },

  ports: {
    title: 'Ports',
    singular: 'port',
    description: 'Origin and destination ports on shipping documents.',
    service: mastersServices.ports,
    columns: [name('code', 'Code'), text('name'), text('country'), text('mode'), active()],
    schema: z.object({
      code: requiredText('Code'),
      name: requiredText('Name'),
      country: requiredText('Country'),
      mode: z.enum(['Sea', 'Air'], { message: 'Choose sea or air' }),
      active: flag,
    }),
    fields: [
      { name: 'code', label: 'UN/LOCODE', required: true },
      { name: 'name', label: 'Port name', required: true },
      { name: 'country', label: 'Country', required: true },
      { name: 'mode', label: 'Mode', type: 'select', options: [{ value: 'Sea', label: 'Sea' }, { value: 'Air', label: 'Air' }], required: true },
      { name: 'active', label: 'Active', type: 'switch' },
    ],
    defaults: { code: '', name: '', country: 'India', mode: 'Sea', active: true },
  },

  incoterms: {
    title: 'Incoterms',
    singular: 'incoterm',
    description: 'Delivery terms that set who carries freight, insurance and duty.',
    service: mastersServices.incoterms,
    columns: [name('code', 'Code'), text('name'), text('description'), active()],
    schema: z.object({
      code: requiredText('Code'),
      name: requiredText('Name'),
      description: requiredText('Description'),
      active: flag,
    }),
    fields: [
      { name: 'code', label: 'Code', required: true },
      { name: 'name', label: 'Name', required: true },
      { name: 'description', label: 'What it means', type: 'textarea', required: true },
      { name: 'active', label: 'Active', type: 'switch' },
    ],
    defaults: { code: '', name: '', description: '', active: true },
  },

  'payment-terms': {
    title: 'Payment terms',
    singular: 'payment term',
    description: 'Credit terms that drive invoice due dates and receivables aging.',
    service: mastersServices['payment-terms'],
    columns: [name('code', 'Code'), text('description'), number('days', 'Days'), active()],
    schema: z.object({
      code: requiredText('Code'),
      description: requiredText('Description'),
      days: z.coerce.number().int().min(0).max(180),
      active: flag,
    }),
    fields: [
      { name: 'code', label: 'Code', required: true },
      { name: 'days', label: 'Credit days', type: 'number', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'active', label: 'Active', type: 'switch' },
    ],
    defaults: { code: '', description: '', days: 30, active: true },
  },

  stages: {
    title: 'Production stages',
    singular: 'stage',
    description: 'The stage ladder every order is tracked against.',
    service: mastersServices.stages,
    columns: [number('sequence', '#'), name('name'), text('code'), text('description'), boolean('optional', 'Optional', ['Optional', 'Always'], ['info', 'default']), active()],
    schema: z.object({
      code: requiredText('Code'),
      name: requiredText('Name'),
      sequence: z.coerce.number().int().min(1).max(20),
      description: optionalText,
      optional: z.boolean().default(false),
      active: flag,
    }),
    fields: [
      { name: 'code', label: 'Code', required: true },
      { name: 'name', label: 'Name', required: true },
      { name: 'sequence', label: 'Sequence', type: 'number', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'optional', label: 'Optional stage', type: 'switch', hint: 'Skipped unless the style needs it' },
      { name: 'active', label: 'Active', type: 'switch' },
    ],
    defaults: { code: '', name: '', sequence: 1, description: '', optional: false, active: true },
  },

  'qc-checklists': {
    title: 'QC checklists',
    singular: 'checklist',
    description: 'Inspection point lists attached to an AQL level and a stage.',
    service: mastersServices['qc-checklists'],
    columns: [name('name'), text('aql', 'AQL'), text('stage'), count('points', 'Points', 'points'), active()],
    schema: z.object({
      name: requiredText('Name'),
      aql: requiredText('AQL'),
      stage: requiredText('Stage'),
      points: z.array(z.string()).min(1, 'Add at least one inspection point'),
      active: flag,
    }),
    fields: [
      { name: 'name', label: 'Checklist name', required: true, full: true },
      { name: 'aql', label: 'AQL', type: 'select', options: ['1.5', '2.5', '4.0', '4-point'].map((value) => ({ value, label: value })), required: true },
      { name: 'stage', label: 'Stage', type: 'select', required: true, options: ['FABRIC_INHOUSE', 'CUTTING', 'STITCHING', 'WASHING_EMB', 'FINISHING', 'PACKING', 'FINAL_INSPECTION'].map((value) => ({ value, label: value.replace(/_/g, ' ') })) },
      { name: 'points', label: 'Inspection points', type: 'tags', required: true, hint: 'Separate each point with a comma' },
      { name: 'active', label: 'Active', type: 'switch' },
    ],
    defaults: { name: '', aql: '2.5', stage: 'FINAL_INSPECTION', points: [], active: true },
  },

  clients: {
    title: 'Clients',
    singular: 'client',
    description: 'Brand accounts, their commercial terms and account owner.',
    service: mastersServices.clients,
    columns: [name('name'), text('code'), text('segment'), text('country'), text('incoterm'), text('paymentTermCode', 'Payment terms'), number('creditLimitUsd', 'Credit limit'), boolean('status', 'Status', ['Active', 'Inactive'])],
    schema: z.object({
      name: requiredText('Name'),
      code: requiredText('Code').max(4, 'Use up to 4 characters'),
      segment: requiredText('Segment'),
      country: requiredText('Country'),
      city: optionalText,
      currency: requiredText('Currency'),
      incoterm: requiredText('Incoterm'),
      paymentTermCode: requiredText('Payment terms'),
      contactName: requiredText('Contact'),
      email: z.string().email('Enter a valid email'),
      phone: optionalText,
      creditLimitUsd: z.coerce.number().min(0),
      notes: optionalText,
    }),
    fields: [
      { name: 'name', label: 'Brand name', required: true },
      { name: 'code', label: 'Short code', required: true },
      { name: 'segment', label: 'Segment', required: true },
      { name: 'country', label: 'Country', required: true },
      { name: 'city', label: 'City' },
      { name: 'currency', label: 'Currency', type: 'select', options: [{ value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }, { value: 'GBP', label: 'GBP' }], required: true },
      { name: 'incoterm', label: 'Incoterm', type: 'select', options: ['FOB', 'CIF', 'CFR', 'DDP', 'DAP', 'EXW'].map((value) => ({ value, label: value })), required: true },
      { name: 'paymentTermCode', label: 'Payment terms', type: 'select', options: ['TT 30', 'TT 45', 'TT 60', 'LC 60', 'LC 90', '30/70', 'Advance'].map((value) => ({ value, label: value })), required: true },
      { name: 'contactName', label: 'Primary contact', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone' },
      { name: 'creditLimitUsd', label: 'Credit limit (USD)', type: 'number', required: true },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
    defaults: { name: '', code: '', segment: '', country: '', city: '', currency: 'USD', incoterm: 'FOB', paymentTermCode: 'TT 45', contactName: '', email: '', phone: '', creditLimitUsd: 250000, notes: '', status: 'ACTIVE', rating: 4 },
  },

  vendors: {
    title: 'Vendors',
    singular: 'vendor',
    description: 'Mills, trims suppliers, garment factories and washing units.',
    service: mastersServices.vendors,
    columns: [name('name'), text('typeLabel', 'Type'), text('city'), number('rating', 'Rating', 1), number('leadTimeDays', 'Lead days'), number('onTimePercent', 'On time %', 0), tags('certifications', 'Certifications'), active()],
    schema: z.object({
      name: requiredText('Name'),
      type: z.enum(['MILL', 'TRIMS', 'FACTORY', 'WASHING'], { message: 'Choose a vendor type' }),
      city: requiredText('City'),
      state: optionalText,
      country: requiredText('Country'),
      contactName: requiredText('Contact'),
      email: z.string().email('Enter a valid email'),
      phone: optionalText,
      rating: z.coerce.number().min(1).max(5),
      leadTimeDays: z.coerce.number().int().min(1).max(180),
      paymentTermCode: requiredText('Payment terms'),
      specialities: z.array(z.string()).min(1, 'List at least one speciality'),
      certifications: z.array(z.string()).optional().default([]),
      active: flag,
      notes: optionalText,
    }),
    fields: [
      { name: 'name', label: 'Vendor name', required: true },
      { name: 'type', label: 'Type', type: 'select', required: true, options: [{ value: 'MILL', label: 'Fabric mill' }, { value: 'TRIMS', label: 'Trims & packaging' }, { value: 'FACTORY', label: 'Garment factory' }, { value: 'WASHING', label: 'Washing & embellishment' }] },
      { name: 'city', label: 'City', required: true },
      { name: 'state', label: 'State' },
      { name: 'country', label: 'Country', required: true },
      { name: 'contactName', label: 'Contact', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone' },
      { name: 'rating', label: 'Rating (1–5)', type: 'number', step: 0.1, required: true },
      { name: 'leadTimeDays', label: 'Lead time (days)', type: 'number', required: true },
      { name: 'paymentTermCode', label: 'Payment terms', type: 'select', options: ['TT 30', 'TT 45', 'TT 60', '30/70', 'Advance'].map((value) => ({ value, label: value })), required: true },
      { name: 'specialities', label: 'Specialities', type: 'tags', required: true },
      { name: 'certifications', label: 'Certifications', type: 'tags' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
      { name: 'active', label: 'Active', type: 'switch' },
    ],
    defaults: { name: '', type: 'MILL', city: '', state: '', country: 'India', contactName: '', email: '', phone: '', rating: 4, leadTimeDays: 21, paymentTermCode: 'TT 30', specialities: [], certifications: [], active: true, notes: '', onTimePercent: 90, defectRatePercent: 2 },
  },
}
