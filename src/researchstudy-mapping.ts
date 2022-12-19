/**
 * This module exports a function for mapping a trial in the format returned by
 * the underlying service to the FHIR ResearchStudy type.
 */

import { ResearchStudy, CLINICAL_TRIAL_IDENTIFIER_CODING_SYSTEM_URL } from 'clinical-trial-matching-service';
import { CodeableConcept, ResearchStudyArm, ResearchStudy as FhirResearchStudy } from 'fhir/r4';
import { AncoraTrial } from './query';

function convertToFhirConstant(displayString: string) {
  return displayString.toLowerCase().replace(/[ /]/g, '-');
}

const primaryPurposes = new Set<string>([
  'treatment', 'prevention', 'diagnostic', 'supportive-care', 'screening',
  'health-services-research', 'basic-science', 'device-feasibility'
]);

function parsePrimaryPurpose(display: string): CodeableConcept | undefined {
  const fhirValue = convertToFhirConstant(display);
  return primaryPurposes.has(fhirValue) ? {
    coding: [
      {
        code: fhirValue
      }
    ],
    text: fhirValue
  } : undefined;
}

// Mapping between recruiting_status and the status in FHIR
const recruitingStatusMapping = new Map<string, FhirResearchStudy["status"]>([
  // FIXME: What is the difference between Available and Recruiting? Does it matter?
  ['Available', 'active'],
  ['Recruiting', 'active'],
  // FIXME: Is 'approved' correct for this state?
  ['Not yet recruiting', 'approved'],
  // FIXME: Is 'temporarily-closed-to-accrual' correct for this?
  ['Enrolling by invitation', 'temporarily-closed-to-accrual']
]);

const phaseMapping = new Map<string, string>([
  // Both N/A and Not Applicable show up
  ['N/A', 'n-a'],
  ['Not Applicable', 'n-a'],
  ['Early Phase 1', 'early-phase-1'],
  ['Phase 1', 'phase-1'],
  ['Phase 1/Phase 2', 'phase-1-phase-2'],
  ['Phase 2', 'phase-2'],
  ['Phase 2/Phase 3', 'phase-2-phase-3'],
  ['Phase 3', 'phase-3'],
  ['Phase 4', 'phase-4']
]);

export function convertToResearchStudy(trial: AncoraTrial, id: number): ResearchStudy {
  /*
   * Mapping TODO:
   * acronym: string; - don't have a good place to map this
   * date_posted: DateTimeString; - don't have a good place to map this
   * date_updated: DateTimeString; - don't have a good place to map this
   * enrollment: number; - don't think this has a mapping
   * start_date: DateTimeString; - the ResearchStudy type is currently missing period
   * study_type: string; - don't have a good place to map this
   * treatments: AncoraTrialTreatment[]; - don't have a good place to map this
   */
  const result = new ResearchStudy(id);
  result.identifier = [
    {
      system: CLINICAL_TRIAL_IDENTIFIER_CODING_SYSTEM_URL,
      use: 'official',
      value: trial.trial_id
    }
  ];
  result.title = trial.brief_title;
  // TODO: Technically description is Markdown.
  // Do things need to be escaped?
  result.description = trial.trial_summary;
  const status = recruitingStatusMapping.get(trial.recruiting_status);
  if (status !== null) {
    result.status = status;
  }
  // Phase is optional, only add it if recognized
  const phase = phaseMapping.get(trial.trial_phase);
  if (phase !== null) {
    result.phase = {
      coding: [
        {
          system: 'http://hl7.org/fhir/ValueSet/research-study-phase',
          code: phase,
          display: trial.trial_phase
        }
      ],
      text: trial.trial_phase
    }
  }
  // The ResearchStudy type is currently missing primary purpose
  (result as FhirResearchStudy).primaryPurposeType = parsePrimaryPurpose(trial.primary_purpose);
  const eligibilityGroup = result.addContainedResource({
    resourceType: 'Group',
    type: 'person',
    actual: false
  });
  eligibilityGroup.display = trial.eligibility_criteria;
  result.enrollment = [ eligibilityGroup ];
  result.principalInvestigator = result.addContainedResource({
    resourceType: 'Practitioner',
    name: [
      {
        use: 'usual',
        // The actual prinicpal_investigator value is just plain text, it might
        // be possible to parse out specific parts
        text: trial.principal_investigator
      }
    ]
  });
  result.sponsor = result.addContainedResource({
    resourceType: 'Organization',
    name: trial.sponsor
  });
  result.arm = trial.arms.map<ResearchStudyArm>(arm => {
    return {
      name: arm["arm name"],
      description: arm["arm name"],
      type: {
        // TODO: Can this be mapped to a proper code?
        text: arm["arm type"]
      }
    };
  });
  // Add locations
  for (const country in trial.locations) {
    for (const location of trial.locations[country]) {
      const fhirLocation = result.addSite(location.facility);
      // TODO: Will there ever be instances without ZIPs or states?
      fhirLocation.address = {
        city: location.city,
        state: location.state,
        postalCode: location.zip
      };
    }
  }
  return result;
}

export default convertToResearchStudy;
