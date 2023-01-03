/**
 * Contains mappings between various known codes and their Ancora query
 * boolean fields.
 */

import { Observation } from 'fhir/r4';
import { AncoraCriterionFlag } from './ancora-query';
import {
  ancoraCriterionCodes,
  ancoraDiseaseCodes,
  AncoraQueryDisease,
  FhirSystem
} from './ancora-mapping-data';

// TODO: Don't know how to code the following:
// CancerGeneticVariant component:GeneStudied valueCodeableConcept = HGNC
// HGNC:427	ALK
// CancerGeneticVariant component:GeneStudied valueCodeableConcept = HGNC
// HGNC:10261	ROS1
// etc.

// With the existing mappings, the most common lookup is actually [system, code]
// to an Ancora flag, so build that mapping

const codesToAncora = new Map<string, Map<string, Set<AncoraCriterionFlag>>>();

function codeMappingFor(system: FhirSystem): Map<string, Set<AncoraCriterionFlag>> {
  let mapping = codesToAncora.get(system);
  if (!mapping) {
    mapping = new Map<string, Set<AncoraCriterionFlag>>();
    codesToAncora.set(system, mapping);
  }
  return mapping;
}

for (const [flag, mappings] of ancoraCriterionCodes.entries()) {
  for (const [system, codes] of mappings.entries()) {
    const systemMappings = codeMappingFor(system);
    for (const code of codes) {
      const existing = systemMappings.get(code);
      if (existing) {
        existing.add(flag);
      } else {
        systemMappings.set(code, new Set<AncoraCriterionFlag>([flag]))
      }
    }
  }
}

/**
 * Looks up all flags for a given code.
 * @param system the FHIR sysetm URI
 * @param code the code to look up
 * @returns null if the code is unknown, otherwise an array of all matching
 * flags
 */
export function findQueryFlagsForCode(system: string, code: string): AncoraCriterionFlag[] | null {
  // See if something exists
  const mapping = codesToAncora.get(system);
  if (mapping) {
    const flag = mapping.get(code);
    return Array.from(flag) ?? null;
  } else {
    return null;
  }
}

// Ancora disease codes also need to be flipped around for use
const codesToDiseaseType = new Map<string, Map<string, AncoraQueryDisease>>();

function diseaseMappingFor(system: string): Map<string, AncoraQueryDisease> {
  let mapping = codesToDiseaseType.get(system);
  if (!mapping) {
    mapping = new Map<string, AncoraQueryDisease>();
    codesToDiseaseType.set(system, mapping);
  }
  return mapping;
}

for (const [disease, mappings] of ancoraDiseaseCodes) {
  for (const [system, codes] of mappings) {
    const diseaseMappings = diseaseMappingFor(system);
    for (const code of codes) {
      // Check for accidental duplicates
      const existing = findDiseaseTypeForCode(system, code);
      if (existing) {
        console.error(`Warning: trying to map ${code} to ${disease} when it is already mapped to ${existing}, keeping original mapping to ${existing}!`);
      } else {
        diseaseMappings.set(code, disease);
      }
    }
  }
}

export function findDiseaseTypeForCode(system: string, code: string): AncoraQueryDisease | null {
  // Look up the system, then, if it exists, the code - otherwise, resolve to null
  return codesToDiseaseType.get(system)?.get(code) ?? null;
}

// Tumor Stage mappings

const STAGE_LOINC_CODES = new Set<string>(['21908-9', '21902-2', '21914-7']);
// FIXME: This is wrong but is the way the front end generates the stages so ??
const STAGE_CODES = new Map<string, number>([
  ['I', 1],
  ['II', 2],
  ['IIA', 2],
  ['III', 3],
  ['IV', 4]
]);

/**
 * If a tumor stage number can be determined from the given Observation, return
 * that, otherwise, return null.
 * @param observation the observation to inspect
 */
export function findTumorStage(observation: Observation): number | null {
  // First check: MCode limits the tumor stages to the LOINC codes
  // 21908-9, 21902-2, or 21914-7.
  const coding = observation.code?.coding;
  if (!coding) {
    return null;
  }
  if (coding.findIndex((value) => { return STAGE_LOINC_CODES.has(value.code); }) < 0) {
    // Didn't find one of the associated codes
    return null;
  }
  // FIXME: Pretty sure this is actually wrong, but it's the way the front end generates patient data, so for now
  return STAGE_CODES.get(observation.valueString) ?? null;
}
