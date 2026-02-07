// ============================================================================
// MAIN SEED MUTATION - APCS Algerian Data (Demo Mode)
// ============================================================================
// Simple demo seed - just pass { key: "demo" } to seed the database

import { v } from "convex/values";
import { mutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { ALGERIAN_TERMINALS } from "./data/terminals";
import { getGateForTerminal } from "./data/gates";
import { generateTrucksForCarrier } from "./data/trucks";
import { generateContainersForCarrier, type ContainerDefinition } from "./data/containers";
import { generateBookings, type BookingDefinition } from "./data/bookings";
import { randomInt, randomElement } from "./utils/random";

// Demo admin user ID
const DEMO_ADMIN_ID = "demo_admin_user";

export default mutation({
  args: {
    // Just pass { key: "demo" } to run the seed
    key: v.string(),
  },
  
  handler: async (ctx, args): Promise<{
    success: boolean;
    message: string;
    stats: {
      terminals: number;
      gates: number;
      trucks: number;
      containers: number;
      bookings: number;
      slotTemplates: number;
    };
  }> => {
    // Verify key
    if (args.key !== "demo") {
      return {
        success: false,
        message: 'Invalid key. Pass { key: "demo" } to seed the database.',
        stats: {
          terminals: 0,
          gates: 0,
          trucks: 0,
          containers: 0,
          bookings: 0,
          slotTemplates: 0,
        },
      };
    }
    
    const now = Date.now();
    const stats = {
      terminals: 0,
      gates: 0,
      trucks: 0,
      containers: 0,
      bookings: 0,
      slotTemplates: 0,
    };
    
    try {
      // Generate demo user IDs
      const operatorIds = Array.from({ length: 15 }, (_, i) => `demo_operator_${i}`);
      const carrierIds = Array.from({ length: 25 }, (_, i) => `demo_carrier_${i}`);
    
      // ======================================================================
      // STEP 1: System Configuration (Singleton)
      // ======================================================================
      console.log("Step 1: Creating system configuration...");
      
      const existingConfig = await ctx.db.query("systemConfig").first();
      if (!existingConfig) {
        await ctx.db.insert("systemConfig", {
          maxAdvanceBookingDays: 30,
          minAdvanceBookingHours: 2,
          noShowGracePeriodMinutes: 30,
          defaultAutoValidationThreshold: 50,
          reminderHoursBefore: [24, 2],
          maxContainersPerBooking: 10,
          updatedAt: now,
          updatedBy: DEMO_ADMIN_ID,
        });
      }
      
      // ======================================================================
      // STEP 2: Create Terminals (with auto-generated slot templates)
      // ======================================================================
      console.log("Step 2: Creating terminals...");
      
      const terminalIds = new Map<string, Id<"terminals">>(); // code -> _id
      
      for (const terminalDef of ALGERIAN_TERMINALS) {
        // Check if terminal already exists
        const existingTerminal = await ctx.db
          .query("terminals")
          .withIndex("by_code", (q) => q.eq("code", terminalDef.code))
          .first();
        
        if (existingTerminal) {
          terminalIds.set(terminalDef.code, existingTerminal._id);
          continue;
        }
        
        const terminalId = await ctx.db.insert("terminals", {
          name: terminalDef.name,
          code: terminalDef.code,
          address: terminalDef.address,
          timezone: terminalDef.timezone,
          isActive: true,
          defaultSlotCapacity: terminalDef.defaultSlotCapacity,
          autoValidationThreshold: terminalDef.autoValidationThreshold,
          capacityAlertThresholds: terminalDef.capacityAlertThresholds,
          operatingHoursStart: terminalDef.operatingHoursStart,
          operatingHoursEnd: terminalDef.operatingHoursEnd,
          createdAt: now,
          updatedAt: now,
          createdBy: DEMO_ADMIN_ID,
        });
        
        terminalIds.set(terminalDef.code, terminalId);
        stats.terminals++;
        
        // Slot templates are auto-created via terminal trigger, but let's count them
        stats.slotTemplates += 168; // 7 days × 24 hours
      }
      
      // ======================================================================
      // STEP 3: Create Gates for Each Terminal
      // ======================================================================
      console.log("Step 3: Creating gates...");
      
      const gateIds = new Map<string, Id<"gates">>(); // terminalCode:gateCode -> _id
      
      for (const [terminalCode, terminalId] of terminalIds) {
        const gateDefinitions = getGateForTerminal(terminalCode);
        
        for (const gateDef of gateDefinitions) {
          // Check if gate already exists
          const existingGate = await ctx.db
            .query("gates")
            .withIndex("by_code", (q) => q.eq("code", gateDef.code))
            .first();
          
          if (existingGate) {
            gateIds.set(`${terminalCode}:${gateDef.code}`, existingGate._id);
            continue;
          }
          
          const gateId = await ctx.db.insert("gates", {
            terminalId,
            name: gateDef.name,
            code: gateDef.code,
            description: gateDef.description,
            isActive: true,
            allowedTruckTypes: gateDef.allowedTruckTypes,
            allowedTruckClasses: gateDef.allowedTruckClasses,
            createdAt: now,
            updatedAt: now,
            createdBy: DEMO_ADMIN_ID,
          });
          
          gateIds.set(`${terminalCode}:${gateDef.code}`, gateId);
          stats.gates++;
        }
      }
      
      // ======================================================================
      // STEP 4: Setup Carrier Data (Trucks & Containers)
      // ======================================================================
      console.log("Step 4: Creating carrier assets (trucks & containers)...");
      
      const carrierData: {
        id: string;
        truckIds: Id<"trucks">[];
        containerIds: Id<"containers">[];
        truckDefs: ReturnType<typeof generateTrucksForCarrier>;
        containerDefs: ContainerDefinition[];
      }[] = [];
      
      for (const carrierId of carrierIds) {
        const truckCount = randomInt(2, 5);
        const containerCount = randomInt(8, 20);
        
        // Generate trucks
        const trucks = generateTrucksForCarrier(carrierId, truckCount);
        const truckIds: Id<"trucks">[] = [];
        
        for (const truck of trucks) {
          const existingTruck = await ctx.db
            .query("trucks")
            .withIndex("by_license_plate", (q) => q.eq("licensePlate", truck.licensePlate))
            .first();
          
          if (existingTruck) {
            truckIds.push(existingTruck._id);
            continue;
          }
          
          const truckId = await ctx.db.insert("trucks", {
            ownerId: carrierId,
            licensePlate: truck.licensePlate,
            truckType: truck.truckType,
            truckClass: truck.truckClass,
            make: truck.make,
            model: truck.model,
            year: truck.year,
            maxWeight: truck.maxWeight,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            createdBy: DEMO_ADMIN_ID,
          });
          
          truckIds.push(truckId);
          stats.trucks++;
        }
        
        // Generate containers
        const containers = generateContainersForCarrier(carrierId, containerCount);
        const containerIds: Id<"containers">[] = [];
        
        for (const container of containers) {
          const existingContainer = await ctx.db
            .query("containers")
            .withIndex("by_container_number", (q) => q.eq("containerNumber", container.containerNumber))
            .first();
          
          if (existingContainer) {
            containerIds.push(existingContainer._id);
            continue;
          }
          
          const containerId = await ctx.db.insert("containers", {
            ownerId: carrierId,
            containerNumber: container.containerNumber,
            containerType: container.containerType,
            dimensions: container.dimensions,
            weightClass: container.weightClass,
            operationType: container.operationType,
            readyDate: container.readyDate,
            departureDate: container.departureDate,
            isEmpty: container.isEmpty,
            isActive: true,
            notes: container.notes,
            createdAt: now,
            updatedAt: now,
          });
          
          containerIds.push(containerId);
          stats.containers++;
        }
        
        carrierData.push({
          id: carrierId,
          truckIds,
          containerIds,
          truckDefs: trucks,
          containerDefs: containers,
        });
      }
      
      // ======================================================================
      // STEP 5: Create Bookings
      // ======================================================================
      console.log("Step 5: Creating bookings...");
      
      const terminalCodes = Array.from(terminalIds.keys());
      const bookings: BookingDefinition[] = generateBookings(
        terminalCodes,
        carrierData.map(c => ({
          id: c.id,
          trucks: c.truckDefs,
          containers: c.containerDefs,
        })),
        400 // Target 400 bookings
      );
      
      for (const bookingDef of bookings) {
        const terminalId = terminalIds.get(bookingDef.terminalCode);
        if (!terminalId) continue;
        
        const carrier = carrierData.find(c => c.id === bookingDef.carrierId);
        if (!carrier) continue;
        
        // Find truck by license plate
        const truckIndex = carrier.truckDefs.findIndex(
          t => t.licensePlate === bookingDef.truckLicensePlate
        );
        if (truckIndex === -1) continue;
        const truckId = carrier.truckIds[truckIndex];
        if (!truckId) continue;
        
        // Find containers by container number
        const containerIds: Id<"containers">[] = [];
        for (const containerNumber of bookingDef.containerNumbers) {
          const containerIndex = carrier.containerDefs.findIndex(
            c => c.containerNumber === containerNumber
          );
          if (containerIndex !== -1) {
            const containerId = carrier.containerIds[containerIndex];
            if (containerId) {
              containerIds.push(containerId);
            }
          }
        }
        
        if (containerIds.length === 0) continue;
        
        // Generate booking reference
        const bookingRef = `${bookingDef.terminalCode}-BK-${bookingDef.preferredDate.replace(/-/g, '')}-${randomInt(1000, 9999)}`;
        
        // Check for duplicate booking reference
        const existingBooking = await ctx.db
          .query("bookings")
          .withIndex("by_reference", (q) => q.eq("bookingReference", bookingRef))
          .first();
        
        if (existingBooking) continue;
        
        // Create or get time slot
        let timeSlot = await ctx.db
          .query("timeSlots")
          .withIndex("by_terminal_and_date", (q) => 
            q.eq("terminalId", terminalId).eq("date", bookingDef.preferredDate)
          )
          .first();
        
        if (!timeSlot) {
          const timeSlotId = await ctx.db.insert("timeSlots", {
            terminalId,
            date: bookingDef.preferredDate,
            startTime: bookingDef.preferredTimeStart,
            endTime: bookingDef.preferredTimeEnd,
            maxCapacity: 30,
            currentBookings: 0,
            autoValidationThreshold: 50,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            createdBy: DEMO_ADMIN_ID,
          });
          
          timeSlot = await ctx.db.get(timeSlotId);
        }
        
        // Assign gate for confirmed/consumed bookings
        let gateId: Id<"gates"> | undefined;
        if (bookingDef.status === 'confirmed' || bookingDef.status === 'consumed') {
          const terminalGates = Array.from(gateIds.entries())
            .filter(([key]) => key.startsWith(`${bookingDef.terminalCode}:`))
            .map(([, id]) => id);
          
          if (terminalGates.length > 0) {
            gateId = randomElement(terminalGates);
          }
        }
        
        // Create booking
        const bookingId = await ctx.db.insert("bookings", {
          terminalId,
          carrierId: bookingDef.carrierId,
          truckId,
          gateId,
          containerIds,
          bookingReference: bookingRef,
          status: bookingDef.status,
          wasAutoValidated: bookingDef.wasAutoValidated,
          preferredDate: bookingDef.preferredDate,
          preferredTimeStart: bookingDef.preferredTimeStart,
          preferredTimeEnd: bookingDef.preferredTimeEnd,
          driverName: bookingDef.driverName,
          driverPhone: bookingDef.driverPhone,
          driverIdNumber: bookingDef.driverIdNumber,
          bookedAt: bookingDef.bookedAt,
          confirmedAt: bookingDef.confirmedAt,
          rejectedAt: bookingDef.rejectedAt,
          cancelledAt: bookingDef.cancelledAt,
          consumedAt: bookingDef.consumedAt,
          expiredAt: bookingDef.expiredAt,
          statusReason: bookingDef.statusReason,
          entryScannedAt: bookingDef.entryScannedAt,
          exitScannedAt: bookingDef.exitScannedAt,
          scannedByEntry: bookingDef.scannedByEntry,
          scannedByExit: bookingDef.scannedByExit,
          createdBy: DEMO_ADMIN_ID,
          updatedAt: now,
        });
        
        // Update time slot booking count
        if (timeSlot) {
          await ctx.db.patch(timeSlot._id, {
            currentBookings: (timeSlot.currentBookings || 0) + 1,
          });
        }
        
        // Update containers with booking reference
        for (const containerId of containerIds) {
          await ctx.db.patch(containerId, {
            bookingId,
          });
        }
        
        // Create booking history entry
        await ctx.db.insert("bookingHistory", {
          bookingId,
          changeType: "created",
          newValue: JSON.stringify({ status: bookingDef.status }),
          changedAt: bookingDef.bookedAt,
          changedBy: DEMO_ADMIN_ID,
          requiredRebook: false,
        });
        
        // Create status change history if not pending
        if (bookingDef.status !== 'pending') {
          const statusTimestamp = 
            bookingDef.confirmedAt || 
            bookingDef.rejectedAt || 
            bookingDef.cancelledAt || 
            bookingDef.consumedAt || 
            bookingDef.expiredAt || 
            now;
          
          await ctx.db.insert("bookingHistory", {
            bookingId,
            changeType: "status_changed",
            previousValue: JSON.stringify({ status: 'pending' }),
            newValue: JSON.stringify({ status: bookingDef.status }),
            changedAt: statusTimestamp,
            changedBy: DEMO_ADMIN_ID,
            note: bookingDef.statusReason,
            requiredRebook: false,
          });
        }
        
        // Create notification for the carrier (only for valid notification types)
        const notificationTypeMap: Record<string, string> = {
          pending: 'booking_created',
          confirmed: 'booking_confirmed',
          rejected: 'booking_rejected',
          cancelled: 'booking_cancelled',
          expired: 'booking_expired',
          // consumed doesn't have a notification type, skip it
        };
        
        const notificationTitles: Record<string, string> = {
          pending: "Réservation créée",
          confirmed: "Réservation confirmée",
          rejected: "Réservation rejetée",
          cancelled: "Réservation annulée",
          expired: "Réservation expirée",
        };
        
        const notificationType = notificationTypeMap[bookingDef.status];
        if (notificationType) {
          await ctx.db.insert("notifications", {
            userId: bookingDef.carrierId,
            type: notificationType as any,
            channel: "in_app",
            title: notificationTitles[bookingDef.status] ?? "Notification",
            body: `Votre réservation ${bookingRef} au terminal ${bookingDef.terminalCode} est ${bookingDef.status}`,
            relatedEntityType: "booking",
            relatedEntityId: bookingId,
            isRead: false,
            createdAt: now,
          });
        }
        
        stats.bookings++;
      }
      
      // ======================================================================
      // STEP 6: Create Terminal Operator Assignments
      // ======================================================================
      console.log("Step 6: Creating operator assignments...");
      
      const terminalIdList = Array.from(terminalIds.values());
      
      for (let i = 0; i < operatorIds.length; i++) {
        const operatorId = operatorIds[i];
        if (!operatorId) continue;
        
        // Assign each operator to 1-3 terminals
        const numTerminals = randomInt(1, 3);
        const assignedTerminalIds: Id<"terminals">[] = [];
        
        for (let j = 0; j < numTerminals; j++) {
          const terminalId = terminalIdList[j % terminalIdList.length];
          if (!terminalId) continue;
          
          if (!assignedTerminalIds.includes(terminalId)) {
            assignedTerminalIds.push(terminalId);
            
            // Check if assignment already exists
            const existingAssignment = await ctx.db
              .query("terminalOperatorAssignments")
              .withIndex("by_user_and_terminal", (q) => 
                q.eq("userId", operatorId).eq("terminalId", terminalId)
              )
              .first();
            
            if (!existingAssignment) {
              await ctx.db.insert("terminalOperatorAssignments", {
                userId: operatorId,
                terminalId,
                assignedAt: now,
                assignedBy: DEMO_ADMIN_ID,
                isActive: true,
              });
            }
          }
        }
      }
      
      // ======================================================================
      // STEP 7: Create Audit Logs
      // ======================================================================
      console.log("Step 7: Creating audit logs...");
      
      await ctx.db.insert("auditLogs", {
        userId: DEMO_ADMIN_ID,
        action: "mutation",
        resource: "seed.execute",
        args: JSON.stringify({ 
          terminalsCreated: stats.terminals,
          gatesCreated: stats.gates,
          trucksCreated: stats.trucks,
          containersCreated: stats.containers,
          bookingsCreated: stats.bookings,
        }),
        result: "success",
        timestamp: now,
      });
      
      console.log("Seeding completed successfully!");
      console.log("Stats:", stats);
      
      return {
        success: true,
        message: `Demo database seeded successfully with Algerian data! Created ${stats.terminals} terminals, ${stats.gates} gates, ${stats.trucks} trucks, ${stats.containers} containers, and ${stats.bookings} bookings.`,
        stats,
      };
      
    } catch (error: any) {
      console.error("Seeding error:", error);
      
      // Log the error
      await ctx.db.insert("auditLogs", {
        userId: DEMO_ADMIN_ID,
        action: "mutation",
        resource: "seed.execute",
        result: "error",
        errorMessage: error.message,
        timestamp: now,
      });
      
      return {
        success: false,
        message: `Seeding failed: ${error.message}`,
        stats,
      };
    }
  },
});
