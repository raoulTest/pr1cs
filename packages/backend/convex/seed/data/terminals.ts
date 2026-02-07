// ============================================================================
// ALGERIAN TERMINAL DEFINITIONS
// ============================================================================

import { getWilayaCodeForTerminal } from '../utils/algerianLicensePlates';

export interface TerminalDefinition {
  name: string;
  code: string;
  address: string;
  timezone: string;
  defaultSlotCapacity: number;
  autoValidationThreshold: number;
  capacityAlertThresholds: number[];
  operatingHoursStart: string;
  operatingHoursEnd: string;
  gateCount: number;
}

export const ALGERIAN_TERMINALS: TerminalDefinition[] = [
  {
    name: "Port d'Alger - Terminal Conteneurs",
    code: "TER-ALGIERS",
    address: "Boulevard Mohamed VI, Alger Centre, Alger 16000",
    timezone: "Africa/Algiers",
    defaultSlotCapacity: 40,
    autoValidationThreshold: 60,
    capacityAlertThresholds: [70, 85, 95],
    operatingHoursStart: "06:00",
    operatingHoursEnd: "22:00",
    gateCount: 5,
  },
  {
    name: "Port d'Oran - Terminal à Conteneurs",
    code: "TER-ORAN",
    address: "Rue du Port, Oran 31000",
    timezone: "Africa/Algiers",
    defaultSlotCapacity: 35,
    autoValidationThreshold: 50,
    capacityAlertThresholds: [70, 85, 95],
    operatingHoursStart: "06:00",
    operatingHoursEnd: "22:00",
    gateCount: 4,
  },
  {
    name: "Port d'Annaba - Terminal Conteneurs",
    code: "TER-ANNABA",
    address: "Zone Portuaire, Annaba 23000",
    timezone: "Africa/Algiers",
    defaultSlotCapacity: 30,
    autoValidationThreshold: 45,
    capacityAlertThresholds: [70, 85, 95],
    operatingHoursStart: "06:00",
    operatingHoursEnd: "22:00",
    gateCount: 4,
  },
  {
    name: "Port de Béjaïa - Terminal Maritime",
    code: "TER-BEJAIA",
    address: "Port de Béjaïa, Béjaïa 06000",
    timezone: "Africa/Algiers",
    defaultSlotCapacity: 25,
    autoValidationThreshold: 40,
    capacityAlertThresholds: [70, 85, 95],
    operatingHoursStart: "06:00",
    operatingHoursEnd: "20:00",
    gateCount: 3,
  },
  {
    name: "Port de Skikda - Terminal à Conteneurs",
    code: "TER-SKIKDA",
    address: "Zone Industrielle, Skikda 21000",
    timezone: "Africa/Algiers",
    defaultSlotCapacity: 28,
    autoValidationThreshold: 55,
    capacityAlertThresholds: [70, 85, 95],
    operatingHoursStart: "06:00",
    operatingHoursEnd: "22:00",
    gateCount: 3,
  },
  {
    name: "Port de Mostaganem - Terminal Commercial",
    code: "TER-MOSTAGANEM",
    address: "Zone Portuaire, Mostaganem 27000",
    timezone: "Africa/Algiers",
    defaultSlotCapacity: 22,
    autoValidationThreshold: 35,
    capacityAlertThresholds: [70, 85, 95],
    operatingHoursStart: "07:00",
    operatingHoursEnd: "19:00",
    gateCount: 3,
  },
  {
    name: "Port de Ghazaouet - Terminal de Pêche et Commerce",
    code: "TER-GHAZAOUET",
    address: "Route de Ghazaouet, Tlemcen 13000",
    timezone: "Africa/Algiers",
    defaultSlotCapacity: 15,
    autoValidationThreshold: 30,
    capacityAlertThresholds: [70, 85, 95],
    operatingHoursStart: "07:00",
    operatingHoursEnd: "18:00",
    gateCount: 2,
  },
];

export function getTerminalWilayaCode(terminalCode: string): number {
  return getWilayaCodeForTerminal(terminalCode);
}
