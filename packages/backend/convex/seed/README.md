# APCS Database Seeding

This module provides comprehensive database seeding for the APCS (Port Terminal Management System) with **Algerian port data**.

## Overview

The seeding system creates realistic data for:
- **7 Algerian port terminals** (Algiers, Oran, Annaba, Béjaïa, Skikda, Mostaganem, Ghazaouet)
- **~25 gates** across all terminals
- **~100 trucks** (Algerian license plates)
- **~350 containers** (ISO 6346 format)
- **~400 bookings** with realistic status distribution
- **~1,176 slot templates** (168 per terminal)

## Prerequisites

Before running the seed, you need to create users via Better Auth:

1. **Admin User** (port_admin role) - required
2. **Operator Users** (terminal_operator role) - optional
3. **Carrier Users** (carrier role) - optional (mock IDs will be used if not provided)

## Usage

### Method 1: Via Convex Dashboard

1. Open the Convex dashboard: `npx convex dashboard`
2. Navigate to the "seed/seed" mutation
3. Call with arguments:

```json
{
  "adminUserId": "your-admin-user-id",
  "operatorUserIds": ["operator-1-id", "operator-2-id", ...],
  "carrierUserIds": ["carrier-1-id", "carrier-2-id", ...]
}
```

### Method 2: Via Convex CLI

```bash
npx convex run seed:seed '{"adminUserId": "your-admin-user-id"}'
```

### Method 3: Via API

```typescript
import { api } from "../convex/_generated/api";

// In your component or script
await convex.mutation(api.seed.seed, {
  adminUserId: "your-admin-user-id",
  operatorUserIds: ["operator-1", "operator-2"],
  carrierUserIds: ["carrier-1", "carrier-2", "carrier-3"]
});
```

## Data Structure

### Terminals
- Algerian ports with realistic addresses
- Timezone: Africa/Algiers
- Operating hours: 06:00-22:00
- Capacity: 15-40 trucks per slot
- Auto-validation: 30-60%

### Gates
- 2-5 gates per terminal
- Type restrictions (container, flatbed, tanker, etc.)
- Class restrictions (light, medium, heavy, super_heavy)

### Trucks
- Algerian license plate format: `XXXXX YYY WW`
  - XXXXX = 5 digits (registration)
  - YYY = 3 digits (series)
  - WW = 2 digits (wilaya code)
- Makes: Mercedes-Benz, Volvo, Scania, MAN, DAF, Renault, Iveco, etc.
- Types: container, flatbed, tanker, refrigerated, bulk, general

### Containers
- ISO 6346 format: `AAAAXXXXXXXC`
  - AAAA = Owner code (e.g., MSCU, CMAU)
  - XXXXXX = 6 digits
  - C = Check digit
- Types: dry, reefer, open_top, flat_rack, tank, hazardous
- Dimensions: 20ft, 40ft, 40ft_hc, 45ft
- Operations: pick_up, drop_off

### Bookings
- Realistic status distribution:
  - Pending: 10-15% (future bookings)
  - Confirmed: 30-40% (near future)
  - Consumed: 30-40% (past bookings)
  - Cancelled: 5-10%
  - Rejected: 3-5%
  - Expired: 2-5%
- Algerian driver names (Ahmed, Mohamed, Fatima, Amina, etc.)
- Algerian phone numbers (+213 format)
- Booking references: `TER-XXX-BK-YYYYMMDD-XXXX`

## Algerian Port Data

### Terminals Included

1. **Port d'Alger** (TER-ALGIERS)
   - Address: Boulevard Mohamed VI, Alger Centre
   - Capacity: 40 trucks/slot
   - Gates: 5

2. **Port d'Oran** (TER-ORAN)
   - Address: Rue du Port, Oran
   - Capacity: 35 trucks/slot
   - Gates: 4

3. **Port d'Annaba** (TER-ANNABA)
   - Address: Zone Portuaire, Annaba
   - Capacity: 30 trucks/slot
   - Gates: 4

4. **Port de Béjaïa** (TER-BEJAIA)
   - Address: Port de Béjaïa
   - Capacity: 25 trucks/slot
   - Gates: 3

5. **Port de Skikda** (TER-SKIKDA)
   - Address: Zone Industrielle, Skikda
   - Capacity: 28 trucks/slot
   - Gates: 3

6. **Port de Mostaganem** (TER-MOSTAGANEM)
   - Address: Zone Portuaire, Mostaganem
   - Capacity: 22 trucks/slot
   - Gates: 3

7. **Port de Ghazaouet** (TER-GHAZAOUET)
   - Address: Route de Ghazaouet, Tlemcen
   - Capacity: 15 trucks/slot
   - Gates: 2

## Wilaya Codes Used

- 16: Algiers
- 31: Oran
- 23: Annaba
- 6: Béjaïa
- 21: Skikda
- 27: Mostaganem
- 13: Tlemcen

## File Structure

```
convex/seed/
├── seed.ts                    # Main seeding mutation
├── index.ts                   # Module exports
├── data/
│   ├── terminals.ts          # Algerian terminal definitions
│   ├── gates.ts              # Gate configurations
│   ├── trucks.ts             # Truck generation
│   ├── containers.ts         # Container generation
│   └── bookings.ts           # Booking generation
└── utils/
    ├── random.ts             # Random utilities
    ├── dates.ts              # Date utilities
    ├── iso6346.ts            # ISO container number generator
    └── algerianLicensePlates.ts  # Algerian license plates
```

## Notes

- Duplicate data is skipped (checked via unique fields)
- Booking history and notifications are created for each booking
- Time slots are created on-demand as bookings are made
- Container booking references are updated when booked
- All timestamps use milliseconds since epoch

## Troubleshooting

### "User not found" errors
Ensure you've created users via Better Auth before running the seed.

### Duplicate data
The seed is idempotent - it skips records that already exist based on unique fields.

### Performance
The seed creates 500+ records and may take 10-30 seconds to complete.

## License

Internal use only - Part of the APCS Port Terminal Management System.
