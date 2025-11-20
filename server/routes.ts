import { Router } from "express";
import type { IStorage } from "./storage";
import { db } from "./db";
import { operators, favorites, operatorTierStats } from "@shared/schema";
import { eq, sql, and } from "drizzle-orm";
import { insertJobSchema, insertServiceRequestSchema, insertCustomerSchema, insertOperatorSchema, insertRatingSchema, insertFavoriteSchema, insertOperatorLocationSchema, insertCustomerServiceHistorySchema, OPERATOR_TIER_INFO } from "@shared/schema";
import { isWithinRadius } from "./utils/distance";

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

      res.json(operator);
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
    const customer = await storage.getCustomer(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  });

  router.post("/api/customers", async (req, res) => {
    const result = insertCustomerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues });
    }
    const customer = await storage.createCustomer(result.data);
    res.status(201).json(customer);
  });

  router.patch("/api/customers/:customerId", async (req, res) => {
    const customer = await storage.updateCustomer(req.params.customerId, req.body);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
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
  router.get("/api/business/:businessId", async (req, res) => {
    const business = await storage.getBusiness(req.params.businessId);
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
      
      // Update active tier in database
      await db.update(operators)
        .set({ activeTier: newTier })
        .where(eq(operators.operatorId, operatorId));
      
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
      
      // Add tier to subscribed tiers in database
      const updatedTiers = [...operator.subscribedTiers, tier];
      await db.update(operators)
        .set({ subscribedTiers: updatedTiers })
        .where(eq(operators.operatorId, operatorId));
      
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
      
      res.json({ message: "Tier added successfully" });
    } catch (error) {
      console.error("Error adding tier:", error);
      res.status(500).json({ message: "Failed to add tier" });
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

  return router;
}
