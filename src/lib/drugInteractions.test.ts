import { describe, it, expect } from 'vitest';
import { checkDrugInteractions, checkAllInteractions } from './drugInteractions';

describe('checkDrugInteractions', () => {
  it('flags warfarin + aspirin as a critical interaction', () => {
    const result = checkDrugInteractions(['warfarin'], 'aspirin');

    expect(result.hasCriticalInteractions).toBe(true);
    expect(result.overallRisk).toBe('critical');
    expect(result.interactions).toHaveLength(1);
    expect(result.interactions[0].severity).toBe('critical');
  });

  it('resolves brand names through drug aliases', () => {
    // Coumadin = warfarin, Disprin = aspirin
    const result = checkDrugInteractions(['Coumadin'], 'Disprin');

    expect(result.hasCriticalInteractions).toBe(true);
  });

  it('matches drug-category interactions (NSAIDs)', () => {
    const result = checkDrugInteractions(['methotrexate'], 'ibuprofen');

    expect(result.interactions.some((i) => i.severity === 'critical')).toBe(true);
  });

  it('reports safe for non-interacting drugs', () => {
    const result = checkDrugInteractions(['paracetamol'], 'omeprazole');

    expect(result.hasAnyInteractions).toBe(false);
    expect(result.overallRisk).toBe('safe');
  });

  it('flags a direct allergy match as critical', () => {
    const result = checkDrugInteractions([], 'amoxicillin', ['amoxicillin']);

    expect(result.allergyConflicts).toHaveLength(1);
    expect(result.allergyConflicts[0].severity).toBe('critical');
    expect(result.overallRisk).toBe('critical');
  });

  it('detects allergy cross-reactivity (penicillin → amoxicillin)', () => {
    const result = checkDrugInteractions([], 'amoxicillin', ['penicillin']);

    expect(result.allergyConflicts).toHaveLength(1);
    expect(result.allergyConflicts[0].crossReactivity).toBe(true);
  });

  it('flags condition contraindications (metformin in kidney disease)', () => {
    const result = checkDrugInteractions([], 'metformin', [], ['chronic kidney disease']);

    expect(result.conditionContraindications).toHaveLength(1);
    expect(result.hasAnyInteractions).toBe(true);
  });
});

describe('checkAllInteractions', () => {
  it('finds interactions across every medication pair', () => {
    const result = checkAllInteractions(['warfarin', 'paracetamol', 'aspirin']);

    expect(
      result.interactions.some(
        (i) =>
          [i.drug1.toLowerCase(), i.drug2.toLowerCase()].includes('warfarin') &&
          [i.drug1.toLowerCase(), i.drug2.toLowerCase()].includes('aspirin')
      )
    ).toBe(true);
  });

  it('aggregates allergies and conditions across the full list', () => {
    const result = checkAllInteractions(['ibuprofen'], ['aspirin'], ['peptic ulcer']);

    expect(result.allergyConflicts.length).toBeGreaterThan(0);
    expect(result.conditionContraindications.length).toBeGreaterThan(0);
  });
});
