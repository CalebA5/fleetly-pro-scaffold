import { Router } from "express";
import type { IStorage } from "./storage";
import { insertExampleSchema } from "@shared/schema";

export function registerRoutes(storage: IStorage) {
  const router = Router();

  router.get("/api/examples", async (req, res) => {
    const examples = await storage.getExamples();
    res.json(examples);
  });

  router.get("/api/examples/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const example = await storage.getExample(id);
    if (!example) {
      return res.status(404).json({ message: "Example not found" });
    }
    res.json(example);
  });

  router.post("/api/examples", async (req, res) => {
    const result = insertExampleSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues });
    }
    const example = await storage.createExample(result.data);
    res.status(201).json(example);
  });

  return router;
}
