import { at, id } from './lib.mjs'

/** Reference data. Everything downstream links to these ids. */
export function buildMasters() {
  const company = {
    id: 'COM-001',
    name: 'ApparelFlow Sourcing Pvt Ltd',
    legalName: 'ApparelFlow Sourcing Private Limited',
    type: 'Buying house & sourcing agency',
    gstin: '33AAFCA9021K1ZQ',
    iec: 'AAFCA9021K',
    addressLine1: '14 Avinashi Road, Peelamedu',
    addressLine2: 'Coimbatore district',
    city: 'Tiruppur',
    state: 'Tamil Nadu',
    country: 'India',
    postcode: '641603',
    phone: '+91 421 4501 200',
    email: 'hello@apparelflow.com',
    website: 'www.apparelflow.com',
    baseCurrency: 'INR',
    exportCurrency: 'USD',
    financialYearStart: '04-01',
    foundedYear: 2009,
    employeeCount: 45,
  }

  const categories = [
    ['CAT-001', 'Knit tops', 'Tees, polos, tanks and henleys', 'Knitwear'],
    ['CAT-002', 'Knit bottoms', 'Joggers, shorts and leggings', 'Knitwear'],
    ['CAT-003', 'Sweatshirts & hoodies', 'Fleece and french terry layers', 'Knitwear'],
    ['CAT-004', 'Woven shirts', 'Casual and formal button-downs', 'Wovens'],
    ['CAT-005', 'Woven bottoms', 'Chinos, denim and cargo', 'Wovens'],
    ['CAT-006', 'Dresses & skirts', 'Woven and knit dresses', 'Wovens'],
    ['CAT-007', 'Outerwear', 'Jackets, gilets and overshirts', 'Outerwear'],
    ['CAT-008', 'Activewear', 'Performance tops and bottoms', 'Performance'],
    ['CAT-009', 'Kidswear', 'Infant, toddler and youth', 'Kids'],
    ['CAT-010', 'Accessories', 'Caps, totes and socks', 'Accessories'],
  ].map(([entryId, name, description, group]) => ({
    id: entryId,
    name,
    description,
    group,
    active: true,
  }))

  const fabrics = [
    ['FAB-001', 'Single jersey 180 GSM', '100% combed cotton', 180, 'KG', 4.35, 'Knit'],
    ['FAB-002', 'Single jersey 160 GSM', '100% organic cotton', 160, 'KG', 5.1, 'Knit'],
    ['FAB-003', 'Pique 220 GSM', '100% cotton pique', 220, 'KG', 4.8, 'Knit'],
    ['FAB-004', 'French terry 280 GSM', '80% cotton / 20% polyester', 280, 'KG', 5.4, 'Knit'],
    ['FAB-005', 'Brushed fleece 320 GSM', '70% cotton / 30% recycled poly', 320, 'KG', 5.95, 'Knit'],
    ['FAB-006', 'Rib 1x1 240 GSM', '95% cotton / 5% elastane', 240, 'KG', 6.2, 'Knit'],
    ['FAB-007', 'Interlock 200 GSM', '100% cotton interlock', 200, 'KG', 4.9, 'Knit'],
    ['FAB-008', 'Poplin 120 GSM', '100% cotton poplin', 120, 'MTR', 1.85, 'Woven'],
    ['FAB-009', 'Oxford 140 GSM', '100% cotton oxford', 140, 'MTR', 2.1, 'Woven'],
    ['FAB-010', 'Twill 240 GSM', '98% cotton / 2% elastane', 240, 'MTR', 2.9, 'Woven'],
    ['FAB-011', 'Denim 11 oz', '100% cotton denim', 372, 'MTR', 3.65, 'Woven'],
    ['FAB-012', 'Canvas 260 GSM', '100% cotton canvas', 260, 'MTR', 3.1, 'Woven'],
    ['FAB-013', 'Viscose challis 110 GSM', '100% LENZING viscose', 110, 'MTR', 2.45, 'Woven'],
    ['FAB-014', 'Linen blend 165 GSM', '55% linen / 45% cotton', 165, 'MTR', 4.2, 'Woven'],
    ['FAB-015', 'Recycled poly jersey 150 GSM', '100% recycled polyester', 150, 'KG', 5.75, 'Performance'],
    ['FAB-016', 'Poly spandex 210 GSM', '88% polyester / 12% spandex', 210, 'KG', 6.4, 'Performance'],
  ].map(([entryId, name, composition, gsm, uom, rate, group]) => ({
    id: entryId,
    name,
    composition,
    gsm,
    uom,
    standardRate: rate,
    currency: 'USD',
    group,
    active: true,
  }))

  const trims = [
    ['TRM-001', 'Main label — woven', 'Label', 'PCS', 0.035],
    ['TRM-002', 'Care label — satin', 'Label', 'PCS', 0.022],
    ['TRM-003', 'Size label', 'Label', 'PCS', 0.014],
    ['TRM-004', 'Hangtag with string', 'Packaging', 'PCS', 0.09],
    ['TRM-005', 'Polybag — recycled LDPE', 'Packaging', 'PCS', 0.048],
    ['TRM-006', 'Carton 5-ply', 'Packaging', 'PCS', 0.62],
    ['TRM-007', 'Sewing thread — 40/2 spun', 'Thread', 'CONE', 1.35],
    ['TRM-008', 'Metal shank button 20L', 'Button', 'GROSS', 2.1],
    ['TRM-009', 'Corozo button 18L', 'Button', 'GROSS', 3.4],
    ['TRM-010', 'YKK zipper 5CN 16cm', 'Zipper', 'PCS', 0.31],
    ['TRM-011', 'Drawcord flat 8mm', 'Cord', 'MTR', 0.07],
    ['TRM-012', 'Elastic waistband 40mm', 'Elastic', 'MTR', 0.16],
    ['TRM-013', 'Heat transfer label', 'Label', 'PCS', 0.052],
    ['TRM-014', 'Rivet — antique brass', 'Hardware', 'GROSS', 1.8],
    ['TRM-015', 'Tissue paper sheet', 'Packaging', 'PCS', 0.018],
  ].map(([entryId, name, group, uom, rate]) => ({
    id: entryId,
    name,
    group,
    uom,
    standardRate: rate,
    currency: 'USD',
    active: true,
  }))

  const colors = [
    ['COL-001', 'Optic White', '#FFFFFF', '11-0601 TCX'],
    ['COL-002', 'Jet Black', '#101114', '19-4005 TCX'],
    ['COL-003', 'Heather Grey', '#B2B6BC', '14-4102 TCX'],
    ['COL-004', 'Navy Blazer', '#1F2A44', '19-4028 TCX'],
    ['COL-005', 'Harbor Blue', '#3A6EA5', '18-4041 TCX'],
    ['COL-006', 'Sage', '#9CAE8E', '15-6317 TCX'],
    ['COL-007', 'Terracotta', '#B5643C', '17-1345 TCX'],
    ['COL-008', 'Sand', '#D8C7AD', '13-1010 TCX'],
    ['COL-009', 'Olive Drab', '#5C6042', '18-0430 TCX'],
    ['COL-010', 'Burgundy', '#5E2233', '19-1528 TCX'],
    ['COL-011', 'Mustard', '#C99A2E', '15-0960 TCX'],
    ['COL-012', 'Dusty Rose', '#C9908E', '15-1614 TCX'],
    ['COL-013', 'Forest', '#23433A', '19-5513 TCX'],
    ['COL-014', 'Ecru', '#EDE5D6', '11-0605 TCX'],
  ].map(([entryId, name, hex, pantone]) => ({
    id: entryId,
    name,
    hex, // audit-ignore: colour master data, not styling
    pantone,
    active: true,
  }))

  const sizeSets = [
    { id: 'SZS-001', name: 'Adult standard', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], region: 'US/EU' },
    { id: 'SZS-002', name: 'Adult extended', sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'], region: 'US' },
    { id: 'SZS-003', name: 'Womens numeric', sizes: ['2', '4', '6', '8', '10', '12', '14'], region: 'US' },
    { id: 'SZS-004', name: 'Kids 2-8', sizes: ['2Y', '3Y', '4Y', '5Y', '6Y', '8Y'], region: 'EU' },
    { id: 'SZS-005', name: 'Kids 8-14', sizes: ['8Y', '10Y', '12Y', '14Y'], region: 'EU' },
    { id: 'SZS-006', name: 'Waist sizing', sizes: ['28', '30', '32', '34', '36', '38'], region: 'US' },
  ].map((entry) => ({ ...entry, active: true }))

  const uom = [
    ['UOM-001', 'PCS', 'Pieces', 0],
    ['UOM-002', 'KG', 'Kilogram', 3],
    ['UOM-003', 'MTR', 'Metre', 2],
    ['UOM-004', 'YRD', 'Yard', 2],
    ['UOM-005', 'DOZ', 'Dozen', 0],
    ['UOM-006', 'GROSS', 'Gross (144)', 0],
    ['UOM-007', 'CONE', 'Cone', 0],
    ['UOM-008', 'SET', 'Set', 0],
  ].map(([entryId, code, name, decimals]) => ({ id: entryId, code, name, decimals, active: true }))

  const currencies = [
    ['CUR-001', 'USD', 'US Dollar', '$', 1, 88.4],
    ['CUR-002', 'INR', 'Indian Rupee', '₹', 88.4, 1],
    ['CUR-003', 'EUR', 'Euro', '€', 0.92, 96.1],
    ['CUR-004', 'GBP', 'Pound Sterling', '£', 0.79, 111.9],
  ].map(([entryId, code, name, symbol, perUsd, inrRate]) => ({
    id: entryId,
    code,
    name,
    symbol,
    perUsd,
    inrRate,
    active: true,
  }))

  const ports = [
    ['PRT-001', 'INMAA', 'Chennai', 'India', 'Sea'],
    ['PRT-002', 'INCOK', 'Cochin', 'India', 'Sea'],
    ['PRT-003', 'INTUT', 'Tuticorin', 'India', 'Sea'],
    ['PRT-004', 'INMAA4', 'Chennai Air Cargo', 'India', 'Air'],
    ['PRT-005', 'USLAX', 'Los Angeles', 'United States', 'Sea'],
    ['PRT-006', 'USNYC', 'New York', 'United States', 'Sea'],
    ['PRT-007', 'NLRTM', 'Rotterdam', 'Netherlands', 'Sea'],
    ['PRT-008', 'DEHAM', 'Hamburg', 'Germany', 'Sea'],
    ['PRT-009', 'GBFXT', 'Felixstowe', 'United Kingdom', 'Sea'],
    ['PRT-010', 'ESBCN', 'Barcelona', 'Spain', 'Sea'],
    ['PRT-011', 'FRLEH', 'Le Havre', 'France', 'Sea'],
  ].map(([entryId, code, name, country, mode]) => ({
    id: entryId,
    code,
    name,
    country,
    mode,
    active: true,
  }))

  const incoterms = [
    ['INC-001', 'FOB', 'Free on Board', 'Seller clears export and loads; buyer carries freight.'],
    ['INC-002', 'CIF', 'Cost, Insurance and Freight', 'Seller pays freight and insurance to the named port.'],
    ['INC-003', 'CFR', 'Cost and Freight', 'Seller pays freight; buyer insures.'],
    ['INC-004', 'EXW', 'Ex Works', 'Buyer collects from the factory gate.'],
    ['INC-005', 'DDP', 'Delivered Duty Paid', 'Seller delivers cleared, duty paid.'],
    ['INC-006', 'DAP', 'Delivered at Place', 'Seller delivers, buyer clears.'],
  ].map(([entryId, code, name, description]) => ({
    id: entryId,
    code,
    name,
    description,
    active: true,
  }))

  const paymentTerms = [
    ['PAY-001', 'TT 30', 'Telegraphic transfer, 30 days from B/L', 30],
    ['PAY-002', 'TT 45', 'Telegraphic transfer, 45 days from B/L', 45],
    ['PAY-003', 'TT 60', 'Telegraphic transfer, 60 days from B/L', 60],
    ['PAY-004', 'LC 60', 'Irrevocable LC at 60 days sight', 60],
    ['PAY-005', 'LC 90', 'Irrevocable LC at 90 days sight', 90],
    ['PAY-006', '30/70', '30% advance, 70% against documents', 15],
    ['PAY-007', 'Advance', '100% advance before dispatch', 0],
  ].map(([entryId, code, description, days]) => ({
    id: entryId,
    code,
    description,
    days,
    active: true,
  }))

  const qcChecklists = [
    {
      id: 'QCL-001',
      name: 'Knit tops — final inspection',
      aql: '2.5',
      stage: 'FINAL_INSPECTION',
      points: [
        'Measurement against the approved spec (±0.5 cm tolerance)',
        'Shade band matches the approved lab dip',
        'Print and embroidery placement within tolerance',
        'Stitch density 11–13 SPI on all seams',
        'Labels: main, care and size present and legible',
        'Trims and hangtags per the approved PP sample',
        'Metal detection pass on every carton',
        'Carton marking and packing ratio correct',
      ],
      active: true,
    },
    {
      id: 'QCL-002',
      name: 'Wovens — inline inspection',
      aql: '2.5',
      stage: 'STITCHING',
      points: [
        'Cut panel shading verified per lay',
        'Button and buttonhole alignment',
        'Collar and cuff symmetry',
        'Side seam puckering check',
        'Broken stitch and skipped stitch audit',
        'Pocket placement per the tech pack',
      ],
      active: true,
    },
    {
      id: 'QCL-003',
      name: 'Denim — post-wash audit',
      aql: '2.5',
      stage: 'WASHING_EMB',
      points: [
        'Wash shade against the approved standard',
        'Shrinkage within ±3% after wash',
        'Hand feel and abrasion consistency',
        'Rivet and hardware integrity after wash',
        'Colour fastness to rubbing, dry and wet',
      ],
      active: true,
    },
    {
      id: 'QCL-004',
      name: 'Kidswear — safety audit',
      aql: '1.5',
      stage: 'FINAL_INSPECTION',
      points: [
        'No functional drawcords at the neck',
        'Small parts pull test 90 N for 10 seconds',
        'Flammability per EN 14878',
        'Needle and metal detection on every unit',
        'Azo-free dye certificate on file',
      ],
      active: true,
    },
    {
      id: 'QCL-005',
      name: 'Fabric inhouse inspection',
      aql: '4-point',
      stage: 'FABRIC_INHOUSE',
      points: [
        '4-point system defect score under 20 per 100 sq yd',
        'GSM within ±5% of the approved standard',
        'Width consistent across the roll',
        'Shade continuity roll to roll',
        'Skew and bow within 3%',
      ],
      active: true,
    },
  ]

  const departments = [
    ['DEP-001', 'Executive', 'EMP-002', 'Strategy, client relationships and governance'],
    ['DEP-002', 'Merchandising', 'EMP-004', 'Owns the order from enquiry to delivery'],
    ['DEP-003', 'Design', 'EMP-012', 'Concepts, tech packs and sample development'],
    ['DEP-004', 'Sourcing', 'EMP-018', 'Vendor development, RFQs and material buying'],
    ['DEP-005', 'Production', 'EMP-024', 'Factory allocation and stage tracking'],
    ['DEP-006', 'Quality', 'EMP-031', 'Inline and final AQL inspections'],
    ['DEP-007', 'Logistics', 'EMP-036', 'Export documentation and freight'],
    ['DEP-008', 'Finance', 'EMP-039', 'Receivables, payables and order P&L'],
    ['DEP-009', 'Human Resources', 'EMP-042', 'Hiring, payroll and employee relations'],
    ['DEP-010', 'Technology', 'EMP-001', 'Systems, data and internal tooling'],
  ].map(([entryId, name, headId, description]) => ({
    id: entryId,
    name,
    headEmployeeId: headId,
    description,
    active: true,
  }))

  const stages = Object.entries({
    FABRIC_INHOUSE: ['Fabric in-house', 1, 'Fabric received, inspected and relaxed', false],
    CUTTING: ['Cutting', 2, 'Marker, lay and cut panels', false],
    STITCHING: ['Stitching', 3, 'Assembly on the sewing line', false],
    WASHING_EMB: ['Washing / embellishment', 4, 'Wash, print or embroidery', true],
    FINISHING: ['Finishing', 5, 'Trimming, pressing and tagging', false],
    PACKING: ['Packing', 6, 'Polybag, cartonise and mark', false],
    FINAL_INSPECTION: ['Final inspection', 7, 'AQL 2.5 final audit before dispatch', false],
  }).map(([code, [name, sequence, description, optional]]) => ({
    id: id('STG', sequence),
    code,
    name,
    sequence,
    description,
    optional,
    active: true,
  }))

  return {
    company,
    categories,
    fabrics,
    trims,
    colors,
    sizeSets,
    uom,
    currencies,
    ports,
    incoterms,
    paymentTerms,
    qcChecklists,
    departments,
    stages,
    generatedAt: at(0),
  }
}
