#!/usr/bin/env node

/**
 * A script file for generating CSV files that can be used to test mappings.
 * This generates a set of patients (one per known disease code) with a set of
 * random observations and medications (again, one per known Ancora flag).
 * The generated patient data is likely garbage - no attempt is made to make it
 * make logical sense. It is intended solely for testing that codes are properly
 * detected within the Ancora wrapper.
 */

import { WriteStream } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';

import {
  ancoraCriterionCodes,
  ancoraDiseaseCodes,
  LOINC_SYSTEM,
  RX_NORM_SYSTEM,
  SNOMED_CT_SYSTEM
} from './ancora-mapping-data';


// Test file to generate CSV information for patients

/**
 * Generate the MRN string for a given patient at a given index. Ensures that
 * MRNs are consistent throughout the generated data.
 */
const generateMRN = (index: number): string => {
  return `ancora-${index}`;
};

/**
 * Return [given, family]
 */
const generatePatientName: () => [string, string] = (() => {
  let count = 0;
  return (): [string, string] => {
    // TODO (maybe): Add other patient names. The names don't really matter.
    count++;
    return [`John${count}`, `Doe${count}`];
  };
})();

const writeCSVLine = (out: WriteStream, data: unknown[]): void => {
  // Simple method for writing CSV data
  for (let i = 0; i < data.length; i++) {
    if (i > 0) {
      out.write(',');
    }
    const value = data[i];
    if (value === null) {
      out.write('null');
    } else if (typeof value !== 'undefined') {
      // Everything else is handled via toString()
      const str = value.toString();
      // If the string has commas in it, it needs to be escaped
      if (str.indexOf(',') >= 0) {
        out.write(`"${str.replace(/"/g, '""')}"`);
      } else {
        // Otherwise it can be written as normal
        out.write(str);
      }
    }
  }
  out.write('\n');
};

// Patient info
interface PatientInfo {
  mrn: string;
  // This is an array of string, string tuples: system, code
  conditions: [string, string][];
  medications: string[];
  observations: string[];
  stage: string;
}

function randomCode(codes: string[]): string {
  return codes[Math.floor(Math.random() * codes.length)];
}

function randomCodeSystem(codes: Map<string, string[]>): [string, string] {
  let totalCodes = 0;
  for (const codeList of codes.values()) {
    totalCodes += codeList.length;
  }
  // This assumes the lists are small enough that iterating is fine. Since
  // the max length at present is two, this is the case.
  let pickedCode = Math.floor(Math.random() * totalCodes);
  for (const [system, codeList] of codes.entries()) {
    if (pickedCode < codeList.length) {
      return [system, codeList[pickedCode]];
    }
    pickedCode -= codeList.length;
  }
  // Getting here should, in theory, be impossible
  throw new Error('Failed to pick a random code');
}

/**
 * Generates the patients and the patient data. This generates 1 patient per
 * disease type.
 */
function* generatePatients(): Generator<string[], PatientInfo[]> {
  // Write header
  yield ['mrn','familyName','givenName','gender','birthsex','dateOfBirth','race','ethnicity','language','addressLine','city','state','zip'];
  // Now generate patients.
  const patients: PatientInfo[] = [];
  let id = 0;
  for (const codes of ancoraDiseaseCodes.values()) {
    const patient: PatientInfo = {
      mrn: generateMRN(id++),
      conditions: [ randomCodeSystem(codes) ],
      medications: [],
      observations: [],
      stage: '3C',
    };
    patients.push(patient);
    const [givenName, familyName] = generatePatientName();
    // For now all patients are male and born 1980-01-01 as we do not use that information
    yield [patient.mrn, familyName, givenName, 'male', 'M', '1980-01-01', '', '', '', '', '', '', ''];
  }
  // Now that we have all the patients, go through and just assign random conditions and medications from all the codes
  // available...
  let patientIdx = 0;
  for (const mappings of ancoraCriterionCodes.values()) {
    const patient = patients[patientIdx];
    // And move to the next one, looping back to the start if we run out.
    patientIdx++;
    if (patientIdx >= patients.length) {
      patientIdx = 0;
    }
    // The code system determines the "type" of mappings
    for (const [system, codes] of mappings.entries()) {
      if (system === LOINC_SYSTEM) {
        // Observation
        patient.observations.push(randomCode(codes));
      } else if (system === RX_NORM_SYSTEM) {
        // Medication
        patient.medications.push(randomCode(codes));
      }
    }
  }
  return patients;
}

function* generateConditions(patients: PatientInfo[]): Generator<string[], void> {
  // First, yield the header
  yield ['mrn','conditionId','codeSystem','code','displayName','category','dateOfDiagnosis','clinicalStatus','verificationStatus','bodySite','laterality','histology'];
  // Then, yield one line per condition per patient
  let id = 0;
  for (const patient of patients) {
    for (const condition of patient.conditions) {
      yield [patient.mrn, `condition-${id++}`, condition[0], condition[1], '-', 'encounter-diagnosis', '2020-01-01','','','','',''];
    }
  }
}

function* generateMedications(patients: PatientInfo[]): Generator<string[], void> {
  // First, yield the header
  yield ['mrn','medicationId','code','codeSystem','displayText','startDate','endDate','treatmentReasonCode','treatmentReasonCodeSystem','treatmentReasonDisplayText','treatmentIntent','status'];
  // Then, yield one line per condition per patient
  let id = 0;
  for (const patient of patients) {
    for (const medication of patient.medications) {
      yield [patient.mrn, `medication-${id++}`, medication, RX_NORM_SYSTEM, '', '2020-01-01', '2020-06-01', '', '', '', '', 'in-progress'];
    }
  }
}

function* generateObservations(patients: PatientInfo[]): Generator<string[], void> {
  // First, yield the header
  yield ['mrn','observationId','status','code','codeSystem','displayName','value','valueCodeSystem','effectiveDate','bodySite','laterality'];
  // Then, yield one line per condition per patient
  let id = 0;
  for (const patient of patients) {
    for (const observation of patient.observations) {
      yield [patient.mrn, `observation-${id++}`, 'final', observation, LOINC_SYSTEM, '', 'value', 'http://www.example.com', '2020-01-01', '', ''];
    }
  }
}

function* generateStaging(patients: PatientInfo[]): Generator<string[], void> {
  yield ['mrn','conditionId','stageGroup','t','n','m','type','stagingSystem','stagingCodeSystem','effectiveDate'];
  let id = 0;
  for (const patient of patients) {
    yield [patient.mrn, `stage-${id++}`, patient.stage,'cT3','cN3','cM0','Clinical','443830009','http://snomed.info/sct','2020-01-01'];
  }
}

async function writeFile<T>(directory: string, filename: string, generator: (out: WriteStream) => T): Promise<T> {
  const handle = await fs.open(path.join(directory, filename), 'w');
  try {
    const stream = handle.createWriteStream({encoding: 'utf-8'});
    const result = generator(stream);
    stream.close();
    return result;
  } finally {
    await handle.close();
  }
}

function writeCSVFile<T>(directory: string, filename: string, generator: Generator<unknown[], T>): Promise<T> {
  return writeFile(directory, filename, (out) => {
    for (;;) {
      const next = generator.next();
      // The "=== true" bit is necessary for TypeScript to prove that done is
      // *actually* true, and therefore returning T, and not "truthy," and
      // therefore may be returning either the next or return value.
      if (next.done === true) {
        return next.value;
      } else {
        // Otherwise, write the line
        writeCSVLine(out, next.value);
      }
    }
  });
}

async function generateTestData(directory: string): Promise<void> {
  // Make sure the given directory exists for a start
  await fs.mkdir(directory, { recursive: true});
  const patients = await writeCSVFile(directory, 'patient-information.csv', generatePatients());
  await writeFile(directory, 'patient-mrns.csv', (out): void => {
    writeCSVLine(out, ['mrn']);
    for (const patient of patients) {
      writeCSVLine(out, [patient.mrn]);
    }
  });
  await writeCSVFile(directory, 'condition-information.csv', generateConditions(patients));
  await writeCSVFile(directory, 'cancer-related-medication-administration-information.csv', generateMedications(patients));
  await writeCSVFile(directory, 'observation-information.csv', generateObservations(patients));
  await writeCSVFile(directory, 'staging-information.csv', generateStaging(patients));
}

async function runCLI(argv: string[]): Promise<number> {
  let dir = 'data';
  // Currently there are no options other than the directory
  if (argv.length > 1) {
    console.error('Too many options');
    return 1;
  } else if (argv.length === 1) {
    dir = argv[0];
  }
  await generateTestData(dir);
  return 0;
}

// This isn't a module, it's a script, so always invoke the main function
runCLI(process.argv.slice(2)).then((exitCode) => {
  process.exitCode = exitCode;
}).catch((error) => {
  console.error('Error running process:');
  console.error(error);
  process.exitCode = 255;
});
