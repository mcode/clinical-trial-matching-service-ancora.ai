/**
 * Contains mappings between various known codes and their Ancora query
 * boolean fields.
 */

import { fhir } from 'clinical-trial-matching-service';
import { AncoraQuery, AncoraCriterionFlag } from './ancora-query';

const LOINC_SYSTEM = 'http://loinc.org';
const RX_NORM_SYSTEM = 'http://www.nlm.nih.gov/research/umls/rxnorm';
const SNOMED_CT_SYSTEM = 'http://snomed.info/sct';

// Because the systems are all constant string values, typeof works to "extract"
// the string value to a TypeScript type. This type is mainly used for "typo
// checking" in the mappings coded below.
type FhirSystem = typeof LOINC_SYSTEM | typeof RX_NORM_SYSTEM | typeof SNOMED_CT_SYSTEM;
type CodeMappings = Map<FhirSystem, string[]>;

const ancoraToCodes = new Map<AncoraCriterionFlag, CodeMappings>([
  [
    'alk',
    new Map<FhirSystem, string[]>([
      [
        LOINC_SYSTEM,
        ['78205-2', '78210-2', '100019-9', '7451-8', '78233-4']
      ]
    ])
  ],
  [
    'ros1',
    new Map<FhirSystem, string[]>([
      [ LOINC_SYSTEM, ['81747-8'] ]
    ])
  ],
  [
    'idh2',
    new Map<FhirSystem, string[]>([
      [ LOINC_SYSTEM, ['100023-1', '95772-0'] ]
    ])
  ],
  [
    'flt3_itd',
    new Map<FhirSystem, string[]>([
      [ LOINC_SYSTEM, ['98489-8', '79210-1', '85100-6', '92844-0'] ]
    ])
  ],
  [
    'flt3_tkd',
    new Map<FhirSystem, string[]>([
      [ LOINC_SYSTEM, ['92843-2', '72520-0', '98490-6'] ]
    ])
  ],
  [
    'hras',
    new Map<FhirSystem, string[]>([
      [ LOINC_SYSTEM, ['53871-0', '21699-4', '21698-6', '53623-5'] ]
    ])
  ],
  [
    'orchiectomy',
    new Map<FhirSystem, string[]>([
      [RX_NORM_SYSTEM,
        [
          '767348006', '767347001', '767344008', '767343002', '767342007',
          '767341000', '767339001', '767337004', '767336008', '767335007',
          '396692006', '236334001', '176418008', '176417003', '176416007',
          '116171002', '112910006', '87375004',
        ]
      ]
    ])
  ],
  [
    'allogeneic_hematopoietic_stem_cell_transplantation',
    new Map<FhirSystem, string[]>([
      [ RX_NORM_SYSTEM, ['425843001'] ]
    ])
  ],
  [
    'autologous_hematopoietic_stem_cell_transplantation',
    new Map<FhirSystem, string[]>([
      [ RX_NORM_SYSTEM, ['425983008', '709115004'] ]
    ])
  ],
  [
    'braf_therapy',
    new Map<FhirSystem, string[]>([
      [
        RX_NORM_SYSTEM,
        [
          '2049112', '2049106', '2049117', '2049121', '2049113', '2049120',
          '2049114', '2049119', '2049111', '2049107', '2049118', '2049110',
          '2049108', '2049109', '2049115', '2049116', '1425223', '1424911',
          '1425222', '1425228', '1425230', '1425224', '1425229', '1425225',
          '1424918', '1424916', '1424912', '1424917', '1424915', '1424913',
          '1424914', '1425226', '1425227', '1147224', '1147220', '1147228',
          '1147225', '1147227', '1147223', '1147221', '1147222', '1160508',
          '1160509', '1187234', '1187235',
        ]
      ]
    ])
  ],
  [
    'mek_therapy',
    new Map<FhirSystem, string[]>([
      [
        RX_NORM_SYSTEM,
        [
          '1425105', '1425099', '1425098', '1425118', '1425110', '1425106',
          '1425117', '1425107', '1425116', '1425104', '1425100', '1425115',
          '1425103', '1425101', '1425102', '1425108', '1425109', '2049128',
          '2049122', '2049133', '2049129', '2049130', '2049127', '2049123',
          '2049126', '2049124', '2049125', '2049131', '2049132', '1722371',
          '1722365', '1722380', '1722376', '1722372', '1722373', '1722370',
          '1722366', '1722369', '1722367', '1722368', '1722374', '1722375',
        ]
      ]
    ])
  ],
  [
    'lhrh_agonists',
    new Map<FhirSystem, string[]>([
      [
        RX_NORM_SYSTEM,
        [
          '203852', '352619', '2371769', '1488617', '1488619', '1488616',
          '1488618', '42375', '203217', '1946522', '1946520', '2371773',
          '1115259', '1115468', '1115456', '1115459', '1115449', '825333',
          '825334', '825335', '825325', '1115464', '1115473', '1115258',
          '1115448', '1115455', '1115458', '1115463', '1115470', '583426',
          '583431', '583436', '2371770', '727602', '825324', '2371771',
          '545848', '1946521', '545835', '752894', '1115457', '1115447',
          '1115257', '1115467', '1115472', '1116124', '1115454', '1115462',
          '1946519', '752899', '752889', '583425', '752884', '1115446',
          '1115461', '545830', '545834', '545843', '545847', '583424', '583429',
          '583434', '372576', '378232', '727599', '1163443', '2371772',
          '1173874', '1181489', '58328', '50610', '203146', '105641', '211544',
          '564142', '571914', '370482', '314008', '310592', '353411', '358339',
          '379243', '1156883', '1188163', '905054', '38782', '338529', '905060',
          '905064', '905057', '905059', '1863373', '1863378', '1863382',
          '1863374', '905053', '199821', '905062', '1863370', '1863376',
          '1863380', '1863371', '1159353', '1179671', '2595041', '2595045',
          '2595049', '2595046', '2595048', '2595047',
        ]
      ]
    ]),
  ],
  [
    'lhrh_antagonists',
    new Map<FhirSystem, string[]>([
      [
        RX_NORM_SYSTEM,
        [
          '858122', '475230', '835863', '858125', '858127', '1812347',
          '1812352', '1812348', '828749', '828751', '1812344', '1812350',
          '1812345', '1157202', '1169000', '2556803', '2472784', '2472778',
          '2556806', '2556800', '2472789', '2556798', '2472785', '2556805',
          '2472786', '2472783', '2556799', '2556796', '2472779', '2556797',
          '2472782', '2556801', '2556802', '2472780', '2472781', '2556795',
          '2556804', '2472787', '2472788',
        ]
      ]
    ])
  ],
  [
    'ad_therapy',
    new Map<FhirSystem, string[]>([
      [
        RX_NORM_SYSTEM,
        [
          '203852', '352619', '2371769', '1488617', '1488619', '1488616',
          '1488618', '42375', '203217', '1946522', '1946520', '2371773',
          '1115259', '1115468', '1115456', '1115459', '1115449', '825333',
          '825334', '825335', '825325', '1115464', '1115473', '1115258',
          '1115448', '1115455', '1115458', '1115463', '1115470', '583426',
          '583431', '583436', '2371770', '727602', '825324', '2371771',
          '545848', '1946521', '545835', '752894', '1115457', '1115447',
          '1115257', '1115467', '1115472', '1116124', '1115454', '1115462',
          '1946519', '752899', '752889', '583425', '752884', '1115446',
          '1115461', '545830', '545834', '545843', '545847', '583424', '583429',
          '583434', '372576', '378232', '727599', '1163443', '2371772',
          '1173874', '1181489', '58328', '50610', '203146', '105641', '211544',
          '564142', '571914', '370482', '314008', '310592', '353411', '358339',
          '379243', '1156883', '1188163', '905054', '38782', '338529', '905060',
          '905064', '905057', '905059', '1863373', '1863378', '1863382',
          '1863374', '905053', '199821', '905062', '1863370', '1863376',
          '1863380', '1863371', '1159353', '1179671', '2595041', '2595045',
          '2595049', '2595046', '2595048', '2595047', '858122', '475230',
          '835863', '858125', '858127', '1812347', '1812352', '1812348',
          '828749', '828751', '1812344', '1812350', '1812345', '1157202',
          '1169000', '2556803', '2472784', '2472778', '2556806', '2556800',
          '2472789', '2556798', '2472785', '2556805', '2472786', '2472783',
          '2556799', '2556796', '2472779', '2556797', '2472782', '2556801',
          '2556802', '2472780', '2472781', '2556795', '2556804', '2472787',
          '2472788', '1100076', '1100072', '1100071', '1918044', '1100079',
          '1100077', '1918043', '1100078', '1100075', '1918042', '1100073',
          '1918041', '1100074', '1163656', '1163657', '1186683', '1186684',
          '202692', '6135', '206978', '608844', '564507', '608843', '402946',
          '106336', '240812', '330469', '335100', '377504', '1160957',
          '1295391', '1184476', '1296820', '4508', '199609', '197726', '315960',
          '332500', '372251', '372252', '1161458', '1161459', '151495', '83008',
          '108828', '564608', '369055', '199123', '349406', '315478', '350633',
          '371070', '1161189', '1161190', '1175807', '1175808', '218741',
          '31805', '284551', '574979', '367745', '311982', '331558', '373082',
          '1158946', '1158947', '1183905', '1183906', '1307304', '1307298',
          '2390650', '1307309', '2390646', '1307305', '2390649', '1307306',
          '2390645', '2390644', '2390648', '1307303', '1307299', '2390647',
          '1307302', '2390643', '1307300', '1307301', '1307307', '1307308',
          '1999582', '1999574', '1999587', '1999583', '1999584', '1999581',
          '1999577', '1999580', '1999578', '1999579', '1999585', '1999586',
          '2180331', '2180325', '2180336', '2180332', '2180333', '2180330',
          '2180326', '2180329', '2180327', '2180328', '2180334', '2180335',
        ]
      ]
    ])
  ],
  [
    'antiandrogens',
    new Map<FhirSystem, string[]>([
      [
        RX_NORM_SYSTEM,
        [
          '4508', '199609', '197726', '315960', '332500', '372251', '372252',
          '1161458', '1161459', '151495', '83008', '108828', '564608', '369055',
          '199123', '349406', '315478', '350633', '371070', '1161189',
          '1161190', '1175807', '1175808', '218741', '31805', '284551',
          '574979', '367745', '311982', '331558', '373082', '1158946',
          '1158947', '1183905', '1183906', '1307304', '1307298', '2390650',
          '1307309', '2390646', '1307305', '2390649', '1307306', '2390645',
          '2390644', '2390648', '1307303', '1307299', '2390647', '1307302',
          '2390643', '1307300', '1307301', '1307307', '1307308', '1999582',
          '1999574', '1999587', '1999583', '1999584', '1999581', '1999577',
          '1999580', '1999578', '1999579', '1999585', '1999586', '2180331',
          '2180325', '2180336', '2180332', '2180333', '2180330', '2180326',
          '2180329', '2180327', '2180328', '2180334', '2180335',
        ]
      ]
    ])
  ],
  [
    'proteasome_inhibitors',
    new Map<FhirSystem, string[]>([
      [
        RX_NORM_SYSTEM,
        [
          '356733', '358258', '402244', '1804996', '1804997', '402243',
          '1804993', '1804994', '1163075', '1187756', '1723758', '1723735',
          '1723734', '1723767', '1723763', '1723772', '1723759', '1723766',
          '1723771', '1723760', '1723757', '1723765', '1723770', '1723753',
          '1723764', '1723769', '1723756', '1723754', '1723755', '1723761',
          '1723762', '1302971', '1302966', '2046644', '1806942', '1806937',
          '1806935', '1806941', '2046643', '1806936', '2046642', '1806934',
          '1806940', '1806932', '1806939', '2046641', '1806933', '1302968',
          '1302974',
        ]
      ]
    ])
  ],
  [
    'immunomodulators',
    new Map<FhirSystem, string[]>([
      [
        RX_NORM_SYSTEM,
        [
          '220239', '10432', '700418', '213360', '404449', '404450', '573254',
          '576406', '576407', '700417', '366451', '360177', '200390', '360176',
          '700416', '316784', '360321', '360322', '700415', '374072', '1164873',
          '1164874', '1184929', '1184930', '337535', '342369', '1429367',
          '1242233', '616114', '643722', '616116', '643714', '616112', '616115',
          '643713', '643721', '1429366', '1242232', '616113', '602910',
          '602912', '1242231', '643712', '643720', '1428947', '602908',
          '602911', '643711', '643719', '1428946', '1242230', '602909',
          '1162569', '1162570', '1182522', '1182529', '1369719', '1369713',
          '1369728', '1369724', '1369736', '1369732', '1369720', '1369727',
          '1369731', '1369735', '1369721', '1369730', '1369718', '1369726',
          '1369734', '1369714', '1369725', '1369729', '1369733', '1369717',
          '1369715', '1369716', '1369722', '1369723',
        ]
      ]
    ])
  ]
]);

// TODO: Don't know how to code the following:
// CancerGeneticVariant component:GeneStudied valueCodeableConcept = HGNC
// HGNC:427	ALK
// CancerGeneticVariant component:GeneStudied valueCodeableConcept = HGNC
// HGNC:10261	ROS1
// etc.

// With the existing mappings, the most common lookup is actually [system, code]
// to an Ancora flag, so build that mapping

const codesToAncora = new Map<string, Map<string, Set<AncoraCriterionFlag>>>();

function codeMappingFor(system: FhirSystem): Map<string, Set<AncoraCriterionFlag>> {
  let mapping = codesToAncora.get(system);
  if (!mapping) {
    mapping = new Map<string, Set<AncoraCriterionFlag>>();
    codesToAncora.set(system, mapping);
  }
  return mapping;
}

for (const [flag, mappings] of ancoraToCodes.entries()) {
  for (const [system, codes] of mappings.entries()) {
    const systemMappings = codeMappingFor(system);
    for (const code of codes) {
      const existing = systemMappings.get(code);
      if (existing) {
        existing.add(flag);
      } else {
        systemMappings.set(code, new Set<AncoraCriterionFlag>([flag]))
      }
    }
  }
}

/**
 * Looks up all flags for a given code.
 * @param system the FHIR sysetm URI
 * @param code the code to look up
 * @returns null if the code is unknown, otherwise an array of all matching
 * flags
 */
export function findQueryFlagsForCode(system: string, code: string): AncoraCriterionFlag[] | null {
  // See if something exists
  const mapping = codesToAncora.get(system);
  if (mapping) {
    const flag = mapping.get(code);
    return Array.from(flag) ?? null;
  } else {
    return null;
  }
}

export type AncoraQueryDisease = AncoraQuery['type_of_disease'];

// Map of Ancora query diseases to SNOMED codes
const diseasesToCodes = new Map<AncoraQueryDisease, string[]>([
  [
    'cervical_cancer',
    [
      '363354003', '372024009', '208041000119100', '184781000119102',
      '1197350005', '1197268005', '1197263001', '1156807006', '773775004',
      '766930002', '766248004', '764951002', '764847000', '763064007',
      '763063001', '733834006', '722683006', '449059000', '448774004',
      '448607004', '423973006', '372100004', '372098004', '369591000',
      '369571007', '369556008', '285432005', '254888007', '188180002',
      '93789008', '93779009', '773283006', '763771009', '763408003',
      '385478001', '372099007', '372097009', '369574004', '369501008',
      '369500009', '369499000', '369498008', '369497003', '314970000',
      '254887002', '254886006', '188184006', '188183000', '188177003',
      '188176007', '123842006', '109880006',
    ]
  ],
  [
    'pancreatic_cancer',
    [
      '1197286008', '1197283000', '1197279000', '1187521002', '1187519007',
      '1148551007', '792907004', '785879009', '783771003', '783706007',
      '782697005', '780821007', '735735001', '733351008', '721718003',
      '713189001', '372142002', '372119009', '372003004', '371967001',
      '363369002', '363368005', '326072005', '254612002', '254609000',
      '235966007', '189814006', '94082003', '93939009', '93843007', '93715005',
      '16823941000119100', '681971000119100', '681911000119108',
      '681831000119107', '681721000119103', '681621000119105',
      '352701000119102', '1651000119109', '1208745002', '1208744003',
      '1186869002', '1186735007', '1141626005', '866052009', '866048009',
      '770602005', '715414009', '700423003', '363419009', '363418001',
      '363417006', '314964006', '285614004', '255088001', '254611009',
      '187798008', '187794005', '187793004', '187792009', '187791002',
      '187786003', '109848009',
    ]
  ],
  [
    'acute_myeloid_leukemia',
    [
      '351251000119103', '12291000132102', '12281000132104', '1162531007',
      '1157157006', '1148906001', '838355002', '780844005', '773537001',
      '766048008', '766046007', '766045006', '764940002', '764855007',
      '763796007', '763309005', '762315004', '734522002', '733598001',
      '725390002', '721306009', '721305008', '703387000', '702446006',
      '700057001', '698646006', '445448008', '444911000', '427658007',
      '426642002', '426124006', '425869007', '413442004', '413441006',
      '404152006', '359648001', '359640008', '359631009', '307592006',
      '285839005', '285769009', '278189009', '277604002', '277602003',
      '277601005', '110005000', '110004001', '109991003', '94148006',
      '93451002', '91861009', '91860005', '91858008',
// Note: The following codes are actually HistologyMorphology codes and probably won't show up here
// FIXME: Look for these in the proper MCode extension location
      '1162993004', '1162928000', '1157158001', '788740009', '783263001',
      '783017000', '734524001', '725391003', '703820005', '703819004',
      '703818007', '450937003', '450935006', '450929006', '450928003',
      '397344008', '397343002', '397342007', '397341000', '397340004',
      '128830003', '128829008', '128828000', '128827005', '103691009',
      '103690005', '103689001', '103688009', '80570006', '69077002', '52220008',
      '35287006', '30962008', '28950004', '22331004', '14317002',
    ]
  ],
  [
    'kidney_cancer',
    [
      '894171571000119000', '763101411000119000', '15959101000119100',
      '15959061000119100', '15958101000119100', '15958021000119100',
      '1082331000119100', '1082321000119100', '1082301000119100',
      '1082281000119100', '1080611000119100', '1080561000119100',
      '354361000119107', '354351000119105', '353111000119108',
      '352961000119103', '1187464007', '1148931000', '1148852009', '895345000',
      '878805009', '782722002', '765095002', '764990003', '764961009',
      '764856008', '764694005', '733608000', '733603009', '733471003',
      '733470002', '717736007', '717735006', '702391001', '408642003',
      '302849000', '254917006', '254916002', '254915003', '93985007',
      '93849006', '836486002', '713574000', '448215006', '363518003',
      '363457009', '314967004', '254918001', '236513009', '236512004',
      '188253000', '188252005', '188250002',
    ]
  ],
  [
    'esophageal_cancer',
    [
      '128041000119107', '1156810004', '783704005', '783183009', '722533007',
      '721628002', '721626003', '721625004', '721624000', '721623006',
      '721622001', '721621008', '721620009', '721619003', '721618006',
      '721617001', '372023003', '372017008', '371999007', '371998004',
      '371984007', '371978009', '371962007', '254551004', '254549003',
      '254547001', '254543002', '254539001', '254535007', '1156786006',
      '1153355009', '1144764001', '449153001', '449075002',
      '449055006', '449053004', '448229007', '440501006', '439478008',
      '438946002', '372138000', '363402007', '314960002', '307216009',
      '276804009', '276803003', '255078002', '187734007', '187727005',
      '187726001', '187725002', '187724003', '187723009', '187722004',
      '109835005',
    ]
  ],
  [
    'liver_cancer',
    [
      '1208349005', '1197204009', '1153383006', '787091002', '408646000',
      '314963000', '254601002', '253018005', '187777008',
      '187776004', '187773007', '109844006', '109841003', '93870000',
      '681751000119106', '1197342001', '1196881000', '1196854000', '1196846002',
      '1186630006', '1186629001', '860831008', '788982002',
      '770685009', '770684008', '716652006', '716648006',
      '447109003', '187769009', '109843000', '109842005', '95214007',
    ]
  ],
  [
    'cholangiocarcinoma',
    [
      '1144891007', '865951006', '721716004', '312104005', '253017000',
      '274902006', '1186631005',
      // These are histology morphology codes:
      '70179006', '52178006'
    ]
  ],
  [
    'melanoma',
    [
      '985355341000119000', '939595491000119000', '808558991000119000',
      '400375351000119000', '249389151000119000', '243971001000119000',
      '15951061000119100', '15951021000119100', '1081021000119100',
      '1080981000119100', '1080941000119100', '352201000119105',
      '352001000119100', '351961000119109', '1197334002', '1197332003',
      '1197324006', '1197294001', '1010631005', '866082003', '866079008',
      '866073009', '866072004', '830150003', '816204007', '783736003',
      '726019003', '723281005', '722665003', '722543005', '721627007',
      '721563000', '720587009', '717968005', '707362006', '707361004',
      '707350007', '698288007', '698287002', '698286006', '698285005',
      '698045009', '698044008', '698043002', '698042007', '698041000',
      '698040004', '449637003', '449636007', '448300007', '448298007',
      '448273006', '447712006', '443493003', '424487008', '424302003',
      '424190005', '423673009', '423494003', '423447006', '423280002',
      '403927001', '403926005', '403925009', '403924008', '403923002',
      '403922007', '403921000', '403920004', '403714009', '403274000',
      '402564006', '402563000', '402562005', '402561003', '402560002',
      '402559007', '402558004', '399660006', '372244006', '314987003',
      '314976006', '313248004', '310498001', '307603002', '302837001',
      '277530005', '276822007', '276821000', '276751004', '274087000',
      '269581007', '269580008', '269579005', '269578002', '255021005',
      '255015006', '255012009', '255004001', '254896002', '254734009',
      '254733003', '254732008', '254731001', '254730000', '231834005',
      '188077000', '188076009', '188075008', '188074007', '188073001',
      '188072006', '188071004', '188070003', '188069004', '188068007',
      '188065005', '188064009', '188063003', '188062008', '188061001',
      '188060000', '188055004', '188054000', '188052001', '188051008',
      '188050009', '188049009', '188046002', '188045003', '188044004',
      '188040008', '188038003', '188034001', '188033007', '188030005',
      '109267002', '93655004', '93654000', '93653006', '93652001', '93651008',
      '93650009', '93649009', '93648001', '93647006', '93646002', '93645003',
      '93644004', '93643005', '93642000', '93641007', '93640008', '93638003',
      '93637008', '93636004', '93230002', '93229007', '93228004', '93227009',
      '93226000', '93225001', '93224002', '93223008', '93222003', '93221005',
      '93220006', '93219000', '93218008', '93217003', '93216007', '93215006',
      '93214005', '93213004', '93211002', '93210001', '93209006',
    ]
  ],
  [
    'gastric_cancer',
    [
      '681941000119107', '681781000119104', '681701000119107',
      '681681000119109', '681631000119108', '878807001', '860830009',
      '840424008', '766980008', '766757006', '721643000', '721642005',
      '721641003', '721640002', '721639004', '721638007', '721637002',
      '721636006', '721635005', '721634009', '721633003', '721632008',
      '721630000', '721629005', '716859000', '716586009', '449222008',
      '448709005', '448663003', '444597005', '372143007', '372014001',
      '254567005', '254563009', '254561006', '254559002', '254557000',
      '254555008', '254553001', '93977003', '93976007', '93867004', '93818001',
      '93809003', '93738008', '93717002', '1144307009', '1144306000',
      '1144305001', '1144304002', '1144303008', '1137644008', '709830006',
      '448555009', '448269008', '447806008', '447805007', '447785000',
      '447766003', '447707005', '447658000', '447656001', '408647009',
      '363349007', '314961003', '276811008', '276810009', '276809004',
      '269460009', '269459004', '187742008', '187741001', '187740000',
      '187738005', '187736009', '187733001', '187732006', '109836006',
    ]
  ],
  [
    'prostate_cancer',
    [
      '1208457007', '823017009', '822970008', '712849003', '449318001',
      '448217003', '448213004', '399490008', '396198006', '278060005',
      '254900004', '93974005', '1098981000119100', '722103009', '715412008',
      '427492003', '399590005', '399068003', '369486003', '369485004',
      '314969001',
    ]
  ],
  [
    'colorectal_cancer',
    [
      '363406005'
    ]
  ]
]);

// These codes also need to be flipped around for use
const codesToDiseaseType = new Map<string, AncoraQueryDisease>();

for (const [disease, codes] of diseasesToCodes) {
  for (const code of codes) {
    const existing = codesToDiseaseType.get(code);
    if (existing) {
      console.error(`Warning: trying to map ${code} to ${disease} when it is already mapped to ${existing}, keeping original mapping to ${existing}!`);
    } else {
      codesToDiseaseType.set(code, disease);
    }
  }
}

export function findDiseaseTypeForCode(system: string, code: string): AncoraQueryDisease | null {
  if (system != SNOMED_CT_SYSTEM) {
    return null;
  }
  return codesToDiseaseType.get(code) ?? null;
}

// Tumor Stage mappings

const STAGE_LOINC_CODES = new Set<string>(['21908-9', '21902-2', '21914-7']);
// FIXME: This is wrong but is the way the front end generates the stages so ??
const STAGE_CODES = new Map<string, number>([
  ['I', 1],
  ['II', 2],
  ['IIA', 2],
  ['III', 3],
  ['IV', 4]
]);

/**
 * If a tumor stage number can be determined from the given Observation, return
 * that, otherwise, return null.
 * @param observation the observation to inspect
 */
export function findTumorStage(observation: fhir.Observation): number | null {
  // First check: MCode limits the tumor stages to the LOINC codes
  // 21908-9, 21902-2, or 21914-7.
  const coding = observation.code?.coding;
  if (!coding) {
    return null;
  }
  if (coding.findIndex((value) => { return STAGE_LOINC_CODES.has(value.code); }) < 0) {
    // Didn't find one of the associated codes
    return null;
  }
  // FIXME: Pretty sure this is actually wrong, but it's the way the front end generates patient data, so for now
  return STAGE_CODES.get(observation.valueString) ?? null;
}
