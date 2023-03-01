import {
  ResearchStudy,
  CLINICAL_TRIAL_IDENTIFIER_CODING_SYSTEM_URL,
} from "clinical-trial-matching-service";
import { ResearchStudy as FhirResearchStudy } from "fhir/r4";
import { AncoraTrial } from "../src/query";
import { convertToResearchStudy } from "../src/researchstudy-mapping";

describe("convertToResearchStudy()", () => {
  let testResearchStudy: AncoraTrial;
  beforeEach(() => {
    testResearchStudy = {
      trial_id: "NCT00000000",
      acronym: "TEST",
      brief_title: "Test Clinical Trial",
      trial_description: "Test trial",
      date_posted: "2023-01-01 00:00:00+00:00",
      date_updated: "2023-02-01 00:00:00+00:00",
      enrollment: 123,
      eligibility_criteria: "Eligibility criteria text.",
      primary_purpose: "Screening",
      principal_investigator: "Dr. Doctor McTestDoctor",
      recruiting_status: "Recruiting",
      start_date: "2023-06-01 00:00:00+00:00",
      trial_ancora_link: "https://www.example.com/details/NCT00000000",
      study_type: "Interventional",
      interventions: [
        {
          intervention_type: "Test",
          intervention_name: "Test Intervention",
        },
      ],
      trial_phase: "N/A",
      trial_summary: "Test summary",
      arms: [
        {
          "arm name": "Test Arm",
          "arm type": "Other",
          "arm description": "Test Arm Description",
        },
      ],
      locations: {
        "United States": [
          {
            city: "Boston",
            zip: "02108",
            state: "Massachusetts",
            country: "United States",
            facility: "Test Facility",
            status: "Recruiting",
            latitude: "-42.3601",
            longitude: "-71.0589",
          },
        ],
      },
      sponsor: "Test Sponsor Organization",
      treatments: [
        {
          treatment_type: "Behavioral",
          treatment_name: "Test Treatment",
        },
      ],
      ancora_match_score: 0,
    };
  });

  const createExpectedTrial = (
    status: ResearchStudy["status"] | null = "active",
    phaseCode: string | null = "n-a",
    phaseText: string | null = "N/A",
    primaryPurpose: string | null = 'screening'
  ): ResearchStudy => {
    const expected = new ResearchStudy(1);
    expected.identifier = [
      {
        system: CLINICAL_TRIAL_IDENTIFIER_CODING_SYSTEM_URL,
        use: "official",
        value: "NCT00000000",
      },
    ];
    expected.title = "Test Clinical Trial";
    expected.description = "Test summary";
    if (status !== null) {
      expected.status = status;
    }
    if (phaseCode !== null && phaseText !== null) {
      expected.phase = {
        coding: [
          {
            system: "http://hl7.org/fhir/ValueSet/research-study-phase",
            code: phaseCode,
            display: phaseText,
          },
        ],
        text: phaseText,
      };
    }
    if (primaryPurpose !== null) {
      (expected as FhirResearchStudy).primaryPurposeType = {
        coding: [
          {
            code: primaryPurpose,
          },
        ],
        text: primaryPurpose,
      };
    }
    const expectedEligibilityGroup = expected.addContainedResource({
      resourceType: "Group",
      type: "person",
      actual: false,
    });
    expectedEligibilityGroup.display = "Eligibility criteria text.";
    expected.enrollment = [expectedEligibilityGroup];
    expected.principalInvestigator = expected.addContainedResource({
      resourceType: "Practitioner",
      name: [
        {
          use: "usual",
          text: "Dr. Doctor McTestDoctor",
        },
      ],
    });
    expected.sponsor = expected.addContainedResource({
      resourceType: "Organization",
      name: "Test Sponsor Organization",
    });
    expected.arm = [
      {
        name: "Test Arm",
        description: "Test Arm Description",
        type: {
          text: "Other",
        },
      },
    ];
    const expectedLocation = expected.addSite("Test Facility");
    expectedLocation.address = {
      city: "Boston",
      state: "Massachusetts",
      postalCode: "02108",
    };
    return expected;
  };

  it("converts as expected", () => {
    const actual = convertToResearchStudy(testResearchStudy, 1);
    const expected = createExpectedTrial();
    // The createReferenceId function is unique per object so just make it equal
    actual.createReferenceId = expected.createReferenceId;
    expect(actual).toEqual(expected);
  });

  it("handles an unknown primary purpose, status, and phase", () => {
    // Set a few fields to other values
    testResearchStudy.recruiting_status = "unknown value";
    testResearchStudy.trial_phase = "unknown phase";
    testResearchStudy.primary_purpose = "unknown primary purpose";
    const actual = convertToResearchStudy(testResearchStudy, 1);
    const expected = createExpectedTrial(null, null, null, null);
    // The createReferenceId function is unique per object so just make it equal
    actual.createReferenceId = expected.createReferenceId;
    expect(actual).toEqual(expected);
  });
});
