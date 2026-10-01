export interface NappiDrug {
  code: string;
  name: string;
  generic: string;
  category: string;
  interactions: string[];
}

export interface MimsResult {
  drug: string;
  dose: string;
  route: string;
  interactions: { drug: string; severity: 'major' | 'moderate' | 'minor'; effect: string }[];
}

const NAPP_DATABASE: NappiDrug[] = [
  { code: '702819001', name: 'Paracetamol 500mg Cap', generic: 'Paracetamol', category: 'Analgesic', interactions: [] },
  { code: '702819002', name: 'Ibuprofen 400mg Tab', generic: 'Ibuprofen', category: 'NSAID', interactions: ['Aspirin', 'Warfarin', 'Furosemide', 'Lithium'] },
  { code: '702819003', name: 'Amoxicillin 500mg Cap', generic: 'Amoxicillin', category: 'Antibiotic', interactions: ['Methotrexate'] },
  { code: '702819004', name: 'Azithromycin 500mg Tab', generic: 'Azithromycin', category: 'Antibiotic', interactions: ['Warfarin', 'Theophylline', 'Cisapride'] },
  { code: '702819005', name: 'Metformin 500mg Tab', generic: 'Metformin', category: 'Antidiabetic', interactions: ['Contrast media'] },
  { code: '702819006', name: 'Amlodipine 5mg Tab', generic: 'Amlodipine', category: 'Antihypertensive', interactions: ['Simvastatin', 'Grapefruit juice'] },
  { code: '702819007', name: 'Lisinopril 10mg Tab', generic: 'Lisinopril', category: 'ACE Inhibitor', interactions: ['Potassium', 'NSAIDs', 'Sodium'] },
  { code: '702819008', name: 'Atorvastatin 20mg Tab', generic: 'Atorvastatin', category: 'Statin', interactions: ['Amlodipine', 'Clarithromycin', 'Erythromycin', 'Grapefruit'] },
  { code: '702819009', name: 'Omeprazole 20mg Cap', generic: 'Omeprazole', category: 'PPI', interactions: ['Clopidogrel', 'Methotrexate', 'Diazepam'] },
  { code: '702819010', name: 'Cetirizine 10mg Tab', generic: 'Cetirizine', category: 'Antihistamine', interactions: [] },
  { code: '702819011', name: 'Amoxicillin + Clavulanate 625mg', generic: 'Amoxicillin/Clavulanic Acid', category: 'Antibiotic', interactions: ['Allopurinol', 'Methotrexate'] },
  { code: '702819012', name: 'Ondansetron 8mg Tab', generic: 'Ondansetron', category: 'Antiemetic', interactions: ['Tramadol', 'Sertraline', 'MAO inhibitors'] },
  { code: '702819013', name: 'Dexamethasone 4mg Tab', generic: 'Dexamethasone', category: 'Corticosteroid', interactions: ['NSAIDs', 'Warfarin', 'Digoxin', 'Sulfonylureas'] },
  { code: '702819014', name: 'Salbutamol 2mg Puffer', generic: 'Salbutamol', category: 'Bronchodilator', interactions: ['Beta-blockers', 'Theophylline'] },
  { code: '702819015', name: 'Prednisone 5mg Tab', generic: 'Prednisone', category: 'Corticosteroid', interactions: ['NSAIDs', 'Warfarin', 'Aspirin', 'Fluconazole'] },
  { code: '702819016', name: 'Ciprofloxacin 500mg Tab', generic: 'Ciprofloxacin', category: 'Antibiotic', interactions: ['Theophylline', 'Iron', 'Warfarin', 'Sotalol'] },
  { code: '702819017', name: 'Tramadol 50mg Cap', generic: 'Tramadol', category: 'Analgesic', interactions: ['SSRIs', 'MAO inhibitors', 'Ondansetron', 'Carbamazepine'] },
  { code: '702819018', name: 'Pantoprazole 40mg Tab', generic: 'Pantoprazole', category: 'PPI', interactions: ['Clopidogrel', 'Methotrexate'] },
  { code: '702819019', name: 'Glyburide 5mg Tab', generic: 'Glyburide', category: 'Antidiabetic', interactions: ['Fluconazole', 'Warfarin', 'Cimetidine', 'Diltiazem'] },
  { code: '702819020', name: 'Enalapril 10mg Tab', generic: 'Enalapril', category: 'ACE Inhibitor', interactions: ['Potassium', 'NSAIDs', 'Lithium', 'Sodium'] },
  { code: '702819021', name: 'Azithromycin 250mg Cap', generic: 'Azithromycin', category: 'Antibiotic', interactions: ['Warfarin', 'Theophylline'] },
  { code: '702819022', name: 'Losartan 50mg Tab', generic: 'Losartan', category: 'ARB', interactions: ['Lithium', 'KCl', 'NSAIDs'] },
  { code: '702819023', name: 'Montelukast 10mg Tab', generic: 'Montelukast', category: 'Asthma', interactions: [] },
  { code: '702819024', name: 'Rabeprazole 20mg Tab', generic: 'Rabeprazole', category: 'PPI', interactions: ['Clopidogrel', 'Methotrexate'] },
  { code: '702819025', name: 'Diclofenac 75mg Tab', generic: 'Diclofenac', category: 'NSAID', interactions: ['Aspirin', 'Warfarin', 'Lithium', 'Methotrexate'] },
  { code: '702819026', name: 'Clarithromycin 500mg Tab', generic: 'Clarithromycin', category: 'Antibiotic', interactions: ['Simvastatin', 'Atorvastatin', 'Theophylline', 'Warfarin'] },
  { code: '702819027', name: 'Levocetirizine 5mg Tab', generic: 'Levocetirizine', category: 'Antihistamine', interactions: [] },
  { code: '702819028', name: 'Escitalopram 10mg Tab', generic: 'Escitalopram', category: 'SSRI', interactions: ['Tramadol', 'MAO inhibitors', 'Aspirin'] },
  { code: '702819029', name: 'Metoprolol 50mg Tab', generic: 'Metoprolol', category: 'Beta-blocker', interactions: ['Salbutamol', 'Verapamil', 'Clonidine'] },
  { code: '702819030', name: 'Furosemide 40mg Tab', generic: 'Furosemide', category: 'Diuretic', interactions: ['NSAIDs', 'Lithium', 'Digoxin', 'Theophylline'] },
];

const NAPP_REGEX = /^\d{9}$/;

export function validateNappiCode(code: string): { valid: boolean; error?: string; drug?: NappiDrug } {
  const trimmed = code.trim();
  if (!trimmed) return { valid: false, error: 'NAPPI code is required' };
  if (!NAPP_REGEX.test(trimmed)) return { valid: false, error: `NAPPI code must be 9 digits. Got: "${trimmed}"` };
  const drug = NAPP_DATABASE.find((d) => d.code === trimmed);
  if (drug) return { valid: true, drug };
  return { valid: true, error: undefined };
}

export function lookupNappi(code: string): NappiDrug | null {
  return NAPP_DATABASE.find((d) => d.code === code.trim()) || null;
}

export function searchNappi(query: string, limit = 8): NappiDrug[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];
  return NAPP_DATABASE.filter(
    (d) => d.name.toLowerCase().includes(q) || d.generic.toLowerCase().includes(q)
  ).slice(0, limit);
}

export function checkDrugInteractions(drugs: { name: string; generic?: string }[]): MimsResult {
  const results: MimsResult[] = [];
  const knownDrugs = drugs.map((d) => NAPP_DATABASE.find((n) => n.generic === d.generic || n.name === d.name));

  for (let i = 0; i < knownDrugs.length; i++) {
    const drug = knownDrugs[i];
    if (!drug) continue;
    const interactions = [];
    for (let j = 0; j < knownDrugs.length; j++) {
      if (i === j) continue;
      const other = knownDrugs[j];
      if (!other) continue;
      if (drug.interactions.some((int) => other.generic.toLowerCase().includes(int.toLowerCase().split(' ')[0]))) {
        interactions.push({
          drug: other.generic,
          severity: 'major' as const,
          effect: `Potential interaction between ${drug.generic} and ${other.generic}. Review dosing.`,
        });
      }
    }
    if (interactions.length > 0) {
      results.push({
        drug: drug.generic,
        dose: '',
        route: '',
        interactions,
      });
    }
  }
  return results as unknown as MimsResult;
}

export function getMimsInteractions(drugName: string): { drug: string; severity: string; effect: string }[] {
  const drug = NAPP_DATABASE.find((d) => d.generic.toLowerCase() === drugName.toLowerCase() || d.name.toLowerCase().includes(drugName.toLowerCase()));
  if (!drug) return [];
  return drug.interactions.map((int) => ({
    drug: int,
    severity: 'moderate',
    effect: `Known interaction between ${drug.generic} and ${int}. Monitor closely.`,
  }));
}
