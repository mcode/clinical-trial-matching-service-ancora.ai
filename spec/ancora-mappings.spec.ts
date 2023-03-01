import { Observation } from 'fhir/r4';
import { CANCERSTAGING_SYSTEM, LOINC_SYSTEM, SNOMED_CT_SYSTEM } from '../src/ancora-mapping-data';
import { findQueryFlagsForCode, tumorStageForCode, findTumorStage } from '../src/ancora-mappings';

describe('findQueryFlagsForCode', () => {
  it('handles a valid mapping', () => {
    expect(findQueryFlagsForCode(LOINC_SYSTEM, '85337-4')).toEqual(['er']);
  });
  it('returns null on an unknown mapping', () => {
    expect(findQueryFlagsForCode(LOINC_SYSTEM, 'unknown')).toBeNull();
    expect(findQueryFlagsForCode('http://www.example.com/invalid', 'unknown')).toBeNull();
  });
});

describe('tumorStageForCode()', () => {
  it('handles upper and lower case codes for cancerstaging.org codes', () => {
    expect(tumorStageForCode(CANCERSTAGING_SYSTEM, '3A')).toBe(3);
    expect(tumorStageForCode(CANCERSTAGING_SYSTEM, '3a')).toBe(3);
  });

  it('accepted undefined', () => {
    expect(tumorStageForCode(undefined, undefined)).toBeUndefined();
    expect(tumorStageForCode(CANCERSTAGING_SYSTEM, undefined)).toBeUndefined();
  });

  it('handles an unknown system', () => {
    expect(tumorStageForCode('http://www.example.com/system/that/is/fake', 'fakecode')).toBeUndefined();
  });

  it('handles an unknown code', () => {
    expect(tumorStageForCode(SNOMED_CT_SYSTEM, 'fakecode')).toBeUndefined();
  });
});

describe('findTumorStage', () => {
  it('finds a known tumor stage', () => {
    expect(findTumorStage({
      resourceType: "Observation",
      status: "final",
      code: { coding: [ { system: "http://loinc.org", code: "21908-9" } ] },
      subject: {
        reference: "urn:uuid:patient",
        type: "Patient"
      },
      valueCodeableConcept: { coding: [ { system: "http://cancerstaging.org", code: "4" } ] }
    })).toEqual(4);
  });
  it('returns 0 for stage 0', () => {
    expect(findTumorStage({
      resourceType: "Observation",
      status: "final",
      code: { coding: [ { system: "http://loinc.org", code: "21908-9" } ] },
      subject: {
        reference: "urn:uuid:patient",
        type: "Patient"
      },
      valueCodeableConcept: { coding: [ { system: SNOMED_CT_SYSTEM, code: '261613009' } ] }
    })).toEqual(0);
  });
  it('returns null for observations with no value', () => {
    expect(findTumorStage({
      resourceType: "Observation",
      status: "final",
      code: { coding: [ { system: "http://loinc.org", code: "21908-9" } ] },
      subject: {
        reference: "urn:uuid:patient",
        type: "Patient"
      }
    })).toBeNull();
  });
  it('returns null for observations with an invalid value', () => {
    expect(findTumorStage({
      resourceType: "Observation",
      status: "final",
      code: { coding: [ { system: "http://loinc.org", code: "21908-9" } ] },
      subject: {
        reference: "urn:uuid:patient",
        type: "Patient"
      },
      valueCodeableConcept: { coding: [ { } ] }
    })).toBeNull();
    expect(findTumorStage({
      resourceType: "Observation",
      status: "final",
      code: { coding: [ { system: "http://loinc.org", code: "21908-9" } ] },
      subject: {
        reference: "urn:uuid:patient",
        type: "Patient"
      },
      valueCodeableConcept: { coding: true }
    } as unknown as Observation)).toBeNull();
    expect(findTumorStage({
      resourceType: "Observation",
      status: "final",
      code: { coding: [ { system: "http://loinc.org", code: "21908-9" } ] },
      subject: {
        reference: "urn:uuid:patient",
        type: "Patient"
      },
      valueCodeableConcept: true
    } as unknown as Observation)).toBeNull();
  });
});
