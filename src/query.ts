/**
 * Handles conversion of patient bundle data to a proper request for matching service apis.
 * Retrieves api response as promise to be used in conversion to fhir ResearchStudy
 */

import util from 'node:util';
// TypeScript doesn't support loading ESM modules (still!) so this works around that
import type { default as nodefetch, RequestInfo, RequestInit, Response } from 'node-fetch';
const fetch: (url: URL | RequestInfo, options: RequestInit) => Promise<Response> = (() => {
  let fetchmod: typeof nodefetch | undefined = undefined;
  return async (url: URL | RequestInfo, options: RequestInit) => {
    if (fetchmod === undefined) {
      fetchmod = (await (eval('import("node-fetch")') as Promise<{default: typeof nodefetch}>)).default;
    }
    return await fetchmod(url, options);
  };
})();
import {
  ClinicalTrialsGovService,
  ServiceConfiguration,
  ResearchStudy,
  SearchSet,
  SearchBundleEntry,
} from "clinical-trial-matching-service";
import { Bundle, Condition, MedicationStatement, Observation, Patient, Procedure } from 'fhir/r4';
import convertToSearchSetEntry from "./researchstudy-mapping";
import { LOINC_SYSTEM, SNOMED_CT_SYSTEM } from './ancora-mapping-data';
import { AncoraCriteria, AncoraQuery } from './ancora-query';
import { findQueryFlagsForCode, findDiseaseTypeForCode, findTumorStage } from './ancora-mappings';

export interface AncoraAiConfiguration extends ServiceConfiguration {
  endpoint?: string;
  api_key?: string;
}

// Debug log - logs lots of debug information
let debuglog: util.DebugLoggerFunction = util.debuglog('ancora', (logger) => { debuglog = logger; });
// Query logger - logs JUST the queries sent to Ancora
let querylog: util.DebugLoggerFunction = util.debuglog('ancora_query', (logger) => { querylog = logger; });

/**
 * Create a new matching function using the given configuration.
 *
 * @param configuration the configuration to use to configure the matcher
 * @param ctgService an optional ClinicalTrialGovService which can be used to
 *     update the returned trials with additional information pulled from
 *     ClinicalTrials.gov
 */
export function createAncoraAiLookup(
  configuration: AncoraAiConfiguration,
  ctgService?: ClinicalTrialsGovService
): (patientBundle: Bundle) => Promise<SearchSet> {
  // Raise errors on missing configuration
  if (typeof configuration.endpoint !== "string") {
    throw new Error("Missing endpoint in configuration");
  }
  if (typeof configuration.api_key !== "string") {
    throw new Error("Missing api_key in configuration");
  }
  const endpoint = configuration.endpoint;
  const apiKey = configuration.api_key;
  return function getMatchingClinicalTrials(
    patientBundle: Bundle
  ): Promise<SearchSet> {
    // Create the query based on the patient bundle:
    const query = new AncoraAPIQuery(patientBundle);
    // And send the query to the server
    return sendQuery(endpoint, query, apiKey, ctgService);
  };
}

export default createAncoraAiLookup;

/**
 * For documentation purposes, indicates a field is a date/time stamp in the
 * format "YYYY-MM-DD HH:mm:ss+ZZ:ZZ"
 */
type DateTimeString = string;

export interface AncoraIntervention extends Record<string, string> {
  intervention_type: string;
  intervention_name: string;
}

export interface AncoraTrialArm extends Record<string, string> {
  "arm name": string;
  "arm type": string;
  "arm description": string;
}

export interface AncoraTrialLocation extends Record<string, string> {
  city: string;
  zip: string;
  state: string;
  country: string;
  facility: string;
  status: string;
  // The following are strings that are actually numbers
  latitude: string;
  longitude: string;
}

export function isAncoraTrialLocation(o: unknown): o is AncoraTrialLocation {
  if (typeof o !== "object" || o === null) return false;
  const location  = o as AncoraTrialLocation;
  return typeof location.city === 'string' &&
    typeof location.zip === 'string' &&
    typeof location.state === 'string' &&
    typeof location.facility === 'string';
}

export interface AncoraTrialTreatment extends Record<string, string> {
  treatment_type: string;
  treatment_name: string;
}

/**
 * Ancora.ai trial
 */
export interface AncoraTrial extends Record<string, unknown> {
  trial_id: string;
  acronym: string;
  brief_title: string;
  date_posted: DateTimeString;
  date_updated: DateTimeString;
  enrollment: number;
  eligibility_criteria: string;
  primary_purpose: string;
  principal_investigator: string;
  recruiting_status: string;
  start_date: DateTimeString;
  trial_ancora_link: string;
  study_type: string;
  interventions: AncoraIntervention[];
  trial_phase: string;
  trial_summary: string;
  trial_description: string;
  arms: AncoraTrialArm[];
  locations: Record<string, AncoraTrialLocation[]>;
  sponsor: string;
  treatments: AncoraTrialTreatment[];
  ancora_match_score: number;
}

/**
 * Type guard to determine if an object is a valid QueryTrial.
 * @param o the object to determine if it is a QueryTrial
 */
export function isAncoraTrial(o: unknown): o is AncoraTrial {
  if (typeof o !== "object" || o === null) return false;
  const trial = o as AncoraTrial;
  // First, check the container types and reject if any of them aren't met
  if (!(
    Array.isArray(trial.arms) &&
    Array.isArray(trial.treatments) &&
    typeof trial.locations === 'object' && trial.locations !== null
  )) {
    return false;
  }
  // Check to make sure locations are valid
  for (const locationId in trial.locations) {
    const locations = trial.locations[locationId];
    if (!(Array.isArray(locations) && locations.every(isAncoraTrialLocation))) {
      return false;
    }
  }
  // Finally check the types of the various fields
  return typeof trial.trial_id === 'string' &&
    typeof trial.acronym === 'string' &&
    typeof trial.brief_title === 'string' &&
    typeof trial.date_posted === 'string' &&
    typeof trial.date_updated === 'string' &&
    typeof trial.enrollment === 'number' &&
    typeof trial.eligibility_criteria === 'string' &&
    typeof trial.primary_purpose === 'string' &&
    typeof trial.principal_investigator === 'string' &&
    typeof trial.recruiting_status === 'string' &&
    typeof trial.start_date === 'string' &&
    typeof trial.trial_ancora_link === 'string' &&
    typeof trial.study_type === 'string' &&
    typeof trial.trial_phase === 'string' &&
    typeof trial.trial_summary === 'string' &&
    typeof trial.trial_description === 'string' &&
    typeof trial.sponsor === 'string';
}

// Generic type for the response data being received from the server.
export type AncoraResponse = unknown[];

/**
 * Type guard to determine if an object is a valid AncoraResponse.
 * @param o the object to determine if it is a AncoraResponse
 */
export function isAncoraResponse(o: unknown): o is AncoraResponse {
  return Array.isArray(o);
}

export interface QueryErrorResponse extends Record<string, unknown> {
  error: string;
}

/**
 * Type guard to determine if an object is a QueryErrorResponse.
 * @param o the object to determine if it is a QueryErrorResponse
 */
export function isQueryErrorResponse(o: unknown): o is QueryErrorResponse {
  if (typeof o !== "object" || o === null) return false;
  return typeof (o as QueryErrorResponse).error === "string";
}

// API RESPONSE SECTION
export class APIError extends Error {
  constructor(
    message: string,
    public response: Response,
    public body: unknown
  ) {
    super(message);
  }
}

/**
 * This class represents a query, built based on values from within the patient
 * bundle.
 * TO-DO
 * Finish making an object for storing the various parameters necessary for the api query
 * based on a patient bundle.
 * Reference https://github.com/mcode/clinical-trial-matching-engine/wiki to see patientBundle Structures
 */
export class AncoraAPIQuery {
  /**
   * The various criteria for the query.
   */
  _criterions: AncoraCriteria;
  /**
   * Type of disease. Must be set when
   */
  typeOfDisease: AncoraQuery['type_of_disease'] | null = null;
  /**
   * ZIP code.
   */
  _zipCode: string | null = null;
  /**
   * Distance in miles a user has indicated they're willing to travel
   */
  _travelRadius: number | null = null;
  /**
   * A FHIR ResearchStudy phase
   */
  _phase: string | null = null;
  /**
   * A FHIR ResearchStudy status
   */
  _recruitmentStatus: string | null = null;

  /**
   * Create a new query object.
   * @param patientBundle the patient bundle to use for field values
   * @param defaultTypeOfDisease type of disease to default to if no disease can
   *   be found within the patient data
   */
  constructor(patientBundle: Bundle, defaultTypeOfDisease?: AncoraQuery['type_of_disease']) {
    // Build the internal criterions object.
    this._criterions = {};
    if (defaultTypeOfDisease) {
      this.typeOfDisease = defaultTypeOfDisease;
    }
    for (const entry of patientBundle.entry) {
      if (!("resource" in entry)) {
        // Skip bad entries
        continue;
      }
      const resource = entry.resource;
      // Pull out search parameters
      if (resource.resourceType === "Parameters") {
        for (const parameter of resource.parameter) {
          if (parameter.name === "zipCode") {
            this._zipCode = parameter.valueString;
          } else if (parameter.name === "travelRadius") {
            // FIXME: No mapping within Ancora at present
            this._travelRadius = parseFloat(parameter.valueString);
          } else if (parameter.name === "phase") {
            // FIXME: No mapping within Ancora at present
            this._phase = parameter.valueString;
          } else if (parameter.name === "recruitmentStatus") {
            // FIXME: No mapping within Ancora at present
            this._recruitmentStatus = parameter.valueString;
          }
        }
      } else if (resource.resourceType === "Condition") {
        this.addCondition(resource);
      } else if (resource.resourceType === "Observation") {
        this.addObservation(resource);
      } else if (resource.resourceType === "MedicationStatement") {
        this.addMedicationStatement(resource);
      } else if (resource.resourceType === "Procedure") {
        this.addProcedure(resource);
      } else if (resource.resourceType === "Patient") {
        this.addPatient(resource);
      }
    }
  }

  /**
   * Looks up and adds a code to the query.
   * @param code the code to add
   * @param value the value to set the flag to, defaults to true (can also be
   *   false to indicate a negative result)
   */
  _addCode(code: { system?: string, code?: string }, value = true): void {
    // Ignore invalid stuff sent to this
    if (typeof code !== 'object' || code === null || typeof code.system !== 'string' || typeof code.code !== 'string') {
      return;
    }
    const flags = findQueryFlagsForCode(code.system, code.code);
    if (flags) {
      for (const flag of flags) {
        this._criterions[flag] = value;
      }
    }
  }

  /**
   * Adds a condition. Looks at the code and set flags based on known codes.
   * @param condition the condition to add
   */
  addCondition(condition: Condition): void {
    if (Array.isArray(condition.code?.coding)) {
      for (const coding of condition.code.coding) {
        this._addCode(coding);
        // Also see if this is a known disease type
        const diseaseType = findDiseaseTypeForCode(coding.system, coding.code);
        if (diseaseType !== null) {
          // For now, if multiple types match, just take the last one seen
          this.typeOfDisease = diseaseType;
        }
      }
    }
    // Also check to see if the condition has an extension with the histology set
    if (Array.isArray(condition.extension)) {
      // Go through the extensions
      for (const extension of condition.extension) {
        if (extension.url === 'http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-histology-morphology-behavior') {
          // Check if this type is recognized
          if (extension.valueCodeableConcept && Array.isArray(extension.valueCodeableConcept.coding)) {
            // For now, just add the code directly
            for (const code of extension.valueCodeableConcept.coding) {
              this._addCode(code);
            }
          }
        }
      }
    }
  }

  /**
   * Adds an observation. Looks at the code and set flags based on known codes.
   * @param observation the observation to add
   */
  addObservation(observation: Observation): void {
    if (observation.valueCodeableConcept) {
      // Check if we know what this is
      for (const coding of observation.valueCodeableConcept.coding) {
        if (coding.system === SNOMED_CT_SYSTEM) {
          let flag: boolean;
          if (coding.code === '10828004') {
            // Code for a positive result
            flag = true;
          } else if (coding.code === '260385009') {
            // Code for a negative result
            flag = false;
          }
          if (flag !== undefined) {
            // If the flag has a known value, add all codes
            if (Array.isArray(observation.code?.coding)) {
              for (const codeCoding of observation.code.coding) {
                this._addCode(codeCoding, flag);
              }
            }
          }
        }
      }
    }
    // If the observation has an integer value, it could be an Ecog or
    // Karnofsky score
    if (typeof observation.valueInteger === 'number') {
      if (Array.isArray(observation.code?.coding)) {
        for (const coding of observation.code.coding) {
          if (coding.system === LOINC_SYSTEM) {
            if (coding.code === '89247-1') {
              // Ecog
              this._criterions.ecog = observation.valueInteger;
            } else if (coding.code === '89243-0') {
              // Karnosky
              this._criterions.karnofsky = observation.valueInteger;
            }
          }
        }
      }
    }
    // Check if this is a tumor stage observation
    const tumorStage = findTumorStage(observation);
    if (tumorStage !== null) {
      this._criterions.tumor_stage = tumorStage;
    }
  }

  /**
   * Adds a medications statement. Looks at the code and set flags based on
   * known codes.
   * @param medicationStatement the medication statement to add
   */
  addMedicationStatement(medicationStatement: MedicationStatement): void {
    // Turns out this uses the same properties as Condition
    for (const coding of medicationStatement.medicationCodeableConcept.coding) {
      this._addCode(coding);
    }
  }

  addProcedure(procedure: Procedure): void {
    // For now, require procedures to be completed
    if (procedure.status === 'completed') {
      // For now, just add whatever codes we can
      if (procedure.code && Array.isArray(procedure.code.coding)) {
        for (const coding of procedure.code.coding) {
          this._addCode(coding);
        }
      }
    }
  }

  addPatient(patient: Patient): void {
    if (patient.birthDate) {
      // For now, just parse out the date part
      const birthDateParts = /^(\d+)(?:-(\d+)(?:-(\d+))?)?/.exec(patient.birthDate);
      if (birthDateParts) {
        // To avoid time zone shenanigans as much as possible (mainly, any DST
        // weirdness), parse as a UTC date
        const birthDate = new Date(
          Date.UTC(
            Number(birthDateParts[1]),
            birthDateParts[2] === undefined ? 0 : (Number(birthDateParts[2]) - 1),
            birthDateParts[3] === undefined ? 1 : Number(birthDateParts[3])
          )
        );
        const today = new Date();
        // Calculate age
        let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
        if (today.getUTCMonth() < birthDate.getUTCMonth()
          || today.getUTCMonth() == birthDate.getUTCMonth() && today.getUTCDate() < birthDate.getUTCDate()) {
          // In this case, the age is off by one, as it's before the birthdate in the current year
          age -= 1;
        }
        // Clamp age to 1-100
        this._criterions.age = Math.max(1, Math.min(100, age));
      }
    }
    // Using the gender field is probably, strictly speaking, inaccurate
    const gender = patient.gender;
    if (gender === 'male' || gender === 'female') {
      this._criterions.natal_sex = gender;
    }
  }

  /**
   * Create an AncoraQuery based on properties within this object. If
   * typeOfDisease is `null` this will throw an exception, as the type of
   * disease must be set within the final query.
   * @return the query object
   */
  toQuery(): AncoraQuery {
    if (this.typeOfDisease == null) {
      throw new Error('No supported type of disease found within patient data, cannot generate a valid query.');
    }
    // TODO (maybe): Clone the criterions object?
    const query: AncoraQuery = {
      // FIXME: Currently hard-coded
      country: 'US',
      criterions: this._criterions,
      type_of_disease: this.typeOfDisease
    };
    if (this._zipCode !== null) {
      query.zip_code = this._zipCode;
    }
    if (this._travelRadius === null) {
      // Set a default since the radius is required
      query.radius = 100;
      query.radius_unit = 'MI';
    } else {
      query.radius = this._travelRadius;
      query.radius_unit = 'MI';
    }

    console.log("query", JSON.stringify(query));
    return query;
  }

  /**
   * Generates a debug string for the query.
   * @returns a string representation of the query
   */
  toString(): string {
    if (this.typeOfDisease == null) {
      return '[AncoraAPIQuery (invalid: no typeOfDisease, with criteria: ' + JSON.stringify(this._criterions) + ')]';
    }
    return `[AncoraAPIQuery ${JSON.stringify(this.toQuery())}]`;
  }
}

/**
 * Convert a query response into a search set.
 *
 * @param response the response object
 * @param ctgService an optional ClinicalTrialGovService which can be used to
 *     update the returned trials with additional information pulled from
 *     ClinicalTrials.gov
 */
export function convertResponseToSearchSet(
  response: AncoraResponse,
  ctgService?: ClinicalTrialsGovService
): Promise<SearchSet> {
  // Our final response
  const entries:SearchBundleEntry[] = [];
  // For generating IDs
  let id = 0;
  for (const trial of response) {
    if (isAncoraTrial(trial)) {
      const entry:SearchBundleEntry = convertToSearchSetEntry(trial, id++);
      entries.push(entry);
    } else {
      // This trial could not be understood. It can be ignored if that should
      // happen or raised/logged as an error.
      debuglog('Unable to parse trial from server: %o', trial);
    }
  }
  
  if (ctgService) {
    // If given a backup service, use it
    return ctgService.updateSearchSetEntries(entries).then(() => {
      return new SearchSet(entries);
    });
  } else {
    // Otherwise, resolve immediately
    return Promise.resolve(new SearchSet(entries));
  }
}

/**
 * Helper function to handle actually sending the query.
 *
 * @param endpoint the URL of the end point to send the query to
 * @param query the query to send
 * @param apiKey the API key to send
 * @param ctgService an optional ClinicalTrialGovService which can be used to
 *     update the returned trials with additional information pulled from
 *     ClinicalTrials.gov
 */
async function sendQuery(
  endpoint: string,
  query: AncoraAPIQuery,
  apiKey: string,
  ctgService?: ClinicalTrialsGovService
): Promise<SearchSet> {
  const queryJsonObject = query.toQuery();
  debuglog('Running query: %o', queryJsonObject);
  querylog('Generated query: %j', queryJsonObject);
  const response = await fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(queryJsonObject),
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
  });
  debuglog('Received response: %d %s', response.status, response.statusText);
  debuglog('Headers: %o', response.headers);
  if (response.status === 200) {
    let result: unknown;
    try {
      result = await response.json();
    } catch (ex) {
      throw new Error('Unable to parse response from server: invalid JSON');
    }
    debuglog('Response object: %j', result);
    // Response object should be an array
    if (Array.isArray(result)) {
      return convertResponseToSearchSet(result, ctgService);
    } else if (isQueryErrorResponse(result)) {
      throw new APIError(
          `Error from service: ${result.error}`,
          response,
          result
        );
    } else {
      throw new Error("Unable to parse response from server: invalid JSON object");
    }
  } else {
    throw new APIError(
      `Server returned ${response.status} ${response.statusText}`,
      response,
      await response.text()
    );
  }
}
