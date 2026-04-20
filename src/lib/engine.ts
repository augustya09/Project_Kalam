
import { Scheme, SchemeRule, WELFARE_SCHEMES } from '../data/schemes';

export interface UserProfile {
  age?: number;
  state?: string;
  caste?: string;
  income?: number;
  landOwnership?: number; // in acres
  occupation?: string;
  familySize?: number;
  hasBankAccount?: boolean;
  isRural?: boolean;
  isUrban?: boolean;
  gender?: string;
  isTaxpayer?: boolean;
  isInstitutionalLandholder?: boolean;
  willingToWork?: boolean;
  seccListed?: boolean;
  ownsPuccaHouse?: boolean;
  housingStatus?: string;
  isBPL?: boolean;
  isBusinessOwner?: boolean;
  loanPurpose?: string;
  vendingSince?: string;
  isPregnant?: boolean;
  deliveryLocation?: string;
  isFirstChild?: boolean;
  isGovtEmployee?: boolean;
  maritalStatus?: string;
  disabilityPercentage?: number;
  hasTwoWheeler?: boolean;
}

export interface EvaluationResult {
  schemeId: string;
  schemeName: string;
  confidenceScore: number; // 0 to 100
  status: 'eligible' | 'almost-eligible' | 'ineligible' | 'uncertain';
  gapAnalysis: string[];
  priorityDocuments: string[];
  ruleEvaluations: {
    ruleId: string;
    description: string;
    passed: boolean | 'uncertain' | 'unresolvable';
    mandatory: boolean;
  }[];
}

export function evaluateProfile(profile: UserProfile): EvaluationResult[] {
  const initialEvaluations = WELFARE_SCHEMES.map(scheme => {
    const evaluations = scheme.rules.map(rule => {
      const passed = evaluateRule(rule, profile);
      return {
        ruleId: rule.id,
        description: rule.description,
        passed,
        mandatory: rule.isMandatory
      };
    });
    return { scheme, evaluations };
  });

  const eligibleIds = initialEvaluations
    .filter(({ evaluations }) => 
      evaluations.every(e => e.mandatory ? e.passed === true : true) &&
      evaluations.filter(e => e.mandatory).length > 0
    )
    .map(({ scheme }) => scheme.id);

  return initialEvaluations.map(({ scheme, evaluations }) => {
    const mandatoryPassed = evaluations.filter(e => e.mandatory && e.passed === true).length;
    const mandatoryTotal = evaluations.filter(e => e.mandatory).length;
    const mandatoryUnresolvable = evaluations.filter(e => e.mandatory && e.passed === 'unresolvable').length;
    const mandatoryFailed = evaluations.filter(e => e.mandatory && (e.passed === false || e.passed === 'unresolvable')).length;
    
    const optionalPassed = evaluations.filter(e => !e.mandatory && e.passed === true).length;
    const optionalTotal = evaluations.filter(e => !e.mandatory).length;
    const uncertainCount = evaluations.filter(e => e.passed === 'uncertain').length;
    
    // Prerequisite Check
    const missingPrerequisites = scheme.prerequisites.filter(preId => !eligibleIds.includes(preId));
    const hasAllPrerequisites = missingPrerequisites.length === 0;

    let status: 'eligible' | 'almost-eligible' | 'ineligible' | 'uncertain';
    let confidenceScore = 0;

    if (mandatoryFailed === 0 && uncertainCount === 0 && hasAllPrerequisites && mandatoryTotal > 0) {
      status = 'eligible';
      confidenceScore = 100;
      if (optionalTotal > 0) {
        confidenceScore = 80 + (optionalPassed / optionalTotal) * 20;
      }
    } else if (mandatoryFailed === 0 && (uncertainCount > 0 || mandatoryUnresolvable > 0) && hasAllPrerequisites) {
      status = 'uncertain';
      confidenceScore = 100;
      if (mandatoryTotal > 0) {
        confidenceScore = (mandatoryPassed / mandatoryTotal) * 100;
      }
      if (optionalTotal > 0) {
        confidenceScore = confidenceScore * 0.8 + (optionalPassed / optionalTotal) * 20;
      }
      
      // Uncertainty penalty
      const uncertaintyPenalty = (uncertainCount / evaluations.length) * 50; 
      confidenceScore = Math.max(0, confidenceScore - uncertaintyPenalty);
    } else if (mandatoryPassed >= (mandatoryTotal - mandatoryFailed) * 0.5 && hasAllPrerequisites && (mandatoryTotal - mandatoryFailed) > 0) {
      status = 'almost-eligible';
      confidenceScore = (mandatoryPassed / (mandatoryTotal || 1)) * 70;
      const uncertaintyPenalty = (uncertainCount / evaluations.length) * 30;
      confidenceScore = Math.max(0, confidenceScore - uncertaintyPenalty);
    } else {
      status = 'ineligible';
      confidenceScore = 0;
    }

    const gapAnalysis: string[] = [];
    evaluations.forEach(e => {
      if (e.passed === false) {
        gapAnalysis.push(`Failed: ${e.description}${e.mandatory ? ' (Mandatory)' : ''}`);
      } else if (e.passed === 'uncertain') {
        gapAnalysis.push(`Insufficient Data: ${e.description}`);
      } else if (e.passed === 'unresolvable') {
        gapAnalysis.push(`Manual Verification Required: ${e.description}`);
      }
    });

    missingPrerequisites.forEach(preId => {
      const preScheme = WELFARE_SCHEMES.find(s => s.id === preId);
      gapAnalysis.push(`Prerequisite Missing: Must be eligible for ${preScheme?.name || preId}`);
    });

    // Priority Documents
    const priorityDocuments = [
      'Aadhaar Card',
      ...scheme.documents.filter(d => d !== 'Aadhaar Card')
    ];

    return {
      schemeId: scheme.id,
      schemeName: scheme.name,
      confidenceScore: Math.round(confidenceScore),
      status,
      gapAnalysis,
      priorityDocuments,
      ruleEvaluations: evaluations
    };
  }).sort((a, b) => b.confidenceScore - a.confidenceScore);
}

export function getUnifiedDocumentChecklist(results: EvaluationResult[]): string[] {
  const interested = results.filter(r => r.status === 'eligible' || r.status === 'uncertain' || r.status === 'almost-eligible');
  const allDocs = interested.flatMap(r => r.priorityDocuments);
  
  const seen = new Set<string>();
  const ordered: string[] = [];
  
  const highPriority = ['Aadhaar Card', 'Bank Passbook', 'Ration Card', 'Income Certificate', 'Land Records', 'Caste Certificate'];
  highPriority.forEach(priority => {
    if (allDocs.includes(priority) && !seen.has(priority)) {
      seen.add(priority);
      ordered.push(priority);
    }
  });
  
  allDocs.forEach(doc => {
    if (!seen.has(doc)) {
      seen.add(doc);
      ordered.push(doc);
    }
  });
  
  return ordered;
}

function evaluateRule(rule: SchemeRule, profile: any): boolean | 'uncertain' | 'unresolvable' {
  const userValue = profile[rule.field];
  if (userValue === undefined || userValue === null) return 'uncertain';

  switch (rule.operator) {
    case 'eq': return userValue === rule.value;
    case 'neq': return userValue !== rule.value;
    case 'gt': return userValue > rule.value;
    case 'lt': return userValue < rule.value;
    case 'gte': return userValue >= rule.value;
    case 'lte': return userValue <= rule.value;
    case 'in': return Array.isArray(rule.value) && rule.value.includes(userValue);
    case 'nin': return Array.isArray(rule.value) && !rule.value.includes(userValue);
    case 'custom': return 'unresolvable'; // Requires manual verification
    default: return false;
  }
}

export const ADVERSARIAL_PROFILES: { name: string; profile: UserProfile; expectedIssue: string; outcome: EvaluationResult['status'] }[] = [
  {
    name: "The Remarried Widow",
    profile: { age: 45, maritalStatus: 'married', isBPL: true, gender: 'female' },
    expectedIssue: "Fails NSAP Widow Pension because marital status is now 'married', even if she was a beneficiary earlier.",
    outcome: 'ineligible'
  },
  {
    name: "The Land-Leasing Farmer",
    profile: { occupation: 'farmer', landOwnership: 0, income: 50000, isRural: true },
    expectedIssue: "Fails PM-Kisan because land records are required (ownership), despite being a full-time farmer.",
    outcome: 'ineligible'
  },
  {
    name: "The Aadhaar-only Resident",
    profile: { age: 30, hasBankAccount: false, isRural: true, willingToWork: true },
    expectedIssue: "Fails MGNREGA and Atal Pension because bank account is mandatory for DBT.",
    outcome: 'ineligible'
  },
  {
    name: "The Urban Street Vendor (New)",
    profile: { occupation: 'street-vendor', vendingSince: '2023-01-01', isUrban: true },
    expectedIssue: "Fails PM SVANidhi due to the March 2020 cutoff date.",
    outcome: 'ineligible'
  },
  {
    name: "The High-Income Rural Resident",
    profile: { isRural: true, income: 500000, ownsPuccaHouse: false, housingStatus: 'kutcha-house' },
    expectedIssue: "Might qualify for PMAY-G based on house status, but high income often triggers exclusion in local verification.",
    outcome: 'ineligible'
  },
  {
    name: "The Migrant Worker",
    profile: { isUrban: true, isRural: false, occupation: 'laborer', income: 100000 },
    expectedIssue: "Caught between PMAY-U (needs urban proof) and PMAY-G (needs rural SECC listing).",
    outcome: 'ineligible'
  },
  {
    name: "The Second-Time Mother",
    profile: { isPregnant: true, isFirstChild: false, income: 50000 },
    expectedIssue: "Fails PM Matru Vandana Yojana which is only for the first child.",
    outcome: 'ineligible'
  },
  {
    name: "The Minor Business Owner",
    profile: { age: 17, isBusinessOwner: true, loanPurpose: 'retail' },
    expectedIssue: "Fails most schemes due to age (needs to be 18+ for contracts/loans).",
    outcome: 'ineligible'
  },
  {
    name: "The Non-SECC Poor",
    profile: { income: 20000, isBPL: true, seccListed: false },
    expectedIssue: "Fails Ayushman Bharat despite being poor, because SECC 2011 is the hard-coded source of truth.",
    outcome: 'ineligible'
  },
  {
    name: "The Retired Govt Employee",
    profile: { age: 65, isBPL: true, isGovtEmployee: true },
    expectedIssue: "Fails NSAP Old Age Pension because govt pensioners are excluded from welfare pensions.",
    outcome: 'ineligible'
  }
];
