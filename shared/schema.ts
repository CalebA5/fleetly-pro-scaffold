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

export const serviceRequests = pgTable("service_requests", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().unique(),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  operatorId: text("operator_id").notNull(),
  operatorName: text("operator_name").notNull(),
  service: text("service").notNull(),
  status: text("status").notNull().default("pending"),
  location: text("location").notNull(),
  notes: text("notes"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
});

export const insertServiceRequestSchema = z.object({
  requestId: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  operatorId: z.string(),
  operatorName: z.string(),
  service: z.string(),
  status: z.string().optional(),
  location: z.string(),
  notes: z.string().optional(),
  estimatedCost: z.string().optional(),
});

export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type ServiceRequestStatus = "pending" | "confirmed" | "declined" | "cancelled";

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  customerId: text("customer_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  photo: text("photo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomerSchema = z.object({
  customerId: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  photo: z.string().optional(),
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Ratings table - for customers to rate operators after service
export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  ratingId: text("rating_id").notNull().unique(),
  customerId: text("customer_id").notNull(),
  operatorId: text("operator_id").notNull(),
  jobId: text("job_id"),
  rating: integer("rating").notNull(), // 1-5 stars
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;

// Favorites table - customers can favorite operators
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  operatorId: text("operator_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

// Operator location tracking - for real-time driver position
export const operatorLocations = pgTable("operator_locations", {
  id: serial("id").primaryKey(),
  operatorId: text("operator_id").notNull(),
  jobId: text("job_id"), // null if not on a job
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  heading: decimal("heading", { precision: 5, scale: 2 }), // direction in degrees
  speed: decimal("speed", { precision: 5, scale: 2 }), // km/h
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertOperatorLocationSchema = createInsertSchema(operatorLocations).omit({
  id: true,
  timestamp: true,
});

export type InsertOperatorLocation = z.infer<typeof insertOperatorLocationSchema>;
export type OperatorLocation = typeof operatorLocations.$inferSelect;

// Customer service history - for location-based grouping
export const customerServiceHistory = pgTable("customer_service_history", {
  id: serial("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  operatorId: text("operator_id").notNull(),
  service: text("service").notNull(),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const insertCustomerServiceHistorySchema = createInsertSchema(customerServiceHistory).omit({
  id: true,
  completedAt: true,
});

export type InsertCustomerServiceHistory = z.infer<typeof insertCustomerServiceHistorySchema>;
export type CustomerServiceHistory = typeof customerServiceHistory.$inferSelect;
