
export interface SchemeRule {
  id: string;
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin' | 'custom';
  value: any;
  description: string;
  isMandatory: boolean;
}

export interface Scheme {
  id: string;
  name: string;
  category: string;
  description: string;
  benefits: string[];
  eligibilitySummary: string;
  rules: SchemeRule[];
  prerequisites: string[]; // IDs of other schemes
  documents: string[];
  applicationSteps: string[];
  officialUrl: string;
  pdfUrl: string;
}

export const WELFARE_SCHEMES: Scheme[] = [
  {
    id: 'pm-kisan',
    name: 'PM-Kisan Samman Nidhi',
    category: 'Agriculture',
    description: 'Income support of ₹6,000 per year to all landholding farmer families.',
    benefits: [
      'Direct income support of ₹6,000 per year in three equal installments',
      'Direct Benefit Transfer (DBT) to bank accounts',
      'Financial stability for small and marginal farmers'
    ],
    eligibilitySummary: 'All landholding farmer families with cultivable land in their names are eligible, subject to certain exclusion criteria (e.g., institutional landholders, taxpayers).',
    rules: [
      { id: 'pk-1', field: 'occupation', operator: 'eq', value: 'farmer', description: 'Must be a farmer', isMandatory: true },
      { id: 'pk-2', field: 'landOwnership', operator: 'gt', value: 0, description: 'Must own cultivable land', isMandatory: true },
      { id: 'pk-3', field: 'isTaxpayer', operator: 'eq', value: false, description: 'Should not be an income tax payer', isMandatory: true },
      { id: 'pk-4', field: 'isInstitutionalLandholder', operator: 'eq', value: false, description: 'Should not be an institutional landholder', isMandatory: true },
      { id: 'pk-5', field: 'isGovtEmployee', operator: 'eq', value: false, description: 'No family member should be a government employee', isMandatory: true },
      { id: 'pk-6', field: 'age', operator: 'gte', value: 18, description: 'Applicant must be an adult', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['Aadhaar Card', 'Land Records', 'Bank Passbook'],
    applicationSteps: ['Register on PM-Kisan portal', 'e-KYC verification', 'State government approval'],
    officialUrl: 'https://pmkisan.gov.in/',
    pdfUrl: 'https://pmkisan.gov.in/Documents/RevisedGuidelines.pdf'
  },
  {
    id: 'mgnrega',
    name: 'MGNREGA',
    category: 'Employment',
    description: 'Guarantees 100 days of wage employment in a financial year to every rural household.',
    benefits: [
      'Guaranteed 100 days of wage employment',
      'Unemployment allowance if work is not provided within 15 days',
      'Creation of durable assets in rural areas'
    ],
    eligibilitySummary: 'Any adult member of a rural household willing to do unskilled manual work.',
    rules: [
      { id: 'mg-1', field: 'isRural', operator: 'eq', value: true, description: 'Must reside in a rural area', isMandatory: true },
      { id: 'mg-2', field: 'age', operator: 'gte', value: 18, description: 'Must be an adult (18+)', isMandatory: true },
      { id: 'mg-3', field: 'willingToWork', operator: 'eq', value: true, description: 'Willing to do unskilled manual work', isMandatory: true },
      { id: 'mg-4', field: 'hasBankAccount', operator: 'eq', value: true, description: 'Must have a bank account for wage credit', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['Job Card', 'Aadhaar Card', 'Bank Account'],
    applicationSteps: ['Apply for Job Card at Gram Panchayat', 'Submit work demand', 'Receive payment in bank account'],
    officialUrl: 'https://nrega.nic.in/',
    pdfUrl: 'https://nrega.nic.in/Circular_Archive/archive/Operational_guidelines_2013.pdf'
  },
  {
    id: 'ayushman-bharat',
    name: 'Ayushman Bharat (PM-JAY)',
    category: 'Health',
    description: 'Health cover of ₹5 lakh per family per year for secondary and tertiary care hospitalization.',
    benefits: [
      'Cashless and paperless access to health services',
      'Coverage of ₹5 lakh per family per year',
      'Covers pre-existing diseases from day one'
    ],
    eligibilitySummary: 'Families listed in the SECC 2011 database or covered under RSBY.',
    rules: [
      { id: 'ab-1', field: 'seccListed', operator: 'eq', value: true, description: 'Must be listed in SECC 2011 database', isMandatory: true },
      { id: 'ab-2', field: 'income', operator: 'lte', value: 100000, description: 'Annual family income should be within limits', isMandatory: false },
      { id: 'ab-3', field: 'ownsPuccaHouse', operator: 'eq', value: false, description: 'Priority for households in kutcha houses', isMandatory: false },
      { id: 'ab-4', field: 'isGovtEmployee', operator: 'eq', value: false, description: 'Should not be a government employee', isMandatory: true },
      { id: 'ab-5', field: 'hasTwoWheeler', operator: 'eq', value: false, description: 'Household should not own a two-wheeler', isMandatory: false }
    ],
    prerequisites: [],
    documents: ['Aadhaar Card', 'Ration Card', 'PM-JAY ID Card'],
    applicationSteps: ['Check name in SECC list', 'Visit empaneled hospital', 'Get treatment using Golden Card'],
    officialUrl: 'https://pmjay.gov.in/',
    pdfUrl: 'https://pmjay.gov.in/sites/default/files/2018-07/PMJAY_Guidelines_on_Process_Flow_at_Hospital.pdf'
  },
  {
    id: 'pmay-u',
    name: 'PMAY-Urban',
    category: 'Housing',
    description: 'Housing for all in urban areas.',
    benefits: [
      'Interest subsidy on home loans',
      'Financial assistance for house construction or enhancement',
      'Focus on slum dwellers and EWS/LIG/MIG categories'
    ],
    eligibilitySummary: 'Urban residents who do not own a pucca house anywhere in India.',
    rules: [
      { id: 'pu-1', field: 'isUrban', operator: 'eq', value: true, description: 'Must reside in an urban area', isMandatory: true },
      { id: 'pu-2', field: 'ownsPuccaHouse', operator: 'eq', value: false, description: 'Should not own a pucca house anywhere in India', isMandatory: true },
      { id: 'pu-3', field: 'income', operator: 'lte', value: 1800000, description: 'Annual income up to ₹18 lakh (MIG-II)', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['Aadhaar Card', 'Income Certificate', 'Affidavit of no pucca house'],
    applicationSteps: ['Online application', 'Verification by ULB', 'Sanction of subsidy/house'],
    officialUrl: 'https://pmay-urban.gov.in/',
    pdfUrl: 'https://pmay-urban.gov.in/assets/images/pdf/Guidelines_PMAY_U_English.pdf'
  },
  {
    id: 'atal-pension',
    name: 'Atal Pension Yojana',
    category: 'Pension',
    description: 'Pension scheme for workers in the unorganized sector.',
    benefits: [
      'Guaranteed minimum pension of ₹1,000 to ₹5,000 per month',
      'Pension to spouse after the death of the subscriber',
      'Return of pension corpus to nominees'
    ],
    eligibilitySummary: 'Indian citizens aged 18-40 years with a savings bank account.',
    rules: [
      { id: 'ap-1', field: 'age', operator: 'gte', value: 18, description: 'Minimum age 18', isMandatory: true },
      { id: 'ap-2', field: 'age', operator: 'lte', value: 40, description: 'Maximum age 40', isMandatory: true },
      { id: 'ap-3', field: 'hasBankAccount', operator: 'eq', value: true, description: 'Must have a bank account', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['Aadhaar Card', 'Bank Account details'],
    applicationSteps: ['Visit bank/post office', 'Fill APY form', 'Auto-debit authorization'],
    officialUrl: 'https://www.npscra.nsdl.co.in/scheme-details.php',
    pdfUrl: 'https://www.npscra.nsdl.co.in/download/APY_Guidelines.pdf'
  },
  {
    id: 'sukanya-samriddhi',
    name: 'Sukanya Samriddhi Yojana',
    category: 'Savings',
    description: 'Small deposit scheme for the girl child.',
    benefits: [
      'High interest rate compared to other small savings schemes',
      'Tax benefits under Section 80C',
      'Maturity after 21 years or marriage after 18 years'
    ],
    eligibilitySummary: 'Parents or legal guardians of a girl child aged 10 years or less.',
    rules: [
      { id: 'ss-1', field: 'gender', operator: 'eq', value: 'female', description: 'Beneficiary must be a girl child', isMandatory: true },
      { id: 'ss-2', field: 'age', operator: 'lte', value: 10, description: 'Age must be 10 years or less', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['Birth Certificate of girl child', 'Aadhaar of parent'],
    applicationSteps: ['Open account in bank/post office', 'Minimum deposit ₹250'],
    officialUrl: 'https://www.nsiindia.gov.in/InternalPage.aspx?Id_Pk=89',
    pdfUrl: 'https://www.nsiindia.gov.in/PDF/SSY_Rules_2016.pdf'
  },
  {
    id: 'pm-ujjwala',
    name: 'PM Ujjwala Yojana',
    category: 'Energy',
    description: 'LPG connections to women from BPL households.',
    benefits: [
      'Free LPG connection for BPL households',
      'Financial assistance of ₹1,600 per connection',
      'Access to clean cooking fuel'
    ],
    eligibilitySummary: 'Adult women belonging to BPL households.',
    rules: [
      { id: 'uj-1', field: 'gender', operator: 'eq', value: 'female', description: 'Applicant must be a woman', isMandatory: true },
      { id: 'uj-2', field: 'age', operator: 'gte', value: 18, description: 'Must be 18+', isMandatory: true },
      { id: 'uj-3', field: 'isBPL', operator: 'eq', value: true, description: 'Must belong to BPL household', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['Aadhaar Card', 'BPL Certificate', 'Ration Card'],
    applicationSteps: ['Apply at nearest LPG distributor', 'KYC verification', 'Connection release'],
    officialUrl: 'https://www.pmuy.gov.in/',
    pdfUrl: 'https://www.pmuy.gov.in/documents/PMUY_Guidelines.pdf'
  },
  {
    id: 'pm-mudra',
    name: 'PM Mudra Yojana',
    category: 'Finance',
    description: 'Loans up to ₹10 lakh for non-corporate, non-farm small/micro enterprises.',
    benefits: [
      'Collateral-free loans up to ₹10 lakh',
      'Three categories: Shishu (up to ₹50k), Kishore (up to ₹5L), Tarun (up to ₹10L)',
      'Support for micro-enterprises'
    ],
    eligibilitySummary: 'Small business owners and entrepreneurs in non-farm sectors.',
    rules: [
      { id: 'mu-1', field: 'isBusinessOwner', operator: 'eq', value: true, description: 'Must be a small business owner', isMandatory: true },
      { id: 'mu-2', field: 'loanPurpose', operator: 'neq', value: 'agriculture', description: 'Non-farm sector only', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['Business Plan', 'ID Proof', 'Address Proof'],
    applicationSteps: ['Approach bank/NBFC', 'Submit Mudra application', 'Loan disbursement'],
    officialUrl: 'https://www.mudra.org.in/',
    pdfUrl: 'https://www.mudra.org.in/Download/Mudra_Scheme_Guidelines.pdf'
  },
  {
    id: 'pm-svanidhi',
    name: 'PM SVANidhi',
    category: 'Finance',
    description: 'Micro-credit facility for street vendors.',
    benefits: [
      'Working capital loan up to ₹10,000',
      'Interest subsidy of 7% on timely repayment',
      'Cashback on digital transactions'
    ],
    eligibilitySummary: 'Street vendors vending in urban areas on or before March 24, 2020.',
    rules: [
      { id: 'sv-1', field: 'occupation', operator: 'eq', value: 'street-vendor', description: 'Must be a street vendor', isMandatory: true },
      { id: 'sv-2', field: 'vendingSince', operator: 'lte', value: '2020-03-24', description: 'Vending before March 24, 2020', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['Certificate of Vending', 'Aadhaar Card'],
    applicationSteps: ['Apply via portal/app', 'ULB verification', 'Loan sanction'],
    officialUrl: 'https://pmsvanidhi.mohua.gov.in/',
    pdfUrl: 'https://pmsvanidhi.mohua.gov.in/Home/DownloadPDF?filename=Scheme_Guidelines.pdf'
  },
  {
    id: 'janani-suraksha',
    name: 'Janani Suraksha Yojana',
    category: 'Health',
    description: 'Safe motherhood intervention under NHM.',
    benefits: [
      'Cash incentive for institutional delivery',
      'Free transport, drugs, and diagnostics',
      'Reduction in maternal and neonatal mortality'
    ],
    eligibilitySummary: 'Pregnant women delivering in government or accredited private health facilities.',
    rules: [
      { id: 'js-1', field: 'isPregnant', operator: 'eq', value: true, description: 'Must be pregnant', isMandatory: true },
      { id: 'js-2', field: 'deliveryLocation', operator: 'in', value: ['government-hospital', 'accredited-private'], description: 'Institutional delivery', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['MCP Card', 'Bank Account'],
    applicationSteps: ['Registration with ASHA', 'Institutional delivery', 'Cash incentive payment'],
    officialUrl: 'https://nhm.gov.in/index1.php?lang=1&level=3&sublinkid=841&lid=309',
    pdfUrl: 'https://nhm.gov.in/images/pdf/programmes/jsy/guidelines/JSY_Guidelines_2006.pdf'
  },
  {
    id: 'pm-matru-vandana',
    name: 'PM Matru Vandana Yojana',
    category: 'Health',
    description: 'Maternity benefit for first-time mothers.',
    benefits: [
      'Cash incentive of ₹5,000 in three installments',
      'Compensation for wage loss during pregnancy',
      'Encouragement for health-seeking behavior'
    ],
    eligibilitySummary: 'Pregnant and lactating mothers for the first living child of the family.',
    rules: [
      { id: 'mv-1', field: 'isPregnant', operator: 'eq', value: true, description: 'Must be pregnant/lactating', isMandatory: true },
      { id: 'mv-2', field: 'isFirstChild', operator: 'eq', value: true, description: 'For the first living child only', isMandatory: true },
      { id: 'mv-3', field: 'isGovtEmployee', operator: 'eq', value: false, description: 'Not a government employee', isMandatory: true }
    ],
    prerequisites: ['janani-suraksha'],
    documents: ['Aadhaar Card', 'MCP Card', 'Bank Passbook'],
    applicationSteps: ['Register at Anganwadi', 'Submit Form 1-A', 'Installment payments'],
    officialUrl: 'https://pmmvy.nic.in/',
    pdfUrl: 'https://pmmvy.nic.in/assets/PMMVY_Guidelines.pdf'
  },
  {
    id: 'nsap-old-age',
    name: 'NSAP - Indira Gandhi National Old Age Pension',
    category: 'Pension',
    description: 'Pension for elderly citizens from BPL households.',
    benefits: [
      'Monthly pension of ₹200 (60-79 years) and ₹500 (80+ years)',
      'Social security for the elderly',
      'Direct credit to bank accounts'
    ],
    eligibilitySummary: 'Elderly citizens aged 60+ belonging to BPL households.',
    rules: [
      { id: 'oa-1', field: 'age', operator: 'gte', value: 60, description: 'Age 60 or above', isMandatory: true },
      { id: 'oa-2', field: 'isBPL', operator: 'eq', value: true, description: 'Must be from BPL household', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['Age Proof', 'BPL Certificate', 'Aadhaar Card'],
    applicationSteps: ['Apply at Social Welfare Dept/Panchayat', 'Verification', 'Monthly pension credit'],
    officialUrl: 'https://nsap.nic.in/',
    pdfUrl: 'https://nsap.nic.in/Guidelines/nsap_guidelines.pdf'
  },
  {
    id: 'nsap-widow',
    name: 'NSAP - Indira Gandhi National Widow Pension',
    category: 'Pension',
    description: 'Pension for widows from BPL households.',
    benefits: [
      'Monthly pension of ₹300 (40-79 years) and ₹500 (80+ years)',
      'Financial support for widows',
      'Direct credit to bank accounts'
    ],
    eligibilitySummary: 'Widows aged 40+ belonging to BPL households.',
    rules: [
      { id: 'wp-1', field: 'maritalStatus', operator: 'eq', value: 'widow', description: 'Must be a widow', isMandatory: true },
      { id: 'wp-2', field: 'age', operator: 'gte', value: 40, description: 'Age between 40 and 79', isMandatory: true },
      { id: 'wp-3', field: 'isBPL', operator: 'eq', value: true, description: 'Must be from BPL household', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['Death Certificate of husband', 'BPL Certificate', 'Age Proof'],
    applicationSteps: ['Apply at Social Welfare Dept', 'Verification', 'Monthly pension credit'],
    officialUrl: 'https://nsap.nic.in/',
    pdfUrl: 'https://nsap.nic.in/Guidelines/nsap_guidelines.pdf'
  },
  {
    id: 'nsap-disability',
    name: 'NSAP - Indira Gandhi National Disability Pension',
    category: 'Pension',
    description: 'Pension for persons with severe or multiple disabilities from BPL households.',
    benefits: [
      'Monthly pension of ₹300 (18-79 years) and ₹500 (80+ years)',
      'Social security for persons with disabilities',
      'Direct credit to bank accounts'
    ],
    eligibilitySummary: 'Persons with 80% or more disability aged 18+ from BPL households.',
    rules: [
      { id: 'dp-1', field: 'disabilityPercentage', operator: 'gte', value: 80, description: '80% or more disability', isMandatory: true },
      { id: 'dp-2', field: 'age', operator: 'gte', value: 18, description: 'Age 18 or above', isMandatory: true },
      { id: 'dp-3', field: 'isBPL', operator: 'eq', value: true, description: 'Must be from BPL household', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['Disability Certificate', 'BPL Certificate', 'Aadhaar Card'],
    applicationSteps: ['Apply at Social Welfare Dept', 'Medical board verification', 'Monthly pension credit'],
    officialUrl: 'https://nsap.nic.in/',
    pdfUrl: 'https://nsap.nic.in/Guidelines/nsap_guidelines.pdf'
  },
  {
    id: 'pm-vishwakarma',
    name: 'PM Vishwakarma',
    category: 'Artisans',
    description: 'Support for traditional artisans and craftspeople.',
    benefits: [
      'Recognition through PM Vishwakarma certificate and ID card',
      'Skill upgradation and toolkit incentive of ₹15,000',
      'Collateral-free credit support up to ₹3 lakh'
    ],
    eligibilitySummary: 'Artisans and craftspeople working with hands and tools in 18 specified trades.',
    rules: [
      { id: 'vi-1', field: 'occupation', operator: 'in', value: ['carpenter', 'blacksmith', 'potter', 'sculptor', 'cobbler'], description: 'Must be a traditional artisan', isMandatory: true },
      { id: 'vi-2', field: 'age', operator: 'gte', value: 18, description: 'Minimum age 18', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['Aadhaar Card', 'Bank Passbook', 'Trade Certificate'],
    applicationSteps: ['Register on PM Vishwakarma portal', 'Verification by Gram Panchayat/ULB', 'Skill assessment and certification'],
    officialUrl: 'https://pmvishwakarma.gov.in/',
    pdfUrl: 'https://pmvishwakarma.gov.in/Guidelines/Scheme_Guidelines.pdf'
  },
  {
    id: 'pm-kusum',
    name: 'PM-KUSUM',
    category: 'Energy',
    description: 'Solar pumps and grid-connected solar power plants for farmers.',
    benefits: [
      'Subsidized solar pumps (up to 60% subsidy)',
      'Income from selling surplus power to the grid',
      'Energy security for farmers'
    ],
    eligibilitySummary: 'Individual farmers, groups of farmers, cooperatives, and panchayats.',
    rules: [
      { id: 'ku-1', field: 'occupation', operator: 'eq', value: 'farmer', description: 'Must be a farmer', isMandatory: true },
      { id: 'ku-2', field: 'landOwnership', operator: 'gt', value: 0, description: 'Must own land for installation', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['Land Records', 'Aadhaar Card', 'Bank Account'],
    applicationSteps: ['Apply via State Nodal Agency', 'Technical feasibility check', 'Installation and commissioning'],
    officialUrl: 'https://pmkusum.mnre.gov.in/',
    pdfUrl: 'https://pmkusum.mnre.gov.in/pdf/Guidelines_PM_KUSUM.pdf'
  },
  {
    id: 'pm-pranam',
    name: 'PM-PRANAM',
    category: 'Agriculture',
    description: 'Incentivizing states to promote alternative fertilizers.',
    benefits: [
      'Reduction in the use of chemical fertilizers',
      'Financial incentive to states for saving fertilizer subsidy',
      'Promotion of organic and bio-fertilizers'
    ],
    eligibilitySummary: 'Farmers willing to adopt alternative fertilizers and reduce chemical usage.',
    rules: [
      { id: 'pr-1', field: 'occupation', operator: 'eq', value: 'farmer', description: 'Must be a farmer', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['Aadhaar Card', 'Soil Health Card'],
    applicationSteps: ['Register with local agriculture office', 'Adopt recommended fertilizer practices'],
    officialUrl: 'https://fert.nic.in/',
    pdfUrl: 'https://fert.nic.in/sites/default/files/PM_PRANAM_Guidelines.pdf'
  },
  {
    id: 'pm-poshan',
    name: 'PM-POSHAN (Mid-Day Meal)',
    category: 'Education',
    description: 'Hot cooked meals to school children.',
    benefits: [
      'Improved nutritional status of children',
      'Encouragement for school attendance',
      'Social integration through common dining'
    ],
    eligibilitySummary: 'Children studying in classes I-VIII in government and government-aided schools.',
    rules: [
      { id: 'po-1', field: 'isStudent', operator: 'eq', value: true, description: 'Must be a student', isMandatory: true },
      { id: 'po-2', field: 'schoolType', operator: 'in', value: ['govt', 'govt-aided'], description: 'Must be in govt/aided school', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['School ID Card'],
    applicationSteps: ['Automatic enrollment in eligible schools'],
    officialUrl: 'https://pmposhan.education.gov.in/',
    pdfUrl: 'https://pmposhan.education.gov.in/pdf/Guidelines_PM_POSHAN.pdf'
  },
  {
    id: 'pm-vani',
    name: 'PM-VANI',
    category: 'Digital',
    description: 'Public Wi-Fi networks through Public Data Offices (PDOs).',
    benefits: [
      'Affordable high-speed internet access',
      'Entrepreneurship opportunities for small shopkeepers',
      'Ease of doing business'
    ],
    eligibilitySummary: 'Any individual or entity willing to set up a Public Data Office.',
    rules: [
      { id: 'va-1', field: 'isBusinessOwner', operator: 'eq', value: true, description: 'Must be a business owner/entity', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['Identity Proof', 'Address Proof', 'Internet Connection'],
    applicationSteps: ['Register as PDO on Saral Sanchar portal', 'Set up Wi-Fi hotspot'],
    officialUrl: 'https://pmvani.dot.gov.in/',
    pdfUrl: 'https://pmvani.dot.gov.in/assets/PM_VANI_Framework.pdf'
  },
  {
    id: 'pm-asha',
    name: 'PM-ASHA',
    category: 'Agriculture',
    description: 'Ensuring remunerative prices to farmers for their produce.',
    benefits: [
      'Price support for pulses, oilseeds, and copra',
      'Protection against market price fluctuations',
      'Direct payment of price difference'
    ],
    eligibilitySummary: 'Farmers growing pulses, oilseeds, and copra.',
    rules: [
      { id: 'as-1', field: 'occupation', operator: 'eq', value: 'farmer', description: 'Must be a farmer', isMandatory: true },
      { id: 'as-2', field: 'cropType', operator: 'in', value: ['pulses', 'oilseeds', 'copra'], description: 'Must grow specified crops', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['Land Records', 'Crop Sowing Certificate', 'Bank Account'],
    applicationSteps: ['Register on procurement portal', 'Sell produce at designated centers'],
    officialUrl: 'https://pashan.dac.gov.in/',
    pdfUrl: 'https://pashan.dac.gov.in/pdf/PM_ASHA_Guidelines.pdf'
  },
  {
    id: 'pm-fme',
    name: 'PM-FME',
    category: 'Food Processing',
    description: 'Formalization of Micro Food Processing Enterprises.',
    benefits: [
      'Credit-linked capital subsidy of 35%',
      'Support for branding and marketing',
      'Training and technical knowledge'
    ],
    eligibilitySummary: 'Individual micro-enterprises, SHGs, FPOs, and cooperatives.',
    rules: [
      { id: 'fm-1', field: 'isBusinessOwner', operator: 'eq', value: true, description: 'Must be a food processing enterprise', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['Business Registration', 'Aadhaar Card', 'Bank Statement'],
    applicationSteps: ['Apply on PM-FME portal', 'DPR preparation', 'Bank loan sanction'],
    officialUrl: 'https://pmfme.mofpi.gov.in/',
    pdfUrl: 'https://pmfme.mofpi.gov.in/assets/PMFME_Guidelines.pdf'
  },
  {
    id: 'pm-devine',
    name: 'PM-DevINE',
    category: 'Infrastructure',
    description: 'Development Initiative for North Eastern Region.',
    benefits: [
      'Funding for infrastructure and social development projects',
      'Livelihood activities for youth and women',
      'Filling gaps in various sectors'
    ],
    eligibilitySummary: 'Residents and entities in the North Eastern states of India.',
    rules: [
      { id: 'de-1', field: 'state', operator: 'in', value: ['Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim', 'Tripura'], description: 'Must be a resident of NE states', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['Domicile Certificate', 'Project Proposal'],
    applicationSteps: ['Project submission via state nodal agency', 'Approval by MDoNER'],
    officialUrl: 'https://mdoner.gov.in/',
    pdfUrl: 'https://mdoner.gov.in/sites/default/files/PM_DevINE_Guidelines.pdf'
  },
  {
    id: 'pm-mitra',
    name: 'PM-MITRA',
    category: 'Textiles',
    description: 'Mega Integrated Textile Region and Apparel parks.',
    benefits: [
      'World-class industrial infrastructure',
      'Employment generation in the textile sector',
      'Reduced logistics costs'
    ],
    eligibilitySummary: 'Textile manufacturers and entrepreneurs.',
    rules: [
      { id: 'mi-1', field: 'occupation', operator: 'eq', value: 'textile-manufacturer', description: 'Must be in textile sector', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['Business License', 'Investment Plan'],
    applicationSteps: ['Apply for unit setup in MITRA park', 'Compliance with park norms'],
    officialUrl: 'https://texmin.nic.in/',
    pdfUrl: 'https://texmin.nic.in/sites/default/files/PM_MITRA_Guidelines.pdf'
  },
  {
    id: 'pm-shri',
    name: 'PM-SHRI Schools',
    category: 'Education',
    description: 'Schools for Rising India - upgrading existing schools.',
    benefits: [
      'Modern infrastructure and technology-driven learning',
      'Focus on NEP 2020 implementation',
      'Green school initiatives'
    ],
    eligibilitySummary: 'Students enrolled in selected PM-SHRI schools.',
    rules: [
      { id: 'sh-1', field: 'isStudent', operator: 'eq', value: true, description: 'Must be a student', isMandatory: true }
    ],
    prerequisites: [],
    documents: ['School Enrollment Proof'],
    applicationSteps: ['Automatic benefit for students in selected schools'],
    officialUrl: 'https://pmshrischools.education.gov.in/',
    pdfUrl: 'https://pmshrischools.education.gov.in/pdf/PM_SHRI_Guidelines.pdf'
  }
];

export const AMBIGUITY_MAP = [
  {
    title: "The 'Income' Definition Paradox",
    schemes: ['PMAY-U', 'PM-Kisan', 'NSAP'],
    description: "PMAY-U uses 'Household Income', PM-Kisan uses 'Exclusion Criteria' (taxpayer status), and NSAP uses 'BPL Status'. A family could be 'BPL' in one state but a 'Taxpayer' in another due to agricultural income exemptions, leading to conflicting eligibility signals.",
    type: "Contradiction"
  },
  {
    title: "Rural vs Urban Boundary Ambiguity",
    schemes: ['PMAY-U', 'MGNREGA'],
    description: "Peri-urban areas (census towns) often qualify for urban housing schemes, but administrative systems usually have complex boundary definitions. However, MGNREGA is strictly rural, yet census towns often have MGNREGA job cards active.",
    type: "Overlap"
  },
  {
    title: "Land Ownership Vagueness",
    schemes: ['PM-Kisan', 'PMAY-G'],
    description: "PM-Kisan requires 'cultivable land'. PMAY-G requires being 'homeless' or having a 'kutcha house'. A farmer might own 0.1 acre of cultivable land (qualifying for PM-Kisan) but have no site for a house, yet PMAY-G priority lists often exclude those with any land ownership recorded.",
    type: "Ambiguity"
  },
  {
    title: "NSAP Widow Pension vs Remarriage",
    schemes: ['nsap-widow'],
    description: "Eligibility ceases immediately upon remarriage. However, verification cycles are annual, creating a state where a user is legally ineligible but system-eligible, leading to potential recovery proceedings later.",
    type: "Contradiction"
  },
  {
    title: "PM Mudra vs PM SVANidhi Overlap",
    schemes: ['pm-mudra', 'pm-svanidhi'],
    description: "Street vendors are technically micro-entrepreneurs. While SVANidhi is a fast-track ₹10k loan, Mudra Shishu offers up to ₹50k. Users often struggle to decide which to pick, as SVANidhi interest subsidies are better, but Mudra capital is higher.",
    type: "Overlap"
  },
  {
    title: "Vishwakarma vs Mudra Income Caps",
    schemes: ['pm-vishwakarma', 'pm-mudra'],
    description: "PM Vishwakarma provides specialized toolkit incentives for specific trades. However, many of these trades also qualify for Mudra. Vishwakarma has stricter exclusion criteria for family members already receiving loans, creating a 'one-loan-per-family' trap.",
    type: "Contradiction"
  },
  {
    title: "Ayushman Bharat SECC vs State Top-ups",
    schemes: ['ayushman-bharat'],
    description: "Many states have their own health schemes (like Karunya in Kerala or Aarogyasri in Telangana). The SECC 2011 list used by PM-JAY is often outdated, while state lists are newer. A user might be 'Ineligible' in the central portal but 'Eligible' in the same portalled state-link.",
    type: "Ambiguity"
  },
  {
    title: "Sukanya Samriddhi Birth Registration Delays",
    schemes: ['sukanya-samriddhi'],
    description: "The 10-year age limit is strictly enforced. In rural areas with delayed birth registrations, a child might be 'eligible' by physical age but 'ineligible' by the only document the bank will accept (the delayed birth certificate).",
    type: "Ambiguity"
  },
  {
    title: "MGNREGA vs Census Town Boundaries",
    schemes: ['mgnrega'],
    description: "Workers in 'Census Towns'—localities that are statistically urban but administratively rural—face 'Silent Rejections'. The portal may accept the registration, but funds are often frozen because the geo-tagging doesn't match the RD Ministry's master rural list.",
    type: "Ambiguity"
  },
  {
    title: "JSY vs PMMVY First Child Overlap",
    schemes: ['janani-suraksha', 'pm-matru-vandana'],
    description: "A first-time mother is eligible for both. However, because JSY is for 'Institutional Delivery' and PMMVY is for 'Pregnancy Benefits', users often assume it's an 'either-or' situation and fail to claim the JSY cash incentive after claiming PMMVY.",
    type: "Overlap"
  }
];
