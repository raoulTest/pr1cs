// ============================================================================
// RESET AND SEED - Complete database reset with real Better Auth users
// ============================================================================
// Usage: npx convex run seed/resetAndSeed:default '{"key":"demo"}'

import { v } from "convex/values";
import { action, internalMutation, internalAction } from "../_generated/server";
import { internal, components } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { ALGERIAN_TERMINALS } from "./data/terminals";
import { getGateForTerminal } from "./data/gates";
import { generateTrucksForCarrier } from "./data/trucks";
import { generateContainersForCarrier } from "./data/containers";
import { generateBookings } from "./data/bookings";
import { randomInt, randomElement } from "./utils/random";
import { scrypt } from "@noble/hashes/scrypt";
import { bytesToHex, randomBytes } from "@noble/hashes/utils";

// Hash password using scrypt (matches Better Auth's exact implementation)
// See: https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/crypto/password.ts
function hashPassword(password: string): string {
  const salt = bytesToHex(randomBytes(16));
  const key = scrypt(password.normalize("NFKC"), salt, { N: 16384, r: 16, p: 1, dkLen: 64 });
  return `${salt}:${bytesToHex(key)}`;
}

const DEFAULT_PASSWORD = "Demo123!";

type CreatedUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

// ============================================================================
// MAIN ACTION - Orchestrates the entire reset and seed process
// ============================================================================

export default action({
  args: {
    key: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    stats: v.object({
      usersCreated: v.number(),
      terminals: v.number(),
      gates: v.number(),
      trucks: v.number(),
      containers: v.number(),
      bookings: v.number(),
    }),
    credentials: v.optional(v.object({
      adminEmail: v.string(),
      password: v.string(),
    })),
  }),
  handler: async (ctx, args) => {
    if (args.key !== "demo") {
      return {
        success: false,
        message: 'Invalid key. Pass { key: "demo" } to reset and seed the database.',
        stats: { usersCreated: 0, terminals: 0, gates: 0, trucks: 0, containers: 0, bookings: 0 },
      };
    }

    const stats = { usersCreated: 0, terminals: 0, gates: 0, trucks: 0, containers: 0, bookings: 0 };

    try {
      // STEP 1: Clear all application tables
      console.log("Step 1: Clearing application tables...");
      await ctx.runMutation(internal.seed.resetAndSeed.clearApplicationTables);
      console.log("  Application tables cleared!");

      // STEP 2: Clear auth tables
      console.log("Step 2: Clearing auth tables...");
      await ctx.runMutation(internal.seed.resetAndSeed.clearAuthTables);
      console.log("  Auth tables cleared!");

      // STEP 3: Create demo users
      console.log("Step 3: Creating demo users...");
      const users: {
        admins: CreatedUser[];
        operators: CreatedUser[];
        carriers: CreatedUser[];
        errors: string[];
      } = await ctx.runAction(internal.seed.resetAndSeed.createDemoUsers, {
        adminCount: 3,
        operatorCount: 15,
        carrierCount: 25,
        defaultPassword: DEFAULT_PASSWORD,
      });
      stats.usersCreated = users.admins.length + users.operators.length + users.carriers.length;
      console.log(`  Created ${stats.usersCreated} users`);
      if (users.errors.length > 0) {
        console.log(`  Errors: ${users.errors.join(", ")}`);
      }

      if (users.admins.length === 0) {
        throw new Error("Failed to create any admin users. Cannot proceed.");
      }

      const primaryAdmin: CreatedUser = users.admins[0]!;
      const adminId = primaryAdmin.id;

      // STEP 4: Create terminals and gates
      console.log("Step 4: Creating terminals and gates...");
      const terminalResult = await ctx.runMutation(internal.seed.resetAndSeed.createTerminalsAndGates, {
        adminId,
      });
      stats.terminals = terminalResult.terminalsCreated;
      stats.gates = terminalResult.gatesCreated;
      console.log(`  Created ${stats.terminals} terminals, ${stats.gates} gates`);

      // STEP 5: Assign operators to terminals
      console.log("Step 5: Assigning operators to terminals...");
      await ctx.runMutation(internal.seed.resetAndSeed.assignOperators, {
        adminId,
        operators: users.operators,
        terminalIds: terminalResult.terminalIds,
      });
      console.log("  Operators assigned!");

      // STEP 6: Create carrier assets (trucks & containers)
      console.log("Step 6: Creating carrier assets...");
      const carrierAssets = await ctx.runMutation(internal.seed.resetAndSeed.createCarrierAssets, {
        adminId,
        carriers: users.carriers,
      });
      stats.trucks = carrierAssets.trucksCreated;
      stats.containers = carrierAssets.containersCreated;
      console.log(`  Created ${stats.trucks} trucks, ${stats.containers} containers`);

      // STEP 7: Create bookings (in batches to avoid timeout)
      console.log("Step 7: Creating bookings...");
      const bookingsResult = await ctx.runMutation(internal.seed.resetAndSeed.createBookings, {
        adminId,
        carrierData: carrierAssets.carrierData,
        terminalMap: terminalResult.terminalMap,
        gateMap: terminalResult.gateMap,
        operators: users.operators,
      });
      stats.bookings = bookingsResult.bookingsCreated;
      console.log(`  Created ${stats.bookings} bookings`);

      // STEP 8: Create audit log
      await ctx.runMutation(internal.seed.resetAndSeed.createAuditLog, {
        adminId,
        stats,
      });

      console.log("=".repeat(60));
      console.log("SEEDING COMPLETED SUCCESSFULLY!");
      console.log("=".repeat(60));
      console.log(`\nLogin credentials:`);
      console.log(`  Email: ${primaryAdmin.email}`);
      console.log(`  Password: ${DEFAULT_PASSWORD}`);

      return {
        success: true,
        message: `Database reset and seeded successfully! Created ${stats.usersCreated} users, ${stats.terminals} terminals, ${stats.gates} gates, ${stats.trucks} trucks, ${stats.containers} containers, and ${stats.bookings} bookings.`,
        stats,
        credentials: {
          adminEmail: primaryAdmin.email,
          password: DEFAULT_PASSWORD,
        },
      };

    } catch (error: any) {
      console.error("Seeding error:", error);
      return {
        success: false,
        message: `Seeding failed: ${error.message}`,
        stats,
      };
    }
  },
});

// ============================================================================
// INTERNAL MUTATIONS - Each handles a specific part of the seed
// ============================================================================

export const clearApplicationTables = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Clear in correct order due to FK constraints
    const tables = [
      "bookingHistory", "notifications", "auditLogs", "bookingAggregates",
      "bookings", "containers", "trucks", "terminalOperatorAssignments",
      "timeSlots", "slotTemplates", "gates", "terminals", "userProfiles", "systemConfig"
    ] as const;

    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }
  },
});

export const clearAuthTables = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Delete one batch for each model - should be enough for demo data
    // If there's more data, run this multiple times
    const paginationOpts = { cursor: null, numItems: 1000 };

    // Clear in order: sessions -> verification -> accounts -> users
    await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
      input: { model: "session" as const },
      paginationOpts,
    });
    await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
      input: { model: "verification" as const },
      paginationOpts,
    });
    await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
      input: { model: "account" as const },
      paginationOpts,
    });
    await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
      input: { model: "user" as const },
      paginationOpts,
    });
  },
});

export const createDemoUsers = internalAction({
  args: {
    adminCount: v.number(),
    operatorCount: v.number(),
    carrierCount: v.number(),
    defaultPassword: v.string(),
  },
  returns: v.object({
    admins: v.array(v.object({ id: v.string(), email: v.string(), name: v.string(), role: v.string() })),
    operators: v.array(v.object({ id: v.string(), email: v.string(), name: v.string(), role: v.string() })),
    carriers: v.array(v.object({ id: v.string(), email: v.string(), name: v.string(), role: v.string() })),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const admins: CreatedUser[] = [];
    const operators: CreatedUser[] = [];
    const carriers: CreatedUser[] = [];
    const errors: string[] = [];

    const FIRST_NAMES = ["Mohamed", "Ahmed", "Karim", "Youcef", "Amine", "Bilal", "Walid", "Samir", "Reda", "Farid", "Omar", "Ali", "Mehdi", "Rachid", "Nassim", "Sofiane", "Fatima", "Amina", "Khadija", "Nadia", "Samira", "Leila", "Dalila", "Yasmina"];
    const LAST_NAMES = ["Benali", "Bensaid", "Boudiaf", "Boumediene", "Brahimi", "Khelifi", "Larbi", "Mahmoudi", "Mansouri", "Meziane", "Mokrani", "Rahmani", "Saidi", "Slimani", "Taleb", "Zerhouni", "Hadjadj", "Bouzid", "Kadri", "Amrani", "Belhadj"];

    const randomElem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)] as T;
    const genName = () => `${randomElem(FIRST_NAMES)} ${randomElem(LAST_NAMES)}`;
    const genEmail = (name: string, i: number, role: string) => {
      const clean = name.toLowerCase().replace(/\s+/g, ".").replace(/[éèêàâîïôöùûü]/g, c => 
        ({ é: "e", è: "e", ê: "e", à: "a", â: "a", î: "i", ï: "i", ô: "o", ö: "o", ù: "u", û: "u", ü: "u" }[c] || c));
      return `${clean}.${role}${i}@apcs.dz`;
    };

    // Hash the password once (all users get the same demo password)
    const hashedPassword = hashPassword(args.defaultPassword);
    const now = Date.now();

    // Helper to create a user via the adapter
    const createUser = async (
      email: string,
      name: string,
      role: "port_admin" | "terminal_operator" | "carrier"
    ): Promise<string | null> => {
      try {
        // Create the user record
        const userResult = await ctx.runMutation(components.betterAuth.adapter.create, {
          input: {
            model: "user" as const,
            data: {
              email,
              name,
              emailVerified: true,
              role,
              createdAt: now,
              updatedAt: now,
            },
          },
        });

        const userId = userResult?._id || userResult?.id;
        if (!userId) {
          errors.push(`${email}: no userId in user result`);
          return null;
        }

        // Create the credential account with hashed password
        await ctx.runMutation(components.betterAuth.adapter.create, {
          input: {
            model: "account" as const,
            data: {
              userId: userId,
              accountId: userId,
              providerId: "credential",
              password: hashedPassword,
              createdAt: now,
              updatedAt: now,
            },
          },
        });

        return userId;
      } catch (e: any) {
        errors.push(`${email}: ${e.message}`);
        return null;
      }
    };

    // Create admins
    for (let i = 0; i < args.adminCount; i++) {
      const name = i === 0 ? "Admin Principal" : genName();
      const email = i === 0 ? "admin@apcs.dz" : genEmail(name, i, "admin");
      console.log(`  Creating admin: ${email}...`);
      const userId = await createUser(email, name, "port_admin");
      if (userId) {
        admins.push({ id: userId, email, name, role: "port_admin" });
        console.log(`  Created admin with ID: ${userId}`);
      }
    }

    // Create operators
    for (let i = 0; i < args.operatorCount; i++) {
      const name = genName();
      const email = genEmail(name, i, "operator");
      const userId = await createUser(email, name, "terminal_operator");
      if (userId) {
        operators.push({ id: userId, email, name, role: "terminal_operator" });
      }
    }

    // Create carriers
    for (let i = 0; i < args.carrierCount; i++) {
      const name = genName();
      const email = genEmail(name, i, "carrier");
      const userId = await createUser(email, name, "carrier");
      if (userId) {
        carriers.push({ id: userId, email, name, role: "carrier" });
      }
    }

    console.log(`  Total: ${admins.length} admins, ${operators.length} operators, ${carriers.length} carriers`);
    return { admins, operators, carriers, errors };
  },
});

export const createTerminalsAndGates = internalMutation({
  args: { adminId: v.string() },
  returns: v.object({
    terminalsCreated: v.number(),
    gatesCreated: v.number(),
    terminalIds: v.array(v.id("terminals")),
    terminalMap: v.array(v.object({ code: v.string(), id: v.id("terminals") })),
    gateMap: v.array(v.object({ key: v.string(), id: v.id("gates") })),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const terminalIds: Id<"terminals">[] = [];
    const terminalMap: { code: string; id: Id<"terminals"> }[] = [];
    const gateMap: { key: string; id: Id<"gates"> }[] = [];
    let gatesCreated = 0;

    // Create system config
    await ctx.db.insert("systemConfig", {
      maxAdvanceBookingDays: 30,
      minAdvanceBookingHours: 2,
      noShowGracePeriodMinutes: 30,
      defaultAutoValidationThreshold: 50,
      reminderHoursBefore: [24, 2],
      maxContainersPerBooking: 10,
      updatedAt: now,
      updatedBy: args.adminId,
    });

    for (const t of ALGERIAN_TERMINALS) {
      const terminalId = await ctx.db.insert("terminals", {
        name: t.name, code: t.code, address: t.address, timezone: t.timezone,
        isActive: true, defaultSlotCapacity: t.defaultSlotCapacity,
        autoValidationThreshold: t.autoValidationThreshold,
        capacityAlertThresholds: t.capacityAlertThresholds,
        operatingHoursStart: t.operatingHoursStart, operatingHoursEnd: t.operatingHoursEnd,
        createdAt: now, updatedAt: now, createdBy: args.adminId,
      });
      
      terminalIds.push(terminalId);
      terminalMap.push({ code: t.code, id: terminalId });

      // Create slot templates
      const startH = parseInt(t.operatingHoursStart.split(":")[0] || "0");
      const endH = parseInt(t.operatingHoursEnd.split(":")[0] || "23");
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          await ctx.db.insert("slotTemplates", {
            terminalId, dayOfWeek: day, hour,
            maxCapacity: t.defaultSlotCapacity,
            isActive: hour >= startH && hour < endH,
            createdAt: now, updatedAt: now,
          });
        }
      }

      // Create gates
      for (const g of getGateForTerminal(t.code)) {
        const gateId = await ctx.db.insert("gates", {
          terminalId, name: g.name, code: g.code, description: g.description,
          isActive: true, allowedTruckTypes: g.allowedTruckTypes, allowedTruckClasses: g.allowedTruckClasses,
          createdAt: now, updatedAt: now, createdBy: args.adminId,
        });
        gateMap.push({ key: `${t.code}:${g.code}`, id: gateId });
        gatesCreated++;
      }
    }

    return { terminalsCreated: terminalIds.length, gatesCreated, terminalIds, terminalMap, gateMap };
  },
});

export const assignOperators = internalMutation({
  args: {
    adminId: v.string(),
    operators: v.array(v.object({ id: v.string(), email: v.string(), name: v.string(), role: v.string() })),
    terminalIds: v.array(v.id("terminals")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.operators.length; i++) {
      const op = args.operators[i]!;
      const numT = randomInt(1, 3);
      const assigned: Id<"terminals">[] = [];
      for (let j = 0; j < numT; j++) {
        const tId = args.terminalIds[(i + j) % args.terminalIds.length];
        if (tId && !assigned.includes(tId)) {
          assigned.push(tId);
          await ctx.db.insert("terminalOperatorAssignments", {
            userId: op.id, terminalId: tId, assignedAt: now, assignedBy: args.adminId, isActive: true,
          });
        }
      }
    }
  },
});

export const createCarrierAssets = internalMutation({
  args: {
    adminId: v.string(),
    carriers: v.array(v.object({ id: v.string(), email: v.string(), name: v.string(), role: v.string() })),
  },
  returns: v.object({
    trucksCreated: v.number(),
    containersCreated: v.number(),
    carrierData: v.array(v.object({
      id: v.string(),
      name: v.string(),
      truckIds: v.array(v.id("trucks")),
      containerIds: v.array(v.id("containers")),
      truckPlates: v.array(v.string()),
      containerNumbers: v.array(v.string()),
    })),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    let trucksCreated = 0, containersCreated = 0;
    const carrierData: any[] = [];

    for (const c of args.carriers) {
      const truckCount = randomInt(2, 5);
      const containerCount = randomInt(8, 15);
      const trucks = generateTrucksForCarrier(c.id, truckCount);
      const containers = generateContainersForCarrier(c.id, containerCount);
      const truckIds: Id<"trucks">[] = [];
      const containerIds: Id<"containers">[] = [];
      const truckPlates: string[] = [];
      const containerNumbers: string[] = [];

      for (const t of trucks) {
        const id = await ctx.db.insert("trucks", {
          ownerId: c.id, licensePlate: t.licensePlate, truckType: t.truckType, truckClass: t.truckClass,
          make: t.make, model: t.model, year: t.year, maxWeight: t.maxWeight,
          isActive: true, createdAt: now, updatedAt: now, createdBy: args.adminId,
        });
        truckIds.push(id);
        truckPlates.push(t.licensePlate);
        trucksCreated++;
      }

      for (const cn of containers) {
        const id = await ctx.db.insert("containers", {
          ownerId: c.id, containerNumber: cn.containerNumber, containerType: cn.containerType,
          dimensions: cn.dimensions, weightClass: cn.weightClass, operationType: cn.operationType,
          readyDate: cn.readyDate, departureDate: cn.departureDate, isEmpty: cn.isEmpty,
          isActive: true, notes: cn.notes, createdAt: now, updatedAt: now,
        });
        containerIds.push(id);
        containerNumbers.push(cn.containerNumber);
        containersCreated++;
      }

      carrierData.push({ id: c.id, name: c.name, truckIds, containerIds, truckPlates, containerNumbers });
    }

    return { trucksCreated, containersCreated, carrierData };
  },
});

export const createBookings = internalMutation({
  args: {
    adminId: v.string(),
    carrierData: v.array(v.object({
      id: v.string(),
      name: v.string(),
      truckIds: v.array(v.id("trucks")),
      containerIds: v.array(v.id("containers")),
      truckPlates: v.array(v.string()),
      containerNumbers: v.array(v.string()),
    })),
    terminalMap: v.array(v.object({ code: v.string(), id: v.id("terminals") })),
    gateMap: v.array(v.object({ key: v.string(), id: v.id("gates") })),
    operators: v.array(v.object({ id: v.string(), email: v.string(), name: v.string(), role: v.string() })),
  },
  returns: v.object({ bookingsCreated: v.number() }),
  handler: async (ctx, args) => {
    const now = Date.now();
    let bookingsCreated = 0;
    const timeSlotCache = new Map<string, Id<"timeSlots">>();

    // Generate booking definitions
    const terminalCodes = args.terminalMap.map(t => t.code);
    const carrierDataForGen = args.carrierData.map(c => ({
      id: c.id,
      trucks: c.truckPlates.map(p => ({ licensePlate: p })),
      containers: c.containerNumbers.map(n => ({ containerNumber: n, operationType: "pick_up" as const })),
    }));
    
    const bookingDefs = generateBookings(terminalCodes, carrierDataForGen, 200); // Reduced to 200 for speed

    for (const b of bookingDefs) {
      const terminal = args.terminalMap.find(t => t.code === b.terminalCode);
      if (!terminal) continue;

      const carrier = args.carrierData.find(c => c.id === b.carrierId);
      if (!carrier) continue;

      const truckIdx = carrier.truckPlates.indexOf(b.truckLicensePlate);
      if (truckIdx === -1) continue;
      const truckId = carrier.truckIds[truckIdx];
      if (!truckId) continue;

      const containerIds: Id<"containers">[] = [];
      for (const cn of b.containerNumbers) {
        const idx = carrier.containerNumbers.indexOf(cn);
        if (idx !== -1 && carrier.containerIds[idx]) {
          containerIds.push(carrier.containerIds[idx]!);
        }
      }
      if (containerIds.length === 0) continue;

      const bookingRef = `${b.terminalCode}-BK-${b.preferredDate.replace(/-/g, '')}-${randomInt(1000, 9999)}`;

      // Get or create time slot
      const slotKey = `${terminal.id}:${b.preferredDate}:${b.preferredTimeStart}`;
      let timeSlotId = timeSlotCache.get(slotKey);
      if (!timeSlotId) {
        timeSlotId = await ctx.db.insert("timeSlots", {
          terminalId: terminal.id, date: b.preferredDate, startTime: b.preferredTimeStart, endTime: b.preferredTimeEnd,
          maxCapacity: 30, currentBookings: 0, autoValidationThreshold: 50, isActive: true,
          createdAt: now, updatedAt: now, createdBy: args.adminId,
        });
        timeSlotCache.set(slotKey, timeSlotId);
      }

      // Gate for confirmed/consumed
      let gateId: Id<"gates"> | undefined;
      if (b.status === "confirmed" || b.status === "consumed") {
        const gates = args.gateMap.filter(g => g.key.startsWith(`${b.terminalCode}:`));
        if (gates.length > 0) gateId = randomElement(gates)!.id;
      }

      const bookingId = await ctx.db.insert("bookings", {
        terminalId: terminal.id, carrierId: carrier.id, truckId, gateId, containerIds,
        bookingReference: bookingRef, status: b.status, wasAutoValidated: b.wasAutoValidated,
        preferredDate: b.preferredDate, preferredTimeStart: b.preferredTimeStart, preferredTimeEnd: b.preferredTimeEnd,
        driverName: b.driverName, driverPhone: b.driverPhone, driverIdNumber: b.driverIdNumber,
        bookedAt: b.bookedAt, confirmedAt: b.confirmedAt, rejectedAt: b.rejectedAt,
        cancelledAt: b.cancelledAt, consumedAt: b.consumedAt, expiredAt: b.expiredAt,
        statusReason: b.statusReason, entryScannedAt: b.entryScannedAt, exitScannedAt: b.exitScannedAt,
        scannedByEntry: b.scannedByEntry, scannedByExit: b.scannedByExit,
        createdBy: carrier.id, updatedAt: now,
      });

      // Update time slot count
      const slot = await ctx.db.get(timeSlotId);
      if (slot) await ctx.db.patch(timeSlotId, { currentBookings: (slot.currentBookings || 0) + 1 });

      // Link containers
      for (const cid of containerIds) await ctx.db.patch(cid, { bookingId });

      // Booking history
      await ctx.db.insert("bookingHistory", {
        bookingId, changeType: "created", newValue: JSON.stringify({ status: b.status }),
        changedAt: b.bookedAt, changedBy: carrier.id, requiredRebook: false,
      });

      // Notification
      const typeMap: Record<string, string> = { pending: "booking_created", confirmed: "booking_confirmed", rejected: "booking_rejected", cancelled: "booking_cancelled", expired: "booking_expired" };
      const titleMap: Record<string, string> = { pending: "Réservation créée", confirmed: "Réservation confirmée", rejected: "Réservation rejetée", cancelled: "Réservation annulée", expired: "Réservation expirée" };
      if (typeMap[b.status]) {
        await ctx.db.insert("notifications", {
          userId: carrier.id, type: typeMap[b.status] as any, channel: "in_app",
          title: titleMap[b.status]!, body: `Votre réservation ${bookingRef} est ${b.status}`,
          relatedEntityType: "booking", relatedEntityId: bookingId, isRead: false, createdAt: now,
        });
      }

      bookingsCreated++;
    }

    return { bookingsCreated };
  },
});

export const createAuditLog = internalMutation({
  args: {
    adminId: v.string(),
    stats: v.object({
      usersCreated: v.number(),
      terminals: v.number(),
      gates: v.number(),
      trucks: v.number(),
      containers: v.number(),
      bookings: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", {
      userId: args.adminId,
      action: "mutation",
      resource: "seed.resetAndSeed",
      args: JSON.stringify(args.stats),
      result: "success",
      timestamp: Date.now(),
    });
  },
});
