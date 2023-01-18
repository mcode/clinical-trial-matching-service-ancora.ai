// Utility script to check what flags in the criteria have codes mapped to them

import { AncoraCriterionFlag } from "./ancora-query";
import { ancoraCriterionCodes } from "./ancora-mapping-data";

// This type is to ensure nothing got missed
type MappedCriteria = Record<AncoraCriterionFlag, number>;

// Maps counts to known flags
const mappedCounts: MappedCriteria = {
  egfr: 0,
  kras: 0,
  alk: 0,
  braf: 0,
  ros1: 0,
  msi: 0,
  nras: 0,
  fgfr2: 0,
  idh1: 0,
  idh2: 0,
  flt3_itd: 0,
  flt3_tkd: 0,
  hras: 0,
  her2: 0,
  er: 0,
  pr: 0,
  brca1: 0,
  brca2: 0,
  hpv_18: 0,
  hpv_16: 0,
  brain_metastases: 0,
  controlled_brain_metastases: 0,
  uncontrolled_brain_metastases: 0,
  cns_leukemia: 0,
  untreated: 0,
  in_treatment: 0,
  remission: 0,
  relapsed: 0,
  nsclc: 0,
  sclc: 0,
  lung_large_cell_carcinoma: 0,
  lung_squamous_cell_carcinoma: 0,
  cervical_squamous_cell_carcinoma: 0,
  cervical_adenocarcinoma: 0,
  lung_adenocarcinoma: 0,
  pancreatic_adenocarcinoma: 0,
  crc_squamous: 0,
  cervical_adenosquamous_carcinoma: 0,
  crc_adenocarcinoma: 0,
  crc_carcinoid: 0,
  crc_lymphoma: 0,
  crc_neuroendocrine: 0,
  melanoma_cutaneous: 0,
  melanoma_mucosal: 0,
  melanoma_ocular: 0,
  intrahepatic_cholangiocarcinoma: 0,
  perihilar_cholangiocarcinoma: 0,
  distal_cholangiocarcinoma: 0,
  mixed_hepatocellular_cholangiocarcinoma: 0,
  gallbladder_cancer: 0,
  prostate_crpc: 0,
  breast_dcis: 0,
  breast_lcis: 0,
  breast_ibc: 0,
  breast_idc: 0,
  breast_ilc: 0,
  primary_liver_cancer: 0,
  secondary_liver_cancer: 0,
  pancreatic_endocrine: 0,
  pancreatic_exocrine: 0,
  aml_genetic_abnormalities: 0,
  aml_acute_promyelocytic_leukemia: 0,
  aml_myelodysplasia: 0,
  aml_therapy_related: 0,
  aml_myeloid_sarcoma: 0,
  aml_down_syndrome: 0,
  aml_nos: 0,
  mm_mgus: 0,
  mm_smoldering_myeloma: 0,
  mm_light_chain_myeloma: 0,
  mm_non_secretory_myeloma: 0,
  mm_typical_myeloma: 0,
  pregnant_nursing: 0,
  allergies_to_medication: 0,
  hiv: 0,
  liver_diseases: 0,
  cardiac_disorders: 0,
  kidney_diseases: 0,
  diabetes: 0,
  postmenopausal: 0,
  premenopausal: 0,
  hpv_vaccination: 0,
  chemotherapy: 0,
  hormonal_therapy: 0,
  radiation_therapy: 0,
  major_surgery: 0,
  immunotherapy: 0,
  braf_therapy: 0,
  mek_therapy: 0,
  orchiectomy: 0,
  lhrh_agonists: 0,
  lhrh_antagonists: 0,
  ad_therapy: 0,
  antiandrogens: 0,
  prostate_hormonal_therapy: 0,
  proteasome_inhibitors: 0,
  immunomodulators: 0,
  corticosteroids: 0,
  allogeneic_hematopoietic_stem_cell_transplantation: 0,
  autologous_hematopoietic_stem_cell_transplantation: 0,
}

for (const [flag, mappings] of ancoraCriterionCodes) {
  // Count up the mappings
  mappedCounts[flag] = Array.from(mappings.values()).reduce(
    (count, mappedValues) => count += mappedValues.length,
    0
  );
}

// And report:

// Convert to pairs so we can sort this mess
const mappedCountPairs = Array.from(Object.keys(mappedCounts)).map((flag: AncoraCriterionFlag) => [ flag, mappedCounts[flag] ]);

mappedCountPairs.sort((a, b) => {
  if (a[1] == b[1]) {
    // Sort by name
    return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0);
  }
  // Reverse order for count
  return a[1] < b[1] ? 1 : -1;
});

let missing = 0;
// And output as something that may be CSV-able
for (const pair of mappedCountPairs) {
  console.log(`${pair[0]},${pair[1]}`);
  if (pair[1] === 0) {
    missing++;
  }
}

console.log();
console.log(`Total flags with no mapped codes: ${missing}`);
