import { Router } from "express";
import type { IStorage } from "./storage";
import { insertJobSchema, insertServiceRequestSchema, insertCustomerSchema, insertRatingSchema, insertFavoriteSchema, insertOperatorLocationSchema, insertCustomerServiceHistorySchema } from "@shared/schema";

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

      // In production, this would use OpenAI Vision API to analyze description + images

      // Mock AI analysis for now - in production this would call OpenAI Vision API
      const recommendations = [
        {
          serviceType: "Snow Plowing",
          confidence: 95,
          estimatedCost: "$85-120",
          reasoning: "Based on your description of a 3-foot snowdrift blocking a 15-foot driveway, snow plowing with a V-plow attachment is the most efficient solution. This job typically takes 30-45 minutes.",
          urgency: "high",
          nearbyOperators: [
            {
              name: "Mike's Snow Service",
              distance: "0.8 miles",
              rating: 4.9,
              price: "$95/hr"
            },
            {
              name: "Winter Warriors",
              distance: "1.2 miles",
              rating: 4.8,
              price: "$90/hr"
            }
          ]
        },
        {
          serviceType: "Ice Removal",
          confidence: 75,
          estimatedCost: "$60-85",
          reasoning: "If ice has formed beneath the snow, ice removal services with de-icing equipment may be needed as a follow-up to prevent slipping hazards.",
          urgency: "medium",
          nearbyOperators: [
            {
              name: "QuickClear Services",
              distance: "1.5 miles",
              rating: 4.7,
              price: "$75/hr"
            }
          ]
        }
      ];

      res.json({ recommendations });
    } catch (error) {
      console.error("AI analysis error:", error);
      res.status(500).json({ message: "Failed to analyze job" });
    }
  });

  return router;
}
