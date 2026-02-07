// ============================================================================
// GATE CONFIGURATIONS FOR ALGERIAN TERMINALS
// ============================================================================

export type TruckType = 'container' | 'flatbed' | 'tanker' | 'refrigerated' | 'bulk' | 'general';
export type TruckClass = 'light' | 'medium' | 'heavy' | 'super_heavy';

export interface GateDefinition {
  name: string;
  code: string;
  description?: string;
  allowedTruckTypes: TruckType[];
  allowedTruckClasses: TruckClass[];
}

const ALL_TRUCK_TYPES: TruckType[] = ['container', 'flatbed', 'tanker', 'refrigerated', 'bulk', 'general'];
const ALL_TRUCK_CLASSES: TruckClass[] = ['light', 'medium', 'heavy', 'super_heavy'];
const CONTAINER_TRUCK_TYPES: TruckType[] = ['container', 'flatbed', 'refrigerated'];
const HEAVY_TRUCK_CLASSES: TruckClass[] = ['medium', 'heavy', 'super_heavy'];

export function generateGatesForTerminal(_terminalCode: string, gateCount: number): GateDefinition[] {
  const gates: GateDefinition[] = [];
  
  const gateNames = ['Portail Nord', 'Portail Sud', 'Portail Est', 'Portail Ouest', 'Portail Principal'];
  const gateCodes = ['GATE-N1', 'GATE-S1', 'GATE-E1', 'GATE-W1', 'GATE-P1'];
  
  for (let i = 0; i < gateCount; i++) {
    const isMainGate = i === 0;
    const isContainerSpecialized = Math.random() > 0.5;
    
    gates.push({
      name: gateNames[i] || `Portail ${i + 1}`,
      code: gateCodes[i] || `GATE-${i + 1}`,
      description: isMainGate ? 'Portail principal - tous types de camions' : `Portail ${i + 1}`,
      allowedTruckTypes: isContainerSpecialized ? CONTAINER_TRUCK_TYPES : ALL_TRUCK_TYPES,
      allowedTruckClasses: isMainGate ? ALL_TRUCK_CLASSES : HEAVY_TRUCK_CLASSES,
    });
  }
  
  return gates;
}

export function getGateForTerminal(terminalCode: string): GateDefinition[] {
  const gateConfigs: Record<string, GateDefinition[]> = {
    'TER-ALGIERS': [
      { name: 'Portail Nord', code: 'GATE-N1', description: 'Portail principal - conteneurs', allowedTruckTypes: ['container', 'refrigerated'], allowedTruckClasses: ['medium', 'heavy', 'super_heavy'] },
      { name: 'Portail Sud', code: 'GATE-S1', description: 'Portail secondaire - tous types', allowedTruckTypes: ['container', 'flatbed', 'refrigerated', 'bulk', 'general'], allowedTruckClasses: ['light', 'medium', 'heavy'] },
      { name: 'Portail Est', code: 'GATE-E1', description: 'Portail dédié citernes', allowedTruckTypes: ['tanker'], allowedTruckClasses: ['medium', 'heavy', 'super_heavy'] },
      { name: 'Portail Ouest', code: 'GATE-W1', description: 'Portail conteneurs frigorifiques', allowedTruckTypes: ['refrigerated', 'container'], allowedTruckClasses: ['medium', 'heavy'] },
      { name: 'Portail Principal', code: 'GATE-P1', description: 'Portail général', allowedTruckTypes: ['container', 'flatbed', 'general'], allowedTruckClasses: ['light', 'medium', 'heavy'] },
    ],
    'TER-ORAN': [
      { name: 'Portail Principal', code: 'GATE-P1', description: 'Portail principal', allowedTruckTypes: ['container', 'flatbed', 'refrigerated'], allowedTruckClasses: ['medium', 'heavy', 'super_heavy'] },
      { name: 'Portail Nord', code: 'GATE-N1', description: 'Portail conteneurs', allowedTruckTypes: ['container', 'refrigerated'], allowedTruckClasses: ['medium', 'heavy'] },
      { name: 'Portail Sud', code: 'GATE-S1', description: 'Portail divers', allowedTruckTypes: ['flatbed', 'bulk', 'general'], allowedTruckClasses: ['light', 'medium', 'heavy'] },
      { name: 'Portail Est', code: 'GATE-E1', description: 'Portail réservé', allowedTruckTypes: ['container', 'tanker'], allowedTruckClasses: ['medium', 'heavy', 'super_heavy'] },
    ],
    'TER-ANNABA': [
      { name: 'Portail Principal', code: 'GATE-P1', description: 'Portail principal', allowedTruckTypes: ['container', 'flatbed', 'refrigerated'], allowedTruckClasses: ['medium', 'heavy'] },
      { name: 'Portail Nord', code: 'GATE-N1', description: 'Portail secondaire', allowedTruckTypes: ['container', 'general'], allowedTruckClasses: ['light', 'medium', 'heavy'] },
      { name: 'Portail Sud', code: 'GATE-S1', description: 'Portail spécialisé', allowedTruckTypes: ['refrigerated', 'tanker'], allowedTruckClasses: ['medium', 'heavy', 'super_heavy'] },
      { name: 'Portail Est', code: 'GATE-E1', description: 'Portail service', allowedTruckTypes: ['flatbed', 'bulk'], allowedTruckClasses: ['medium', 'heavy'] },
    ],
    'TER-BEJAIA': [
      { name: 'Portail Principal', code: 'GATE-P1', description: 'Portail principal', allowedTruckTypes: ['container', 'flatbed'], allowedTruckClasses: ['medium', 'heavy'] },
      { name: 'Portail Nord', code: 'GATE-N1', description: 'Portail conteneurs', allowedTruckTypes: ['container', 'refrigerated'], allowedTruckClasses: ['medium', 'heavy'] },
      { name: 'Portail Sud', code: 'GATE-S1', description: 'Portail service', allowedTruckTypes: ['general', 'bulk'], allowedTruckClasses: ['light', 'medium'] },
    ],
    'TER-SKIKDA': [
      { name: 'Portail Principal', code: 'GATE-P1', description: 'Portail principal', allowedTruckTypes: ['container', 'flatbed', 'refrigerated'], allowedTruckClasses: ['medium', 'heavy'] },
      { name: 'Portail Nord', code: 'GATE-N1', description: 'Portail industriel', allowedTruckTypes: ['container', 'tanker'], allowedTruckClasses: ['heavy', 'super_heavy'] },
      { name: 'Portail Sud', code: 'GATE-S1', description: 'Portail commercial', allowedTruckTypes: ['flatbed', 'general'], allowedTruckClasses: ['light', 'medium', 'heavy'] },
    ],
    'TER-MOSTAGANEM': [
      { name: 'Portail Principal', code: 'GATE-P1', description: 'Portail principal', allowedTruckTypes: ['container', 'flatbed'], allowedTruckClasses: ['medium', 'heavy'] },
      { name: 'Portail Nord', code: 'GATE-N1', description: 'Portail secondaire', allowedTruckTypes: ['container', 'general'], allowedTruckClasses: ['light', 'medium', 'heavy'] },
      { name: 'Portail Sud', code: 'GATE-S1', description: 'Portail logistique', allowedTruckTypes: ['flatbed', 'bulk'], allowedTruckClasses: ['medium', 'heavy'] },
    ],
    'TER-GHAZAOUET': [
      { name: 'Portail Principal', code: 'GATE-P1', description: 'Portail principal', allowedTruckTypes: ['container', 'flatbed', 'general'], allowedTruckClasses: ['light', 'medium', 'heavy'] },
      { name: 'Portail Nord', code: 'GATE-N1', description: 'Portail pêche', allowedTruckTypes: ['refrigerated', 'general'], allowedTruckClasses: ['light', 'medium'] },
    ],
  };
  
  return gateConfigs[terminalCode] || generateGatesForTerminal(terminalCode, 3);
}
