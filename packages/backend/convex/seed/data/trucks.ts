// ============================================================================
// ALGERIAN TRUCK DATA GENERATION
// ============================================================================

import { generateAlgerianLicensePlate } from '../utils/algerianLicensePlates';
import { randomElement, randomInt } from '../utils/random';

export type TruckType = 'container' | 'flatbed' | 'tanker' | 'refrigerated' | 'bulk' | 'general';
export type TruckClass = 'light' | 'medium' | 'heavy' | 'super_heavy';

export interface TruckDefinition {
  licensePlate: string;
  truckType: TruckType;
  truckClass: TruckClass;
  make: string;
  model: string;
  year: number;
  maxWeight: number;
}

const TRUCK_MAKES = [
  'Mercedes-Benz', 'Volvo', 'Scania', 'MAN', 'DAF', 'Renault', 
  'Iveco', 'Ford', 'Isuzu', 'Mitsubishi'
];

const TRUCK_MODELS: Record<string, string[]> = {
  'Mercedes-Benz': ['Actros', 'Axor', 'Atego', 'Econic'],
  'Volvo': ['FH', 'FM', 'FMX', 'FE'],
  'Scania': ['R-Series', 'G-Series', 'P-Series', 'S-Series'],
  'MAN': ['TGX', 'TGS', 'TGM', 'TGL'],
  'DAF': ['XF', 'CF', 'LF'],
  'Renault': ['T-High', 'T', 'C', 'K'],
  'Iveco': ['S-Way', 'X-Way', 'Stralis', 'Trakker'],
  'Ford': ['F-MAX', 'Cargo'],
  'Isuzu': ['F-Series', 'Giga'],
  'Mitsubishi': ['Super Great', 'Fuso']
};

const TRUCK_TYPES: TruckType[] = ['container', 'flatbed', 'tanker', 'refrigerated', 'bulk', 'general'];

function getTruckClassFromType(type: TruckType): TruckClass {
  switch (type) {
    case 'general':
      return randomElement(['light', 'medium'] as TruckClass[]);
    case 'flatbed':
    case 'bulk':
      return randomElement(['medium', 'heavy'] as TruckClass[]);
    case 'container':
    case 'refrigerated':
      return randomElement(['medium', 'heavy', 'super_heavy'] as TruckClass[]);
    case 'tanker':
      return randomElement(['heavy', 'super_heavy'] as TruckClass[]);
    default:
      return 'medium';
  }
}

function getMaxWeightFromClass(truckClass: TruckClass): number {
  switch (truckClass) {
    case 'light':
      return randomInt(25, 35); // 2.5-3.5 tons
    case 'medium':
      return randomInt(55, 75); // 5.5-7.5 tons
    case 'heavy':
      return randomInt(120, 180); // 12-18 tons
    case 'super_heavy':
      return randomInt(250, 440); // 25-44 tons
    default:
      return 100;
  }
}

export function generateTrucksForCarrier(_carrierId: string, count: number): TruckDefinition[] {
  const trucks: TruckDefinition[] = [];
  
  for (let i = 0; i < count; i++) {
    const make = randomElement(TRUCK_MAKES);
    const models = TRUCK_MODELS[make];
    const model = models ? randomElement(models) : 'Standard';
    const truckType = randomElement(TRUCK_TYPES);
    const truckClass = getTruckClassFromType(truckType);
    
    trucks.push({
      licensePlate: generateAlgerianLicensePlate(),
      truckType,
      truckClass,
      make,
      model,
      year: randomInt(2015, 2024),
      maxWeight: getMaxWeightFromClass(truckClass),
    });
  }
  
  return trucks;
}

export function generateTruckFleet(carrierCount: number, _trucksPerCarrier: number): Map<string, TruckDefinition[]> {
  const fleet = new Map<string, TruckDefinition[]>();
  
  for (let i = 0; i < carrierCount; i++) {
    const carrierId = `carrier_${i}`;
    const truckCount = randomInt(2, 5);
    fleet.set(carrierId, generateTrucksForCarrier(carrierId, truckCount));
  }
  
  return fleet;
}
