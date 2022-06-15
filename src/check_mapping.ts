//
// This file examines a set of responses from Ancora.ai and outputs various
// information about them. It was used to build the mappings in
// research-mappings.ts.
//
// It's kept (for now) for reference but may be removed in the future.
//
import fs from 'fs';

import { AncoraResponse, isAncoraResponse, isAncoraTrial, isAncoraTrialLocation } from './query';

function scanFile(filename: string): void {
  const text = fs.readFileSync(filename, { encoding: 'utf-8' });
  const json: unknown = JSON.parse(text);
  if (typeof json !== 'object') {
    throw new Error('Invalid object ' + typeof json);
  }
  if (json === null) {
    throw new Error('Invalid object null');
  }
  if (isAncoraResponse(json)) {
    scanResults(json);
  } else {
    throw new Error('JSON object not a results object');
  }
}

function scanResults(results: AncoraResponse): void {
  const recruitingStatusTypes = new Set<string>();
  const phases = new Set<string>();
  const primaryPurposes = new Set<string>();
  const studyTypes = new Set<string>();
  const seenKeys = new Map<string, Set<string>>();
  for (const nctId in results.trials) {
    const trial = results.trials[nctId];
    if (isAncoraTrial(trial)) {
      recruitingStatusTypes.add(trial.recruiting_status);
      phases.add(trial.trial_phase);
      primaryPurposes.add(trial.primary_purpose);
      studyTypes.add(trial.study_type);
      // grab existing keys and what type they are
      for (const key in trial) {
        let types = seenKeys.get(key);
        if (!types) {
          types = new Set<string>();
          seenKeys.set(key, types);
        }
        types.add(Array.isArray(trial[key]) ? 'Array' : typeof trial[key]);
      }
      // make sure locations are all valid as far as we know
      for (const location of trial.locations) {
        if (!isAncoraTrialLocation(location)) {
          console.error('Warning: Invalid location found:');
          console.error(JSON.stringify(location, null, 2));
        }
      }
    } else {
      console.error('Warning: ignored trial due to failure to pass type guard!');
    }
  }
  console.log('Known keys:');
  const entries = Array.from(seenKeys.entries()).sort((a, b) => a[0] < b[0] ? -1 : (a == b ? 0 : 1));
  for (const entry of entries) {
    console.log(`  ${JSON.stringify(entry[0])}: ${JSON.stringify(Array.from(entry[1]).sort())}`);
  }
  console.log('Seen primary purposes:');
  console.log(JSON.stringify(Array.from(primaryPurposes).sort(), null, 2));
  console.log('Seen recruiting types:');
  console.log(JSON.stringify(Array.from(recruitingStatusTypes).sort(), null, 2));
  console.log('Seen phases:');
  console.log(JSON.stringify(Array.from(phases).sort(), null, 2));
  console.log('Seen study types:');
  console.log(JSON.stringify(Array.from(studyTypes).sort(), null, 2));
}

if (require.main === module) {
  // scan arguments
  for (let i = 2; i < process.argv.length; i++) {
    console.log(`Scanning ${process.argv[i]}...`);
    try {
      scanFile(process.argv[i]);
    } catch (ex) {
      console.error(`Exception scanning ${process.argv[i]}:`);
      console.error(ex);
    }
  }
}
