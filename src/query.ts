/**
 * Handles conversion of patient bundle data to a proper request for matching service apis.
 * Retrieves api response as promise to be used in conversion to fhir ResearchStudy
 */
import https from "https";
import { IncomingMessage } from "http";
import {
  fhir,
  ClinicalTrialsGovService,
  ServiceConfiguration,
  ResearchStudy,
  SearchSet,
} from "clinical-trial-matching-service";
import convertToResearchStudy from "./researchstudy-mapping";
import { AncoraCriteria, AncoraQuery } from './ancora-query';
import { findQueryFlagsForCode, findDiseaseTypeForCode, findTumorStage } from './ancora-mappings';

export interface AncoraAiConfiguration extends ServiceConfiguration {
  endpoint?: string;
  api_key?: string;
}

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
): (patientBundle: fhir.Bundle) => Promise<SearchSet> {
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
    patientBundle: fhir.Bundle
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

export interface AncoraTrialArm extends Record<string, string> {
  "arm name": string;
  "arm type": string;
  "arm description": string;
}

export interface AncoraTrialLocation extends Record<string, string> {
  city: string;
  zip: string;
  state: string;
  facility: string;
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
  exclusion_text: string;
  inclusion_text: string;
  primary_purpose: string;
  principal_investigator: string;
  recruiting_status: string;
  start_date: DateTimeString;
  study_type: string;
  trial_phase: string;
  trial_summary: string;
  arms: AncoraTrialArm[];
  locations: AncoraTrialLocation[];
  sponsor: string;
  treatments: AncoraTrialTreatment[];
}

/**
 * Type guard to determine if an object is a valid QueryTrial.
 * @param o the object to determine if it is a QueryTrial
 */
export function isAncoraTrial(o: unknown): o is AncoraTrial {
  if (typeof o !== "object" || o === null) return false;
  const trial = o as AncoraTrial;
  return typeof trial.trial_id === 'string' &&
    typeof trial.acronym === 'string' &&
    typeof trial.brief_title === 'string' &&
    typeof trial.date_posted === 'string' &&
    typeof trial.date_updated === 'string' &&
    typeof trial.enrollment === 'number' &&
    typeof trial.exclusion_text === 'string' &&
    typeof trial.inclusion_text === 'string' &&
    typeof trial.primary_purpose === 'string' &&
    typeof trial.principal_investigator === 'string' &&
    typeof trial.recruiting_status === 'string' &&
    typeof trial.start_date === 'string' &&
    typeof trial.study_type === 'string' &&
    typeof trial.trial_phase === 'string' &&
    typeof trial.trial_summary === 'string' &&
    Array.isArray(trial.arms) &&
    Array.isArray(trial.locations) &&
    typeof trial.sponsor === 'string' &&
    Array.isArray(trial.treatments);
}

// Generic type for the response data being received from the server.
export interface AncoraResponse extends Record<string, unknown> {
  length: number;
  /**
   * Map of NCT ID to trial.
   */
  trials: Record<string, AncoraTrial>;
}

/**
 * Type guard to determine if an object is a valid QueryResponse.
 * @param o the object to determine if it is a QueryResponse
 */
export function isAncoraResponse(o: unknown): o is AncoraResponse {
  if (typeof o !== "object" || o === null) return false;

  // Note that the following DOES NOT check the trials object to make sure every
  // object within it is valid. Currently this is done later in the process.
  // This makes this type guard or the AncoraResponse type sort of invalid.
  // However, the assumption is that a single unparsable trial should not cause
  // the entire response to be thrown away.
  const response = o as AncoraResponse;
  return typeof response.length === 'number' && typeof response.trials === 'object';
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
    public result: IncomingMessage,
    public body: string
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
  constructor(patientBundle: fhir.Bundle, defaultTypeOfDisease?: AncoraQuery['type_of_disease']) {
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
      }
    }
  }

  /**
   * Looks up and adds a code to the query.
   * @param code the code to add
   */
  _addCode(code: { system: string, code: string }): void {
    const flags = findQueryFlagsForCode(code.system, code.code);
    if (flags) {
      for (const flag of flags) {
        this._criterions[flag] = true;
      }
    }
  }

  /**
   * Adds a condition. Looks at the code and set flags based on known codes.
   * @param condition the condition to add
   */
  addCondition(condition: fhir.Condition): void {
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

  /**
   * Adds an observation. Looks at the code and set flags based on known codes.
   * @param observation the observation to add
   */
  addObservation(observation: fhir.Observation): void {
    if (observation.valueCodeableConcept) {
      for (const coding of observation.valueCodeableConcept.coding) {
        this._addCode(coding);
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
  addMedicationStatement(medicationStatement: fhir.MedicationStatement): void {
    // Turns out this uses the same properties as Condition
    for (const coding of medicationStatement.code.coding) {
      this._addCode(coding);
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
    if (this._travelRadius != null) {
      query.radius = this._travelRadius;
      query.radius_unit = 'MI';
    }
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
  const studies: ResearchStudy[] = [];
  // For generating IDs
  let id = 0;
  for (const nctId in response.trials) {
    const trial = response.trials[nctId];
    if (isAncoraTrial(trial)) {
      studies.push(convertToResearchStudy(trial, id++));
    } else {
      // This trial could not be understood. It can be ignored if that should
      // happen or raised/logged as an error.
      console.error("Unable to parse trial from server: %o", trial);
    }
  }
  if (ctgService) {
    // If given a backup service, use it
    return ctgService.updateResearchStudies(studies).then(() => {
      return new SearchSet(studies);
    });
  } else {
    // Otherwise, resolve immediately
    return Promise.resolve(new SearchSet(studies));
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
function sendQuery(
  endpoint: string,
  query: AncoraAPIQuery,
  apiKey: string,
  ctgService?: ClinicalTrialsGovService
): Promise<SearchSet> {
  return new Promise((resolve, reject) => {
    const body = Buffer.from(JSON.stringify(query.toQuery()), "utf8");

    const request = https.request(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          "Content-Length": body.byteLength.toString(),
          "X-Api-Key": apiKey,
        },
      },
      (result) => {
        let responseBody = "";
        result.on("data", (chunk) => {
          responseBody += chunk;
        });
        result.on("end", () => {
          console.log("Complete");
          if (result.statusCode === 200) {
            let json: unknown;
            try {
              json = JSON.parse(responseBody) as unknown;
            } catch (ex) {
              reject(
                new APIError(
                  "Unable to parse response as JSON",
                  result,
                  responseBody
                )
              );
              return;
            }
            if (isAncoraResponse(json)) {
              resolve(convertResponseToSearchSet(json, ctgService));
            } else if (isQueryErrorResponse(json)) {
              reject(
                new APIError(
                  `Error from service: ${json.error}`,
                  result,
                  responseBody
                )
              );
            } else {
              reject(new Error("Unable to parse response from server"));
            }
          } else {
            reject(
              new APIError(
                `Server returned ${result.statusCode} ${result.statusMessage}`,
                result,
                responseBody
              )
            );
          }
        });
      }
    );

    request.on("error", (error) => reject(error));

    request.write(body);
    request.end();
  });
}
