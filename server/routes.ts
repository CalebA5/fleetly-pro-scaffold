import { Router } from "express";
import type { IStorage } from "./storage";
import { db } from "./db";
import { operators, customers, users, favorites, operatorTierStats, weatherAlerts, insertWeatherAlertSchema, emergencyRequests, dispatchQueue, insertEmergencyRequestSchema, insertDispatchQueueSchema, businesses, serviceRequests, operatorDailyEarnings, operatorMonthlyEarnings, acceptedJobs, operatorPricingConfigs, operatorQuotes, insertOperatorPricingConfigSchema, insertOperatorQuoteSchema, notifications } from "@shared/schema";
import { notificationService } from "./notificationService";
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
      // CRITICAL SECURITY FIX: Verify authenticated user FIRST
      const sessionUser = (req as any).session?.user;
      if (!sessionUser || !sessionUser.userId) {
        return res.status(401).json({ message: "Authentication required to create operator profile" });
      }
      
      const result = insertOperatorSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ errors: result.error.issues });
      }
      
      // SECURITY: Reject if form email doesn't match session email
      // This prevents users from creating operator profiles for other accounts
      if (result.data.email && result.data.email.toLowerCase() !== sessionUser.email.toLowerCase()) {
        return res.status(403).json({ 
          message: "Email mismatch. You can only create operator profiles for your own account.",
          debug: {
            formEmail: result.data.email,
            sessionEmail: sessionUser.email
          }
        });
      }
      
      // Check for duplicate operatorId
      const existing = await db.query.operators.findFirst({
        where: eq(operators.operatorId, result.data.operatorId)
      });
      if (existing) {
        return res.status(409).json({ message: `Operator with ID ${result.data.operatorId} already exists` });
      }
      
      // BUSINESS LICENSE UNIQUENESS CHECK: Prevent duplicate business licenses
      // Normalize license: trim whitespace and convert to uppercase for consistency
      let normalizedBusinessLicense: string | null = null;
      if (result.data.businessLicense && result.data.businessLicense.trim() !== "") {
        normalizedBusinessLicense = result.data.businessLicense.trim().toUpperCase();
        
        const existingBusiness = await db.query.operators.findFirst({
          where: eq(operators.businessLicense, normalizedBusinessLicense)
        });
        if (existingBusiness) {
          return res.status(409).json({ 
            message: `This business license is already registered to another operator. Each business license must be unique.`,
            field: "businessLicense"
          });
        }
      }
      
      // Set up tier defaults
      const tier = result.data.operatorTier || "manual";
      const subscribedTiers: string[] = result.data.subscribedTiers || [tier];
      const activeTier = result.data.activeTier || null; // Start as null - operator must go online manually
      
      // PHASE 1: Create operator tier profiles with PENDING approval status
      // All new operators must be verified before they can earn
      const tierProfiles: Record<string, any> = {};
      subscribedTiers.forEach(tier => {
        tierProfiles[tier] = {
          tier,
          subscribed: true,
          onboardingCompleted: true,
          onboardedAt: new Date().toISOString(),
          approvalStatus: "pending", // PHASE 1: Require admin approval
          approvalSubmittedAt: new Date().toISOString(),
          approvedAt: null,
          rejectionReason: null,
          canEarn: false, // Cannot earn until approved
          vehicle: result.data.vehicle || "Not specified",
          licensePlate: result.data.licensePlate || "N/A",
          businessLicense: normalizedBusinessLicense, // Use normalized value
          businessName: result.data.businessName || null,
          services: result.data.services || []
        };
      });
      
      // Create operator in database with proper defaults
      // ALWAYS use session email, not form email
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
        email: sessionUser.email, // SECURITY FIX: Use session email, not form
        latitude: result.data.latitude || "0",
        longitude: result.data.longitude || "0",
        address: result.data.address || "",
        isOnline: 0, // ALWAYS start offline
        hourlyRate: result.data.hourlyRate || null,
        availability: result.data.availability || "available",
        photo: result.data.photo || null,
        operatorTier: tier,
        subscribedTiers,
        activeTier, // null until operator goes online
        isCertified: result.data.isCertified ?? 1,
        businessLicense: normalizedBusinessLicense, // Use normalized value
        homeLatitude: result.data.homeLatitude || null,
        homeLongitude: result.data.homeLongitude || null,
        operatingRadius: result.data.operatingRadius || null,
        businessId: result.data.businessId || null,
        businessName: result.data.businessName || null,
        operatorTierProfiles: tierProfiles // PHASE 1: Add tier profiles with approval status
      };
      
      const [operator] = await db.insert(operators).values(operatorData).returning();
      
      // Link operator to authenticated user (using userId from session)
      await db.update(users)
        .set({ 
          operatorId: result.data.operatorId,
          role: 'operator'
        })
        .where(eq(users.userId, sessionUser.userId));
      
      // Update session for immediate frontend sync
      if ((req as any).session?.user) {
        (req as any).session.user.operatorId = result.data.operatorId;
        (req as any).session.user.operatorTier = tier;
        (req as any).session.user.subscribedTiers = subscribedTiers;
        (req as any).session.user.operatorProfileComplete = true;
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
    try {
      const customerId = req.query.customerId as string | undefined;
      
      // CRITICAL SECURITY: Enforce authentication and customer ownership
      const userId = req.sessionData?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized - no session" });
      }
      
      // Get the user record to find their email
      const user = await db.query.users.findFirst({
        where: eq(users.userId, userId)
      });
      
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      
      // Get the logged-in user's customer record by email
      const userCustomer = await db.query.customers.findFirst({
        where: eq(customers.email, user.email)
      });
      
      // If customerId is provided, verify it matches the logged-in customer
      if (customerId) {
        if (!userCustomer || userCustomer.customerId !== customerId) {
          return res.status(403).json({ error: "Forbidden - cannot access other customer's requests" });
        }
        
        const requests = await storage.getServiceRequests(customerId);
        return res.json(requests);
      }
      
      // If no customerId provided but user is authenticated, use their customerId
      if (userCustomer) {
        const requests = await storage.getServiceRequests(userCustomer.customerId);
        return res.json(requests);
      }
      
      // No customerId and not a customer - return empty array
      return res.json([]);
    } catch (error) {
      console.error("Error fetching service requests:", error);
      return res.status(500).json({ error: "Failed to fetch service requests" });
    }
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
      
      // CRITICAL FIX: Get pending service requests from DATABASE (not MemStorage)
      // This ensures completed jobs don't reappear after being marked "completed"
      const pendingRequests = await db.query.serviceRequests.findMany({
        where: eq(serviceRequests.status, "pending")
      });
      
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
    
    // SELF-EXCLUSION: Prevent customers from requesting services from themselves
    const customerId = result.data.customerId;
    const targetOperatorId = result.data.operatorId; // Field used in service requests
    
    if (customerId && targetOperatorId) {
      // Get the customer record to find their userId
      const customer = await db.query.customers.findFirst({
        where: eq(customers.customerId, customerId)
      });
      
      if (customer) {
        // Get the user record to check if they're also an operator
        const user = await db.query.users.findFirst({
          where: eq(users.userId, customer.userId)
        });
        
        // Block if customer's operatorId matches the target operatorId
        if (user?.operatorId && user.operatorId === targetOperatorId) {
          return res.status(400).json({ 
            error: "Self-service not allowed",
            message: "You cannot request a service from yourself. Please select a different operator."
          });
        }
      }
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
      
      // PHASE 1: Build operator tier profiles with PENDING approval status
      // All new tiers must be verified before operators can earn in them
      const existingProfiles = (operator.operatorTierProfiles as any) || {};
      const updatedProfiles = {
        ...existingProfiles,
        [tier]: {
          tier,
          subscribed: true,
          onboardingCompleted: true,
          onboardedAt: new Date().toISOString(),
          approvalStatus: "pending", // PHASE 1: Require admin approval
          approvalSubmittedAt: new Date().toISOString(),
          approvedAt: null,
          rejectionReason: null,
          canEarn: false, // Cannot earn until approved
          vehicle: details?.vehicle || operator.vehicle,
          licensePlate: details?.licensePlate || operator.licensePlate,
          businessLicense: details?.businessLicense || operator.businessLicense,
          businessName: details?.businessName || operator.businessName,
          services: details?.services || operator.services,
          documents: details?.documents || {}
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
      
      // FIXED: Block offline toggle for any non-terminal job (accepted/in_progress/started, not completed/cancelled)
      const allAcceptedJobs = await storage.getAcceptedJobs(operatorId);
      const activeJobs = allAcceptedJobs.filter(job => 
        job.status !== 'completed' && job.status !== 'cancelled'
      );
      
      // Prevent going offline if operator has active jobs in current tier
      if (isOnline === 0 && operator.isOnline === 1 && operator.activeTier) {
        if (activeJobs.length > 0) {
          return res.status(409).json({ 
            error: "active_jobs",
            message: `You cannot go offline while you have ${activeJobs.length} active job(s) in progress. Please complete or cancel your current jobs first.`,
            currentTier: operator.activeTier,
            activeJobCount: activeJobs.length
          });
        }
      }
      
      // Check if operator is already online on a different tier
      if (isOnline === 1 && operator.isOnline === 1 && operator.activeTier !== activeTier) {
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

      // DATABASE FIX: Read from database instead of MemStorage for persistence
      // Only return ACTIVE jobs (not completed or cancelled) - completed jobs go to Job History
      const whereConditions = [
        eq(acceptedJobs.operatorId, operatorId),
        or(
          eq(acceptedJobs.status, "accepted"),
          eq(acceptedJobs.status, "in_progress")
        )
      ];
      
      // Filter by tier if provided
      if (tier) {
        whereConditions.push(eq(acceptedJobs.tier, tier));
      }
      
      const jobs = await db.select()
        .from(acceptedJobs)
        .where(and(...whereConditions))
        .orderBy(acceptedJobs.acceptedAt);
      
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
      const { operatorId, earnings } = req.body;
      
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

      // Calculate earnings if not provided (use midpoint of budget range)
      let actualEarnings = earnings;
      if (!actualEarnings) {
        const jobData = existingJob.jobData as any;
        const budgetRange = jobData?.budgetRange || "$0-$0";
        const match = budgetRange.match(/\$(\d+)-\$?(\d+)/);
        if (match) {
          actualEarnings = (parseInt(match[1]) + parseInt(match[2])) / 2;
        } else {
          actualEarnings = 0;
        }
      }

      const job = await storage.completeAcceptedJob(acceptedJobId, actualEarnings);
      
      // CRITICAL FIX: Mark the source serviceRequest as "completed" so it doesn't reappear
      if (existingJob.jobSourceId) {
        await db.update(serviceRequests)
          .set({ 
            status: "completed",
            completedAt: new Date(),
            paymentStatus: "pending", // Uber-style: earnings pending until review window
            paymentCapturedAt: new Date() // Customer charged immediately
          })
          .where(eq(serviceRequests.requestId, existingJob.jobSourceId));
      }
      
      // DATABASE PERSISTENCE FIX: Write earnings directly to database (not MemStorage)
      const today = new Date().toISOString().split('T')[0];
      const month = new Date().toISOString().substring(0, 7);
      
      // Upsert daily earnings to DATABASE (persists across logout/refresh)
      await db.insert(operatorDailyEarnings)
        .values({
          operatorId,
          tier: existingJob.tier,
          date: today,
          jobsCompleted: 1,
          earningsPending: actualEarnings, // Store as number, not string
          earnings: actualEarnings
        })
        .onConflictDoUpdate({
          target: [operatorDailyEarnings.operatorId, operatorDailyEarnings.tier, operatorDailyEarnings.date],
          set: {
            jobsCompleted: sql`${operatorDailyEarnings.jobsCompleted} + 1`,
            earningsPending: sql`${operatorDailyEarnings.earningsPending} + ${actualEarnings}`,
            earnings: sql`${operatorDailyEarnings.earnings} + ${actualEarnings}`,
            updatedAt: new Date()
          }
        });
      
      // Upsert monthly earnings to DATABASE (persists across logout/refresh)
      await db.insert(operatorMonthlyEarnings)
        .values({
          operatorId,
          tier: existingJob.tier,
          month,
          jobsCompleted: 1,
          earningsPending: actualEarnings, // Store as number, not string
          earnings: actualEarnings
        })
        .onConflictDoUpdate({
          target: [operatorMonthlyEarnings.operatorId, operatorMonthlyEarnings.tier, operatorMonthlyEarnings.month],
          set: {
            jobsCompleted: sql`${operatorMonthlyEarnings.jobsCompleted} + 1`,
            earningsPending: sql`${operatorMonthlyEarnings.earningsPending} + ${actualEarnings}`,
            earnings: sql`${operatorMonthlyEarnings.earnings} + ${actualEarnings}`,
            updatedAt: new Date()
          }
        });
      
      // CUSTOMER GROUPS UNLOCK: Update total tier stats for unlock tracking
      await db.insert(operatorTierStats)
        .values({
          operatorId,
          tier: existingJob.tier,
          jobsCompleted: 1,
          totalEarnings: actualEarnings, // Store as number, not string
          lastActiveAt: new Date()
        })
        .onConflictDoUpdate({
          target: [operatorTierStats.operatorId, operatorTierStats.tier],
          set: {
            jobsCompleted: sql`${operatorTierStats.jobsCompleted} + 1`,
            totalEarnings: sql`${operatorTierStats.totalEarnings} + ${actualEarnings}`,
            lastActiveAt: new Date()
          }
        });
      
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
      const { reason, operatorId, cancelledByOperator = true } = req.body;
      
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

      const result = await storage.cancelAcceptedJob(acceptedJobId, reason, cancelledByOperator);
      
      // CRITICAL FIX: Mark the source serviceRequest as "cancelled" so it doesn't reappear
      if (existingJob.jobSourceId) {
        await db.update(serviceRequests)
          .set({ 
            status: "cancelled",
            paymentStatus: "refunded"
          })
          .where(eq(serviceRequests.requestId, existingJob.jobSourceId));
      }
      
      // If there's a penalty (cancelled by operator before 50% completion), record it
      if (result.penalty && result.penalty > 0) {
        await storage.createPenalty(
          operatorId,
          existingJob.tier,
          acceptedJobId,
          result.penalty,
          "cancellation_under_50_percent",
          existingJob.progress
        );
      }
      
      res.json({
        ...result.job,
        penalty: result.penalty,
        penaltyMessage: result.penalty 
          ? `You will forfeit $${result.penalty.toFixed(2)} for cancelling before 50% completion.`
          : undefined
      });
    } catch (error) {
      console.error("Error cancelling job:", error);
      res.status(500).json({ message: "Failed to cancel job" });
    }
  });

  // ========== JOB HISTORY ENDPOINT ==========
  
  // Get completed job history for operator with filters
  router.get("/api/operators/:operatorId/job-history", async (req, res) => {
    try {
      const { operatorId } = req.params;
      const {
        tier,
        startDate,
        endDate,
        limit = "50",
        offset = "0"
      } = req.query as Record<string, string>;
      
      // SECURITY FIX: Validate and sanitize pagination params
      const validLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
      const validOffset = Math.max(parseInt(offset) || 0, 0);
      
      const whereConditions = [
        eq(acceptedJobs.operatorId, operatorId),
        eq(acceptedJobs.status, "completed") // Only completed jobs
      ];
      
      // Filter by tier if provided
      if (tier && tier !== "all") {
        whereConditions.push(eq(acceptedJobs.tier, tier));
      }
      
      // Filter by date range if provided
      if (startDate) {
        whereConditions.push(gte(acceptedJobs.completedAt, new Date(startDate)));
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999); // End of day
        whereConditions.push(sql`${acceptedJobs.completedAt} <= ${endDateTime}`);
      }
      
      // Query completed jobs from database with pagination
      // Select specific columns for performance
      const jobs = await db.select({
        id: acceptedJobs.id,
        acceptedJobId: acceptedJobs.acceptedJobId,
        operatorId: acceptedJobs.operatorId,
        tier: acceptedJobs.tier,
        status: acceptedJobs.status,
        jobData: acceptedJobs.jobData,
        actualEarnings: acceptedJobs.actualEarnings,
        completedAt: acceptedJobs.completedAt,
        acceptedAt: acceptedJobs.acceptedAt
      })
        .from(acceptedJobs)
        .where(and(...whereConditions))
        .orderBy(sql`${acceptedJobs.completedAt} DESC`) // Newest first
        .limit(validLimit)
        .offset(validOffset);
      
      // Get total count for pagination
      const totalResult = await db.select({ count: sql<number>`count(*)` })
        .from(acceptedJobs)
        .where(and(...whereConditions));
      
      const total = Number(totalResult[0]?.count || 0);
      
      // FIX: Convert actualEarnings from string to number for frontend
      const jobsWithNumericEarnings = jobs.map(job => ({
        ...job,
        actualEarnings: job.actualEarnings ? parseFloat(job.actualEarnings) : 0
      }));
      
      res.json({
        jobs: jobsWithNumericEarnings,
        pagination: {
          total,
          limit: validLimit,
          offset: validOffset,
          hasMore: validOffset + jobs.length < total
        }
      });
    } catch (error) {
      console.error("Error fetching job history:", error);
      res.status(500).json({ message: "Failed to fetch job history" });
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

  // ========== CUSTOMER JOB TRACKING ENDPOINTS ==========
  
  // Get all jobs for a customer (from their service requests that were accepted)
  router.get("/api/customer-jobs/:customerId", async (req, res) => {
    try {
      const { customerId } = req.params;
      const status = req.query.status as string | undefined;
      
      // FIX: Find ALL service requests for this customer that have been assigned/in_progress/completed
      // Don't just filter for "assigned" - that makes jobs disappear when they progress!
      const requests = await db.query.serviceRequests.findMany({
        where: and(
          eq(serviceRequests.customerId, customerId),
          or(
            eq(serviceRequests.status, "assigned"),
            eq(serviceRequests.status, "in_progress"),
            eq(serviceRequests.status, "completed")
          )
        )
      });
      
      if (!requests || requests.length === 0) {
        return res.json([]);
      }
      
      // Get the request IDs
      const requestIds = requests.map(r => r.requestId);
      
      // Find all accepted jobs matching these request IDs
      const whereConditions = [
        inArray(acceptedJobs.jobSourceId, requestIds)
      ];
      
      // FIX: Actually use the status filter parameter
      if (status) {
        whereConditions.push(eq(acceptedJobs.status, status));
      }
      
      const jobs = await db.select()
        .from(acceptedJobs)
        .where(and(...whereConditions))
        .orderBy(sql`${acceptedJobs.acceptedAt} DESC`);
      
      // FIX: Properly enrich jobs with operator details (phone, name, vehicle, rating)
      const enrichedJobs = await Promise.all(jobs.map(async (job) => {
        const operator = await db.query.operators.findFirst({
          where: eq(operators.operatorId, job.operatorId)
        });
        
        return {
          ...job,
          // Operator contact info (only visible after quote acceptance)
          operatorName: operator?.name || "Unknown Operator",
          operatorPhone: operator?.phone || null,
          operatorEmail: operator?.email || null,
          operatorPhoto: operator?.photo || null,
          operatorRating: operator?.rating || "0",
          // Vehicle info for tracking
          operatorVehicle: operator?.vehicle || null,
          operatorLicensePlate: operator?.licensePlate || null
        };
      }));
      
      res.json(enrichedJobs);
    } catch (error) {
      console.error("Error fetching customer jobs:", error);
      res.status(500).json({ message: "Failed to fetch customer jobs" });
    }
  });
  
  // Get a specific customer job by acceptedJobId
  router.get("/api/customer-jobs/job/:acceptedJobId", async (req, res) => {
    try {
      const { acceptedJobId } = req.params;
      
      const job = await db.query.acceptedJobs.findFirst({
        where: eq(acceptedJobs.acceptedJobId, acceptedJobId)
      });
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Get the operator details
      const operator = await db.query.operators.findFirst({
        where: eq(operators.operatorId, job.operatorId)
      });
      
      // Combine job with operator info
      res.json({
        ...job,
        operatorName: operator?.name || "Unknown",
        operatorPhone: operator?.phone || null,
        operatorEmail: operator?.email || null,
        operatorPhoto: operator?.photo || null,
        operatorRating: operator?.rating || "0"
      });
    } catch (error) {
      console.error("Error fetching customer job:", error);
      res.status(500).json({ message: "Failed to fetch customer job" });
    }
  });

  // Get today's earnings for operator (by tier) - DATABASE PERSISTENCE FIX
  router.get("/api/earnings/today/:operatorId", async (req, res) => {
    try {
      const { operatorId } = req.params;
      const tier = req.query.tier as string || "manual";
      const today = new Date().toISOString().split('T')[0];
      
      // Read from DATABASE (persists across logout/refresh)
      const result = await db.query.operatorDailyEarnings.findFirst({
        where: and(
          eq(operatorDailyEarnings.operatorId, operatorId),
          eq(operatorDailyEarnings.tier, tier),
          eq(operatorDailyEarnings.date, today)
        )
      });
      
      res.json({
        earnings: result ? parseFloat(result.earnings) : 0,
        earningsPending: result ? parseFloat(result.earningsPending) : 0,
        earningsAvailable: result ? parseFloat(result.earningsAvailable) : 0,
        jobsCompleted: result ? result.jobsCompleted : 0
      });
    } catch (error) {
      console.error("Error fetching today's earnings:", error);
      res.status(500).json({ message: "Failed to fetch today's earnings" });
    }
  });

  // Get this month's earnings for operator (by tier) - DATABASE PERSISTENCE FIX
  router.get("/api/earnings/month/:operatorId", async (req, res) => {
    try {
      const { operatorId } = req.params;
      const tier = req.query.tier as string || "manual";
      const month = new Date().toISOString().substring(0, 7);
      
      // Read from DATABASE (persists across logout/refresh)
      const result = await db.query.operatorMonthlyEarnings.findFirst({
        where: and(
          eq(operatorMonthlyEarnings.operatorId, operatorId),
          eq(operatorMonthlyEarnings.tier, tier),
          eq(operatorMonthlyEarnings.month, month)
        )
      });
      
      res.json({
        earnings: result ? parseFloat(result.earnings) : 0,
        earningsPending: result ? parseFloat(result.earningsPending) : 0,
        earningsAvailable: result ? parseFloat(result.earningsAvailable) : 0,
        jobsCompleted: result ? result.jobsCompleted : 0
      });
    } catch (error) {
      console.error("Error fetching month's earnings:", error);
      res.status(500).json({ message: "Failed to fetch month's earnings" });
    }
  });

  // CUSTOMER GROUPS UNLOCK: Check if operator has unlocked customer groups for their tier
  router.get("/api/operators/:operatorId/tier/:tier/unlock-status", async (req, res) => {
    try {
      const { operatorId, tier } = req.params;
      const minimumJobsRequired = 5; // Jobs needed to unlock customer groups per tier
      
      // Get operator's tier stats from database (or default to 0 if not exists)
      const tierStats = await db.query.operatorTierStats.findFirst({
        where: and(
          eq(operatorTierStats.operatorId, operatorId),
          eq(operatorTierStats.tier, tier)
        )
      });
      
      const jobsCompleted = tierStats ? tierStats.jobsCompleted : 0;
      const isUnlocked = jobsCompleted >= minimumJobsRequired;
      const progress = Math.min(100, (jobsCompleted / minimumJobsRequired) * 100);
      
      // Always return valid response (even for new operators with 0 jobs)
      res.json({
        isUnlocked,
        jobsCompleted,
        minimumJobsRequired,
        progress
      });
    } catch (error) {
      console.error("Error checking unlock status:", error);
      res.status(500).json({ message: "Failed to check unlock status" });
    }
  });

  // ========== QUOTE SYSTEM ENDPOINTS ==========

  // Get operator's pricing configs (all tiers or specific tier)
  router.get("/api/operators/:operatorId/pricing-config", async (req, res) => {
    try {
      const { operatorId } = req.params;
      const tier = req.query.tier as string | undefined;
      
      const configs = await db.select()
        .from(operatorPricingConfigs)
        .where(
          tier 
            ? and(eq(operatorPricingConfigs.operatorId, operatorId), eq(operatorPricingConfigs.tier, tier))
            : eq(operatorPricingConfigs.operatorId, operatorId)
        );
      
      res.json(configs);
    } catch (error) {
      console.error("Error fetching pricing configs:", error);
      res.status(500).json({ message: "Failed to fetch pricing configs" });
    }
  });

  // Create or update pricing config for operator
  router.post("/api/operators/:operatorId/pricing-config", async (req, res) => {
    try {
      const { operatorId } = req.params;
      const configData = req.body;
      
      // Validate the pricing config data
      const validation = insertOperatorPricingConfigSchema.safeParse({
        ...configData,
        operatorId
      });
      
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.issues });
      }
      
      const { tier, serviceType, baseRate, perKmRate, urgencyMultipliers, minimumFee } = validation.data;
      
      // Check if config already exists
      const existing = await db.select()
        .from(operatorPricingConfigs)
        .where(
          and(
            eq(operatorPricingConfigs.operatorId, operatorId),
            eq(operatorPricingConfigs.tier, tier),
            eq(operatorPricingConfigs.serviceType, serviceType)
          )
        )
        .limit(1);
      
      if (existing.length > 0) {
        // Update existing config
        const updated = await db.update(operatorPricingConfigs)
          .set({
            baseRate,
            perKmRate,
            urgencyMultipliers,
            minimumFee,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(operatorPricingConfigs.operatorId, operatorId),
              eq(operatorPricingConfigs.tier, tier),
              eq(operatorPricingConfigs.serviceType, serviceType)
            )
          )
          .returning();
        
        return res.json(updated[0]);
      } else {
        // Create new config
        const created = await db.insert(operatorPricingConfigs)
          .values(validation.data)
          .returning();
        
        return res.status(201).json(created[0]);
      }
    } catch (error) {
      console.error("Error creating/updating pricing config:", error);
      res.status(500).json({ message: "Failed to save pricing config" });
    }
  });

  // Submit a quote for a service request
  router.post("/api/service-requests/:requestId/quotes", async (req, res) => {
    try {
      const requestIdParam = req.params.requestId;
      const quoteData = req.body;
      
      // Support both numeric ID and string requestId for flexibility
      const isNumeric = !isNaN(Number(requestIdParam));
      const request = await db.select()
        .from(serviceRequests)
        .where(isNumeric 
          ? eq(serviceRequests.id, parseInt(requestIdParam))
          : eq(serviceRequests.requestId, requestIdParam)
        )
        .limit(1);
      
      if (request.length === 0) {
        return res.status(404).json({ message: "Service request not found" });
      }
      
      // Use the string requestId for quote tracking
      const requestId = request[0].requestId;
      
      // Check if operator already has a quote for this request
      const existingQuote = await db.select()
        .from(operatorQuotes)
        .where(
          and(
            eq(operatorQuotes.serviceRequestId, requestId),
            eq(operatorQuotes.operatorId, quoteData.operatorId)
          )
        )
        .limit(1);
      
      if (existingQuote.length > 0 && existingQuote[0].status !== "operator_withdrawn") {
        return res.status(409).json({ message: "You already have an active quote for this request" });
      }
      
      // Generate unique quote ID
      const quoteId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Set quote expiry (default 12 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 12);
      
      // Create quote
      const validation = insertOperatorQuoteSchema.safeParse({
        ...quoteData,
        quoteId,
        serviceRequestId: requestId,  // Use string requestId
        status: "sent",
        expiresAt,
        history: [{
          action: "created",
          timestamp: new Date().toISOString(),
          actor: quoteData.operatorId
        }]
      });
      
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error.issues });
      }
      
      const quote = await db.insert(operatorQuotes)
        .values(validation.data)
        .returning();
      
      // Create notification for customer about new quote (non-blocking)
      notificationService.notifyCustomerOfQuote(
        requestId,
        request[0].customerId,
        quoteData.operatorName,
        quoteData.amount,
        quoteId
      ).catch(err => {
        console.error("Failed to create quote notification:", err);
      });
      
      // Update service request quote count, last quote time, and status
      await db.update(serviceRequests)
        .set({
          quoteCount: sql`${serviceRequests.quoteCount} + 1`,
          lastQuoteAt: new Date(),
          status: "quoted" // Update status to show quotes have been received
        })
        .where(eq(serviceRequests.requestId, requestId));
      
      res.status(201).json(quote[0]);
    } catch (error) {
      console.error("Error creating quote:", error);
      res.status(500).json({ message: "Failed to create quote" });
    }
  });

  // Get all quotes for a service request
  router.get("/api/service-requests/:requestId/quotes", async (req, res) => {
    try {
      const requestIdParam = req.params.requestId;
      
      // Support both numeric ID and string requestId
      const isNumeric = !isNaN(Number(requestIdParam));
      const request = await db.select()
        .from(serviceRequests)
        .where(isNumeric 
          ? eq(serviceRequests.id, parseInt(requestIdParam))
          : eq(serviceRequests.requestId, requestIdParam)
        )
        .limit(1);
      
      if (request.length === 0) {
        return res.json([]);
      }
      
      const quotes = await db.select()
        .from(operatorQuotes)
        .where(eq(operatorQuotes.serviceRequestId, request[0].requestId))
        .orderBy(sql`${operatorQuotes.submittedAt} DESC`);
      
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  // Get all quotes for a customer across all service requests
  router.get("/api/quotes/customer/:customerId", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      
      // Get all service requests by this customer
      const requests = await db.select()
        .from(serviceRequests)
        .where(eq(serviceRequests.customerId, customerId));
      
      if (requests.length === 0) {
        return res.json([]);
      }
      
      // Get all quotes for these requests  
      const requestIds = requests.map(r => r.requestId);
      const quotes = await db.select()
        .from(operatorQuotes)
        .where(sql`${operatorQuotes.serviceRequestId} IN (${sql.join(requestIds.map(id => sql`${id}`), sql`, `)})`)
        .orderBy(sql`${operatorQuotes.submittedAt} DESC`);
      
      // Get operator details
      const operatorIds = [...new Set(quotes.map(q => q.operatorId))];
      const operatorDetails = await db.select()
        .from(operators)
        .where(sql`${operators.id} IN (${sql.join(operatorIds.map(id => sql`${id}`), sql`, `)})`);
      
      // Combine quote data with service request and operator info
      const quotesWithDetails = quotes.map(quote => {
        const request = requests.find(r => r.requestId === quote.serviceRequestId);
        const operator = operatorDetails.find(op => op.id === quote.operatorId);
        
        // Map status from backend to frontend expected values
        let frontendStatus = quote.status;
        if (quote.status === "sent") frontendStatus = "pending";
        else if (quote.status === "customer_accepted") frontendStatus = "accepted";
        else if (quote.status === "customer_declined") frontendStatus = "declined";
        else if (quote.status === "counter_pending" || quote.status === "counter_sent") frontendStatus = "countered";
        
        return {
          id: quote.quoteId,
          serviceRequestId: quote.serviceRequestId,
          operatorId: quote.operatorId,
          operatorName: quote.operatorName,
          operatorTier: quote.tier,
          operatorRating: operator?.rating || null,
          amount: parseFloat(quote.amount),
          breakdown: quote.breakdown || {},
          message: quote.notes,
          status: frontendStatus,
          expiresAt: quote.expiresAt?.toISOString() || new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          createdAt: quote.submittedAt?.toISOString() || new Date().toISOString(),
          serviceRequest: request ? {
            id: request.requestId,
            serviceType: request.serviceType,
            location: request.location,
            description: request.description || "",
            isEmergency: request.isEmergency === 1
          } : {
            id: quote.serviceRequestId,
            serviceType: "Unknown",
            location: "Unknown",
            description: "",
            isEmergency: false
          }
        };
      });
      
      res.json(quotesWithDetails);
    } catch (error) {
      console.error("Error fetching customer quotes:", error);
      res.status(500).json({ message: "Failed to fetch customer quotes" });
    }
  });

  // Get quotes by operator
  router.get("/api/operators/:operatorId/quotes", async (req, res) => {
    try {
      const { operatorId } = req.params;
      const status = req.query.status as string | undefined;
      
      const quotes = await db.select()
        .from(operatorQuotes)
        .where(
          status
            ? and(eq(operatorQuotes.operatorId, operatorId), eq(operatorQuotes.status, status))
            : eq(operatorQuotes.operatorId, operatorId)
        )
        .orderBy(sql`${operatorQuotes.submittedAt} DESC`);
      
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching operator quotes:", error);
      res.status(500).json({ message: "Failed to fetch operator quotes" });
    }
  });

  // Update quote (withdraw, edit amount while draft)
  router.patch("/api/quotes/:quoteId", async (req, res) => {
    try {
      const { quoteId } = req.params;
      const updates = req.body;
      
      // Get existing quote
      const existing = await db.select()
        .from(operatorQuotes)
        .where(eq(operatorQuotes.quoteId, quoteId))
        .limit(1);
      
      if (existing.length === 0) {
        return res.status(404).json({ message: "Quote not found" });
      }
      
      const quote = existing[0];
      
      // Only allow certain updates based on status
      if (updates.status === "operator_withdrawn") {
        // Operator is withdrawing the quote
        const updated = await db.update(operatorQuotes)
          .set({
            status: "operator_withdrawn",
            history: sql`${operatorQuotes.history} || ${JSON.stringify([{
              action: "withdrawn",
              timestamp: new Date().toISOString(),
              actor: quote.operatorId
            }])}`
          })
          .where(eq(operatorQuotes.quoteId, quoteId))
          .returning();
        
        return res.json(updated[0]);
      }
      
      // For other updates, apply them
      const updated = await db.update(operatorQuotes)
        .set(updates)
        .where(eq(operatorQuotes.quoteId, quoteId))
        .returning();
      
      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating quote:", error);
      res.status(500).json({ message: "Failed to update quote" });
    }
  });

  // Customer responds to quote (accept/decline/counter)
  router.post("/api/quotes/:quoteId/respond", async (req, res) => {
    try {
      const { quoteId } = req.params;
      const { action, customerId, counterAmount, notes } = req.body;
      
      if (!action || !["accept", "decline", "counter"].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Must be 'accept', 'decline', or 'counter'" });
      }
      
      // Get the quote
      const existing = await db.select()
        .from(operatorQuotes)
        .where(eq(operatorQuotes.quoteId, quoteId))
        .limit(1);
      
      if (existing.length === 0) {
        return res.status(404).json({ message: "Quote not found" });
      }
      
      const quote = existing[0];
      
      // Get the service request
      const request = await db.select()
        .from(serviceRequests)
        .where(eq(serviceRequests.requestId, quote.serviceRequestId))
        .limit(1);
      
      if (request.length === 0) {
        return res.status(404).json({ message: "Service request not found" });
      }
      
      if (action === "accept") {
        // Check if this quote is already accepted (idempotency check)
        const existingJob = await db.select()
          .from(acceptedJobs)
          .where(
            and(
              eq(acceptedJobs.serviceRequestId, quote.serviceRequestId),
              eq(acceptedJobs.operatorId, quote.operatorId)
            )
          )
          .limit(1);
        
        if (existingJob.length > 0) {
          // Already accepted - return existing job info
          return res.json({ 
            message: "Quote already accepted", 
            acceptedJobId: existingJob[0].acceptedJobId,
            alreadyAccepted: true 
          });
        }
        
        // Customer accepts the quote - create accepted job
        const acceptedJobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create accepted job with the quoted amount
        await db.insert(acceptedJobs).values({
          acceptedJobId,
          serviceRequestId: quote.serviceRequestId,
          operatorId: quote.operatorId,
          operatorName: quote.operatorName,
          tier: quote.tier,
          status: "accepted",
          jobData: request[0],
          jobSourceId: quote.serviceRequestId,
          progress: 0,
          agreedPrice: quote.amount // Store the quoted amount
        });
        
        // Update quote status
        await db.update(operatorQuotes)
          .set({
            status: "customer_accepted",
            respondedAt: new Date(),
            history: sql`${operatorQuotes.history} || ${JSON.stringify([{
              action: "customer_accepted",
              timestamp: new Date().toISOString(),
              actor: customerId
            }])}`
          })
          .where(eq(operatorQuotes.quoteId, quoteId));
        
        // Update service request to mark quote as decided
        await db.update(serviceRequests)
          .set({
            quoteStatus: "decided",
            selectedQuoteId: quoteId,
            operatorId: quote.operatorId,
            operatorName: quote.operatorName,
            status: "assigned"
          })
          .where(eq(serviceRequests.requestId, quote.serviceRequestId));
        
        // Decline all other quotes for this request
        await db.update(operatorQuotes)
          .set({
            status: "customer_declined",
            customerResponseNotes: "Customer selected another operator"
          })
          .where(
            and(
              eq(operatorQuotes.serviceRequestId, quote.serviceRequestId),
              sql`${operatorQuotes.quoteId} != ${quoteId}`,
              eq(operatorQuotes.status, "sent")
            )
          );
        
        return res.json({ message: "Quote accepted, job created", acceptedJobId });
      } else if (action === "decline") {
        // Customer declines the quote
        await db.update(operatorQuotes)
          .set({
            status: "customer_declined",
            respondedAt: new Date(),
            customerResponseNotes: notes,
            history: sql`${operatorQuotes.history} || ${JSON.stringify([{
              action: "customer_declined",
              timestamp: new Date().toISOString(),
              actor: customerId,
              notes
            }])}`
          })
          .where(eq(operatorQuotes.quoteId, quoteId));
        
        return res.json({ message: "Quote declined" });
      } else if (action === "counter") {
        // Customer counter-offers
        if (!counterAmount) {
          return res.status(400).json({ message: "Counter amount is required" });
        }
        
        await db.update(operatorQuotes)
          .set({
            status: "counter_pending",
            counterAmount,
            customerResponseNotes: notes,
            respondedAt: new Date(),
            history: sql`${operatorQuotes.history} || ${JSON.stringify([{
              action: "customer_counter",
              timestamp: new Date().toISOString(),
              actor: customerId,
              counterAmount,
              notes
            }])}`
          })
          .where(eq(operatorQuotes.quoteId, quoteId));
        
        return res.json({ message: "Counter offer sent" });
      }
    } catch (error) {
      console.error("Error responding to quote:", error);
      res.status(500).json({ message: "Failed to respond to quote" });
    }
  });

  // Customer accepts quote - simpler endpoint for frontend
  router.post("/api/quotes/:quoteId/accept", async (req, res) => {
    try {
      const { quoteId } = req.params;
      
      // Get the quote
      const existing = await db.select()
        .from(operatorQuotes)
        .where(eq(operatorQuotes.quoteId, quoteId))
        .limit(1);
      
      if (existing.length === 0) {
        return res.status(404).json({ message: "Quote not found" });
      }
      
      const quote = existing[0];
      
      // Get the service request
      const request = await db.select()
        .from(serviceRequests)
        .where(eq(serviceRequests.requestId, quote.serviceRequestId))
        .limit(1);
      
      if (request.length === 0) {
        return res.status(404).json({ message: "Service request not found" });
      }
      
      const customerId = request[0].customerId;
      
      // Check if this quote is already accepted (idempotency check)
      const existingJob = await db.select()
        .from(acceptedJobs)
        .where(
          and(
            eq(acceptedJobs.serviceRequestId, quote.serviceRequestId),
            eq(acceptedJobs.operatorId, quote.operatorId)
          )
        )
        .limit(1);
      
      if (existingJob.length > 0) {
        // Already accepted - return existing job info
        return res.json({ 
          message: "Quote already accepted", 
          acceptedJobId: existingJob[0].acceptedJobId,
          alreadyAccepted: true 
        });
      }
      
      // Customer accepts the quote - create accepted job
      const acceptedJobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create accepted job with the quoted amount
      await db.insert(acceptedJobs).values({
        acceptedJobId,
        serviceRequestId: quote.serviceRequestId,
        operatorId: quote.operatorId,
        operatorName: quote.operatorName,
        tier: quote.tier,
        status: "accepted",
        jobData: request[0],
        jobSourceId: quote.serviceRequestId,
        progress: 0,
        agreedPrice: quote.amount
      });
      
      // Update quote status
      await db.update(operatorQuotes)
        .set({
          status: "customer_accepted",
          respondedAt: new Date(),
          history: sql`${operatorQuotes.history} || ${JSON.stringify([{
            action: "customer_accepted",
            timestamp: new Date().toISOString(),
            actor: customerId
          }])}`
        })
        .where(eq(operatorQuotes.quoteId, quoteId));
      
      // Update service request to mark quote as decided
      await db.update(serviceRequests)
        .set({
          quoteStatus: "decided",
          selectedQuoteId: quoteId,
          operatorId: quote.operatorId,
          operatorName: quote.operatorName,
          status: "assigned"
        })
        .where(eq(serviceRequests.requestId, quote.serviceRequestId));
      
      // Decline all other quotes for this request
      await db.update(operatorQuotes)
        .set({
          status: "customer_declined",
          customerResponseNotes: "Customer selected another operator"
        })
        .where(
          and(
            eq(operatorQuotes.serviceRequestId, quote.serviceRequestId),
            sql`${operatorQuotes.quoteId} != ${quoteId}`,
            eq(operatorQuotes.status, "sent")
          )
        );
      
      // Only create notifications if this is a new acceptance (not idempotent retry)
      // Create notification for operator - their quote was ACCEPTED
      const operatorNotificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(notifications).values({
        notificationId: operatorNotificationId,
        userId: quote.operatorId,
        audienceRole: "operator",
        title: "Quote Accepted!",
        body: `Your quote for $${quote.amount} has been accepted. Job is ready to start.`,
        type: "quote_accepted",
        requestId: quote.serviceRequestId,
        metadata: {
          quoteId: quoteId,
          customerId: customerId,
          amount: quote.amount,
          acceptedJobId: acceptedJobId
        },
        deliveryState: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
      });
      
      // Create notification for customer - confirmation
      const customerNotificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(notifications).values({
        notificationId: customerNotificationId,
        userId: customerId,
        audienceRole: "customer",
        title: "Quote Accepted",
        body: `You accepted ${quote.operatorName}'s quote for $${quote.amount}. The operator will start soon.`,
        type: "quote_accepted",
        requestId: quote.serviceRequestId,
        metadata: {
          quoteId: quoteId,
          operatorId: quote.operatorId,
          operatorName: quote.operatorName,
          amount: quote.amount,
          acceptedJobId: acceptedJobId
        },
        deliveryState: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      
      return res.json({ message: "Quote accepted, job created", acceptedJobId });
    } catch (error) {
      console.error("Error accepting quote:", error);
      res.status(500).json({ message: "Failed to accept quote" });
    }
  });

  // Customer declines quote - simpler endpoint for frontend
  router.post("/api/quotes/:quoteId/decline", async (req, res) => {
    try {
      const { quoteId } = req.params;
      
      // Get the quote
      const existing = await db.select()
        .from(operatorQuotes)
        .where(eq(operatorQuotes.quoteId, quoteId))
        .limit(1);
      
      if (existing.length === 0) {
        return res.status(404).json({ message: "Quote not found" });
      }
      
      const quote = existing[0];
      
      // Get the service request to get customer ID
      const request = await db.select()
        .from(serviceRequests)
        .where(eq(serviceRequests.requestId, quote.serviceRequestId))
        .limit(1);
      
      if (request.length === 0) {
        return res.status(404).json({ message: "Service request not found" });
      }
      
      const customerId = request[0].customerId;
      
      // Customer declines the quote
      await db.update(operatorQuotes)
        .set({
          status: "customer_declined",
          respondedAt: new Date(),
          history: sql`${operatorQuotes.history} || ${JSON.stringify([{
            action: "customer_declined",
            timestamp: new Date().toISOString(),
            actor: customerId
          }])}`
        })
        .where(eq(operatorQuotes.quoteId, quoteId));
      
      // Create notification for operator - their quote was DECLINED
      const operatorNotificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(notifications).values({
        notificationId: operatorNotificationId,
        userId: quote.operatorId,
        audienceRole: "operator",
        title: "Quote Declined",
        body: `Your quote for $${quote.amount} was declined by the customer.`,
        type: "quote_declined",
        requestId: quote.serviceRequestId,
        metadata: {
          quoteId: quoteId,
          customerId: customerId,
          amount: quote.amount
        },
        deliveryState: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      
      // Create notification for customer - confirmation
      const customerNotificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(notifications).values({
        notificationId: customerNotificationId,
        userId: customerId,
        audienceRole: "customer",
        title: "Quote Declined",
        body: `You declined ${quote.operatorName}'s quote for $${quote.amount}.`,
        type: "quote_declined",
        requestId: quote.serviceRequestId,
        metadata: {
          quoteId: quoteId,
          operatorId: quote.operatorId,
          operatorName: quote.operatorName,
          amount: quote.amount
        },
        deliveryState: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      
      return res.json({ message: "Quote declined" });
    } catch (error) {
      console.error("Error declining quote:", error);
      res.status(500).json({ message: "Failed to decline quote" });
    }
  });

  // Operator declines a service request with reason
  router.post("/api/service-requests/:requestId/decline", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { operatorId, operatorName, tier, declineReason, declineNotes } = req.body;
      
      if (!operatorId || !tier || !declineReason) {
        return res.status(400).json({ message: "Missing required fields: operatorId, tier, declineReason" });
      }
      
      // Validate decline reason
      const validReasons = ["distance", "budget", "nature_of_job", "other"];
      if (!validReasons.includes(declineReason)) {
        return res.status(400).json({ message: "Invalid decline reason. Must be one of: distance, budget, nature_of_job, other" });
      }
      
      // Get the service request
      const request = await db.select()
        .from(serviceRequests)
        .where(eq(serviceRequests.requestId, requestId))
        .limit(1);
      
      if (request.length === 0) {
        return res.status(404).json({ message: "Service request not found" });
      }
      
      // Create a declined quote record for tracking
      const quoteId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      
      await db.insert(operatorQuotes).values({
        quoteId,
        serviceRequestId: requestId,
        operatorId,
        operatorName: operatorName || 'Unknown Operator',
        tier,
        amount: "0", // Declined, so no quote amount
        status: "operator_declined",
        declineReason,
        declineNotes: declineNotes || null,
        operatorAccepted: 0,
        respondedAt: now,
        expiresAt: now, // Already expired since declined
        history: [{
          action: "operator_declined",
          timestamp: now.toISOString(),
          actor: operatorId,
          reason: declineReason,
          notes: declineNotes
        }]
      });
      
      // Update service request status to operator_declined
      await db.update(serviceRequests)
        .set({
          status: "operator_declined",
          respondedAt: now,
          decisionAt: now
        })
        .where(eq(serviceRequests.requestId, requestId));
      
      res.json({ 
        message: "Job declined", 
        declineReason, 
        declineNotes,
        quoteId 
      });
    } catch (error) {
      console.error("Error declining service request:", error);
      res.status(500).json({ message: "Failed to decline service request" });
    }
  });

  // Operator submits quote AND accepts job simultaneously (enhanced workflow)
  router.post("/api/service-requests/:requestId/quote-and-accept", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { operatorId, operatorName, tier, amount, breakdown, notes } = req.body;
      
      if (!operatorId || !tier || !amount) {
        return res.status(400).json({ message: "Missing required fields: operatorId, tier, amount" });
      }
      
      // Get the service request
      const request = await db.select()
        .from(serviceRequests)
        .where(eq(serviceRequests.requestId, requestId))
        .limit(1);
      
      if (request.length === 0) {
        return res.status(404).json({ message: "Service request not found" });
      }
      
      // Create quote with operator_accepted status
      const quoteId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours from now
      
      const newQuote = await db.insert(operatorQuotes).values({
        quoteId,
        serviceRequestId: requestId,
        operatorId,
        operatorName: operatorName || 'Unknown Operator',
        tier,
        amount: amount.toString(),
        breakdown: breakdown || null,
        notes: notes || null,
        status: "operator_accepted", // Operator has accepted
        operatorAccepted: 1, // Flag set to true
        expiresAt,
        history: [{
          action: "quote_and_accept",
          timestamp: now.toISOString(),
          actor: operatorId,
          amount
        }]
      }).returning();
      
      // Create accepted job immediately
      const acceptedJobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.insert(acceptedJobs).values({
        acceptedJobId,
        serviceRequestId: requestId,
        operatorId,
        operatorName: operatorName || 'Unknown Operator',
        tier,
        status: "accepted",
        jobData: request[0],
        jobSourceId: requestId,
        progress: 0,
        agreedPrice: amount.toString()
      });
      
      // Update service request status to operator_accepted
      await db.update(serviceRequests)
        .set({
          status: "operator_accepted",
          operatorId,
          operatorName: operatorName || 'Unknown Operator',
          respondedAt: now,
          decisionAt: now,
          selectedQuoteId: quoteId,
          quoteStatus: "decided",
          quoteCount: sql`${serviceRequests.quoteCount} + 1`
        })
        .where(eq(serviceRequests.requestId, requestId));
      
      res.json({ 
        message: "Quote submitted and job accepted", 
        quoteId,
        acceptedJobId,
        quote: newQuote[0]
      });
    } catch (error) {
      console.error("Error submitting quote and accepting job:", error);
      res.status(500).json({ message: "Failed to submit quote and accept job" });
    }
  });

  // Emergency broadcast - send emergency request to all nearby operators
  router.post("/api/service-requests/:requestId/emergency-broadcast", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { radiusKm = 25 } = req.body; // Default 25km radius for emergencies
      
      // Get the service request
      const request = await db.select()
        .from(serviceRequests)
        .where(eq(serviceRequests.requestId, requestId))
        .limit(1);
      
      if (request.length === 0) {
        return res.status(404).json({ message: "Service request not found" });
      }
      
      const reqData = request[0];
      
      if (!reqData.isEmergency) {
        return res.status(400).json({ message: "This endpoint is only for emergency requests" });
      }
      
      if (!reqData.latitude || !reqData.longitude) {
        return res.status(400).json({ message: "Service request has no location data" });
      }
      
      const requestLat = parseFloat(reqData.latitude.toString());
      const requestLon = parseFloat(reqData.longitude.toString());
      
      // Haversine formula to calculate distance in kilometers
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };
      
      // Get all operators that offer this service type
      const allOperators = await db.select().from(operators);
      
      const nearbyOperators = allOperators.filter((op) => {
        // Check if operator offers this service type
        const services = Array.isArray(op.services) ? op.services : [];
        if (!services.includes(reqData.serviceType)) return false;
        
        // Check if operator has valid location
        if (!op.latitude || !op.longitude) return false;
        
        // Calculate distance
        const opLat = parseFloat(op.latitude.toString());
        const opLon = parseFloat(op.longitude.toString());
        const distanceKm = calculateDistance(requestLat, requestLon, opLat, opLon);
        
        // Filter by emergency broadcast radius (typically larger than normal)
        return distanceKm <= radiusKm;
      });
      
      // Calculate priority score for each operator and create dispatch queue entries
      const dispatchEntries = [];
      const now = new Date();
      const expiryTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes to respond
      
      for (let i = 0; i < nearbyOperators.length; i++) {
        const op = nearbyOperators[i];
        const opLat = parseFloat(op.latitude!.toString());
        const opLon = parseFloat(op.longitude!.toString());
        const distanceKm = calculateDistance(requestLat, requestLon, opLat, opLon);
        const rating = parseFloat(op.rating?.toString() || '0');
        
        // Get operator's tier stats for average response time (if available)
        const tier = op.activeTier || op.operatorTier || 'manual';
        const tierStats = await db.select()
          .from(operatorTierStats)
          .where(and(
            eq(operatorTierStats.operatorId, op.operatorId),
            eq(operatorTierStats.tier, tier)
          ))
          .limit(1);
        
        // Calculate average response time from previous dispatch queue entries
        const previousResponses = await db.select()
          .from(dispatchQueue)
          .where(and(
            eq(dispatchQueue.operatorId, op.operatorId),
            sql`${dispatchQueue.responseTimeSeconds} IS NOT NULL`
          ))
          .limit(10);
        
        const avgResponseTime = previousResponses.length > 0
          ? previousResponses.reduce((sum, r) => sum + (r.responseTimeSeconds || 0), 0) / previousResponses.length
          : 300; // Default 5 minutes if no history
        
        dispatchEntries.push({
          operator: op,
          distanceKm,
          rating,
          avgResponseTime,
          tier
        });
      }
      
      // Sort by priority: rating (highest first), then response time (fastest first), then distance (closest first)
      dispatchEntries.sort((a, b) => {
        // Primary: rating
        if (a.rating !== b.rating) {
          return b.rating - a.rating; // Higher rating first
        }
        
        // Secondary: average response time
        if (a.avgResponseTime !== b.avgResponseTime) {
          return a.avgResponseTime - b.avgResponseTime; // Faster response first
        }
        
        // Tertiary: distance
        return a.distanceKm - b.distanceKm; // Closer first
      });
      
      // Create dispatch queue entries
      const createdEntries = [];
      for (let i = 0; i < dispatchEntries.length; i++) {
        const entry = dispatchEntries[i];
        const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`;
        
        const result = await db.insert(dispatchQueue).values({
          queueId,
          serviceRequestId: requestId,
          emergencyId: reqData.requestId, // Link to emergency request
          operatorId: entry.operator.operatorId,
          queuePosition: i + 1, // Priority order
          status: "pending",
          notifiedAt: now,
          expiresAt: expiryTime,
          distanceKm: entry.distanceKm.toString(),
          operatorRatingSnapshot: entry.rating.toString(),
          operatorAvgResponseTime: entry.avgResponseTime.toString()
        }).returning();
        
        createdEntries.push(result[0]);
      }
      
      res.json({
        message: "Emergency broadcast sent",
        totalOperatorsNotified: createdEntries.length,
        dispatchEntries: createdEntries.map((e, i) => ({
          operatorId: e.operatorId,
          queuePosition: e.queuePosition,
          distanceKm: e.distanceKm,
          rating: e.operatorRatingSnapshot,
          avgResponseTime: e.operatorAvgResponseTime
        }))
      });
    } catch (error) {
      console.error("Error broadcasting emergency request:", error);
      res.status(500).json({ message: "Failed to broadcast emergency request" });
    }
  });

  // Find alternative operators when a job is declined
  router.get("/api/service-requests/:requestId/alternative-operators", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { excludeOperatorIds } = req.query;
      
      // Parse excludeOperatorIds from query string
      const excludeList = excludeOperatorIds 
        ? (Array.isArray(excludeOperatorIds) ? excludeOperatorIds : [excludeOperatorIds])
        : [];
      
      // Get the service request
      const request = await db.select()
        .from(serviceRequests)
        .where(eq(serviceRequests.requestId, requestId))
        .limit(1);
      
      if (request.length === 0) {
        return res.status(404).json({ message: "Service request not found" });
      }
      
      const reqData = request[0];
      
      if (!reqData.latitude || !reqData.longitude) {
        return res.status(400).json({ message: "Service request has no location data" });
      }
      
      const requestLat = parseFloat(reqData.latitude.toString());
      const requestLon = parseFloat(reqData.longitude.toString());
      
      // Haversine formula to calculate distance in kilometers
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };
      
      // Get all operators that offer this service type
      const allOperators = await db.select().from(operators);
      
      const matchingOperators = allOperators.filter((op) => {
        // Exclude already-declined operators
        if (excludeList.includes(op.operatorId)) return false;
        
        // Check if operator offers this service type
        const services = Array.isArray(op.services) ? op.services : [];
        if (!services.includes(reqData.serviceType)) return false;
        
        // Check if operator has valid location
        if (!op.latitude || !op.longitude) return false;
        
        return true;
      });
      
      // Calculate distance and filter by tier operating radius
      const operatorsWithDistance = matchingOperators.map((op) => {
        const opLat = parseFloat(op.latitude!.toString());
        const opLon = parseFloat(op.longitude!.toString());
        const distanceKm = calculateDistance(requestLat, requestLon, opLat, opLon);
        
        return {
          ...op,
          distanceKm
        };
      }).filter((op) => {
        // Filter by tier operating radius
        const tier = op.activeTier || op.operatorTier || 'manual';
        const tierInfo = {
          professional: null, // No radius restriction
          equipped: 15, // 15km radius
          manual: 5, // 5km radius from home
        };
        
        const maxRadius = tierInfo[tier as keyof typeof tierInfo];
        if (maxRadius === null) return true; // Professional - no limit
        
        return op.distanceKm <= maxRadius;
      });
      
      // Sort by rating (highest first), then by distance (closest first)
      operatorsWithDistance.sort((a, b) => {
        const ratingA = parseFloat(a.rating?.toString() || '0');
        const ratingB = parseFloat(b.rating?.toString() || '0');
        
        if (ratingA !== ratingB) {
          return ratingB - ratingA; // Higher rating first
        }
        
        return a.distanceKm - b.distanceKm; // Closer first if ratings equal
      });
      
      res.json(operatorsWithDistance);
    } catch (error) {
      console.error("Error finding alternative operators:", error);
      res.status(500).json({ message: "Failed to find alternative operators" });
    }
  });

  // ===== NOTIFICATIONS API =====
  
  // Get notifications for authenticated user
  router.get("/api/notifications", async (req, res) => {
    try {
      // Check both session sources for compatibility
      const userId = req.sessionData?.userId || req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { unreadOnly } = req.query;
      
      const allNotifications = await db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
        orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
        limit: 50,
      });
      
      // Filter unread if requested
      const result = unreadOnly === 'true' 
        ? allNotifications.filter(n => !n.readAt)
        : allNotifications;
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  
  // Mark notification as read (requires ownership)
  router.patch("/api/notifications/:notificationId/read", async (req, res) => {
    try {
      // Check both session sources for compatibility
      const userId = req.sessionData?.userId || req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { notificationId } = req.params;
      
      // Verify ownership before updating
      const notification = await db.query.notifications.findFirst({
        where: eq(notifications.notificationId, notificationId),
      });
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await db.update(notifications)
        .set({ readAt: new Date(), deliveryState: "read" })
        .where(eq(notifications.notificationId, notificationId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  
  // Get unread notification count for authenticated user
  router.get("/api/notifications/count", async (req, res) => {
    try {
      // Check both session sources for compatibility
      const userId = req.sessionData?.userId || req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const allNotifications = await db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
      });
      
      const unreadCount = allNotifications.filter(n => !n.readAt).length;
      
      res.json({ count: unreadCount });
    } catch (error) {
      console.error("Error fetching notification count:", error);
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });

  // ========== PHASE 2: ADMIN PORTAL ENDPOINTS ==========
  
  // Middleware to check if user is admin
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const sessionUser = req.session?.user;
      if (!sessionUser || !sessionUser.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is admin
      const user = await db.query.users.findFirst({
        where: eq(users.userId, sessionUser.userId)
      });
      
      if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      next();
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ message: "Failed to verify admin status" });
    }
  };
  
  // Get all operators with pending verification (admin only)
  router.get("/api/admin/operators/pending", requireAdmin, async (req, res) => {
    try {
      const allOperators = await db.query.operators.findMany();
      
      // Filter operators with at least one pending tier
      const pendingOperators = allOperators.filter(operator => {
        const tierProfiles = (operator.operatorTierProfiles as Record<string, any>) || {};
        const tiers = Object.keys(tierProfiles);
        
        return tiers.some(tier => {
          const profile = tierProfiles[tier];
          return profile?.approvalStatus === "pending" || profile?.approvalStatus === "under_review";
        });
      });
      
      res.json(pendingOperators);
    } catch (error) {
      console.error("Error fetching pending operators:", error);
      res.status(500).json({ message: "Failed to fetch pending operators" });
    }
  });
  
  // Approve operator tier (admin only)
  router.post("/api/admin/operators/:operatorId/approve/:tier", requireAdmin, async (req, res) => {
    try {
      const { operatorId, tier } = req.params;
      
      // Get operator
      const operator = await db.query.operators.findFirst({
        where: eq(operators.operatorId, operatorId)
      });
      
      if (!operator) {
        return res.status(404).json({ message: "Operator not found" });
      }
      
      // Update tier profile approval status
      const tierProfiles = (operator.operatorTierProfiles as Record<string, any>) || {};
      
      if (!tierProfiles[tier]) {
        return res.status(400).json({ message: `Tier ${tier} not found for this operator` });
      }
      
      tierProfiles[tier] = {
        ...tierProfiles[tier],
        approvalStatus: "approved",
        approvedAt: new Date().toISOString(),
        canEarn: true,
        rejectionReason: null
      };
      
      // Update database
      await db.update(operators)
        .set({ operatorTierProfiles: tierProfiles })
        .where(eq(operators.operatorId, operatorId));
      
      // TODO: Send approval email notification to operator
      
      res.json({ 
        message: "Operator tier approved successfully",
        tier,
        operatorId 
      });
    } catch (error) {
      console.error("Error approving operator:", error);
      res.status(500).json({ message: "Failed to approve operator" });
    }
  });
  
  // Reject operator tier (admin only)
  router.post("/api/admin/operators/:operatorId/reject/:tier", requireAdmin, async (req, res) => {
    try {
      const { operatorId, tier } = req.params;
      const { reason } = req.body;
      
      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }
      
      // Get operator
      const operator = await db.query.operators.findFirst({
        where: eq(operators.operatorId, operatorId)
      });
      
      if (!operator) {
        return res.status(404).json({ message: "Operator not found" });
      }
      
      // Update tier profile approval status
      const tierProfiles = (operator.operatorTierProfiles as Record<string, any>) || {};
      
      if (!tierProfiles[tier]) {
        return res.status(400).json({ message: `Tier ${tier} not found for this operator` });
      }
      
      tierProfiles[tier] = {
        ...tierProfiles[tier],
        approvalStatus: "rejected",
        rejectionReason: reason,
        canEarn: false
      };
      
      // Update database
      await db.update(operators)
        .set({ operatorTierProfiles: tierProfiles })
        .where(eq(operators.operatorId, operatorId));
      
      // TODO: Send rejection email notification to operator
      
      res.json({ 
        message: "Operator tier rejected",
        tier,
        operatorId,
        reason 
      });
    } catch (error) {
      console.error("Error rejecting operator:", error);
      res.status(500).json({ message: "Failed to reject operator" });
    }
  });

  return router;
}
