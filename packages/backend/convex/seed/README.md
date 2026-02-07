# APCS Database Seeding (Demo Mode)

This module provides simple database seeding for the APCS (Port Terminal Management System) with **Algerian port data**.

## Quick Start

Just pass `{ key: "demo" }` to run the seed:

```bash
npx convex run seed/seed:default '{"key":"demo"}'
```

That's it! No need to create users first.

## Data Created

- **7 Algerian port terminals** (Algiers, Oran, Annaba, Béjaïa, Skikda, Mostaganem, Ghazaouet)
- **~25 gates** across all terminals
- **~100 trucks** (Algerian license plates)
- **~350 containers** (ISO 6346 format)
- **~400 bookings** with realistic status distribution
- **15 operators** assigned to terminals
- **25 carriers** with trucks and containers

## Alternative: Via Convex Dashboard

1. Open the Convex dashboard: `npx convex dashboard`
2. Navigate to the `seed/seed` mutation
3. Call with:

```json
{
  "key": "demo"
}
```

## Algerian Port Data

### Terminals

1. **Port d'Alger** (TER-ALGIERS) - 40 trucks/slot
2. **Port d'Oran** (TER-ORAN) - 35 trucks/slot
3. **Port d'Annaba** (TER-ANNABA) - 30 trucks/slot
4. **Port de Béjaïa** (TER-BEJAIA) - 25 trucks/slot
5. **Port de Skikda** (TER-SKIKDA) - 28 trucks/slot
6. **Port de Mostaganem** (TER-MOSTAGANEM) - 22 trucks/slot
7. **Port de Ghazaouet** (TER-GHAZAOUET) - 15 trucks/slot

### Demo Users

The seed automatically creates demo users:
- **Admin**: `demo_admin_user`
- **Operators**: `demo_operator_0` through `demo_operator_14`
- **Carriers**: `demo_carrier_0` through `demo_carrier_24`

## Features

- **Idempotent** - Safe to run multiple times (skips duplicates)
- **Realistic data** - Algerian names, phone numbers, license plates
- **Booking lifecycle** - Pending, confirmed, consumed, cancelled, rejected, expired
- **Full audit trail** - Booking history and notifications created
- **Time slots** - Created on-demand as bookings are made

## File Structure

```
convex/seed/
├── seed.ts                    # Main seeding mutation
├── index.ts                   # Module exports
├── data/
│   ├── terminals.ts          # Terminal definitions
│   ├── gates.ts              # Gate configurations
│   ├── trucks.ts             # Truck generation
│   ├── containers.ts         # Container generation
│   └── bookings.ts           # Booking generation
└── utils/
    ├── random.ts             # Random utilities
    ├── dates.ts              # Date utilities
    ├── iso6346.ts            # Container numbers
    └── algerianLicensePlates.ts  # Algerian plates
```

## Notes

- No Better Auth setup required
- No pre-existing users needed
- Perfect for demos and testing
- All data uses `demo_` prefix for easy identification
