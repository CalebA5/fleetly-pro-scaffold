import { pgTable, serial, text, timestamp, integer, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  jobNumber: text("job_number").notNull().unique(),
  service: text("service").notNull(),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  operatorId: text("operator_id"),
  operatorName: text("operator_name"),
  operatorRating: decimal("operator_rating", { precision: 3, scale: 2 }),
  operatorPhone: text("operator_phone"),
  operatorVehicle: text("operator_vehicle"),
  operatorLicensePlate: text("operator_license_plate"),
  status: text("status").notNull().default("pending"),
  progress: integer("progress").notNull().default(0),
  location: text("location").notNull(),
  estimatedArrival: text("estimated_arrival"),
  estimatedCompletion: text("estimated_completion"),
  estimatedTotal: decimal("estimated_total", { precision: 10, scale: 2 }),
  actualTotal: decimal("actual_total", { precision: 10, scale: 2 }),
  jobSteps: jsonb("job_steps"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type UpdateJob = Partial<InsertJob>;
export type Job = typeof jobs.$inferSelect;

export type JobStep = {
  step: string;
  completed: boolean;
  time: string;
  current?: boolean;
};

export type JobStatus = "pending" | "assigned" | "en_route" | "arrived" | "in_progress" | "completed" | "cancelled";

export const operators = pgTable("operators", {
  id: serial("id").primaryKey(),
  operatorId: text("operator_id").notNull().unique(),
  name: text("name").notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).notNull(),
  totalJobs: integer("total_jobs").notNull().default(0),
  services: jsonb("services").notNull(),
  vehicle: text("vehicle").notNull(),
  licensePlate: text("license_plate").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  address: text("address").notNull(),
  isOnline: integer("is_online").notNull().default(0),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  availability: text("availability").notNull().default("available"),
  photo: text("photo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOperatorSchema = createInsertSchema(operators).omit({
  id: true,
  createdAt: true,
});

export type InsertOperator = z.infer<typeof insertOperatorSchema>;
export type Operator = typeof operators.$inferSelect;
