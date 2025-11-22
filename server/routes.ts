import { Router } from "express";
import type { IStorage } from "./storage";
import { db } from "./db";
import { operators, customers, users, favorites, operatorTierStats, weatherAlerts, insertWeatherAlertSchema, emergencyRequests, dispatchQueue, insertEmergencyRequestSchema, insertDispatchQueueSchema, businesses, serviceRequests } from "@shared/schema";
import { eq, sql, and, gte, or } from "drizzle-orm";
import { insertJobSchema, insertServiceRequestSchema, insertCustomerSchema, insertOperatorSchema, insertRatingSchema, insertFavoriteSchema, insertOperatorLocationSchema, insertCustomerServiceHistorySchema, OPERATOR_TIER_INFO } from "@shared/schema";
import { isWithinRadius } from "./utils/distance";
import { getServiceRelevantAlerts } from "./services/weatherService";
import { z } from "zod";

// Validation schemas for operator endpoints
const updateActiveTierSchema = z.object({
  activeTier: z.enum(['professional', 'equipped', 'manual'])
});

const updateEquipmentSchema = z.object({
  equipmentInventory: z.array(z.any()).optional(),
  primaryVehicleImage: z.string().nullable().optional()
});

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

export function registerRoutes(storage: IStorage) {
  const router = Router();

  router.get("/api/jobs", async (req, res) => {
    const customerId = req.query.customerId as string | undefined;
    const jobs = await storage.getJobs(customerId);
    res.json(jobs);
  });

  router.get("/api/jobs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const job = await storage.getJob(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  });

  router.get("/api/jobs/number/:jobNumber", async (req, res) => {
    const job = await storage.getJobByNumber(req.params.jobNumber);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  });

  router.post("/api/jobs", async (req, res) => {
    const result = insertJobSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues });
    }
    const job = await storage.createJob(result.data);
    res.status(201).json(job);
  });

  router.patch("/api/jobs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const job = await storage.updateJob(id, req.body);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  });

  router.get("/api/operators", async (req, res) => {
    try {
      const service = req.query.service as string | undefined;
      
      // Get operators from database with optional service filter
      let dbOperators;
      if (service) {
        // Filter by service using Drizzle
        dbOperators = await db.query.operators.findMany({
          where: sql`${operators.services}::jsonb @> ${JSON.stringify([service])}::jsonb`
        });
      } else {
        dbOperators = await db.query.operators.findMany();
      }
      
      res.json(dbOperators);
    } catch (error) {
      console.error("Error fetching operators:", error);
      res.status(500).json({ error: "Failed to fetch operators" });
    }
  });

  router.get("/api/operators/nearby", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 10;
      
      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ message: "Valid latitude and longitude required" });
      }
      
      // Get all operators from database and filter by proximity
      const allOperators = await db.query.operators.findMany();
      const nearbyOperators = allOperators.filter(op => {
        const opLat = parseFloat(String(op.latitude));
        const opLon = parseFloat(String(op.longitude));
        return isWithinRadius(lat, lon, opLat, opLon, radius);
      });
      
      res.json(nearbyOperators);
    } catch (error) {
      console.error("Error fetching nearby operators:", error);
      res.status(500).json({ message: "Failed to fetch nearby operators" });
    }
  });

  router.get("/api/operators/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const operator = await db.query.operators.findFirst({
        where: eq(operators.id, id)
      });
      if (!operator) {
        return res.status(404).json({ message: "Operator not found" });
      }
      res.json(operator);
    } catch (error) {
      console.error("Error fetching operator:", error);
      res.status(500).json({ message: "Failed to fetch operator" });
    }
  });

  router.get("/api/operators/by-id/:operatorId", async (req, res) => {
    try {
      const operatorId = req.params.operatorId;
      const operator = await db.query.operators.findFirst({
        where: eq(operators.operatorId, operatorId)
      });
      if (!operator) {
        return res.status(404).json({ message: "Operator not found" });
      }

      // Ensure operatorTierProfiles is properly formatted
      // If not exists or is empty, generate based on subscribedTiers
      let tierProfiles = operator.operatorTierProfiles as any[];
      
      if (!tierProfiles || tierProfiles.length === 0) {
        // Generate mock tier profiles based on subscribed tiers
        tierProfiles = operator.subscribedTiers.map((tier: string) => ({
          tier,
          subscribed: true,
          onboardingCompleted: true,
          onboardedAt: new Date().toISOString(),
          approvalStatus: "approved", // Mock: all tiers approved
          approvalSubmittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          approvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          canEarn: true,
          vehicle: operator.vehicle,
          licensePlate: operator.licensePlate,
          businessName: operator.businessName || undefined,
          businessLicense: operator.businessLicense || undefined,
          services: operator.services as string[],
        }));
      }

      res.json({
        ...operator,
        operatorTierProfiles: tierProfiles
      });
    } catch (error) {
      console.error("Error fetching operator:", error);
      res.status(500).json({ message: "Failed to fetch operator" });
    }
  });

  router.get("/api/operators/by-id/:operatorId/tier-stats", async (req, res) => {
    try {
      const operatorId = req.params.operatorId;
      
      // Fetch tier-specific stats for this operator
      const tierStats = await db.query.operatorTierStats.findMany({
        where: eq(operatorTierStats.operatorId, operatorId)
      });
      
      res.json(tierStats);
    } catch (error) {
      console.error("Error fetching tier stats:", error);
      res.status(500).json({ message: "Failed to fetch tier stats" });
    }
  });

  router.get("/api/operators/by-user/:email", async (req, res) => {
    try {
      const email = req.params.email;
      
      // Find all operators for this user by email
      const userOperators = await db.query.operators.findMany({
        where: eq(operators.email, email)
      });
      
      res.json(userOperators);
    } catch (error) {
      console.error("Error fetching operators by user:", error);
      res.status(500).json({ message: "Failed to fetch operators" });
    }
  });

  // Get separate tier cards - one for Professional, one for Equipped+Manual combined
  router.get("/api/operator-cards", async (req, res) => {
    try {
      const service = req.query.service as string | undefined;
      
      // Get all operators
      const allOperators = await db.query.operators.findMany();
      
      // Group operators by email to consolidate duplicates (normalize email)
      const operatorsByEmail = new Map<string, any[]>();
      for (const op of allOperators) {
        // Normalize email: trim and lowercase
        const emailRaw = op.email || op.operatorId || "";
        const email = String(emailRaw).trim().toLowerCase();
        if (!operatorsByEmail.has(email)) {
          operatorsByEmail.set(email, []);
        }
        operatorsByEmail.get(email)!.push(op);
      }
      
      // Build SEPARATE tier cards (not consolidated)
      const tierCards = [];
      for (const [email, operators] of operatorsByEmail) {
        // Use the most recent operator record as the base
        const primaryOperator = operators.reduce((latest, current) => 
          new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
        );
        
        // Collect all subscribed tiers AND operatorTier (for legacy operators without subscribedTiers)
        const allTiers = new Set<string>();
        const allSubscribedTiers = new Set<string>();
        const tierDataMap = new Map<string, any>();
        
        for (const op of operators) {
          // Add operatorTier for backward compatibility
          allTiers.add(op.operatorTier);
          
          // Add subscribedTiers if available
          if (op.subscribedTiers && op.subscribedTiers.length > 0) {
            op.subscribedTiers.forEach((t: string) => allSubscribedTiers.add(t));
          }
          
          // Merge tier-specific data for each record's tier
          if (!tierDataMap.has(op.operatorTier)) {
            tierDataMap.set(op.operatorTier, {
              services: new Set<string>(),
              vehicles: new Set<string>(),
              licensePlates: new Set<string>(),
              equipmentInventory: []
            });
          }
          
          const tierData = tierDataMap.get(op.operatorTier)!;
          // Merge services
          if (op.services) {
            op.services.forEach((s: string) => tierData.services.add(s));
          }
          // Merge vehicles and license plates
          if (op.vehicle && op.vehicle !== "Not set" && op.vehicle !== "Not specified") {
            tierData.vehicles.add(op.vehicle);
          }
          if (op.licensePlate && op.licensePlate !== "Not set" && op.licensePlate !== "N/A") {
            tierData.licensePlates.add(op.licensePlate);
          }
          // Merge equipment inventory (sanitize nulls, filter valid equipment)
          if (op.equipmentInventory && Array.isArray(op.equipmentInventory) && op.equipmentInventory.length > 0) {
            const validEquipment = op.equipmentInventory.filter(item => item != null);
            tierData.equipmentInventory.push(...validEquipment);
          }
        }
        
        // Get tier stats for ALL operator IDs in this merged set
        const allOperatorIds = operators.map(op => op.operatorId);
        const { ratings } = await import("@shared/schema");
        const { inArray } = await import("drizzle-orm");
        
        const tierStatsRecords = await db.query.operatorTierStats.findMany({
          where: inArray(operatorTierStats.operatorId, allOperatorIds)
        });
        
        // Merge tier stats by tier (aggregate across all merged operators)
        const tierStatsMap: Record<string, any> = {};
        for (const stat of tierStatsRecords) {
          if (!tierStatsMap[stat.tier]) {
            tierStatsMap[stat.tier] = {
              jobsCompleted: 0,
              totalEarnings: 0,
              totalRatings: 0,
              ratingSum: 0,
              lastActiveAt: stat.lastActiveAt
            };
          }
          
          tierStatsMap[stat.tier].jobsCompleted += stat.jobsCompleted;
          tierStatsMap[stat.tier].totalEarnings += parseFloat(stat.totalEarnings);
          tierStatsMap[stat.tier].totalRatings += stat.totalRatings;
          tierStatsMap[stat.tier].ratingSum += parseFloat(stat.rating) * stat.totalRatings;
          
          // Keep the most recent lastActiveAt
          if (!tierStatsMap[stat.tier].lastActiveAt || 
              (stat.lastActiveAt && stat.lastActiveAt > tierStatsMap[stat.tier].lastActiveAt)) {
            tierStatsMap[stat.tier].lastActiveAt = stat.lastActiveAt;
          }
        }
        
        // Calculate average ratings for each tier
        for (const tier in tierStatsMap) {
          const stats = tierStatsMap[tier];
          stats.rating = stats.totalRatings > 0 
            ? (stats.ratingSum / stats.totalRatings).toFixed(2)
            : "0.00";
          stats.totalEarnings = stats.totalEarnings.toFixed(2);
        }
        
        // Determine which tier cards to create based on ALL discovered tiers (union of operatorTier and subscribedTiers)
        const allUniqueTiers = new Set([...allTiers, ...allSubscribedTiers]);
        const hasProfessional = allUniqueTiers.has("professional");
        const hasEquippedOrManual = allUniqueTiers.has("equipped") || allUniqueTiers.has("manual");
        
        // Helper function to create tier card
        const createTierCard = (tierType: "professional" | "equipped_manual", includedTiers: string[]) => {
          // Merge data from all included tiers
          const mergedServices = new Set<string>();
          const mergedVehicles = new Set<string>();
          const mergedLicensePlates = new Set<string>();
          const mergedEquipment: any[] = [];
          const mergedStats = {
            jobsCompleted: 0,
            totalEarnings: 0,
            totalRatings: 0,
            ratingSum: 0,
            lastActiveAt: null as Date | null
          };
          
          for (const tier of includedTiers) {
            const tierData = tierDataMap.get(tier);
            if (tierData) {
              tierData.services.forEach((s: string) => mergedServices.add(s));
              tierData.vehicles.forEach((v: string) => mergedVehicles.add(v));
              tierData.licensePlates.forEach((p: string) => mergedLicensePlates.add(p));
              mergedEquipment.push(...tierData.equipmentInventory);
            }
            
            const stats = tierStatsMap[tier];
            if (stats) {
              mergedStats.jobsCompleted += stats.jobsCompleted;
              mergedStats.totalEarnings += stats.totalEarnings;
              mergedStats.totalRatings += stats.totalRatings;
              mergedStats.ratingSum += stats.ratingSum;
              if (!mergedStats.lastActiveAt || (stats.lastActiveAt && stats.lastActiveAt > mergedStats.lastActiveAt)) {
                mergedStats.lastActiveAt = stats.lastActiveAt;
              }
            }
          }
          
          const avgRating = mergedStats.totalRatings > 0 
            ? (mergedStats.ratingSum / mergedStats.totalRatings).toFixed(2)
            : "0.00";
          
          // Determine card name based on tier type
          const cardName = tierType === "professional"
            ? (primaryOperator.businessName || primaryOperator.name)
            : (primaryOperator.driverName || primaryOperator.name);
          
          const isActive = includedTiers.includes(primaryOperator.activeTier);
          
          return {
            cardId: `${primaryOperator.operatorId}-${tierType}`,
            tierType,
            includedTiers,
            isActive,
            operatorId: primaryOperator.operatorId,
            name: cardName,
            email: primaryOperator.email,
            phone: primaryOperator.phone,
            photo: primaryOperator.photo,
            latitude: primaryOperator.latitude,
            longitude: primaryOperator.longitude,
            address: primaryOperator.address,
            isOnline: primaryOperator.isOnline,
            hourlyRate: primaryOperator.hourlyRate || "0.00",
            availability: primaryOperator.availability,
            activeTier: primaryOperator.activeTier,
            subscribedTiers: Array.from(allUniqueTiers), // All discovered tiers from all records
            services: Array.from(mergedServices),
            vehicle: Array.from(mergedVehicles).join(", ") || "Not specified",
            licensePlate: Array.from(mergedLicensePlates).join(", ") || "N/A",
            equipmentInventory: mergedEquipment,
            primaryVehicleImage: primaryOperator.primaryVehicleImage,
            totalJobs: mergedStats.jobsCompleted,
            rating: avgRating,
            recentReviews: recentReviews.map(r => ({
              ratingId: r.ratingId,
              customerId: r.customerId,
              rating: r.rating,
              review: r.review,
              createdAt: r.createdAt
            })),
            reviewCount: allReviews.length
          };
        };
        
        // Get reviews for ALL operator IDs in this merged set
        const allReviews = await db.query.ratings.findMany({
          where: inArray(ratings.operatorId, allOperatorIds),
          orderBy: (ratings, { desc }) => [desc(ratings.createdAt)]
        });
        
        // Take the 3 most recent reviews
        const recentReviews = allReviews.slice(0, 3);
        
        // Create separate tier cards based on subscribed tiers
        // Only show professional tier card if:
        // 1. Operator has professional tier
        // 2. Operator is currently active on professional tier OR doesn't have any other tiers
        const shouldShowProfessionalCard = hasProfessional && 
          (primaryOperator.activeTier === "professional" || !hasEquippedOrManual);
        
        if (shouldShowProfessionalCard) {
          const professionalCard = createTierCard("professional", ["professional"]);
          
          // Filter by service if specified
          if (!service || professionalCard.services.includes(service)) {
            tierCards.push(professionalCard);
          }
        }
        
        if (hasEquippedOrManual) {
          const equippedManualTiers = [];
          if (allUniqueTiers.has("equipped")) equippedManualTiers.push("equipped");
          if (allUniqueTiers.has("manual")) equippedManualTiers.push("manual");
          
          const equippedManualCard = createTierCard("equipped_manual", equippedManualTiers);
          
          // Filter by service if specified
          if (!service || equippedManualCard.services.includes(service)) {
            tierCards.push(equippedManualCard);
          }
        }
      }
      
      res.json(tierCards);
    } catch (error) {
      console.error("Error fetching operator cards:", error);
      res.status(500).json({ message: "Failed to fetch operator cards" });
    }
  });

  router.post("/api/operators", async (req, res) => {
    try {
      const result = insertOperatorSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ errors: result.error.issues });
      }
      
      // Check for duplicate operatorId
      const existing = await db.query.operators.findFirst({
        where: eq(operators.operatorId, result.data.operatorId)
      });
      if (existing) {
        return res.status(409).json({ message: `Operator with ID ${result.data.operatorId} already exists` });
      }
      
      // Set up tier defaults
      const tier = result.data.operatorTier || "manual";
      const subscribedTiers: string[] = result.data.subscribedTiers || [tier];
      const activeTier = result.data.activeTier || tier;
      
      // Ensure activeTier is in subscribedTiers
      if (!subscribedTiers.includes(activeTier)) {
        subscribedTiers.push(activeTier);
      }
      
      // Create operator in database with proper defaults
      const operatorData = {
        operatorId: result.data.operatorId,
        name: result.data.name,
        driverName: result.data.driverName || result.data.name,
        rating: result.data.rating || "0",
        totalJobs: result.data.totalJobs || 0,
        services: result.data.services || [],
        vehicle: result.data.vehicle || "Not specified",
        licensePlate: result.data.licensePlate || "N/A",
        phone: result.data.phone || "",
        email: result.data.email || null,
        latitude: result.data.latitude || "0",
        longitude: result.data.longitude || "0",
        address: result.data.address || "",
        isOnline: result.data.isOnline || 0,
        hourlyRate: result.data.hourlyRate || null,
        availability: result.data.availability || "available",
        photo: result.data.photo || null,
        operatorTier: tier,
        subscribedTiers,
        activeTier,
        isCertified: result.data.isCertified ?? 1,
        businessLicense: result.data.businessLicense || null,
        homeLatitude: result.data.homeLatitude || null,
        homeLongitude: result.data.homeLongitude || null,
        operatingRadius: result.data.operatingRadius || null,
        businessId: result.data.businessId || null,
        businessName: result.data.businessName || null
      };
      
      const [operator] = await db.insert(operators).values(operatorData).returning();
      
      // Link operator to user account by operatorId and update role
      const userEmail = result.data.email;
      if (userEmail) {
        await db.update(users)
          .set({ 
            operatorId: result.data.operatorId,
            role: 'operator'
          })
          .where(eq(users.email, userEmail));
      }
      
      // Create initial tier stats for each subscribed tier
      const tierStatsToCreate = subscribedTiers.map(tier => ({
        operatorId: result.data.operatorId,
        tier,
        jobsCompleted: 0,
        totalEarnings: "0",
        rating: "0",
        totalRatings: 0,
        lastActiveAt: null
      }));

      await db.insert(operatorTierStats).values(tierStatsToCreate);
      
      res.status(201).json(operator);
    } catch (error: any) {
      console.error("Error creating operator:", error);
      res.status(500).json({ message: "Failed to create operator" });
    }
  });

  router.patch("/api/operators/:operatorId", async (req, res) => {
    try {
      const operatorId = req.params.operatorId;
      
      // Check if operator exists
      const existing = await db.query.operators.findFirst({
        where: eq(operators.operatorId, operatorId)
      });
      if (!existing) {
        return res.status(404).json({ message: "Operator not found" });
      }
      
      // Update operator in database
      const [operator] = await db.update(operators)
        .set(req.body)
        .where(eq(operators.operatorId, operatorId))
        .returning();
      
      res.json(operator);
    } catch (error) {
      console.error("Error updating operator:", error);
      res.status(500).json({ message: "Failed to update operator" });
    }
  });

  // Switch active tier for an operator
  router.patch("/api/operators/:operatorId/active-tier", async (req, res) => {
    try {
      const operatorId = req.params.operatorId;
      
      // Validate request body
      const result = updateActiveTierSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid tier specified", errors: result.error.issues });
      }

      const { activeTier } = result.data;

      // Get operator
      const existing = await db.query.operators.findFirst({
        where: eq(operators.operatorId, operatorId)
      });
      if (!existing) {
        return res.status(404).json({ message: "Operator not found" });
      }

      // Verify operator is subscribed to this tier
      if (!existing.subscribedTiers || !existing.subscribedTiers.includes(activeTier)) {
        return res.status(403).json({ message: "Operator not subscribed to this tier" });
      }

      // Update active tier
      const [operator] = await db.update(operators)
        .set({ activeTier })
        .where(eq(operators.operatorId, operatorId))
        .returning();

      res.json(operator);
    } catch (error) {
      console.error("Error switching active tier:", error);
      res.status(500).json({ message: "Failed to switch active tier" });
    }
  });

  // Get operator equipment inventory
  router.get("/api/operators/:operatorId/equipment", async (req, res) => {
    try {
      const operatorId = req.params.operatorId;
      
      const operator = await db.query.operators.findFirst({
        where: eq(operators.operatorId, operatorId)
      });
      
      if (!operator) {
        return res.status(404).json({ message: "Operator not found" });
      }

      res.json({
        equipmentInventory: operator.equipmentInventory || [],
        primaryVehicleImage: operator.primaryVehicleImage
      });
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ message: "Failed to fetch equipment" });
    }
  });

  // Update operator equipment inventory
  router.patch("/api/operators/:operatorId/equipment", async (req, res) => {
    try {
      const operatorId = req.params.operatorId;
      
      // Validate request body
      const result = updateEquipmentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid equipment data", errors: result.error.issues });
      }

      const { equipmentInventory, primaryVehicleImage } = result.data;

      // Get operator
      const existing = await db.query.operators.findFirst({
        where: eq(operators.operatorId, operatorId)
      });
      if (!existing) {
        return res.status(404).json({ message: "Operator not found" });
      }

      // Update equipment with defensive normalization
      const updateData: any = {};
      if (equipmentInventory !== undefined) {
        updateData.equipmentInventory = equipmentInventory || [];
      }
      if (primaryVehicleImage !== undefined) {
        updateData.primaryVehicleImage = primaryVehicleImage;
      }

      const [operator] = await db.update(operators)
        .set(updateData)
        .where(eq(operators.operatorId, operatorId))
        .returning();

      res.json(operator);
    } catch (error) {
      console.error("Error updating equipment:", error);
      res.status(500).json({ message: "Failed to update equipment" });
    }
  });

  router.get("/api/service-requests", async (req, res) => {
    const customerId = req.query.customerId as string | undefined;
    const requests = await storage.getServiceRequests(customerId);
    res.json(requests);
  });

  router.get("/api/service-requests/for-operator/:operatorId", async (req, res) => {
    try {
      const operatorId = req.params.operatorId;
      
      // Get operator from database
      const operator = await db.query.operators.findFirst({
        where: eq(operators.operatorId, operatorId)
      });
      
      if (!operator) {
        return res.status(404).json({ message: "Operator not found" });
      }
      
      // Get operator's tier info
      const tierInfo = OPERATOR_TIER_INFO[operator.operatorTier as keyof typeof OPERATOR_TIER_INFO];
      if (!tierInfo) {
        return res.status(400).json({ message: "Invalid operator tier" });
      }
      
      // Get all pending service requests
      const allRequests = await storage.getServiceRequests();
      const pendingRequests = allRequests.filter(req => req.status === "pending");
      
      // Filter by service type based on tier
      let filteredRequests = pendingRequests;
      if (operator.operatorTier === "manual") {
        // Manual operators only see snow plowing jobs
        filteredRequests = pendingRequests.filter(req => req.serviceType === "Snow Plowing");
      }
      
      // Filter by radius if operator has location and tier has radius restriction
      if (operator.homeLatitude && operator.homeLongitude && tierInfo.radiusKm !== null) {
        const operatorLat = parseFloat(operator.homeLatitude);
        const operatorLon = parseFloat(operator.homeLongitude);
        
        filteredRequests = filteredRequests.filter(req => {
          // If request doesn't have coordinates, include it (backward compatibility)
          if (!req.latitude || !req.longitude) {
            return true;
          }
          
          const jobLat = parseFloat(req.latitude);
          const jobLon = parseFloat(req.longitude);
          
          return isWithinRadius(operatorLat, operatorLon, jobLat, jobLon, tierInfo.radiusKm);
        });
      }
      
      res.json(filteredRequests);
    } catch (error) {
      console.error("Error filtering service requests:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  router.get("/api/service-requests/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const request = await storage.getServiceRequest(id);
    if (!request) {
      return res.status(404).json({ message: "Service request not found" });
    }
    res.json(request);
  });

  router.get("/api/service-requests/request/:requestId", async (req, res) => {
    const request = await storage.getServiceRequestByRequestId(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: "Service request not found" });
    }
    res.json(request);
  });

  router.post("/api/service-requests", async (req, res) => {
    const result = insertServiceRequestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues });
    }
    const request = await storage.createServiceRequest(result.data);
    res.status(201).json(request);
  });

  router.patch("/api/service-requests/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { status, respondedAt } = req.body;
    const request = await storage.updateServiceRequest(id, status, respondedAt);
    if (!request) {
      return res.status(404).json({ message: "Service request not found" });
    }
    res.json(request);
  });

  router.get("/api/customers/:customerId", async (req, res) => {
    try {
      const customer = await db.query.customers.findFirst({
        where: eq(customers.customerId, req.params.customerId)
      });
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  router.post("/api/customers", async (req, res) => {
    try {
      const result = insertCustomerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ errors: result.error.issues });
      }
      
      // Check if customer already exists
      const existing = await db.query.customers.findFirst({
        where: eq(customers.customerId, result.data.customerId)
      });
      
      if (existing) {
        return res.status(200).json(existing); // Return existing customer
      }
      
      // Create new customer with validated data
      const customerData: any = { ...result.data };
      const [customer] = await db.insert(customers).values(customerData).returning();
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  router.patch("/api/customers/:customerId", async (req, res) => {
    try {
      const [customer] = await db.update(customers)
        .set(req.body)
        .where(eq(customers.customerId, req.params.customerId))
        .returning();
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  // Favorites routes
  router.get("/api/favorites/:customerId", async (req, res) => {
    try {
      const customerFavorites = await db.query.favorites.findMany({
        where: eq(favorites.customerId, req.params.customerId)
      });
      res.json(customerFavorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  router.post("/api/favorites", async (req, res) => {
    try {
      const favoriteSchema = insertFavoriteSchema.pick({ customerId: true, operatorId: true });
      const result = favoriteSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ errors: result.error.issues });
      }
      
      // Check if favorite already exists
      const existing = await db.query.favorites.findFirst({
        where: and(
          eq(favorites.customerId, result.data.customerId),
          eq(favorites.operatorId, result.data.operatorId)
        )
      });
      
      if (existing) {
        return res.status(200).json(existing); // Return existing favorite
      }
      
      // Create new favorite
      const [favorite] = await db.insert(favorites).values({
        customerId: result.data.customerId,
        operatorId: result.data.operatorId
      }).returning();
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  router.delete("/api/favorites/:customerId/:operatorId", async (req, res) => {
    try {
      const { customerId, operatorId } = req.params;
      
      const deleted = await db.delete(favorites)
        .where(and(
          eq(favorites.customerId, customerId),
          eq(favorites.operatorId, operatorId)
        ))
        .returning();
      
      if (deleted.length === 0) {
        return res.status(404).json({ message: "Favorite not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  router.get("/api/favorites/:customerId/:operatorId/check", async (req, res) => {
    try {
      const { customerId, operatorId } = req.params;
      
      const favorite = await db.query.favorites.findFirst({
        where: and(
          eq(favorites.customerId, customerId),
          eq(favorites.operatorId, operatorId)
        )
      });
      
      res.json({ isFavorite: !!favorite });
    } catch (error) {
      console.error("Error checking favorite:", error);
      res.status(500).json({ message: "Failed to check favorite" });
    }
  });

  // Ratings routes
  router.get("/api/ratings", async (req, res) => {
    const operatorId = req.query.operatorId as string | undefined;
    const ratings = await storage.getRatings(operatorId);
    res.json(ratings);
  });

  router.post("/api/ratings", async (req, res) => {
    const result = insertRatingSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues });
    }
    const rating = await storage.createRating(result.data);
    res.status(201).json(rating);
  });

  // Operator location tracking routes
  router.get("/api/operator-location/:operatorId", async (req, res) => {
    const location = await storage.getOperatorLocation(req.params.operatorId);
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }
    res.json(location);
  });

  router.post("/api/operator-location", async (req, res) => {
    const result = insertOperatorLocationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues });
    }
    const location = await storage.updateOperatorLocation(result.data);
    res.status(201).json(location);
  });

  router.get("/api/operator-location/:operatorId/history", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const history = await storage.getOperatorLocationHistory(req.params.operatorId, limit);
    res.json(history);
  });

  // Customer service history routes
  router.get("/api/service-history/:operatorId", async (req, res) => {
    const { operatorId } = req.params;
    const service = req.query.service as string;
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 5;

    if (!service || isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ message: "service, lat, and lon required" });
    }

    const history = await storage.getCustomerServiceHistory(operatorId, service, lat, lon, radius);
    res.json(history);
  });

  router.post("/api/service-history", async (req, res) => {
    const result = insertCustomerServiceHistorySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues });
    }
    const history = await storage.addServiceHistory(result.data);
    res.status(201).json(history);
  });

  // AI Assist route
  router.post("/api/ai-assist/analyze", async (req, res) => {
    try {
      const { description, imageCount } = req.body;

      if (!description || !description.trim()) {
        return res.status(400).json({ message: "Job description is required" });
      }

      // Intelligent service matching using pattern detection
      const descLower = description.toLowerCase();
      
      // Keywords for each service type
      const serviceKeywords = {
        'Courier': ['package', 'packages', 'deliver', 'delivery', 'parcel', 'shipment', 'transport goods', 'mail', 'courier', 'envelope'],
        'Hauling': ['haul', 'hauling', 'move', 'moving', 'transport', 'freight', 'cargo', 'tons', 'kg', 'pounds', 'lbs', 'goods', 'materials', 'junk', 'debris'],
        'Snow Plowing': ['snow', 'snowplow', 'plow', 'plowing', 'snowdrift', 'driveway snow', 'winter', 'blizzard'],
        'Towing': ['tow', 'towing', 'stuck', 'breakdown', 'broken down', 'vehicle stuck', 'car stuck', 'roadside'],
        'Ice Removal': ['ice', 'de-ice', 'deicing', 'salt', 'slippery', 'frozen'],
        'Roadside Assistance': ['roadside', 'flat tire', 'battery', 'jumpstart', 'lockout', 'emergency']
      };

      // Calculate confidence scores for each service
      const scores: Array<{ service: string; score: number; matches: string[] }> = [];
      
      for (const [service, keywords] of Object.entries(serviceKeywords)) {
        const matches = keywords.filter(keyword => descLower.includes(keyword));
        const score = matches.length;
        if (score > 0) {
          scores.push({ service, score, matches });
        }
      }

      // Sort by score (highest first)
      scores.sort((a, b) => b.score - a.score);

      // Generate recommendations
      const recommendations = [];
      
      if (scores.length > 0) {
        // Top recommendation
        const top = scores[0];
        let confidence = Math.min(95, 70 + (top.score * 10));
        let reasoning = `Based on your description mentioning "${top.matches.slice(0, 3).join('", "')} ${top.matches.length > 3 ? 'and more' : ''}", ${top.service.toLowerCase()} is the most suitable service for your needs.`;
        let estimatedCost = "$80-150";
        let urgency = "medium";

        // Customize by service type
        if (top.service === 'Courier' || top.service === 'Hauling') {
          estimatedCost = "$100-250";
          reasoning += " This service specializes in transporting goods efficiently and safely.";
        } else if (top.service === 'Snow Plowing') {
          estimatedCost = "$85-120";
          urgency = descLower.includes('emergency') || descLower.includes('stuck') ? 'high' : 'medium';
        } else if (top.service === 'Towing') {
          estimatedCost = "$75-150";
          urgency = 'high';
          reasoning += " Towing services can quickly get your vehicle to safety.";
        }

        recommendations.push({
          serviceType: top.service,
          confidence,
          estimatedCost,
          reasoning,
          urgency,
          nearbyOperators: [
            {
              name: `${top.service} Pro Services`,
              distance: "0.8 miles",
              rating: 4.9,
              price: "$95/hr"
            },
            {
              name: `Quick ${top.service}`,
              distance: "1.2 miles",
              rating: 4.8,
              price: "$90/hr"
            }
          ]
        });

        // Add secondary recommendation if exists
        if (scores.length > 1 && scores[1].score >= 1) {
          const second = scores[1];
          recommendations.push({
            serviceType: second.service,
            confidence: Math.min(75, 50 + (second.score * 10)),
            estimatedCost: "$60-100",
            reasoning: `Your description also mentions "${second.matches[0]}", which suggests ${second.service.toLowerCase()} might be helpful as well.`,
            urgency: "low",
            nearbyOperators: [
              {
                name: `${second.service} Express`,
                distance: "1.5 miles",
                rating: 4.7,
                price: "$75/hr"
              }
            ]
          });
        }
      } else {
        // Fallback if no keywords matched
        recommendations.push({
          serviceType: "Hauling",
          confidence: 60,
          estimatedCost: "$100-200",
          reasoning: "Based on your description, general hauling services may be able to help. Please provide more details for better recommendations.",
          urgency: "medium",
          nearbyOperators: [
            {
              name: "General Hauling Services",
              distance: "1.0 miles",
              rating: 4.6,
              price: "$85/hr"
            }
          ]
        });
      }

      res.json({ recommendations });
    } catch (error) {
      console.error("AI analysis error:", error);
      res.status(500).json({ message: "Failed to analyze job" });
    }
  });

  // Business management routes
  router.post("/api/business", async (req, res) => {
    try {
      const businessData = req.body;
      const business = await storage.createBusiness(businessData);
      res.status(201).json(business);
    } catch (error) {
      console.error("Error creating business:", error);
      res.status(500).json({ message: "Failed to create business" });
    }
  });

  router.get("/api/business/:businessId", async (req, res) => {
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.businessId, req.params.businessId)
    });
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }
    res.json(business);
  });

  router.get("/api/business/drivers/:businessId", async (req, res) => {
    const drivers = await storage.getBusinessDrivers(req.params.businessId);
    res.json(drivers);
  });

  router.post("/api/business/drivers", async (req, res) => {
    try {
      const operatorId = `DRV-${Date.now()}`;
      const driverData = {
        ...req.body,
        operatorId,
        rating: "5.00",
      };
      const driver = await storage.createDriver(driverData);
      res.status(201).json(driver);
    } catch (error) {
      console.error("Error creating driver:", error);
      res.status(500).json({ message: "Failed to create driver" });
    }
  });

  router.delete("/api/business/drivers/:driverId", async (req, res) => {
    try {
      const success = await storage.removeDriver(req.params.driverId);
      if (!success) {
        return res.status(404).json({ message: "Driver not found" });
      }
      res.json({ message: "Driver removed successfully" });
    } catch (error) {
      console.error("Error removing driver:", error);
      res.status(500).json({ message: "Failed to remove driver" });
    }
  });

  // Create business for existing professional operator (fix for legacy accounts)
  router.post("/api/operators/:operatorId/setup-business", async (req, res) => {
    try {
      const operatorId = req.params.operatorId;
      
      // Get operator from database
      const operator = await db.query.operators.findFirst({
        where: eq(operators.operatorId, operatorId)
      });
      
      if (!operator) {
        return res.status(404).json({ message: "Operator not found" });
      }
      
      // Check if operator is professional tier
      if (operator.operatorTier !== "professional" && !operator.subscribedTiers?.includes("professional")) {
        return res.status(400).json({ message: "Only professional operators can have a business" });
      }
      
      // Check if already has a business
      if (operator.businessId) {
        return res.status(400).json({ message: "Operator already has a business", businessId: operator.businessId });
      }
      
      // Get user from database (don't rely on session)
      const dbUser = await db.query.users.findFirst({
        where: eq(users.operatorId, operatorId)
      });
      
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create business ID
      const businessId = `BUS-${dbUser.email.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
      
      // Create business in database
      const businessData = {
        businessId,
        name: `${dbUser.name}'s Business`,
        email: dbUser.email,
        phone: "",
        businessLicense: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
      };
      
      const [business] = await db.insert(businesses)
        .values(businessData)
        .returning();
      
      // Update operator with businessId
      await db.update(operators)
        .set({ businessId })
        .where(eq(operators.operatorId, operatorId));
      
      // Update user with businessId
      await db.update(users)
        .set({ businessId })
        .where(eq(users.operatorId, operatorId));
      
      // Update session if it exists
      if ((req as any).session?.user) {
        (req as any).session.user.businessId = businessId;
      }
      
      res.json({ business, businessId });
    } catch (error) {
      console.error("Error setting up business:", error);
      res.status(500).json({ message: "Failed to setup business" });
    }
  });

  // Tier Switching Routes
  router.post("/api/operators/:operatorId/switch-tier", async (req, res) => {
    try {
      const { newTier } = req.body;
      const operatorId = req.params.operatorId;
      
      // Get operator from database
      const operator = await db.query.operators.findFirst({
        where: eq(operators.operatorId, operatorId)
      });
      
      if (!operator) {
        return res.status(404).json({ message: "Operator not found" });
      }
      
      // Check if tier is subscribed
      if (!operator.subscribedTiers.includes(newTier)) {
        return res.status(400).json({ message: "Tier not subscribed" });
      }
      
      // IMPORTANT: Update viewTier to track which dashboard is being viewed
      // activeTier in database represents which tier the operator is ONLINE on (only set via toggle-online)
      // viewTier in database tracks which dashboard they're currently viewing (persists across reloads)
      
      await db.update(operators)
        .set({ viewTier: newTier })
        .where(eq(operators.operatorId, operatorId));
      
      // Update session viewTier for immediate frontend routing update (without refetch)
      if ((req as any).session?.user) {
        (req as any).session.user.viewTier = newTier;
      }
      
      res.json({ message: "Tier switched successfully" });
    } catch (error) {
      console.error("Error switching tier:", error);
      res.status(500).json({ message: "Failed to switch tier" });
    }
  });

  router.post("/api/operators/:operatorId/add-tier", async (req, res) => {
    try {
      const { tier, details } = req.body;
      const operatorId = req.params.operatorId;
      
      // Get operator from database
      const operator = await db.query.operators.findFirst({
        where: eq(operators.operatorId, operatorId)
      });
      
      if (!operator) {
        return res.status(404).json({ message: "Operator not found" });
      }
      
      // Check if tier is already subscribed
      if (operator.subscribedTiers.includes(tier)) {
        return res.status(400).json({ message: "Tier already subscribed" });
      }
      
      // Add tier to subscribed tiers and set as active tier
      const updatedTiers = [...operator.subscribedTiers, tier];
      
      // Build operator tier profiles
      const existingProfiles = (operator.operatorTierProfiles as any) || {};
      const updatedProfiles = {
        ...existingProfiles,
        [tier]: {
          tier,
          subscribed: true,
          onboardingCompleted: true,
          onboardedAt: new Date().toISOString(),
          vehicle: details?.vehicle || operator.vehicle,
          licensePlate: details?.licensePlate || operator.licensePlate,
          businessLicense: details?.businessLicense || operator.businessLicense,
          services: details?.services || operator.services
        }
      };
      
      // Update database with new tier, set as viewing tier, and store tier profiles
      // IMPORTANT: Do NOT set activeTier in database here  
      // activeTier represents which tier is ONLINE, not which tier was just added
      // viewTier tracks which dashboard to show (persists across reloads)
      // User must manually go online after adding a tier
      const [updatedOperator] = await db.update(operators)
        .set({ 
          subscribedTiers: updatedTiers,
          operatorTier: tier, // Set as primary tier for legacy compatibility
          viewTier: tier, // Set as current viewing tier
          operatorTierProfiles: updatedProfiles
        })
        .where(eq(operators.operatorId, operatorId))
        .returning();
      
      // Update session for frontend routing
      if ((req as any).session?.user) {
        (req as any).session.user.viewTier = tier;
        (req as any).session.user.subscribedTiers = updatedTiers;
      }
      
      // Create initial tier stats for the new tier
      await db.insert(operatorTierStats).values({
        operatorId,
        tier,
        jobsCompleted: 0,
        totalEarnings: "0",
        rating: "0",
        totalRatings: 0,
        lastActiveAt: null
      });
      
      res.json({ 
        message: "Tier added successfully",
        activeTier: tier,
        subscribedTiers: updatedTiers,
        operator: updatedOperator
      });
    } catch (error) {
      console.error("Error adding tier:", error);
      res.status(500).json({ message: "Failed to add tier" });
    }
  });

  // Toggle operator online/offline status
  router.post("/api/operators/:operatorId/toggle-online", async (req, res) => {
    try {
      const { isOnline, activeTier, confirmed } = req.body;
      const operatorId = req.params.operatorId;
      
      // Get operator from database
      const operator = await db.query.operators.findFirst({
        where: eq(operators.operatorId, operatorId)
      });
      
      if (!operator) {
        return res.status(404).json({ message: "Operator not found" });
      }
      
      // If going online, verify the tier is subscribed
      if (isOnline === 1 && activeTier && !operator.subscribedTiers.includes(activeTier)) {
        return res.status(400).json({ message: "Cannot go online for unsubscribed tier" });
      }
      
      // NEW: Check if operator is already online on a different tier
      if (isOnline === 1 && operator.isOnline === 1 && operator.activeTier !== activeTier) {
        // Check for active (confirmed) jobs on the currently online tier
        const activeJobs = await db.query.serviceRequests.findMany({
          where: and(
            eq(serviceRequests.operatorId, operatorId),
            eq(serviceRequests.status, "confirmed")
          )
        });
        
        if (activeJobs.length > 0) {
          // Block switching - operator has active jobs
          return res.status(409).json({ 
            error: "active_jobs",
            message: `You cannot go online on ${activeTier} tier while you have ${activeJobs.length} active job(s) on ${operator.activeTier} tier. Please complete or cancel your current jobs first.`,
            currentTier: operator.activeTier,
            activeJobCount: activeJobs.length
          });
        }
        
        // If not confirmed, require confirmation from user
        if (!confirmed) {
          return res.status(200).json({
            warning: "tier_switch",
            message: `Going online on ${activeTier} tier will take you offline on ${operator.activeTier} tier.`,
            currentTier: operator.activeTier,
            newTier: activeTier,
            requiresConfirmation: true
          });
        }
        
        // User has confirmed - proceed with tier switch
      }
      
      // CRITICAL: Enforce mutual exclusivity - only one tier can be online at a time
      // When going online for a tier, ensure we're offline for all other tiers
      // When going offline, set everything to offline
      // Also update viewTier to match the tier being activated (UX: show dashboard for online tier)
      
      const updates = {
        isOnline,
        activeTier: isOnline === 1 ? activeTier : null,
        viewTier: isOnline === 1 ? activeTier : operator.viewTier // Set viewTier when going online, preserve when going offline
      };
      
      // Update online status, active tier, and view tier atomically
      await db.update(operators)
        .set(updates)
        .where(eq(operators.operatorId, operatorId));
      
      // Update session viewTier for immediate frontend routing update
      if ((req as any).session?.user && isOnline === 1) {
        (req as any).session.user.viewTier = activeTier;
      }
      
      res.json({ 
        message: isOnline === 1 ? `You are now online as ${activeTier}` : "You are now offline",
        isOnline,
        activeTier: isOnline === 1 ? activeTier : null,
        viewTier: isOnline === 1 ? activeTier : operator.viewTier
      });
    } catch (error) {
      console.error("Error toggling online status:", error);
      res.status(500).json({ message: "Failed to toggle online status" });
    }
  });

  // Vehicle Management Routes
  router.get("/api/operators/:operatorId/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getOperatorVehicles(req.params.operatorId);
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  router.post("/api/operators/:operatorId/vehicles", async (req, res) => {
    try {
      const vehicleId = `VEH-${Date.now()}`;
      const vehicleData = {
        ...req.body,
        vehicleId,
        operatorId: req.params.operatorId,
      };
      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (error) {
      console.error("Error creating vehicle:", error);
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  router.patch("/api/vehicles/:vehicleId", async (req, res) => {
    try {
      const vehicle = await storage.updateVehicle(req.params.vehicleId, req.body);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  router.delete("/api/vehicles/:vehicleId", async (req, res) => {
    try {
      const success = await storage.deleteVehicle(req.params.vehicleId);
      if (!success) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json({ message: "Vehicle deleted successfully" });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  router.post("/api/operators/:operatorId/vehicles/:vehicleId/set-active", async (req, res) => {
    try {
      const success = await storage.setActiveVehicle(req.params.operatorId, req.params.vehicleId);
      if (!success) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json({ message: "Active vehicle updated successfully" });
    } catch (error) {
      console.error("Error setting active vehicle:", error);
      res.status(500).json({ message: "Failed to set active vehicle" });
    }
  });

  // Weather Alerts Routes - Proactive Notifications
  
  // Fetch active weather alerts from NWS and update database
  router.post("/api/weather/sync", async (req, res) => {
    try {
      const area = (req.query.area as string) || "US";
      
      // Fetch latest alerts from NWS
      const alerts = await getServiceRelevantAlerts(area);
      const allRelevantAlerts = [...alerts.winterAlerts, ...alerts.stormAlerts];
      
      // Update database with new alerts
      for (const alert of allRelevantAlerts) {
        const existingAlert = await db.query.weatherAlerts.findFirst({
          where: eq(weatherAlerts.alertId, alert.id)
        });
        
        if (!existingAlert) {
          // Insert new alert
          await db.insert(weatherAlerts).values({
            alertId: alert.id,
            event: alert.event,
            headline: alert.headline,
            description: alert.description,
            severity: alert.severity,
            urgency: alert.urgency,
            areaDesc: alert.areaDesc,
            effective: new Date(alert.effective),
            expires: new Date(alert.expires),
            instruction: alert.instruction,
            category: alert.category,
            isActive: 1,
          });
        }
      }
      
      // Deactivate expired alerts
      await db.update(weatherAlerts)
        .set({ isActive: 0 })
        .where(sql`${weatherAlerts.expires} < NOW() AND ${weatherAlerts.isActive} = 1`);
      
      res.json({ 
        message: "Weather alerts synced successfully",
        winterAlerts: alerts.winterAlerts.length,
        stormAlerts: alerts.stormAlerts.length,
        total: allRelevantAlerts.length
      });
    } catch (error) {
      console.error("Error syncing weather alerts:", error);
      res.status(500).json({ message: "Failed to sync weather alerts" });
    }
  });

  // Get all weather alerts from database (both active and expired)
  router.get("/api/weather/alerts", async (req, res) => {
    try {
      const allAlerts = await db.query.weatherAlerts.findMany({
        orderBy: (alerts, { desc }) => [
          desc(alerts.isActive),
          desc(alerts.severity), 
          desc(alerts.urgency)
        ]
      });
      
      res.json(allAlerts);
    } catch (error) {
      console.error("Error fetching weather alerts:", error);
      res.status(500).json({ message: "Failed to fetch weather alerts" });
    }
  });

  // Get severe weather alerts only (Extreme/Severe)
  router.get("/api/weather/alerts/severe", async (req, res) => {
    try {
      const severeAlerts = await db.query.weatherAlerts.findMany({
        where: and(
          eq(weatherAlerts.isActive, 1),
          gte(weatherAlerts.expires, new Date()),
          sql`${weatherAlerts.severity} IN ('Extreme', 'Severe')`
        ),
        orderBy: (alerts, { desc }) => [desc(alerts.severity), desc(alerts.urgency)]
      });
      
      res.json(severeAlerts);
    } catch (error) {
      console.error("Error fetching severe weather alerts:", error);
      res.status(500).json({ message: "Failed to fetch severe weather alerts" });
    }
  });

  // ===== EMERGENCY SOS ROUTES =====
  
  // Create emergency request (no auth required)
  router.post("/api/emergency-requests", async (req, res) => {
    try {
      const result = insertEmergencyRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ errors: result.error.issues });
      }
      
      // Insert with validated and transformed data (lat/lng as strings)
      const [emergency] = await db.insert(emergencyRequests).values(result.data).returning();
      
      // Find 5 nearest online operators
      const allOperators = await db.query.operators.findMany({
        where: eq(operators.isOnline, 1)
      });
      
      // Parse coordinates for distance calculation (expecting strings from schema)
      const emergencyLat = parseFloat(String(result.data.latitude));
      const emergencyLng = parseFloat(String(result.data.longitude));
      
      // Calculate distances and sort
      const operatorsWithDistance = allOperators.map(op => ({
        ...op,
        distance: calculateDistance(
          emergencyLat,
          emergencyLng,
          parseFloat(String(op.latitude)),
          parseFloat(String(op.longitude))
        )
      })).sort((a, b) => a.distance - b.distance).slice(0, 5);
      
      // Create dispatch queue entries for nearest 5 operators
      const now = new Date();
      const queueEntries = operatorsWithDistance.map((op, index) => ({
        queueId: `QUEUE-${Date.now()}-${op.operatorId}`,
        emergencyId: result.data.emergencyId,
        serviceRequestId: null,
        operatorId: op.operatorId,
        queuePosition: index + 1,
        status: index === 0 ? "notified" : "pending", // Notify first operator immediately
        notifiedAt: index === 0 ? now : null, // Set notification time for first operator
        respondedAt: null,
        distanceKm: op.distance.toFixed(2),
        expiresAt: index === 0 ? new Date(Date.now() + 10 * 60 * 1000) : null, // 10 min expiry for first operator
        createdAt: now,
      }));
      
      if (queueEntries.length > 0) {
        await db.insert(dispatchQueue).values(queueEntries);
      }
      
      res.status(201).json({
        ...emergency[0],
        notifiedOperators: operatorsWithDistance.length
      });
    } catch (error) {
      console.error("Error creating emergency request:", error);
      res.status(500).json({ message: "Failed to create emergency request" });
    }
  });
  
  // Get emergency request by ID with queue status
  router.get("/api/emergency-requests/:emergencyId", async (req, res) => {
    try {
      const emergency = await db.query.emergencyRequests.findFirst({
        where: eq(emergencyRequests.emergencyId, req.params.emergencyId)
      });
      
      if (!emergency) {
        return res.status(404).json({ message: "Emergency request not found" });
      }
      
      // Get queue status
      const queue = await db.query.dispatchQueue.findMany({
        where: eq(dispatchQueue.emergencyId, req.params.emergencyId),
        orderBy: (queue, { asc }) => [asc(queue.queuePosition)]
      });
      
      // Get operator details for queued operators
      const queueWithOperators = await Promise.all(
        queue.map(async (q) => {
          const operator = await db.query.operators.findFirst({
            where: eq(operators.operatorId, q.operatorId)
          });
          return {
            ...q,
            operatorName: operator?.name,
            operatorPhone: operator?.phone,
          };
        })
      );
      
      res.json({
        ...emergency,
        queue: queueWithOperators,
        notifiedCount: queue.length,
      });
    } catch (error) {
      console.error("Error fetching emergency request:", error);
      res.status(500).json({ message: "Failed to fetch emergency request" });
    }
  });
  
  // Get dispatch queue for an emergency
  router.get("/api/emergency-requests/:emergencyId/queue", async (req, res) => {
    try {
      const queue = await db.query.dispatchQueue.findMany({
        where: eq(dispatchQueue.emergencyId, req.params.emergencyId),
        orderBy: (queue, { asc }) => [asc(queue.queuePosition)]
      });
      
      res.json(queue);
    } catch (error) {
      console.error("Error fetching dispatch queue:", error);
      res.status(500).json({ message: "Failed to fetch dispatch queue" });
    }
  });

  // Operator accepts emergency request
  router.post("/api/emergency-requests/:emergencyId/accept", async (req, res) => {
    try {
      const { operatorId } = req.body;
      
      if (!operatorId) {
        return res.status(400).json({ message: "Operator ID required" });
      }
      
      // Find the queue entry
      const queueEntry = await db.query.dispatchQueue.findFirst({
        where: and(
          eq(dispatchQueue.emergencyId, req.params.emergencyId),
          eq(dispatchQueue.operatorId, operatorId)
        )
      });
      
      if (!queueEntry) {
        return res.status(404).json({ message: "Queue entry not found" });
      }
      
      if (queueEntry.status !== "notified") {
        return res.status(400).json({ message: "This operator was not notified" });
      }
      
      // Update queue entry to accepted
      await db.update(dispatchQueue)
        .set({
          status: "accepted",
          respondedAt: new Date()
        })
        .where(eq(dispatchQueue.id, queueEntry.id));
      
      // Update emergency request
      await db.update(emergencyRequests)
        .set({
          status: "operator_assigned",
          assignedOperatorId: operatorId,
          updatedAt: new Date()
        })
        .where(eq(emergencyRequests.emergencyId, req.params.emergencyId));
      
      // Decline all other operators in queue
      await db.update(dispatchQueue)
        .set({
          status: "declined",
          respondedAt: new Date()
        })
        .where(and(
          eq(dispatchQueue.emergencyId, req.params.emergencyId),
          sql`${dispatchQueue.id} != ${queueEntry.id}`
        ));
      
      res.json({ message: "Emergency request accepted" });
    } catch (error) {
      console.error("Error accepting emergency request:", error);
      res.status(500).json({ message: "Failed to accept emergency request" });
    }
  });

  // Operator declines emergency request
  router.post("/api/emergency-requests/:emergencyId/decline", async (req, res) => {
    try {
      const { operatorId } = req.body;
      
      if (!operatorId) {
        return res.status(400).json({ message: "Operator ID required" });
      }
      
      // Find the queue entry
      const queueEntry = await db.query.dispatchQueue.findFirst({
        where: and(
          eq(dispatchQueue.emergencyId, req.params.emergencyId),
          eq(dispatchQueue.operatorId, operatorId)
        )
      });
      
      if (!queueEntry) {
        return res.status(404).json({ message: "Queue entry not found" });
      }
      
      // Update queue entry to declined
      await db.update(dispatchQueue)
        .set({
          status: "declined",
          respondedAt: new Date()
        })
        .where(eq(dispatchQueue.id, queueEntry.id));
      
      // Get next operator in queue
      const nextOperator = await db.query.dispatchQueue.findFirst({
        where: and(
          eq(dispatchQueue.emergencyId, req.params.emergencyId),
          eq(dispatchQueue.status, "pending")
        ),
        orderBy: (queue, { asc }) => [asc(queue.queuePosition)]
      });
      
      // Notify next operator if available
      if (nextOperator) {
        await db.update(dispatchQueue)
          .set({
            status: "notified",
            notifiedAt: new Date(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
          })
          .where(eq(dispatchQueue.id, nextOperator.id));
      } else {
        // No more operators - mark emergency as cancelled
        await db.update(emergencyRequests)
          .set({
            status: "cancelled",
            updatedAt: new Date()
          })
          .where(eq(emergencyRequests.emergencyId, req.params.emergencyId));
      }
      
      res.json({ message: "Emergency request declined, notified next operator" });
    } catch (error) {
      console.error("Error declining emergency request:", error);
      res.status(500).json({ message: "Failed to decline emergency request" });
    }
  });

  // ========== ACCEPTED JOBS ENDPOINTS (Persistent Job Tracking) ==========
  
  // Get all accepted jobs for an operator (optionally filtered by tier)
  router.get("/api/accepted-jobs", async (req, res) => {
    try {
      const operatorId = req.query.operatorId as string;
      const tier = req.query.tier as string | undefined;
      
      if (!operatorId) {
        return res.status(400).json({ message: "operatorId is required" });
      }

      const jobs = await storage.getAcceptedJobs(operatorId, tier);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching accepted jobs:", error);
      res.status(500).json({ message: "Failed to fetch accepted jobs" });
    }
  });

  // Get a specific accepted job by ID (with operator authorization)
  router.get("/api/accepted-jobs/:acceptedJobId", async (req, res) => {
    try {
      const { acceptedJobId } = req.params;
      const operatorId = req.query.operatorId as string;
      
      if (!operatorId) {
        return res.status(400).json({ message: "operatorId is required" });
      }
      
      const job = await storage.getAcceptedJob(acceptedJobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // SECURITY: Verify operator owns this job
      if (job.operatorId !== operatorId) {
        return res.status(403).json({ message: "Unauthorized - you don't own this job" });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error fetching accepted job:", error);
      res.status(500).json({ message: "Failed to fetch accepted job" });
    }
  });

  // Create a new accepted job (when operator accepts a request)
  router.post("/api/accepted-jobs", async (req, res) => {
    try {
      const { operatorId, jobSourceId, jobSourceType, tier, jobData } = req.body;
      
      if (!operatorId || !jobSourceId || !jobSourceType || !tier || !jobData) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if operator has active jobs on other tiers
      const activeJobs = await storage.getOperatorActiveJobs(operatorId, tier);
      if (activeJobs.length > 0) {
        return res.status(400).json({ 
          message: "Cannot accept job - you have active jobs on another tier. Complete those first.",
          activeJobs: activeJobs.map(j => ({ tier: j.tier, id: j.acceptedJobId }))
        });
      }

      // Generate unique ID for this accepted job
      const acceptedJobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newJob = await storage.createAcceptedJob({
        acceptedJobId,
        operatorId,
        jobSourceId,
        jobSourceType,
        tier,
        status: "accepted",
        progress: 0,
        jobData,
        startedAt: null,
        completedAt: null,
        cancelledAt: null,
        cancellationReason: null,
      });

      res.status(201).json(newJob);
    } catch (error) {
      console.error("Error creating accepted job:", error);
      res.status(500).json({ message: "Failed to create accepted job" });
    }
  });

  // Start a job (move from "accepted" to "in_progress")
  router.post("/api/accepted-jobs/:acceptedJobId/start", async (req, res) => {
    try {
      const { acceptedJobId } = req.params;
      const operatorId = req.body?.operatorId || req.query.operatorId as string;
      
      if (!operatorId) {
        return res.status(400).json({ message: "operatorId is required" });
      }
      
      // SECURITY: Verify operator owns this job before allowing modifications
      const existingJob = await storage.getAcceptedJob(acceptedJobId);
      if (!existingJob) {
        return res.status(404).json({ message: "Job not found" });
      }
      if (existingJob.operatorId !== operatorId) {
        return res.status(403).json({ message: "Unauthorized - you don't own this job" });
      }
      
      // BUSINESS LOGIC: Only one job in progress at a time
      const operatorJobs = await storage.getAcceptedJobs(operatorId);
      const inProgressJobs = operatorJobs.filter(j => 
        j.status === "in_progress" && j.acceptedJobId !== acceptedJobId
      );
      if (inProgressJobs.length > 0) {
        return res.status(409).json({ 
          message: "You already have a job in progress. Please complete it before starting another job."
        });
      }
      
      const job = await storage.startAcceptedJob(acceptedJobId);
      res.json(job);
    } catch (error) {
      console.error("Error starting job:", error);
      res.status(500).json({ message: "Failed to start job" });
    }
  });

  // Update job progress
  router.patch("/api/accepted-jobs/:acceptedJobId/progress", async (req, res) => {
    try {
      const { acceptedJobId } = req.params;
      const { progress, operatorId } = req.body;
      
      if (!operatorId) {
        return res.status(400).json({ message: "operatorId is required" });
      }
      
      if (typeof progress !== "number" || progress < 0 || progress > 100) {
        return res.status(400).json({ message: "Progress must be a number between 0 and 100" });
      }

      // SECURITY: Verify operator owns this job
      const existingJob = await storage.getAcceptedJob(acceptedJobId);
      if (!existingJob) {
        return res.status(404).json({ message: "Job not found" });
      }
      if (existingJob.operatorId !== operatorId) {
        return res.status(403).json({ message: "Unauthorized - you don't own this job" });
      }

      const job = await storage.updateAcceptedJobProgress(acceptedJobId, progress);
      res.json(job);
    } catch (error) {
      console.error("Error updating job progress:", error);
      res.status(500).json({ message: "Failed to update job progress" });
    }
  });

  // Complete a job
  router.post("/api/accepted-jobs/:acceptedJobId/complete", async (req, res) => {
    try {
      const { acceptedJobId } = req.params;
      const operatorId = req.body?.operatorId || req.query.operatorId as string;
      
      if (!operatorId) {
        return res.status(400).json({ message: "operatorId is required" });
      }
      
      // SECURITY: Verify operator owns this job
      const existingJob = await storage.getAcceptedJob(acceptedJobId);
      if (!existingJob) {
        return res.status(404).json({ message: "Job not found" });
      }
      if (existingJob.operatorId !== operatorId) {
        return res.status(403).json({ message: "Unauthorized - you don't own this job" });
      }

      const job = await storage.completeAcceptedJob(acceptedJobId);
      res.json(job);
    } catch (error) {
      console.error("Error completing job:", error);
      res.status(500).json({ message: "Failed to complete job" });
    }
  });

  // Cancel a job
  router.post("/api/accepted-jobs/:acceptedJobId/cancel", async (req, res) => {
    try {
      const { acceptedJobId } = req.params;
      const { reason, operatorId } = req.body;
      
      if (!operatorId) {
        return res.status(400).json({ message: "operatorId is required" });
      }
      
      if (!reason || typeof reason !== "string") {
        return res.status(400).json({ message: "Cancellation reason is required" });
      }

      // SECURITY: Verify operator owns this job
      const existingJob = await storage.getAcceptedJob(acceptedJobId);
      if (!existingJob) {
        return res.status(404).json({ message: "Job not found" });
      }
      if (existingJob.operatorId !== operatorId) {
        return res.status(403).json({ message: "Unauthorized - you don't own this job" });
      }

      const job = await storage.cancelAcceptedJob(acceptedJobId, reason);
      res.json(job);
    } catch (error) {
      console.error("Error cancelling job:", error);
      res.status(500).json({ message: "Failed to cancel job" });
    }
  });

  // Get operator's active jobs (for cross-tier checking)
  router.get("/api/accepted-jobs/operator/:operatorId/active", async (req, res) => {
    try {
      const { operatorId } = req.params;
      const excludeTier = req.query.excludeTier as string | undefined;
      
      const activeJobs = await storage.getOperatorActiveJobs(operatorId, excludeTier);
      res.json(activeJobs);
    } catch (error) {
      console.error("Error fetching operator active jobs:", error);
      res.status(500).json({ message: "Failed to fetch operator active jobs" });
    }
  });

  return router;
}
