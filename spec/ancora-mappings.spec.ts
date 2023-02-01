import { CANCERSTAGING_SYSTEM, SNOMED_CT_SYSTEM } from '../src/ancora-mapping-data';
import { tumorStageForCode } from '../src/ancora-mappings';

describe('tumorStageForCode()', () => {
  it('handles upper and lower case codes for cancerstaging.org codes', () => {
    expect(tumorStageForCode(CANCERSTAGING_SYSTEM, '3A')).toBe(3);
    expect(tumorStageForCode(CANCERSTAGING_SYSTEM, '3a')).toBe(3);
  });

  it('accepted undefined', () => {
    expect(tumorStageForCode(undefined, undefined)).toBe(undefined);
    expect(tumorStageForCode(CANCERSTAGING_SYSTEM, undefined)).toBe(undefined);
  });

  it('handles an unknown system', () => {
    expect(tumorStageForCode('http://www.example.com/system/that/is/fake', 'fakecode')).toBe(undefined);
  });

  it('handles an unknown code', () => {
    expect(tumorStageForCode(SNOMED_CT_SYSTEM, 'fakecode')).toBe(undefined);
  });
});
