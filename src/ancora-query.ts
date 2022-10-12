/**
 * Module for Ancora types.
 */

/**
 * An AncoraQuery object.
 */
 export interface AncoraQuery {
  /**
   * Two digit [sic] country code (presumably ISO-3166 alpha-2 codes?)
   */
  country: string;

  /**
   * What is the zip code for the request (then we limit to 400 km/ mi radius)
   * 02108'
   */
  zip_code?: string;

  /**
   * What is the type of cancer
   * breast_cancer, cervical_cancer, lung_cancer, melanoma, colorectal_cancer, kidney_cancer, prostate_cancer, liver_cancer, pancreatic_cancer, cholangiocarcinoma, esophageal_cancer, gastric_cancer, acute_myeloid_leukemia, myeloma
   */
  type_of_disease: "breast_cancer" | "cervical_cancer" | "lung_cancer" |
    "melanoma" | "colorectal_cancer" | "kidney_cancer" | "prostate_cancer" |
    "liver_cancer" | "pancreatic_cancer" | "cholangiocarcinoma" |
    "esophageal_cancer" | "gastric_cancer" | "acute_myeloid_leukemia" |
    "myeloma";

  location?: {
    lat: number,
    long: number
  };

  /**
   * an integer defining search radius
   */
  radius?: number;

  radius_unit?: "MI" | "KM";

  /**
   * an object containing filtering parameters
   */
  criterions?: AncoraCriteria;
}

export interface AncoraCriteria {
  /**
   * Has the tumor been tested positive for EGFR
   */
  egfr?: boolean;
  /**
   * Has the tumor been tested positive for KRAS
   * true, false
   */
  kras?: boolean;
  /**
   * Has the tumor been tested positive for ALK
   * true, false
   */
  alk?: boolean;
  /**
   * Has the tumor been tested positive for BRAF
   * true, false
   */
  braf?: boolean;
  /**
   * Has the tumor been tested positive for ROS1
   * true, false
   */
  ros1?: boolean;
  /**
   * Does the patient's cancer have a high level of microsatellite-instability (MSI-H) (or dMMR)
   * true, false
   */
  msi?: boolean;
  /**
   * Has the tumor been tested positive for NRAS
   * true, false
   */
  nras?: boolean;
  /**
   * Has the tumor been tested positive for FGRF2
   * true, false
   */
  fgfr2?: boolean;
  /**
   * Has the tumor been tested positive for IDH1
   * true, false
   */
  idh1?: boolean;
  /**
   * Has the tumor been tested positive for IDH2
   * true, false
   */
  idh2?: boolean;
  /**
   * Has the tumor been tested positive for FLT3-ITD
   * true, false
   */
  flt3_itd?: boolean;
  /**
   * Has the tumor been tested positive for FLT3-TKD
   * true, false
   */
  flt3_tkd?: boolean;
  /**
   * Has the tumor been tested positive for HRAS
   * true, false
   */
  hras?: boolean;
  /**
   * Has the tumor been tested positive for HER2
   * true, false
   */
  her2?: boolean;
  /**
   * Has the tumor been tested positive for ER
   * true, false
   */
  er?: boolean;
  /**
   * Has the tumor been tested positive for PR
   * true, false
   */
  pr?: boolean;
  /**
   * Has the tumor been tested positive for BRCA1
   * true, false
   */
  brca1?: boolean;
  /**
   * Has the tumor been tested positive for BRCA2
   * true, false
   */
  brca2?: boolean;
  /**
   * How large is the diameter of the main tumor in centimeters
   * 0-35
   */
  tumor_size?: number;
  /**
   * What is the patient's tumor stage? (solid tumor)
   * 0-4
   */
  tumor_stage?: number;
  /**
   * Has the cancer been tested positive for the HPV18 strain
   * true, false
   */
  hpv_18?: boolean;
  /**
   * Has the cancer been tested positive for the HPV16 strain
   * true, false
   */
  hpv_16?: boolean;
  /**
   * What is the patient's most recent level of prostate-specific antigen (PSA)
   * 0-100
   */
  psa?: number;
  /**
   * Does the patient have brain metastases
   * true, false
   */
  brain_metastases?: boolean;
  /**
   * Does the patient have controlled brain metastates
   * true, false
   */
  controlled_brain_metastases?: boolean;
  /**
   * Does the patient have uncontrolled brain metastates
   * true, false
   */
  uncontrolled_brain_metastases?: boolean;
  /**
   * Does the patient have CNS involvement
   * true, false
   */
  cns_leukemia?: boolean;
  /**
   * What is the patient's treatment stage? (Hemoc)
   * true, false
   */
  untreated?: boolean;
  /**
   * What is the patient's treatment stage? (Hemoc)
   * true, false
   */
  in_treatment?: boolean;
  /**
   * What is the patient's treatment stage? (Hemoc)
   * true, false
   */
  remission?: boolean;
  /**
   * What is the patient's treatment stage? (Hemoc)
   * true, false
   */
  relapsed?: boolean;
  /**
   * Does the patient have non small cell lung cancer?
   * true, false
   */
  nsclc?: boolean;
  /**
   * Does the patient have small cell lung cancer?
   * true, false
   */
  sclc?: boolean;
  /**
   * Does the patient have Non small cell lung cancer- large cell carcinoma?
   * true, false
   */
  lung_large_cell_carcinoma?: boolean;
  /**
   * Does the patient have Non small cell lung cancer- squamous cell carcinoma?
   * true, false
   */
  lung_squamous_cell_carcinoma?: boolean;
  /**
   * Does the patient have Cervical cancer- squamous cell carcinoma?
   * true, false
   */
  cervical_squamous_cell_carcinoma?: boolean;
  /**
   * Has the patient's cancer been classified as Cervical Cancer- adenocarcinoma?
   * true, false
   */
  cervical_adenocarcinoma?: boolean;
  /**
   * Has the patient's cancer been classified as Non small cell lung cancer- adenocarcinoma?
   * true, false
   */
  lung_adenocarcinoma?: boolean;
  /**
   * Has the patient's cancer been classified as Pancreatic Cancer- adenocarcinoma?
   * true, false
   */
  pancreatic_adenocarcinoma?: boolean;
  /**
   * Has the patient's cancer been classified as Colorectal Cancer-squamous?
   * true, false
   */
  crc_squamous?: boolean;
  /**
   * Has the patient's cancer been classified as Cervical cancer- adenosquamous carcinoma?
   * true, false
   */
  cervical_adenosquamous_carcinoma?: boolean;
  /**
   * Has the patient's cancer been classified as Colorectal Cancer- adenocarcinoma?
   * true, false
   */
  crc_adenocarcinoma?: boolean;
  /**
   * Has the patient's cancer been classified as Colorectal Cancer- carcinoid?
   * true, false
   */
  crc_carcinoid?: boolean;
  /**
   * Has the patient's cancer been classified as Colorectal Cancer- lymphoma?
   * true, false
   */
  crc_lymphoma?: boolean;
  /**
   * Has the patient's cancer been classified as Colorectal Cancer- neuroendocrine
   * true, false
   */
  crc_neuroendocrine?: boolean;
  /**
   * Has the patient's cancer been classified as  Melanoma- cutaneous?
   * true, false
   */
  melanoma_cutaneous?: boolean;
  /**
   * Has the patient's cancer been classified as  Melanoma- mucosal?
   * true, false
   */
  melanoma_mucosal?: boolean;
  /**
   * Has the patient's cancer been classified as  Melanoma- ocular?
   * true, false
   */
  melanoma_ocular?: boolean;
  /**
   * Has the patient's cancer been classified as  Bile Duct cancer- intrahepatic cholangiocarcinoma
   * true, false
   */
  intrahepatic_cholangiocarcinoma?: boolean;
  /**
   * Has the patient's cancer been classified as  Bile Duct cancer- perihilar cholangiocarcinoma
   * true, false
   */
  perihilar_cholangiocarcinoma?: boolean;
  /**
   * Has the patient's cancer been classified as  Bile Duct cancer- distal cholangiocarcinoma
   * true, false
   */
  distal_cholangiocarcinoma?: boolean;
  /**
   * Has the patient's cancer been classified as  Bile Duct cancer- combined hepatocellular and intrahepatic cholangiocarcinoma?
   * true, false
   */
  mixed_hepatocellular_cholangiocarcinoma?: boolean;
  /**
   * Has the patient's cancer been classified as  Bile Duct cancer-gall bladder cancer?
   * true, false
   */
  gallbladder_cancer?: boolean;
  /**
   * Has the patient's cancer been classified as Castrate-Resistant Prostate Cancer (CRPC) based on the response to hormone therapy
   * true, false
   */
   prostate_crpc?: boolean;
  /**
   * Has the patient's cancer been classified as Breast Cancer- ductal carcinoma in situ ?
   * true, false
   */
  breast_dcis?: boolean;
  /**
   * Has the patient's cancer been classified as Breast Cancer- lobular carcinoma in situ ?
   * true, false
   */
  breast_lcis?: boolean;
  /**
   * Has the patient's cancer been classified as Breast Cancer- inflammatory breast cancer ?
   * true, false
   */
   breast_ibc?: boolean;
  /**
   * Has the patient's cancer been classified as Breast Cancer- invasive/ infiltrating ductal carcinoma ?
   * true, false
   */
   breast_idc?: boolean;
  /**
   * Has the patient's cancer been classified as Breast Cancer- invasive/ infiltrating lobular carcinoma ?
   * true, false
   */
   breast_ilc?: boolean;
  /**
   * Has the patient's cancer been classified as primary liver cancer?
   * true, false
   */
   primary_liver_cancer?: boolean;
  /**
   * Has the patient's cancer been classified as secondary liver cancer?
   * true, false
   */
   secondary_liver_cancer?: boolean;
  /**
   * Has the patient's cancer been classified as Pancreatic Cancer- neuroendocrine tumor subtype?
   * true, false
   */
   pancreatic_endocrine?: boolean;
  /**
   * Has the patient's cancer been classified as Pancreatic Cancer- exocrine subtype?
   * true, false
   */
   pancreatic_exocrine?: boolean;
  /**
   * Has the patient's cancer been classified as acute myeloid leukemia with certain genetic abnormalities (exluding APL)?
   * true, false
   */
   aml_genetic_abnormalities?: boolean;
  /**
   * Has the patient's cancer been classified as acute myeloid leukemia - acute promyelocytic leukaemia?
   * true, false
   */
   aml_acute_promyelocytic_leukemia?: boolean;
  /**
   * Has the patient's cancer been classified as acute myeloid leukemia - with myelodysplasia-related changes?
   * true, false
   */
   aml_myelodysplasia?: boolean;
  /**
   * Has the patient's cancer been classified as acute myeloid leukemia related to previous chemotherapy or radiation?
   * true, false
   */
   aml_therapy_related?: boolean;
  /**
   * Has the patient's cancer been classified as acute myeloid leukemia- myeloid sarcoma?
   * true, false
   * Note: Original was "aml_ myeloid_sarcoma", space assumed to be in error.
   */
  aml_myeloid_sarcoma?: boolean;
  /**
   * Has the patient's cancer been classified as acute myeloid leukemia- myeloid proliferations related to Down syndrome?
   * true, false
   * Note: Original key started with a space, which is assumed to not be part of the key.
   */
  aml_down_syndrome?: boolean;
  /**
   * Has the patient's cancer been classified as acute myeloid leukemia- not otherwise specified?
   * true, false
   * Note: Original key started with a space, which is assumed to not be part of the key.
   */
  aml_nos?: boolean;
  /**
   * Has the patient's cancer been classified as multiple myeloma- monoclonal gammopathy of undertermined significance?
   * true, false
   * Note: Original was "mm_ mgus", space assumed to be in error.
   */
  mm_mgus?: boolean;
  /**
   * Has the patient's cancer been classified as smoldering multiple myeloma?
   * true, false
   */
  mm_smoldering_myeloma?: boolean;
  /**
   * Has the patient's cancer been classified as light chain multiple myeloma (bence jones myeloma)?
   * true, false
   */
  mm_light_chain_myeloma?: boolean;
  /**
   * Has the patient's cancer been classified as non-secretory multiple myeloma?
   * true, false
   */
  mm_non_secretory_myeloma?: boolean;
  /**
   * Has the patient's cancer been classified as typical multiple myeloma (IgG, IgA, IgD, IgE, or IgM)?
   * true, false
   */
  mm_typical_myeloma?: boolean;
  /**
   * Natal sex of patient
   * male, female
   */
  natal_sex?: "male" | "female";
  /**
   * Age of patient
   * 1-100
   */
  age?: number;
  /**
   * Is the patient pregnant or nursing
   * true, false
   */
  pregnant_nursing?: boolean;
  /**
   * Does the patient have any allergies to medication
   * true, false
   */
  allergies_to_medication?: boolean;
  /**
   * Does the patient have HIV
   * true, false
   */
  hiv?: boolean;
  /**
   * Does the patient have any liver diseases
   * true, false
   */
  liver_diseases?: boolean;
  /**
   * Does the patient have any cardiac disorders
   * true, false
   */
  cardiac_disorders?: boolean;
  /**
   * Does the patient have any kidney diseases
   * true, false
   */
  kidney_diseases?: boolean;
  /**
   * What is the patient's karnofsky status
   * 10-100
   */
  karnofsky?: number;
  /**
   * What is the patient's ECOG status
   * 0-4
   */
  ecog?: number;
  /**
   * Does the patient have diabetes
   * true, false
   */
  diabetes?: boolean;
  /**
   * Is the patient postmenopausal
   * true, false
   */
  postmenopausal?: boolean;
  /**
   * Is the patient premenopausal
   * true, false
   */
  premenopausal?: boolean;
  /**
   * Has the patient been vaccinated for HPV
   * true, false
   */
  hpv_vaccination?: boolean;
  /**
   * What country is the request for
   * US, UK, ES, CH
   */
  country_code?: "US" | "UK" | "ES" | "CH";
  /**
   * Has the patient had chemotherapy administered
   * true, false
   */
  chemotherapy?: boolean;
  /**
   * Has the patient received hormonal therapy
   * true, false
   */
  hormonal_therapy?: boolean;
  /**
   * Has the patient had radiotherapy
   * true, false
   */
  radiation_therapy?: boolean;
  /**
   * Has the patient had cancer surgery
   * true, false
   */
  major_surgery?: boolean;
  /**
   * Has the patient received immunotherapy
   * true, false
   */
  immunotherapy?: boolean;
  /**
   * Has the patient received a BRAF inhibitor?
   * true, false
   */
  braf_therapy?: boolean;
  /**
   * Has the patient received a MEK inhibitor?
   * true, false
   */
  mek_therapy?: boolean;
  /**
   * Has the patient had an orchiectomy?
   * true, false
   */
  orchiectomy?: boolean;
  /**
   * Has the patient received luteinizing hormone-releasing hormone agonists (LHRH)
   * true, false
   */
  lhrh_agonists?: boolean;
  /**
   * Has the patient received luteinizing hormone-releasing hormone antagonists (LHRH)
   * true, false
   */
  lhrh_antagonists?: boolean;
  /**
   * Has the patient received other androgen deprivation therapy
   * true, false
   */
  ad_therapy?: boolean;
  /**
   * Has the patient received anti-androgens
   * true, false
   */
  antiandrogens?: boolean;
  /**
   * Has the patient received other hormone treatments (i.e. finasteride, dutasteride)
   * true, false
   */
  prostate_hormonal_therapy?: boolean;
  /**
   * Has the patient received a proteasome inhibitor
   * true, false
   */
  proteasome_inhibitors?: boolean;
  /**
   * Has the patient received an immunomodulator
   * true, false
   */
  immunomodulators?: boolean;
  /**
   * Has the patient received corticosteroids
   * true, false
   */
  corticosteroids?: boolean;
  /**
   * Has the patient received an allogeneic hematopoietic stem cell transplantation
   * true, false
   */
  allogeneic_hematopoietic_stem_cell_transplantation?: boolean;
  /**
   * Has the patient received an autologous hematopoietic stem cell transplantation
   * true, false
   */
  autologous_hematopoietic_stem_cell_transplantation?: boolean;
}

/**
 * Set of valid flag values within the criterions. These are the keys within
 * AncoraCriterions where the property is a boolean. This can be used to ensure
 * that something like:
 *
 * ```typescript
 * let flag: AncoraCriterionFlag = 'in_treatment';
 * query.criterions[flag] = true;
 * ```
 *
 * Can be proven valid to the TypeScript compiler.
 */
 export type AncoraCriterionFlag = {
  // Some TypeScript magic: create a type that is simply a set of values that
  // are either themselves if originally a boolean or never, then index on
  // those keys, producing a final list of strings that are booleans.
  [K in keyof AncoraCriteria]: AncoraCriteria[K] extends boolean ? K : never;
}[keyof AncoraCriteria];
