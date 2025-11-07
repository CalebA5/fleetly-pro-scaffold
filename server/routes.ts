import { Router } from "express";
import type { IStorage } from "./storage";
import { insertJobSchema, insertServiceRequestSchema, insertCustomerSchema, insertRatingSchema, insertFavoriteSchema, insertOperatorLocationSchema, insertCustomerServiceHistorySchema, OPERATOR_TIER_INFO } from "@shared/schema";
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
    const service = req.query.service as string | undefined;
    const operators = await storage.getOperators(service);
    res.json(operators);
  });

  router.get("/api/operators/nearby", async (req, res) => {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 10;
    
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ message: "Valid latitude and longitude required" });
    }
    
    const operators = await storage.getNearbyOperators(lat, lon, radius);
    res.json(operators);
  });

  router.get("/api/operators/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const operator = await storage.getOperator(id);
    if (!operator) {
      return res.status(404).json({ message: "Operator not found" });
    }
    res.json(operator);
  });

  router.get("/api/service-requests", async (req, res) => {
    const customerId = req.query.customerId as string | undefined;
    const requests = await storage.getServiceRequests(customerId);
    res.json(requests);
  });

  router.get("/api/service-requests/for-operator/:operatorId", async (req, res) => {
    try {
      const operatorId = req.params.operatorId;
      
      // Get all operators to find this one
      const operators = await storage.getOperators();
      const operator = operators.find(op => op.operatorId === operatorId);
      
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
    const favorites = await storage.getFavorites(req.params.customerId);
    res.json(favorites);
  });

  router.post("/api/favorites", async (req, res) => {
    const favoriteSchema = insertFavoriteSchema.pick({ customerId: true, operatorId: true });
    const result = favoriteSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues });
    }
    const favorite = await storage.addFavorite(result.data.customerId, result.data.operatorId);
    res.status(201).json(favorite);
  });

  router.delete("/api/favorites/:customerId/:operatorId", async (req, res) => {
    const { customerId, operatorId } = req.params;
    const success = await storage.removeFavorite(customerId, operatorId);
    if (!success) {
      return res.status(404).json({ message: "Favorite not found" });
    }
    res.status(204).send();
  });

  router.get("/api/favorites/:customerId/:operatorId/check", async (req, res) => {
    const { customerId, operatorId } = req.params;
    const isFavorite = await storage.isFavorite(customerId, operatorId);
    res.json({ isFavorite });
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

  return router;
}
