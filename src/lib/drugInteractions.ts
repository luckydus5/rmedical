// ================================
// Sanovia AI Drug Interaction Engine
// This is the core AI that saves lives by preventing dangerous drug combinations
// ================================

export interface Drug {
  id: string;
  name: string;
  genericName: string;
  category: DrugCategory;
  contraindications: string[];
}

export type DrugCategory = 
  | 'antibiotic'
  | 'antiviral'
  | 'antimalarial'
  | 'painkiller'
  | 'antihistamine'
  | 'antihypertensive'
  | 'antidiabetic'
  | 'anticoagulant'
  | 'antidepressant'
  | 'antipsychotic'
  | 'steroid'
  | 'nsaid'
  | 'opioid'
  | 'cardiovascular'
  | 'respiratory'
  | 'gastrointestinal'
  | 'supplement'
  | 'other';

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  effect: string;
  mechanism: string;
  recommendation: string;
  source: string;
}

export interface InteractionCheckResult {
  hasCriticalInteractions: boolean;
  hasAnyInteractions: boolean;
  interactions: DrugInteraction[];
  allergyConflicts: AllergyConflict[];
  conditionContraindications: ConditionContraindication[];
  overallRisk: 'safe' | 'low' | 'moderate' | 'high' | 'critical';
  summary: string;
}

export interface AllergyConflict {
  drug: string;
  allergen: string;
  severity: string;
  crossReactivity: boolean;
  message: string;
}

export interface ConditionContraindication {
  drug: string;
  condition: string;
  severity: string;
  message: string;
}

// ================================
// Drug Interaction Database
// This database contains common drug interactions found in African healthcare
// Focused on WHO Essential Medicines and commonly used drugs in East Africa
// ================================

export const DRUG_INTERACTIONS: DrugInteraction[] = [
  // Critical Interactions (Life-threatening)
  {
    drug1: 'warfarin',
    drug2: 'aspirin',
    severity: 'critical',
    effect: 'Severe bleeding risk',
    mechanism: 'Both drugs affect blood clotting through different mechanisms',
    recommendation: 'Avoid combination. Use alternative pain relief. Monitor INR closely if unavoidable.',
    source: 'WHO Essential Medicines Guidelines'
  },
  {
    drug1: 'methotrexate',
    drug2: 'nsaids',
    severity: 'critical',
    effect: 'Methotrexate toxicity',
    mechanism: 'NSAIDs reduce methotrexate excretion',
    recommendation: 'Avoid NSAIDs. Use paracetamol for pain.',
    source: 'WHO Essential Medicines Guidelines'
  },
  {
    drug1: 'metformin',
    drug2: 'alcohol',
    severity: 'critical',
    effect: 'Lactic acidosis risk',
    mechanism: 'Both increase lactate production',
    recommendation: 'Avoid alcohol. Educate patient on risks.',
    source: 'Diabetes Management Guidelines'
  },
  {
    drug1: 'fluconazole',
    drug2: 'erythromycin',
    severity: 'critical',
    effect: 'QT prolongation - risk of fatal arrhythmia',
    mechanism: 'Both drugs prolong QT interval',
    recommendation: 'Use alternative antifungal or antibiotic.',
    source: 'Cardiac Safety Guidelines'
  },
  {
    drug1: 'ciprofloxacin',
    drug2: 'theophylline',
    severity: 'critical',
    effect: 'Theophylline toxicity - seizures possible',
    mechanism: 'Ciprofloxacin inhibits theophylline metabolism',
    recommendation: 'Reduce theophylline dose by 50% or use alternative antibiotic.',
    source: 'WHO Essential Medicines Guidelines'
  },
  
  // Serious Interactions
  {
    drug1: 'artemether',
    drug2: 'halofantrine',
    severity: 'serious',
    effect: 'QT prolongation',
    mechanism: 'Both antimalarials affect cardiac rhythm',
    recommendation: 'Do not use together. Wait 1 month between treatments.',
    source: 'WHO Malaria Treatment Guidelines'
  },
  {
    drug1: 'efavirenz',
    drug2: 'rifampicin',
    severity: 'serious',
    effect: 'Reduced HIV drug effectiveness',
    mechanism: 'Rifampicin induces metabolism of efavirenz',
    recommendation: 'Increase efavirenz dose to 800mg or use alternative ARV.',
    source: 'WHO HIV Treatment Guidelines'
  },
  {
    drug1: 'amlodipine',
    drug2: 'simvastatin',
    severity: 'serious',
    effect: 'Increased risk of muscle damage (rhabdomyolysis)',
    mechanism: 'Amlodipine increases simvastatin levels',
    recommendation: 'Limit simvastatin to 20mg daily.',
    source: 'Cardiovascular Guidelines'
  },
  {
    drug1: 'ibuprofen',
    drug2: 'lisinopril',
    severity: 'serious',
    effect: 'Reduced blood pressure control, kidney damage risk',
    mechanism: 'NSAIDs counteract ACE inhibitor effects',
    recommendation: 'Use paracetamol instead. Monitor blood pressure and kidney function.',
    source: 'Hypertension Guidelines'
  },
  {
    drug1: 'metronidazole',
    drug2: 'alcohol',
    severity: 'serious',
    effect: 'Severe nausea, vomiting, flushing, rapid heartbeat',
    mechanism: 'Disulfiram-like reaction',
    recommendation: 'No alcohol during treatment and 48 hours after.',
    source: 'Antibiotic Prescribing Guidelines'
  },
  
  // Moderate Interactions
  {
    drug1: 'amoxicillin',
    drug2: 'methotrexate',
    severity: 'moderate',
    effect: 'Increased methotrexate toxicity',
    mechanism: 'Reduced renal excretion of methotrexate',
    recommendation: 'Monitor for methotrexate toxicity. Consider dose reduction.',
    source: 'Drug Interaction Database'
  },
  {
    drug1: 'omeprazole',
    drug2: 'clopidogrel',
    severity: 'moderate',
    effect: 'Reduced effectiveness of clopidogrel',
    mechanism: 'Omeprazole inhibits activation of clopidogrel',
    recommendation: 'Use pantoprazole or H2 blocker instead.',
    source: 'Cardiology Guidelines'
  },
  {
    drug1: 'ciprofloxacin',
    drug2: 'antacids',
    severity: 'moderate',
    effect: 'Reduced antibiotic absorption',
    mechanism: 'Metal ions in antacids bind to ciprofloxacin',
    recommendation: 'Take ciprofloxacin 2 hours before or 6 hours after antacids.',
    source: 'Antibiotic Guidelines'
  },
  {
    drug1: 'doxycycline',
    drug2: 'iron supplements',
    severity: 'moderate',
    effect: 'Reduced absorption of both drugs',
    mechanism: 'Iron binds to doxycycline',
    recommendation: 'Separate doses by at least 2-3 hours.',
    source: 'Drug Interaction Database'
  },
  {
    drug1: 'glibenclamide',
    drug2: 'fluconazole',
    severity: 'moderate',
    effect: 'Risk of hypoglycemia',
    mechanism: 'Fluconazole increases glibenclamide levels',
    recommendation: 'Monitor blood glucose closely. May need dose reduction.',
    source: 'Diabetes Guidelines'
  },
  
  // Minor Interactions
  {
    drug1: 'paracetamol',
    drug2: 'caffeine',
    severity: 'minor',
    effect: 'Enhanced pain relief',
    mechanism: 'Caffeine may enhance paracetamol absorption',
    recommendation: 'Generally beneficial. No action needed.',
    source: 'Pain Management Guidelines'
  },
];

// Drug aliases for matching (handles brand names and alternative spellings)
export const DRUG_ALIASES: Record<string, string[]> = {
  'paracetamol': ['acetaminophen', 'tylenol', 'panadol', 'doliprane'],
  'ibuprofen': ['brufen', 'advil', 'nurofen', 'motrin'],
  'amoxicillin': ['amoxil', 'augmentin', 'clamoxyl'],
  'metformin': ['glucophage', 'metforal', 'diabex'],
  'amlodipine': ['norvasc', 'istin', 'amlor'],
  'omeprazole': ['prilosec', 'losec', 'omez'],
  'ciprofloxacin': ['cipro', 'ciproxin', 'ciprobay'],
  'artemether': ['coartem', 'riamet'],
  'warfarin': ['coumadin', 'marevan'],
  'aspirin': ['disprin', 'ecotrin', 'bayer'],
  'lisinopril': ['zestril', 'prinivil'],
  'simvastatin': ['zocor', 'simvacor'],
  'metronidazole': ['flagyl', 'metrogyl'],
  'fluconazole': ['diflucan', 'flucoral'],
  'doxycycline': ['vibramycin', 'doryx'],
  'efavirenz': ['sustiva', 'stocrin'],
  'rifampicin': ['rifadin', 'rimactane', 'rifampin'],
  'glibenclamide': ['daonil', 'glyburide', 'diabeta'],
};

// Allergy cross-reactivity database
export const ALLERGY_CROSS_REACTIVITY: Record<string, string[]> = {
  'penicillin': ['amoxicillin', 'ampicillin', 'piperacillin', 'cephalosporins'],
  'sulfa': ['sulfamethoxazole', 'cotrimoxazole', 'sulfasalazine'],
  'aspirin': ['ibuprofen', 'naproxen', 'diclofenac', 'nsaids'],
  'codeine': ['morphine', 'tramadol', 'oxycodone'],
  'cephalosporins': ['ceftriaxone', 'cefuroxime', 'cephalexin'],
};

// Condition contraindications
export const CONDITION_CONTRAINDICATIONS: Array<{
  drug: string;
  condition: string;
  severity: string;
  message: string;
}> = [
  {
    drug: 'ibuprofen',
    condition: 'peptic ulcer',
    severity: 'serious',
    message: 'NSAIDs can cause severe GI bleeding in patients with ulcer history'
  },
  {
    drug: 'metformin',
    condition: 'kidney disease',
    severity: 'serious',
    message: 'Metformin may cause lactic acidosis in severe kidney disease'
  },
  {
    drug: 'aspirin',
    condition: 'asthma',
    severity: 'moderate',
    message: 'Aspirin may trigger bronchospasm in some asthma patients'
  },
  {
    drug: 'beta-blockers',
    condition: 'asthma',
    severity: 'serious',
    message: 'Beta-blockers may worsen breathing in asthma patients'
  },
  {
    drug: 'metoclopramide',
    condition: 'parkinson',
    severity: 'serious',
    message: 'May worsen Parkinson symptoms'
  },
];

// ================================
// Core Interaction Checking Functions
// ================================

function normalizeDrugName(drug: string): string {
  const normalized = drug.toLowerCase().trim();
  
  // Check aliases
  for (const [canonical, aliases] of Object.entries(DRUG_ALIASES)) {
    if (aliases.includes(normalized) || canonical === normalized) {
      return canonical;
    }
  }
  
  return normalized;
}

function findInteraction(drug1: string, drug2: string): DrugInteraction | null {
  const norm1 = normalizeDrugName(drug1);
  const norm2 = normalizeDrugName(drug2);
  
  for (const interaction of DRUG_INTERACTIONS) {
    const intDrug1 = normalizeDrugName(interaction.drug1);
    const intDrug2 = normalizeDrugName(interaction.drug2);
    
    if ((intDrug1 === norm1 && intDrug2 === norm2) ||
        (intDrug1 === norm2 && intDrug2 === norm1)) {
      return interaction;
    }
    
    // Check for category matches (e.g., "nsaids" matches any NSAID)
    if (intDrug2 === 'nsaids') {
      const nsaids = ['ibuprofen', 'naproxen', 'diclofenac', 'indomethacin', 'piroxicam'];
      if (intDrug1 === norm1 && nsaids.includes(norm2)) {
        return { ...interaction, drug2: drug2 };
      }
      if (intDrug1 === norm2 && nsaids.includes(norm1)) {
        return { ...interaction, drug1: drug1, drug2: interaction.drug1 };
      }
    }
  }
  
  return null;
}

function checkAllergyConflicts(
  medications: string[],
  allergies: string[]
): AllergyConflict[] {
  const conflicts: AllergyConflict[] = [];
  
  for (const med of medications) {
    const normMed = normalizeDrugName(med);
    
    for (const allergy of allergies) {
      const normAllergy = allergy.toLowerCase().trim();
      
      // Direct match
      if (normMed === normAllergy) {
        conflicts.push({
          drug: med,
          allergen: allergy,
          severity: 'critical',
          crossReactivity: false,
          message: `CRITICAL: Patient is allergic to ${allergy}. Do not prescribe ${med}.`
        });
        continue;
      }
      
      // Cross-reactivity check
      const crossReactive = ALLERGY_CROSS_REACTIVITY[normAllergy] || [];
      if (crossReactive.includes(normMed)) {
        conflicts.push({
          drug: med,
          allergen: allergy,
          severity: 'serious',
          crossReactivity: true,
          message: `WARNING: ${med} may cause cross-reactivity in patients allergic to ${allergy}.`
        });
      }
    }
  }
  
  return conflicts;
}

function checkConditionContraindications(
  medications: string[],
  conditions: string[]
): ConditionContraindication[] {
  const contraindications: ConditionContraindication[] = [];
  
  for (const med of medications) {
    const normMed = normalizeDrugName(med);
    
    for (const condition of conditions) {
      const normCondition = condition.toLowerCase().trim();
      
      for (const contra of CONDITION_CONTRAINDICATIONS) {
        if (normalizeDrugName(contra.drug) === normMed &&
            normCondition.includes(contra.condition.toLowerCase())) {
          contraindications.push({
            drug: med,
            condition: condition,
            severity: contra.severity,
            message: contra.message
          });
        }
      }
    }
  }
  
  return contraindications;
}

function calculateOverallRisk(result: Omit<InteractionCheckResult, 'overallRisk' | 'summary'>): 'safe' | 'low' | 'moderate' | 'high' | 'critical' {
  if (result.allergyConflicts.some(c => c.severity === 'critical')) {
    return 'critical';
  }
  if (result.interactions.some(i => i.severity === 'critical')) {
    return 'critical';
  }
  if (result.allergyConflicts.some(c => c.severity === 'serious') ||
      result.interactions.some(i => i.severity === 'serious') ||
      result.conditionContraindications.some(c => c.severity === 'serious')) {
    return 'high';
  }
  if (result.interactions.some(i => i.severity === 'moderate') ||
      result.conditionContraindications.some(c => c.severity === 'moderate')) {
    return 'moderate';
  }
  if (result.hasAnyInteractions) {
    return 'low';
  }
  return 'safe';
}

function generateSummary(result: Omit<InteractionCheckResult, 'summary'>): string {
  if (result.overallRisk === 'critical') {
    return '🚨 CRITICAL: Life-threatening interaction or allergy detected. Do not proceed without physician review.';
  }
  if (result.overallRisk === 'high') {
    return '⚠️ HIGH RISK: Serious interactions detected. Consult with physician before prescribing.';
  }
  if (result.overallRisk === 'moderate') {
    return '⚡ MODERATE RISK: Some interactions found. Monitor patient closely.';
  }
  if (result.overallRisk === 'low') {
    return '📋 LOW RISK: Minor interactions detected. Proceed with awareness.';
  }
  return '✅ SAFE: No significant interactions detected.';
}

// ================================
// Main Export Function
// ================================

export function checkDrugInteractions(
  currentMedications: string[],
  newMedication: string,
  patientAllergies: string[] = [],
  patientConditions: string[] = []
): InteractionCheckResult {
  const allMedications = [...currentMedications, newMedication];
  const interactions: DrugInteraction[] = [];
  
  // Check new medication against all current medications
  for (const currentMed of currentMedications) {
    const interaction = findInteraction(newMedication, currentMed);
    if (interaction) {
      interactions.push(interaction);
    }
  }
  
  // Check allergy conflicts for new medication
  const allergyConflicts = checkAllergyConflicts([newMedication], patientAllergies);
  
  // Check condition contraindications
  const conditionContraindications = checkConditionContraindications([newMedication], patientConditions);
  
  const partialResult = {
    hasCriticalInteractions: interactions.some(i => i.severity === 'critical') || 
                              allergyConflicts.some(c => c.severity === 'critical'),
    hasAnyInteractions: interactions.length > 0 || allergyConflicts.length > 0 || conditionContraindications.length > 0,
    interactions,
    allergyConflicts,
    conditionContraindications,
  };
  
  const overallRisk = calculateOverallRisk(partialResult);
  const summary = generateSummary({ ...partialResult, overallRisk });
  
  return {
    ...partialResult,
    overallRisk,
    summary
  };
}

export function checkAllInteractions(
  medications: string[],
  patientAllergies: string[] = [],
  patientConditions: string[] = []
): InteractionCheckResult {
  const allInteractions: DrugInteraction[] = [];
  
  // Check each pair of medications
  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const interaction = findInteraction(medications[i], medications[j]);
      if (interaction) {
        allInteractions.push(interaction);
      }
    }
  }
  
  // Check allergy conflicts for all medications
  const allergyConflicts = checkAllergyConflicts(medications, patientAllergies);
  
  // Check condition contraindications for all medications
  const conditionContraindications = checkConditionContraindications(medications, patientConditions);
  
  const partialResult = {
    hasCriticalInteractions: allInteractions.some(i => i.severity === 'critical') ||
                              allergyConflicts.some(c => c.severity === 'critical'),
    hasAnyInteractions: allInteractions.length > 0 || allergyConflicts.length > 0 || conditionContraindications.length > 0,
    interactions: allInteractions,
    allergyConflicts,
    conditionContraindications,
  };
  
  const overallRisk = calculateOverallRisk(partialResult);
  const summary = generateSummary({ ...partialResult, overallRisk });
  
  return {
    ...partialResult,
    overallRisk,
    summary
  };
}
