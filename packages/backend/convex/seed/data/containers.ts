// ============================================================================
// ALGERIAN CONTAINER DATA GENERATION
// ============================================================================

import { generateContainerNumbers } from '../utils/iso6346';
import { randomElement, randomInt, weightedRandom } from '../utils/random';
import { addDays, getToday } from '../utils/dates';

export type ContainerType = 'dry' | 'reefer' | 'open_top' | 'flat_rack' | 'tank' | 'hazardous';
export type ContainerDimension = '20ft' | '40ft' | '40ft_hc' | '45ft';
export type ContainerWeightClass = 'light' | 'medium' | 'heavy' | 'super_heavy';
export type ContainerOperation = 'pick_up' | 'drop_off';

export interface ContainerDefinition {
  containerNumber: string;
  containerType: ContainerType;
  dimensions: ContainerDimension;
  weightClass: ContainerWeightClass;
  operationType: ContainerOperation;
  isEmpty: boolean;
  readyDate?: number;
  departureDate?: number;
  notes?: string;
  bookingId?: string; // For tracking if container is booked
}

const CONTAINER_TYPES: ContainerType[] = ['dry', 'reefer', 'open_top', 'flat_rack', 'tank', 'hazardous'];
const OPERATION_TYPES: ContainerOperation[] = ['pick_up', 'drop_off'];

function getWeightClassFromType(type: ContainerType): ContainerWeightClass {
  switch (type) {
    case 'dry':
      return weightedRandom(['light', 'medium', 'heavy'] as ContainerWeightClass[], [0.2, 0.5, 0.3]);
    case 'reefer':
      return weightedRandom(['medium', 'heavy'] as ContainerWeightClass[], [0.4, 0.6]);
    case 'open_top':
    case 'flat_rack':
      return weightedRandom(['medium', 'heavy', 'super_heavy'] as ContainerWeightClass[], [0.3, 0.5, 0.2]);
    case 'tank':
      return weightedRandom(['heavy', 'super_heavy'] as ContainerWeightClass[], [0.6, 0.4]);
    case 'hazardous':
      return weightedRandom(['medium', 'heavy'] as ContainerWeightClass[], [0.3, 0.7]);
    default:
      return 'medium';
  }
}

function getDimensionFromType(type: ContainerType): ContainerDimension {
  switch (type) {
    case 'reefer':
      return weightedRandom(['40ft', '40ft_hc'] as ContainerDimension[], [0.6, 0.4]);
    case 'tank':
      return weightedRandom(['20ft', '40ft'] as ContainerDimension[], [0.7, 0.3]);
    case 'hazardous':
      return weightedRandom(['20ft', '40ft'] as ContainerDimension[], [0.5, 0.5]);
    default:
      return weightedRandom(['20ft', '40ft', '40ft_hc', '45ft'] as ContainerDimension[], [0.3, 0.45, 0.2, 0.05]);
  }
}

function generateContainerNotes(type: ContainerType, isEmpty: boolean): string | undefined {
  if (Math.random() > 0.7) return undefined;
  
  const notes: Record<ContainerType, string[]> = {
    'dry': ['Marchandise générale', 'Textile', 'Électronique'],
    'reefer': ['Produits frais', ' Surgelés', 'Pharmaceutique'],
    'open_top': ['Machinerie lourde', 'Matériaux de construction'],
    'flat_rack': ['Véhicules', 'Équipement industriel'],
    'tank': ['Liquides chimiques', 'Carburant', 'Huile'],
    'hazardous': ['Matières dangereuses - Classe 3', 'Produits chimiques']
  };
  
  const typeNotes = notes[type] || ['Conteneur standard'];
  const note = randomElement(typeNotes);
  return isEmpty ? `${note} - VIDE` : note;
}

export function generateContainersForCarrier(_carrierId: string, count: number): ContainerDefinition[] {
  const containers: ContainerDefinition[] = [];
  const containerNumbers = generateContainerNumbers(count);
  const today = getToday();
  
  for (let i = 0; i < count; i++) {
    const containerType = randomElement(CONTAINER_TYPES);
    const operationType = randomElement(OPERATION_TYPES);
    const isEmpty = Math.random() > 0.6; // 40% loaded, 60% empty
    const containerNumber = containerNumbers[i];
    
    if (!containerNumber) continue;
    
    const container: ContainerDefinition = {
      containerNumber,
      containerType,
      dimensions: getDimensionFromType(containerType),
      weightClass: getWeightClassFromType(containerType),
      operationType,
      isEmpty,
      notes: generateContainerNotes(containerType, isEmpty),
    };
    
    // Add dates based on operation type
    if (operationType === 'pick_up') {
      // Ready date: within past 30 days to future 30 days
      const readyDaysOffset = randomInt(-30, 30);
      const readyDate = addDays(today, readyDaysOffset);
      container.readyDate = readyDate.getTime();
    } else {
      // Drop off: departure date within future 30 days
      const departureDaysOffset = randomInt(0, 30);
      const departureDate = addDays(today, departureDaysOffset);
      container.departureDate = departureDate.getTime();
    }
    
    containers.push(container);
  }
  
  return containers;
}

export function generateContainerPool(totalCount: number): Map<string, ContainerDefinition[]> {
  const pool = new Map<string, ContainerDefinition[]>();
  const containerNumbers = generateContainerNumbers(totalCount);
  
  // Distribute containers among carriers
  const carrierCount = 25;
  const baseContainersPerCarrier = Math.floor(totalCount / carrierCount);
  let remainingContainers = totalCount;
  let containerIndex = 0;
  
  for (let i = 0; i < carrierCount; i++) {
    const carrierId = `carrier_${i}`;
    const containerCount = i === carrierCount - 1 
      ? remainingContainers 
      : baseContainersPerCarrier + randomInt(-5, 5);
    
    const containers: ContainerDefinition[] = [];
    const today = getToday();
    
    for (let j = 0; j < containerCount && containerIndex < totalCount; j++) {
      const containerType = randomElement(CONTAINER_TYPES);
      const operationType = randomElement(OPERATION_TYPES);
      const isEmpty = Math.random() > 0.6;
      const containerNumber = containerNumbers[containerIndex++];
      
      if (!containerNumber) continue;
      
      const container: ContainerDefinition = {
        containerNumber,
        containerType,
        dimensions: getDimensionFromType(containerType),
        weightClass: getWeightClassFromType(containerType),
        operationType,
        isEmpty,
        notes: generateContainerNotes(containerType, isEmpty),
      };
      
      if (operationType === 'pick_up') {
        const readyDaysOffset = randomInt(-30, 30);
        container.readyDate = addDays(today, readyDaysOffset).getTime();
      } else {
        const departureDaysOffset = randomInt(0, 30);
        container.departureDate = addDays(today, departureDaysOffset).getTime();
      }
      
      containers.push(container);
    }
    
    pool.set(carrierId, containers);
    remainingContainers -= containerCount;
  }
  
  return pool;
}
