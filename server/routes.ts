import { Router } from "express";
import type { IStorage } from "./storage";
import { insertJobSchema } from "@shared/schema";

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

  return router;
}
