/**
 * This provides an example of how to test the query to ensure it produces
 * results.
 */

import {
  ClinicalTrialsGovService,
  fhir,
  ResearchStudy,
} from "clinical-trial-matching-service";
import createClinicalTrialLookup, {
  convertResponseToSearchSet,
  isAncoraTrial,
  isAncoraResponse,
  isQueryErrorResponse,
  AncoraAPIQuery,
  AncoraResponse,
  AncoraTrial,
} from "../src/query";
import nock from "nock";

const exampleTrial = {
  "trial_id": "NCT00000000",
  "acronym": "N/A",
  "brief_title": "Example Trial",
  "date_posted": "2022-01-15 00:00:00+00:00",
  "date_updated": "2022-02-15 00:00:00+00:00",
  "enrollment": 100,
  "exclusion_text": "  Exclusion Criteria:\n\n    * Adults unable to consent\n\n    * Prisoners",
  "inclusion_text": "  Inclusion Criteria:\n\n    * Adults age 18 and older",
  "primary_purpose": "Treatment",
  "principal_investigator": "Example Doctor, MD, Example Medical Center",
  "recruiting_status": "Recruiting",
  "start_date": "2022-01-21 00:00:00+00:00",
  "study_type": "Interventional",
  "trial_phase": "Not Applicable",
  "trial_summary": "An example trial",
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
  "locations": [
    {
      "city": "Bedford",
      "zip": "01730",
      "state": "Massachusetts",
      "facility": "Example Facility"
    }
  ],
  "sponsor": "Example Sponsor",
  "treatments": [
    {
      "treatment_type": "Other",
      "treatment_name": "Test value"
    }
  ]
};

describe("createClinicalTrialLookup()", () => {
  it("creates a function if configured properly", () => {
    expect(
      typeof createClinicalTrialLookup({
        endpoint: "http://www.example.com/",
        auth_token: "token",
      })
    ).toEqual("function");
  });

  // This test just makes sure an error is properly raised for invalid
  // configurations
  it("raises an error if configuration is missing", () => {
    expect(() => {
      createClinicalTrialLookup({});
    }).toThrowError("Missing endpoint in configuration");
    expect(() => {
      createClinicalTrialLookup({ endpoint: "http://www.example.com/" });
    }).toThrowError("Missing auth_token in configuration");
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
    expect(isAncoraResponse({ length: 0, trials: {} })).toBeTrue();
    expect(isAncoraResponse({ length: 1, trials: { "NCT00000001": exampleTrial } })).toBeTrue();
    // Currently this is true. It may make sense to make it false, but for now,
    // a single invalid trial does not invalidate the array.
    expect(isAncoraResponse({ length: 1, trials: { "NCT12345678": "invalid" } })).toBeTrue();
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
    expect(query._query.zip_code).toEqual("01730");
    // Not mapped: expect(query.travelRadius).toEqual(25);
    // Not mapped: expect(query.phase).toEqual("phase-1");
    // Not mapped: expect(query.recruitmentStatus).toEqual("approved");
  });

  it("gathers conditions", () => {
    const query = new AncoraAPIQuery({
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "Condition",
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
            resourceType: "MedicationStatement",
            code: {
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
    expect(query._query.flt3_itd).toBeTrue();
    expect(query._query.braf_therapy).toBeTrue();
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
      }).toString()
    ).toEqual(
      '{"zip_code":"01730"}'
    );
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
    const bundle: fhir.Bundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [],
    };
    // Force an invalid entry in
    bundle.entry.push(({ invalid: true } as unknown) as fhir.BundleEntry);
    new AncoraAPIQuery(bundle);
    // Passing is not raising an exception
  });
});

describe("convertResponseToSearchSet()", () => {
  it("converts trials", () => {
    return expectAsync(
      convertResponseToSearchSet({
        length: 1,
        trials: {
          "NCT00000000": exampleTrial
        },
      }).then((searchSet) => {
        expect(searchSet.entry.length).toEqual(1);
        expect(searchSet.entry[0].resource).toBeInstanceOf(ResearchStudy);
        expect(
          (searchSet.entry[0].resource as fhir.ResearchStudy).status
        ).toEqual("active");
      })
    ).toBeResolved();
  });

  it("skips invalid trials", () => {
    const response: AncoraResponse = {
      length: 1,
      trials: {
        "NCT00000000": exampleTrial
      }
    };
    // Push on an invalid object
    response.trials['NCT12345678'] = ({
      invalidObject: true,
    } as unknown) as AncoraTrial;
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
      convertResponseToSearchSet(
        {
          length: 1,
          trials: {
            "NCT00000001": exampleTrial
          }
        },
        backupService
      )
    )
      .toBeResolved()
      .then(() => {
        expect(spy).toHaveBeenCalled();
      });
  });
});

describe("ClinicalTrialLookup", () => {
  // A valid patient bundle for the matcher, passed to ensure a query is generated
  const patientBundle: fhir.Bundle = {
    resourceType: "Bundle",
    type: "batch",
    entry: [],
  };
  let matcher: (patientBundle: fhir.Bundle) => Promise<fhir.SearchSet>;
  let scope: nock.Scope;
  let mockRequest: nock.Interceptor;
  beforeEach(() => {
    // Create the matcher here. This creates a new instance each test so that
    // each test can adjust it as necessary without worrying about interfering
    // with other tests.
    matcher = createClinicalTrialLookup({
      endpoint: "https://www.example.com/endpoint",
      auth_token: "test_token",
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
    mockRequest.reply(200, { length: 1, trials: {} });
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
      "Unable to parse response as JSON"
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
