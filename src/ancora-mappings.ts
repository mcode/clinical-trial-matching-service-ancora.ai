/**
 * Contains mappings between various known codes and their Ancora query
 * boolean fields.
 */

import { Observation } from 'fhir/r4';
import { AncoraCriterionFlag } from './ancora-query';
import {
  ancoraCriterionCodes,
  ancoraDiseaseCodes,
  ancoraStageMappings,
  AncoraQueryDisease,
  FhirSystem,
  CANCERSTAGING_SYSTEM
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
    return flag ? Array.from(flag) : null;
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
      // This is a sanity check and the if never happening is expected
      /* istanbul ignore if */
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

// Again, need to flip them around
const codesToTumorStages = new Map<string, Map<string, number>>();
function tumorStageMappingsFor(system: string): Map<string, number> {
  let mappings = codesToTumorStages.get(system);
  if (!mappings) {
    mappings = new Map<string, number>();
    codesToTumorStages.set(system, mappings);
  }
  return mappings;
}

/**
 * Normalize the code for matching
 * @param code the code to normalize
 * @returns the lower-cased code
 */
function normalizeCode(system: string, code: string): string {
  // For now, this assumes cancer staging codes should be normalized to
  // lower case. FIXME: Is this in fact correct?
  if (system === CANCERSTAGING_SYSTEM)
    return code.toLowerCase();
  else
    return code;
}

for (const [tumorStage, mappings] of ancoraStageMappings) {
  for (const [system, codes] of mappings) {
    // First, grab the stage mappings
    const stageMappings = tumorStageMappingsFor(system);
    for (let code of codes) {
      code = normalizeCode(system, code);
      const existing = tumorStageForCode(system, code);
      // This is a sanity check and the if never happening is expected
      /* istanbul ignore if */
      if (existing) {
        console.error(`Warning: trying to map ${code} to stage ${tumorStage} when it is already mapped to ${existing}, keeping original mapping to ${existing}!`);
      } else {
        stageMappings.set(code, tumorStage);
      }
    }
  }
}

export function tumorStageForCode(system: string | undefined, code: string | undefined): number | undefined {
  // Reject undefined values immediately
  if (typeof system === 'undefined' || typeof code === 'undefined') {
    return undefined;
  }
  return codesToTumorStages.get(system)?.get(normalizeCode(system, code));
}

const STAGE_LOINC_CODES = new Set<string>(['21908-9', '21902-2', '21914-7']);

/**
 * If a tumor stage number can be determined from the given Observation, return
 * that, otherwise, return null.
 * @param observation the observation to inspect
 * @return the tumor stage, from 0-4. Note that 0 is falsey, so check "!== null"
 *   to determine if a value was returned.
 */
export function findTumorStage(observation: Observation): number | null {
  // First check: MCode limits the tumor stages to the LOINC codes
  // 21908-9, 21902-2, or 21914-7.
  const coding = observation.code?.coding;
  if (!Array.isArray(coding)) {
    return null;
  }
  if (coding.findIndex((value) => { return STAGE_LOINC_CODES.has(value.code); }) < 0) {
    // Didn't find one of the associated codes
    return null;
  }
  const stagingCodes = observation.valueCodeableConcept?.coding;
  if (Array.isArray(stagingCodes)) {
    // See if we recognize any of the codes
    for (const code of stagingCodes) {
      const tumorStage = tumorStageForCode(code.system, code.code);
      // 0 is a valid stage and if(0) is false
      if (typeof tumorStage === 'number') {
        return tumorStage;
      }
    }
  }
  return null;
}
