// ============================================================================
// ALGERIAN BOOKING DATA GENERATION
// ============================================================================

import { randomElement, randomInt, weightedRandom, randomElements } from '../utils/random';
import { getToday, addDays, formatDate, getRandomHour, formatHour, getDaysDifference } from '../utils/dates';
import type { ContainerDefinition } from './containers';
import type { TruckDefinition } from './trucks';

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'consumed' | 'cancelled' | 'expired';

export interface BookingDefinition {
  terminalCode: string;
  carrierId: string;
  truckLicensePlate: string;
  containerNumbers: string[];
  status: BookingStatus;
  preferredDate: string;
  preferredTimeStart: string;
  preferredTimeEnd: string;
  driverName: string;
  driverPhone: string;
  driverIdNumber: string;
  wasAutoValidated: boolean;
  // Timestamps for different statuses
  bookedAt: number;
  confirmedAt?: number;
  rejectedAt?: number;
  cancelledAt?: number;
  consumedAt?: number;
  expiredAt?: number;
  statusReason?: string;
  // QR scan data
  entryScannedAt?: number;
  exitScannedAt?: number;
  scannedByEntry?: string;
  scannedByExit?: string;
}

// Algerian driver names
const FIRST_NAMES = [
  'Ahmed', 'Mohamed', 'Ali', 'Hassan', 'Omar', 'Khaled', 'Karim', 'Amine',
  'Sofiane', 'Yacine', 'Rachid', 'Nabil', 'Samir', 'Farid', 'Djamel', 'Walid',
  'Younes', 'Adel', 'Hamid', 'Mourad', 'Tarek', 'Fares', 'Aymen', 'Bilal',
  'Fatima', 'Amina', 'Sara', 'Nadia', 'Leila', 'Yasmine', 'Imane', 'Lina',
  'Meriem', 'Sabrina', 'Amel', 'Nawel', 'Djamila', 'Fatiha', 'Samia', 'Khadija',
  'Rania', 'Lamia', 'Asma', 'Kenza', 'Salima', 'Dounia', 'Widad', 'Hania'
];

const LAST_NAMES = [
  'Benali', 'Boudiaf', 'Messaoudi', 'Haddad', 'Kaci', 'Brahimi', 'Amara',
  'Belkacem', 'Hamidi', 'Sahraoui', 'Medjdoub', 'Bensaïd', 'Touati',
  'Zeroual', 'Lounès', 'Djebbour', 'Slimani', 'Gacem', 'Larbi', 'Boualem',
  'Benkacem', 'Moussaoui', 'Cherifi', 'Merad', 'Soltani', 'Boukhalfa',
  'Hamzaoui', 'Laroui', 'Aït', 'Boumediene', 'Benyahia', 'Rezig'
];

function generateAlgerianName(): string {
  const first = randomElement(FIRST_NAMES);
  const last = randomElement(LAST_NAMES);
  return `${first} ${last}`;
}

function generateAlgerianPhone(): string {
  const prefixes = ['05', '06', '07'];
  const prefix = randomElement(prefixes);
  const number = randomInt(10000000, 99999999).toString();
  return `+213 ${prefix}${number.slice(0,2)} ${number.slice(2,4)} ${number.slice(4,6)} ${number.slice(6,8)}`;
}

function generateDriverIdNumber(): string {
  // Algerian national ID format: YYXXXXXXXX where YY is year of birth, XXXXXXXX is unique number
  const year = randomInt(65, 99); // 1965-1999
  const unique = randomInt(10000000, 99999999).toString();
  return `${year}${unique}`;
}

function assignRealisticStatus(preferredDate: Date): { status: BookingStatus; probability: number } {
  const today = getToday();
  const daysDiff = getDaysDifference(preferredDate, today);
  
  if (daysDiff < -7) {
    // Future booking (> 7 days): mostly pending/confirmed
    const status = weightedRandom(
      ['pending', 'confirmed'] as BookingStatus[],
      [0.3, 0.7]
    );
    return { status, probability: status === 'pending' ? 0.3 : 0.7 };
  } else if (daysDiff >= -7 && daysDiff <= 2) {
    // Near future/past few days: confirmed, some consumed, few cancelled
    const status = weightedRandom(
      ['confirmed', 'consumed', 'cancelled', 'expired'] as BookingStatus[],
      [0.45, 0.40, 0.10, 0.05]
    );
    return { status, probability: status === 'confirmed' ? 0.45 : 0.4 };
  } else {
    // Past booking (> 2 days ago): mostly consumed, some cancelled/expired/rejected
    const status = weightedRandom(
      ['consumed', 'cancelled', 'expired', 'rejected'] as BookingStatus[],
      [0.70, 0.15, 0.10, 0.05]
    );
    return { status, probability: status === 'consumed' ? 0.7 : 0.15 };
  }
}

function getStatusReason(status: BookingStatus): string | undefined {
  const reasons: Record<BookingStatus, string[]> = {
    'pending': [],
    'confirmed': ['Validé automatiquement', 'Validé par l\'opérateur'],
    'rejected': ['Capacité insuffisante', 'Type de camion incompatible', 'Documents incomplets'],
    'consumed': [],
    'cancelled': ['Annulation demandée par le transporteur', 'Changement de planning', 'Problème de disponibilité'],
    'expired': ['Non présenté dans le créneau horaire']
  };
  
  const statusReasons = reasons[status];
  if (statusReasons.length === 0) return undefined;
  return randomElement(statusReasons);
}

// Minimal types for booking generation - only the fields we actually use
type MinimalTruck = Pick<TruckDefinition, 'licensePlate'>;
type MinimalContainer = Pick<ContainerDefinition, 'containerNumber' | 'operationType'> & { bookingId?: string };

export function generateBookings(
  terminalCodes: string[],
  carriers: { id: string; trucks: MinimalTruck[]; containers: MinimalContainer[] }[],
  totalCount: number
): BookingDefinition[] {
  const bookings: BookingDefinition[] = [];
  const today = getToday();
  const startDate = addDays(today, -30);
  const endDate = addDays(today, 30);
  
  for (let i = 0; i < totalCount; i++) {
    // Select random carrier with available assets
    const carrier = randomElement(carriers.filter(c => c.trucks.length > 0 && c.containers.length > 0));
    if (!carrier) continue;
    
    // Select random terminal
    const terminalCode = randomElement(terminalCodes);
    
    // Select random truck
    const truck = randomElement(carrier.trucks);
    
    // Select 1-4 containers
    const containerCount = weightedRandom([1, 2, 3, 4], [0.5, 0.3, 0.15, 0.05]);
    const availableContainers = carrier.containers.filter(c => !c.bookingId);
    const selectedContainers = randomElements(availableContainers, Math.min(containerCount, availableContainers.length));
    
    if (selectedContainers.length === 0) continue;
    
    // Generate preferred date (past 30 days to future 30 days)
    const preferredDateObj = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    const preferredDate = formatDate(preferredDateObj);
    
    // Generate time slot (06:00 - 22:00)
    const startHour = getRandomHour();
    const preferredTimeStart = formatHour(startHour);
    const preferredTimeEnd = formatHour(startHour + 1);
    
    // Assign realistic status
    const { status } = assignRealisticStatus(preferredDateObj);
    
    // Generate timestamps based on status
    const bookedAt = addDays(preferredDateObj, randomInt(-10, -1)).getTime();
    let confirmedAt: number | undefined;
    let rejectedAt: number | undefined;
    let cancelledAt: number | undefined;
    let consumedAt: number | undefined;
    let expiredAt: number | undefined;
    let entryScannedAt: number | undefined;
    let exitScannedAt: number | undefined;
    
    if (status === 'confirmed' || status === 'consumed') {
      confirmedAt = addDays(new Date(bookedAt), randomInt(0, 2)).getTime();
    }
    
    if (status === 'rejected') {
      rejectedAt = addDays(new Date(bookedAt), randomInt(0, 1)).getTime();
    }
    
    if (status === 'cancelled') {
      cancelledAt = addDays(new Date(bookedAt), randomInt(0, 5)).getTime();
    }
    
    if (status === 'consumed') {
      consumedAt = preferredDateObj.getTime() + randomInt(0, 45) * 60 * 1000; // Within first 45 min of slot
      entryScannedAt = consumedAt;
      exitScannedAt = entryScannedAt + randomInt(30, 120) * 60 * 1000; // 30-120 min in terminal
    }
    
    if (status === 'expired') {
      expiredAt = addDays(preferredDateObj, 1).getTime();
    }
    
    const wasAutoValidated = Math.random() < 0.4; // 40% auto-validated
    
    bookings.push({
      terminalCode,
      carrierId: carrier.id,
      truckLicensePlate: truck.licensePlate,
      containerNumbers: selectedContainers.map(c => c.containerNumber),
      status,
      preferredDate,
      preferredTimeStart,
      preferredTimeEnd,
      driverName: generateAlgerianName(),
      driverPhone: generateAlgerianPhone(),
      driverIdNumber: generateDriverIdNumber(),
      wasAutoValidated,
      bookedAt,
      confirmedAt,
      rejectedAt,
      cancelledAt,
      consumedAt,
      expiredAt,
      statusReason: getStatusReason(status),
      entryScannedAt,
      exitScannedAt,
      scannedByEntry: entryScannedAt ? `operator_${randomInt(0, 15)}` : undefined,
      scannedByExit: exitScannedAt ? `operator_${randomInt(0, 15)}` : undefined,
    });
  }
  
  return bookings;
}

// Add bookingId to containers
export function markContainersAsBooked(
  containers: ContainerDefinition[],
  containerNumbers: string[],
  bookingId: string
): void {
  for (const container of containers) {
    if (containerNumbers.includes(container.containerNumber)) {
      (container as any).bookingId = bookingId;
    }
  }
}
