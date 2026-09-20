import { at, day, id, round } from './lib.mjs'

/** The six brands we produce for. */
export function buildClients() {
  return [
    {
      id: 'CLI-001',
      code: 'NWA',
      name: 'Northwind Apparel',
      segment: 'Casual basics',
      country: 'United States',
      city: 'Portland, OR',
      addressLine1: '1120 NW Quimby Street, Suite 400',
      currency: 'USD',
      incoterm: 'FOB',
      paymentTermCode: 'TT 45',
      destinationPortId: 'PRT-005',
      contactName: 'Ellie Brandt',
      contactTitle: 'Sourcing Director',
      email: 'buyer@northwindapparel.com',
      phone: '+1 503 555 0142',
      accountManagerId: 'EMP-005',
      since: day(-1580),
      rating: 5,
      creditLimitUsd: 900000,
      status: 'ACTIVE',
      notes: 'Largest account. Runs two drops a year plus a replenishment programme.',
    },
    {
      id: 'CLI-002',
      code: 'BHC',
      name: 'Blue Harbor Co.',
      segment: 'Coastal lifestyle',
      country: 'United States',
      city: 'Charleston, SC',
      addressLine1: '88 East Bay Street',
      currency: 'USD',
      incoterm: 'FOB',
      paymentTermCode: 'TT 30',
      destinationPortId: 'PRT-006',
      contactName: 'Marcus Reed',
      contactTitle: 'Head of Product',
      email: 'sourcing@blueharborco.com',
      phone: '+1 843 555 0177',
      accountManagerId: 'EMP-006',
      since: day(-1120),
      rating: 4,
      creditLimitUsd: 520000,
      status: 'ACTIVE',
      notes: 'Strict on wash shade continuity across repeat orders.',
    },
    {
      id: 'CLI-003',
      code: 'URL',
      name: 'Urban Loom',
      segment: 'Street & workwear',
      country: 'United Kingdom',
      city: 'Manchester',
      addressLine1: '3 Ducie Street, Piccadilly',
      currency: 'GBP',
      incoterm: 'CIF',
      paymentTermCode: 'LC 60',
      destinationPortId: 'PRT-009',
      contactName: 'Nadia Hussain',
      contactTitle: 'Buying Manager',
      email: 'buying@urbanloom.co.uk',
      phone: '+44 161 555 0193',
      accountManagerId: 'EMP-007',
      since: day(-860),
      rating: 3,
      creditLimitUsd: 380000,
      status: 'ACTIVE',
      notes: 'Slow payer — two invoices currently past due.',
    },
    {
      id: 'CLI-004',
      code: 'VRD',
      name: 'Verde Kids',
      segment: 'Sustainable kidswear',
      country: 'Spain',
      city: 'Barcelona',
      addressLine1: 'Carrer de Pallars 193',
      currency: 'EUR',
      incoterm: 'FOB',
      paymentTermCode: 'TT 60',
      destinationPortId: 'PRT-010',
      contactName: 'Lucía Fernández',
      contactTitle: 'Product Director',
      email: 'product@verdekids.es',
      phone: '+34 93 555 0108',
      accountManagerId: 'EMP-008',
      since: day(-640),
      rating: 5,
      creditLimitUsd: 410000,
      status: 'ACTIVE',
      notes: 'GOTS certification required on every fabric. EN 14682 safety audit on all styles.',
    },
    {
      id: 'CLI-005',
      code: 'ATA',
      name: 'Atlas Active',
      segment: 'Performance activewear',
      country: 'Germany',
      city: 'Munich',
      addressLine1: 'Rosenheimer Strasse 145',
      currency: 'EUR',
      incoterm: 'CIF',
      paymentTermCode: 'TT 45',
      destinationPortId: 'PRT-008',
      contactName: 'Jonas Weber',
      contactTitle: 'Sourcing Lead',
      email: 'sourcing@atlasactive.de',
      phone: '+49 89 555 0166',
      accountManagerId: 'EMP-009',
      since: day(-470),
      rating: 4,
      creditLimitUsd: 460000,
      status: 'ACTIVE',
      notes: 'Recycled polyester only. Requires GRS transaction certificates per shipment.',
    },
    {
      id: 'CLI-006',
      code: 'MSR',
      name: 'Maison Rue',
      segment: 'Contemporary womenswear',
      country: 'France',
      city: 'Paris',
      addressLine1: '24 Rue du Faubourg Saint-Antoine',
      currency: 'EUR',
      incoterm: 'FOB',
      paymentTermCode: '30/70',
      destinationPortId: 'PRT-011',
      contactName: 'Camille Rousseau',
      contactTitle: 'Production Manager',
      email: 'buyer@maisonrue.com',
      phone: '+33 1 55 55 0188',
      accountManagerId: 'EMP-010',
      since: day(-310),
      rating: 4,
      creditLimitUsd: 290000,
      status: 'ACTIVE',
      notes: 'Newest account. Small runs, high fabric quality, tight ex-factory windows.',
    },
  ]
}

const VENDOR_SEED = [
  // [name, type, city, specialities, capacity, rating, leadDays, onTime, defectRate]
  ['Coimbatore Spinning Mills', 'MILL', 'Coimbatore', ['Single jersey', 'Interlock', 'Rib'], '45 T/month', 4.4, 22, 91, 1.8],
  ['Kaveri Knit Fabrics', 'MILL', 'Tiruppur', ['French terry', 'Fleece', 'Pique'], '38 T/month', 4.1, 20, 88, 2.4],
  ['Southern Weaves Ltd', 'MILL', 'Erode', ['Poplin', 'Oxford', 'Twill'], '220k m/month', 4.6, 26, 94, 1.3],
  ['Nilgiri Organic Yarns', 'MILL', 'Coimbatore', ['GOTS organic jersey', 'Slub'], '18 T/month', 4.8, 30, 96, 0.9],
  ['Deccan Denim Mills', 'MILL', 'Hyderabad', ['Denim 9–13 oz', 'Canvas'], '180k m/month', 3.9, 34, 82, 3.1],
  ['Vellore Viscose House', 'MILL', 'Vellore', ['Viscose challis', 'Rayon blends'], '120k m/month', 3.7, 28, 79, 3.6],
  ['GreenSpin Recycled Fibres', 'MILL', 'Salem', ['rPET jersey', 'GRS poly spandex'], '24 T/month', 4.5, 25, 92, 1.5],

  ['Precision Trims & Labels', 'TRIMS', 'Tiruppur', ['Woven labels', 'Heat transfers', 'Hangtags'], '2.5M pcs/month', 4.5, 12, 93, 1.1],
  ['Anchor Thread Supplies', 'TRIMS', 'Coimbatore', ['Spun thread', 'Core spun'], '90k cones/month', 4.3, 10, 95, 0.8],
  ['Metro Button House', 'TRIMS', 'Mumbai', ['Corozo', 'Metal shank', 'Rivets'], '1.2M pcs/month', 4.0, 16, 87, 2.0],
  ['ZipLine Fasteners', 'TRIMS', 'Chennai', ['YKK distribution', 'Custom pullers'], '800k pcs/month', 4.2, 14, 90, 1.6],
  ['EcoPack Solutions', 'TRIMS', 'Tiruppur', ['Recycled polybags', 'FSC cartons'], '3M pcs/month', 4.6, 9, 96, 0.7],
  ['Sunrise Elastics', 'TRIMS', 'Ludhiana', ['Waistbands', 'Drawcords'], '400k m/month', 3.6, 18, 77, 3.9],

  ['Velmurugan Garments', 'FACTORY', 'Tiruppur', ['Knit tops', 'Kidswear'], '420k pcs/month', 4.5, 45, 93, 1.4],
  ['Cauvery Apparel Works', 'FACTORY', 'Tiruppur', ['Sweatshirts', 'Joggers'], '310k pcs/month', 4.2, 48, 89, 2.1],
  ['Pioneer Stitchcraft', 'FACTORY', 'Bengaluru', ['Woven shirts', 'Dresses'], '180k pcs/month', 4.4, 52, 91, 1.7],
  ['Harbour Line Apparels', 'FACTORY', 'Chennai', ['Outerwear', 'Woven bottoms'], '150k pcs/month', 3.8, 58, 81, 3.2],
  ['Sapphire Knitwear', 'FACTORY', 'Tiruppur', ['Polos', 'Tees'], '500k pcs/month', 4.7, 42, 96, 0.9],
  ['Neelkanth Garment Co.', 'FACTORY', 'Jaipur', ['Dresses', 'Skirts'], '120k pcs/month', 3.5, 60, 74, 4.4],
  ['Everest Activewear Unit', 'FACTORY', 'Bengaluru', ['Performance tops', 'Leggings'], '200k pcs/month', 4.3, 50, 90, 1.9],
  ['Little Sprout Kidswear', 'FACTORY', 'Tiruppur', ['Infant', 'Toddler'], '260k pcs/month', 4.6, 44, 94, 1.2],

  ['Crystal Wash Systems', 'WASHING', 'Tiruppur', ['Enzyme wash', 'Garment dye'], '90k pcs/month', 4.4, 8, 92, 1.6],
  ['Indigo Lane Laundry', 'WASHING', 'Hyderabad', ['Denim wash', 'Whiskering'], '70k pcs/month', 3.9, 11, 84, 2.8],
  ['Prism Print & Embroidery', 'WASHING', 'Tiruppur', ['Screen print', 'Embroidery'], '150k pcs/month', 4.5, 7, 94, 1.3],
  ['AquaSave Finishing', 'WASHING', 'Coimbatore', ['Ozone wash', 'Low-water finish'], '60k pcs/month', 4.7, 9, 97, 0.8],
]

/** 25 vendors across mills, trims suppliers, factories and washing units. */
export function buildVendors(random) {
  const TYPE_LABEL = {
    MILL: 'Fabric mill',
    TRIMS: 'Trims & packaging',
    FACTORY: 'Garment factory',
    WASHING: 'Washing & embellishment',
  }
  const PAYMENT_TERMS = ['TT 30', 'TT 45', 'TT 60', 'Advance', '30/70']

  return VENDOR_SEED.map((entry, index) => {
    const [name, type, city, specialities, capacity, rating, leadDays, onTime, defectRate] = entry
    const contactFirst = ['Ramesh', 'Anita', 'Suresh', 'Kavya', 'Imran', 'Deepa', 'Joseph', 'Meena'][index % 8]
    const contactLast = ['Nair', 'Pillai', 'Subramanian', 'Reddy', 'Khan', 'Menon', 'Fernandes', 'Bhat'][index % 8]
    return {
      id: id('VEN', index + 1),
      code: `V${String(index + 1).padStart(3, '0')}`,
      name,
      type,
      typeLabel: TYPE_LABEL[type],
      city,
      state: city === 'Mumbai' ? 'Maharashtra' : city === 'Jaipur' ? 'Rajasthan' : city === 'Ludhiana' ? 'Punjab' : city === 'Hyderabad' ? 'Telangana' : city === 'Bengaluru' ? 'Karnataka' : 'Tamil Nadu',
      country: 'India',
      specialities,
      monthlyCapacity: capacity,
      rating,
      leadTimeDays: leadDays,
      onTimePercent: onTime,
      defectRatePercent: defectRate,
      contactName: `${contactFirst} ${contactLast}`,
      email: `${contactFirst.toLowerCase()}@${name.toLowerCase().replace(/[^a-z]+/g, '')}.in`,
      phone: `+91 9${random.int(1000000000, 9999999999)}`.slice(0, 14),
      paymentTermCode: PAYMENT_TERMS[index % PAYMENT_TERMS.length],
      gstin: `33${String.fromCharCode(65 + (index % 26))}AFCV${1000 + index}K1Z${String.fromCharCode(65 + ((index * 7) % 26))}`,
      certifications: type === 'MILL' && index % 3 === 0 ? ['GOTS', 'OEKO-TEX 100'] : type === 'FACTORY' ? ['SEDEX', 'WRAP'] : ['OEKO-TEX 100'],
      active: rating >= 3.5,
      onboardedAt: day(-random.int(180, 2100)),
      notes:
        onTime < 82
          ? 'Under review — repeated delivery slippage over the last two quarters.'
          : 'Approved supplier in good standing.',
    }
  })
}

const FIRST_NAMES = [
  'Arjun', 'Lakshmi', 'Vikram', 'Sanjana', 'Priya', 'Karthik', 'Divya', 'Rahul', 'Anjali', 'Nikhil',
  'Shreya', 'Mei Ling', 'Aditya', 'Fatima', 'Joseph', 'Ritu', 'Pranav', 'Rafael', 'Swathi', 'Gopal',
  'Aisha', 'Manoj', 'Kiran', 'Daniel', 'Bhavana', 'Suresh', 'Nandini', 'Ashwin', 'Yamini', 'Rohit',
  'Sofia', 'Vinod', 'Charu', 'Devika', 'Balaji', 'Hari', 'Leela', 'Mohit', 'Neha', 'Pooja',
  'Rakesh', 'Tanvi', 'Uma', 'Sathish', 'Varsha',
]
const LAST_NAMES = [
  'Mehta', 'Iyer', 'Shankar', 'Desai', 'Raman', 'Natarajan', 'Menon', 'Bose', 'Gupta', 'Varma',
  'Joshi', 'Chan', 'Kapoor', 'Sheikh', 'Dsouza', 'Agarwal', 'Rao', 'Costa', 'Krishnan', 'Pillai',
  'Begum', 'Nambiar', 'Thomas', 'Osei', 'Reddy', 'Kumar', 'Balan', 'Sundaram', 'Prasad', 'Dutta',
  'Almeida', 'Chauhan', 'Lal', 'Sethi', 'Murthy', 'Venkatesh', 'Rajan', 'Bansal', 'Kulkarni', 'Hegde',
  'Saxena', 'Shah', 'Nair', 'Kumaran', 'Patil',
]

/** EMP-001 … EMP-045, laid out so the ids in users.json land in the right department. */
const HEADCOUNT_PLAN = [
  ['Technology', 1],
  ['Executive', 2],
  ['Merchandising', 8],
  ['Design', 6],
  ['Sourcing', 6],
  ['Production', 7],
  ['Quality', 5],
  ['Logistics', 3],
  ['Finance', 3],
  ['Human Resources', 2],
  ['Technology', 2],
]

const TITLES = {
  Executive: ['Chief Executive Officer', 'Chief Operating Officer'],
  Merchandising: ['Head of Merchandising', 'Senior Merchandiser', 'Merchandiser', 'Assistant Merchandiser'],
  Design: ['Design Lead', 'Senior Designer', 'Designer', 'CAD Artist', 'Pattern Master'],
  Sourcing: ['Sourcing Manager', 'Senior Sourcing Executive', 'Sourcing Executive', 'Vendor Development Executive'],
  Production: ['Production Manager', 'Production Planner', 'Floor Coordinator', 'Production Executive'],
  Quality: ['QA Manager', 'Senior QA Inspector', 'QA Inspector', 'Fabric Inspector'],
  Logistics: ['Export Logistics Lead', 'Documentation Executive', 'Shipping Coordinator'],
  Finance: ['Finance Controller', 'Accounts Executive', 'Costing Analyst'],
  'Human Resources': ['HR Manager', 'HR Executive'],
  Technology: ['Head of Systems', 'Data Analyst', 'Systems Executive'],
}

const DEPARTMENT_IDS = {
  Executive: 'DEP-001',
  Merchandising: 'DEP-002',
  Design: 'DEP-003',
  Sourcing: 'DEP-004',
  Production: 'DEP-005',
  Quality: 'DEP-006',
  Logistics: 'DEP-007',
  Finance: 'DEP-008',
  'Human Resources': 'DEP-009',
  Technology: 'DEP-010',
}

// Names pinned so employee records agree with users.json.
const PINNED = {
  'EMP-001': ['Arjun Mehta', 'Head of Systems'],
  'EMP-002': ['Lakshmi Iyer', 'Chief Executive Officer'],
  'EMP-005': ['Priya Raman', 'Senior Merchandiser'],
  'EMP-012': ['Mei Ling Chan', 'Design Lead'],
  'EMP-018': ['Rafael Costa', 'Sourcing Manager'],
  'EMP-024': ['Daniel Osei', 'Production Manager'],
  'EMP-031': ['Sofia Almeida', 'QA Manager'],
  'EMP-036': ['Hari Venkatesh', 'Export Logistics Lead'],
  'EMP-039': ['Neha Kulkarni', 'Finance Controller'],
  'EMP-042': ['Tanvi Shah', 'HR Manager'],
}

/** 45 employees. */
export function buildEmployees(random) {
  const employees = []
  let index = 0
  for (const [department, count] of HEADCOUNT_PLAN) {
    for (let seat = 0; seat < count; seat += 1) {
      const employeeId = id('EMP', index + 1)
      const pinned = PINNED[employeeId]
      const name = pinned?.[0] ?? `${FIRST_NAMES[index]} ${LAST_NAMES[index]}`
      const titles = TITLES[department]
      const title = pinned?.[1] ?? titles[Math.min(seat, titles.length - 1)]
      const isLead = seat === 0 && !['Technology'].includes(department)
      const joined = -random.int(90, 2400)
      const grade = isLead ? 'M2' : seat < 2 ? 'M1' : 'E' + random.int(1, 3)
      const baseMonthly =
        department === 'Executive'
          ? random.int(320000, 420000)
          : isLead
            ? random.int(120000, 185000)
            : random.int(34000, 96000)

      employees.push({
        id: employeeId,
        code: `AF${String(index + 1).padStart(4, '0')}`,
        name,
        title,
        department,
        departmentId: DEPARTMENT_IDS[department],
        grade,
        email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@apparelflow.com`,
        phone: `+91 9${random.int(400000000, 899999999)}`,
        location: random.pick(['Tiruppur, IN', 'Tiruppur, IN', 'Coimbatore, IN', 'Chennai, IN', 'Bengaluru, IN']),
        employmentType: random.chance(0.88) ? 'FULL_TIME' : 'CONTRACT',
        joinedAt: day(joined),
        reportsTo: isLead || department === 'Executive' ? null : id('EMP', index + 1 - seat),
        monthlyCtc: baseMonthly,
        currency: 'INR',
        leaveBalance: random.int(4, 22),
        status: 'ACTIVE',
        bankLast4: String(random.int(1000, 9999)),
      })
      index += 1
    }
  }
  return employees
}

/** Convenience: employees grouped by department for assignment elsewhere. */
export function employeesByDepartment(employees) {
  return employees.reduce((accumulator, employee) => {
    accumulator[employee.department] = accumulator[employee.department] ?? []
    accumulator[employee.department].push(employee)
    return accumulator
  }, {})
}

/** @param {number} value */
export function usd(value) {
  return round(value, 2)
}

export const SEED_META = { at, day }
