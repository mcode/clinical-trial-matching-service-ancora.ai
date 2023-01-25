/**
 * This provides an example of how to test the query to ensure it produces
 * results.
 */

import {
  ClinicalTrialsGovService,
  ResearchStudy,
  SearchSet,
} from "clinical-trial-matching-service";
import { Bundle, BundleEntry, FhirResource } from 'fhir/r4';
import createAncoraAiLookup, {
  convertResponseToSearchSet,
  isAncoraTrial,
  isAncoraResponse,
  isQueryErrorResponse,
  AncoraAPIQuery,
  AncoraResponse,
  AncoraTrial,
} from "../src/query";
import nock from "nock";
import fs from 'fs';
import path from 'path';

const exampleTrial: AncoraTrial = {
  "trial_id": "NCT00000000",
  "acronym": "N/A",
  "brief_title": "Example Trial",
  "date_posted": "2022-01-15 00:00:00+00:00",
  "date_updated": "2022-02-15 00:00:00+00:00",
  "enrollment": 100,
  "eligibility_criteria": "  Exclusion Criteria:\n\n    * Adults unable to consent\n\n    * Prisoners  \n\n  Inclusion Criteria:\n\n    * Adults age 18 and older",
  "primary_purpose": "Treatment",
  "principal_investigator": "Example Doctor, MD, Example Medical Center",
  "recruiting_status": "Recruiting",
  "start_date": "2022-01-21 00:00:00+00:00",
  "trial_ancora_link": "http://example.com",
  "study_type": "Interventional",
  "interventions": [],
  "trial_phase": "Not Applicable",
  "trial_summary": "An example trial",
  "trial_description": "An example description",
  "arms": [
    {
      "arm name": "Control",
      "arm type": "No Intervention",
      "arm description": "Do nothing"
    },
    {
      "arm name": "Experimental",
      "arm type": "Experimental",
      "arm description": "Do something"
    }
  ],
  "locations": {
    "United States": [
      {
        "city": "Bedford",
        "zip": "01730",
        "state": "Massachusetts",
        "country": "United States",
        "facility": "Example Facility",
        "status": "Recruiting",
        "latitude": "FIXME",
        "longitude": "FIXME"
      }
    ]
  },
  "sponsor": "Example Sponsor",
  "treatments": [
    {
      "treatment_type": "Other",
      "treatment_name": "Test value"
    }
  ],
  "ancora_match_score": 0.5
};

describe("createClinicalTrialLookup()", () => {
  it("creates a function if configured properly", () => {
    expect(
      typeof createAncoraAiLookup({
        endpoint: "http://www.example.com/",
        api_key: "token",
      })
    ).toEqual("function");
  });

  // This test just makes sure an error is properly raised for invalid
  // configurations
  it("raises an error if configuration is missing", () => {
    expect(() => {
      createAncoraAiLookup({});
    }).toThrowError("Missing endpoint in configuration");
    expect(() => {
      createAncoraAiLookup({ endpoint: "http://www.example.com/" });
    }).toThrowError("Missing api_key in configuration");
  });
});

describe("isAncoraTrial()", () => {
  it("returns false for non-trial objects", () => {
    expect(isAncoraTrial(null)).toBeFalse();
    expect(isAncoraTrial(true)).toBeFalse();
    expect(isAncoraTrial("string")).toBeFalse();
    expect(isAncoraTrial(42)).toBeFalse();
    expect(isAncoraTrial({ invalid: true })).toBeFalse();
  });

  it("returns true on a matching object", () => {
    expect(isAncoraTrial(exampleTrial)).toBeTrue();
  });
});

describe("isAncoraResponse()", () => {
  it("returns false for non-response objects", () => {
    expect(isAncoraResponse(null)).toBeFalse();
    expect(isAncoraResponse(true)).toBeFalse();
    expect(isAncoraResponse("string")).toBeFalse();
    expect(isAncoraResponse(42)).toBeFalse();
    expect(isAncoraResponse({ invalid: true })).toBeFalse();
  });

  it("returns true on a matching object", () => {
    expect(isAncoraResponse([])).toBeTrue();
    expect(isAncoraResponse([exampleTrial])).toBeTrue();
    // Currently this is true. It may make sense to make it false, but for now,
    // a single invalid trial does not invalidate the array.
    expect(isAncoraResponse(["invalid"])).toBeTrue();
  });
});

describe("isQueryErrorResponse()", () => {
  it("returns false for non-response objects", () => {
    expect(isQueryErrorResponse(null)).toBeFalse();
    expect(isQueryErrorResponse(true)).toBeFalse();
    expect(isQueryErrorResponse("string")).toBeFalse();
    expect(isQueryErrorResponse(42)).toBeFalse();
    expect(isQueryErrorResponse({ invalid: true })).toBeFalse();
  });

  it("returns true on a matching object", () => {
    expect(isQueryErrorResponse({ error: "oops" })).toBeTrue();
  });
});

describe("APIQuery", () => {
  it("extracts passed properties", () => {
    const query = new AncoraAPIQuery({
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "Parameters",
            parameter: [
              {
                name: "zipCode",
                valueString: "01730",
              },
              {
                name: "travelRadius",
                valueString: "25",
              },
              {
                name: "phase",
                valueString: "phase-1",
              },
              {
                name: "recruitmentStatus",
                valueString: "approved",
              },
            ],
          },
        },
      ],
    });
    expect(query._zipCode).toEqual("01730");
    expect(query._travelRadius).toEqual(25);
    expect(query._phase).toEqual("phase-1");
    expect(query._recruitmentStatus).toEqual("approved");
  });

  it("maps conditions properly", () => {
    const query = new AncoraAPIQuery({
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "Condition",
            subject: {},
            code: {
              coding: [
                {
                  system: "http://loinc.org",
                  code: "98489-8",
                },
              ],
            },
          },
        },
        {
          resource: {
            resourceType: "Condition",
            subject: {},
            code: {
              coding: [
                {
                  system: "http://snomed.info/sct",
                  code: "326072005",
                  display: "Carcinoma of head of pancreas (disorder)"
                },
              ],
            },
          },
        },
        {
          resource: {
            resourceType: "MedicationStatement",
            status: "active",
            subject: {},
            medicationCodeableConcept: {
              coding: [
                {
                  system: "http://www.nlm.nih.gov/research/umls/rxnorm",
                  code: "2049112",
                },
              ],
            },
          },
        },
      ],
    });
    expect(query._criterions.flt3_itd).toBeTrue();
    expect(query._criterions.braf_therapy).toBeTrue();
    expect(query.typeOfDisease).toEqual("pancreatic_cancer");
  });

  it("converts the query to a string", () => {
    expect(
      new AncoraAPIQuery({
        resourceType: "Bundle",
        type: "collection",
        entry: [
          {
            resource: {
              resourceType: "Parameters",
              parameter: [
                {
                  name: "zipCode",
                  valueString: "01730",
                },
                {
                  name: "travelRadius",
                  valueString: "25",
                },
                {
                  name: "phase",
                  valueString: "phase-1",
                },
                {
                  name: "recruitmentStatus",
                  valueString: "approved",
                },
              ],
            },
          },
        ],
      }, "breast_cancer").toString()
    ).toEqual(
      // This is probably stable as of ECMAScript 2015 which should cover
      // supported versions of Node.js
      '[AncoraAPIQuery {"country":"US","criterions":{},"type_of_disease":"breast_cancer","zip_code":"01730","radius":25,"radius_unit":"MI"}]'
    );
  });

  it("parses Ecog scores", () => {
    const query = new AncoraAPIQuery({
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "Observation",
            subject: {},
            status: "final",
            code: {
              coding: [
                {
                  system: "http://loinc.org",
                  code: "89247-1",
                },
              ],
            },
            valueInteger: 2
          },
        },
      ]
    }, "breast_cancer");
    expect(query._criterions.ecog).toEqual(2);
  });

  it("parses Karnofsky scores", () => {
    const query = new AncoraAPIQuery({
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "Observation",
            subject: {},
            status: "final",
            code: {
              coding: [
                {
                  system: "http://loinc.org",
                  code: "89243-0",
                },
              ],
            },
            valueInteger: 80
          },
        },
      ]
    }, "breast_cancer");
    expect(query._criterions.karnofsky).toEqual(80);
  });

  it("parses positive biomarkers", () => {
    const query = new AncoraAPIQuery({
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          "resource": {
            "resourceType": "Observation",
            "status": "final",
            "subject": {
              "reference": "urn:uuid:Ob4VwDGaXWUMXbJOr7nMN",
              "type": "Patient"
            },
            "valueCodeableConcept": {
              "coding": [
                {
                  "code": "10828004",
                  "display": "Positive (qualifier value)",
                  "system": "http://snomed.info/sct"
                }
              ]
            },
            "meta": {
              "profile": [
                "http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-tumor-marker"
              ]
            },
            "code": {
              "coding": [
                {
                  "code": "50995-0",
                  "display": "BRCA1+BRCA2 gene targeted mutation analysis in Blood or Tissue by Molecular genetics method",
                  "system": "http://loinc.org"
                }
              ]
            },
            "category": [
              {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                    "code": "laboratory"
                  }
                ]
              }
            ]
          }
        }
      ]
    });
    expect(query._criterions.brca1).toBe(true);
  });

  it("parses negative biomarkers", () => {
    const query = new AncoraAPIQuery({
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          "resource": {
            "resourceType": "Observation",
            "status": "final",
            "subject": {
              "reference": "urn:uuid:ASSEV4F261lmdRuaAB12n",
              "type": "Patient"
            },
            "valueCodeableConcept": {
              "coding": [
                {
                  "code": "260385009",
                  "display": "Negative (qualifier value)",
                  "system": "http://snomed.info/sct"
                }
              ]
            },
            "meta": {
              "profile": [
                "http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-tumor-marker"
              ]
            },
            "code": {
              "coding": [
                {
                  "code": "51981-9",
                  "display": "HER2 [Presence] in Serum by Immunoassay",
                  "system": "http://loinc.org"
                }
              ]
            },
            "category": [
              {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                    "code": "laboratory"
                  }
                ]
              }
            ]
          }
        }
      ]
    });
    expect(query._criterions.her2).toBe(false);
  });

  it("parses procedures", () => {
    const query = new AncoraAPIQuery({
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          "resource": {
            "resourceType": "Procedure",
            "status": "completed",
            "subject": {
              "reference": "urn:uuid:ASSEV4F261lmdRuaAB12n",
              "type": "Patient"
            },
            "code": {
              "coding": [
                {
                  "system": "http://snomed.info/sct",
                  "code": "429929004",
                  "display": "Laser ablation using computed tomography guidance (procedure)"
                }
              ]
            },
            "meta": {
              "profile": [
                "http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-cancer-related-radiation-procedure"
              ]
            },
            "performedDateTime": "2023-01-25T19:49:53.034Z"
          }
        }
      ]
    });
    expect(query._criterions.radiation_therapy).toBe(true);
  });

  it("ignores unknown parameters", () => {
    // Passing in this case is simply "not raising an exception"
    new AncoraAPIQuery({
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "Parameters",
            parameter: [
              {
                name: "unknown",
                valueString: "invalid",
              },
            ],
          },
        },
      ],
    });
  });

  it("ignores invalid entries", () => {
    // Passing in this case is simply "not raising an exception"
    const bundle: Bundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [],
    };
    // Force an invalid entry in
    bundle.entry?.push(({ invalid: true } as unknown) as BundleEntry);
    new AncoraAPIQuery(bundle);
    // Passing is not raising an exception
  });

  it('can handle a patient bundle from the front end', async () => {
    // This loads a known patient bundle generated by the matching app
    const jsonString = await fs.promises.readFile(path.resolve(__dirname, '../../spec/data/patient_bundle.json'), {encoding: 'utf-8'});
    const bundle = JSON.parse(jsonString) as Bundle<FhirResource>;
    const query = new AncoraAPIQuery(bundle);
    expect(query.typeOfDisease).toEqual('colorectal_cancer');
    expect(query._criterions.ecog).toEqual(3);
    expect(query._criterions.karnofsky).toEqual(60);
    expect(query._criterions.tumor_stage).toEqual(3);
    expect(query._criterions.natal_sex).toEqual('female');
  });
});

describe("convertResponseToSearchSet()", () => {
  it("converts trials", () => {
    return expectAsync(
      convertResponseToSearchSet([exampleTrial]).then((searchSet) => {
        expect(searchSet.entry.length).toEqual(1);
        expect(searchSet.entry[0].resource).toBeInstanceOf(ResearchStudy);
        expect(
          (searchSet.entry[0].resource as ResearchStudy).status
        ).toEqual("active");
      })
    ).toBeResolved();
  });

  it("skips invalid trials", () => {
    const response: AncoraResponse = [exampleTrial,{ invalidObject: true, }];
    return expectAsync(convertResponseToSearchSet(response)).toBeResolved();
  });

  it("uses the backup service if provided", () => {
    // Note that we don't initialize the backup service so no files are created
    const backupService = new ClinicalTrialsGovService("temp");
    // Instead we install a spy that takes over "updating" the research studies
    // by doing nothing
    const spy = spyOn(backupService, "updateResearchStudies").and.callFake(
      (studies) => {
        return Promise.resolve(studies);
      }
    );
    return expectAsync(
      convertResponseToSearchSet([exampleTrial], backupService)
    )
      .toBeResolved()
      .then(() => {
        expect(spy).toHaveBeenCalled();
      });
  });
});

describe("ClinicalTrialLookup", () => {
  // A valid patient bundle for the matcher, passed to ensure a query is generated
  const patientBundle: Bundle = {
    resourceType: "Bundle",
    type: "batch",
    entry: [
      {
        resource: {
          resourceType: "Condition",
          meta: { profile: ['http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-primary-cancer-condition'] },
          subject: {},
          code: {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '363406005'
              }
            ]
          }
        }
      }
    ],
  };
  let matcher: (patientBundle: Bundle) => Promise<SearchSet>;
  let scope: nock.Scope;
  let mockRequest: nock.Interceptor;
  beforeEach(() => {
    // Create the matcher here. This creates a new instance each test so that
    // each test can adjust it as necessary without worrying about interfering
    // with other tests.
    matcher = createAncoraAiLookup({
      endpoint: "https://www.example.com/endpoint",
      api_key: "test_token",
    });
    // Create the interceptor for the mock request here as it's the same for
    // each test
    scope = nock("https://www.example.com");
    mockRequest = scope.post("/endpoint");
  });
  afterEach(() => {
    // Expect the endpoint to have been hit in these tests
    expect(nock.isDone()).toBeTrue();
  });

  it("generates a request", () => {
    mockRequest.reply(200, []);
    return expectAsync(matcher(patientBundle)).toBeResolved();
  });

  it("rejects with an error if an error is returned by the server", () => {
    // Simulate an error response
    mockRequest.reply(200, { error: "Test error" });
    return expectAsync(matcher(patientBundle)).toBeRejectedWithError(
      "Error from service: Test error"
    );
  });

  it("rejects with an error if an HTTP error is returned by the server", () => {
    // Simulate an error response
    mockRequest.reply(500, "Internal Server Error");
    return expectAsync(matcher(patientBundle)).toBeRejectedWithError(
      /^Server returned 500/
    );
  });

  it("rejects with an error if the response is invalid", () => {
    // Simulate a valid response with something that can't be parsed as JSON
    mockRequest.reply(200, { missingAllKnownKeys: true });
    return expectAsync(matcher(patientBundle)).toBeRejectedWithError(
      "Unable to parse response from server"
    );
  });

  it("rejects with an error if the response is not JSON", () => {
    // Simulate a valid response with something that can't be parsed as JSON
    mockRequest.reply(200, "A string that isn't JSON");
    return expectAsync(matcher(patientBundle)).toBeRejectedWithError(
      "Unable to parse response from server"
    );
  });

  it("rejects with an error if the request fails", () => {
    // Simulate a valid response with something that can't be parsed as JSON
    mockRequest.replyWithError("Test error");
    return expectAsync(matcher(patientBundle)).toBeRejectedWithError(
      "Test error"
    );
  });
});
