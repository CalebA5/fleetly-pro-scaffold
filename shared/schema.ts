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
  operatorTier: text("operator_tier").notNull().default("professional"),
  subscribedTiers: text("subscribed_tiers").array().notNull().default(["professional"]),
  activeTier: text("active_tier").notNull().default("professional"),
  isCertified: integer("is_certified").notNull().default(1),
  businessLicense: text("business_license"),
  homeLatitude: decimal("home_latitude", { precision: 10, scale: 7 }),
  homeLongitude: decimal("home_longitude", { precision: 10, scale: 7 }),
  operatingRadius: decimal("operating_radius", { precision: 10, scale: 2 }),
  businessId: text("business_id"),
  businessName: text("business_name"),
  driverName: text("driver_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOperatorSchema = createInsertSchema(operators).omit({
  id: true,
  createdAt: true,
});

export type InsertOperator = z.infer<typeof insertOperatorSchema>;
export type Operator = typeof operators.$inferSelect;

export type OperatorTier = "professional" | "equipped" | "manual";

export const OPERATOR_TIER_INFO = {
  professional: {
    label: "Professional & Certified",
    description: "Licensed business with professional equipment and certification",
    pricingMultiplier: 1.5,
    radiusKm: null, // No radius restriction
    badge: "🏆",
  },
  equipped: {
    label: "Skilled & Equipped",
    description: "Have trucks/vehicles but no formal certification",
    pricingMultiplier: 1.0,
    radiusKm: 15, // 15km radius
    badge: "🚛",
  },
  manual: {
    label: "Manual Operator",
    description: "On-foot with basic equipment (shovels, snow blowers)",
    pricingMultiplier: 0.6,
    radiusKm: 5, // 5km radius from home
    badge: "⛏️",
  },
};

export const operatorTierStats = pgTable("operator_tier_stats", {
  id: serial("id").primaryKey(),
  operatorId: text("operator_id").notNull(),
  tier: text("tier").notNull(),
  jobsCompleted: integer("jobs_completed").notNull().default(0),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).notNull().default("0"),
  rating: decimal("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  totalRatings: integer("total_ratings").notNull().default(0),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOperatorTierStatsSchema = createInsertSchema(operatorTierStats).omit({
  id: true,
  createdAt: true,
});

export type InsertOperatorTierStats = z.infer<typeof insertOperatorTierStatsSchema>;
export type OperatorTierStats = typeof operatorTierStats.$inferSelect;

export const serviceRequests = pgTable("service_requests", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().unique(),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  operatorId: text("operator_id"),
  operatorName: text("operator_name"),
  serviceType: text("service_type").notNull(),
  isEmergency: integer("is_emergency").notNull().default(0),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  preferredDate: text("preferred_date"),
  preferredTime: text("preferred_time"),
  timeFlexibility: text("time_flexibility"),
  budgetRange: text("budget_range"),
  imageCount: integer("image_count").notNull().default(0),
  details: jsonb("details"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
});

const baseServiceRequestSchema = z.object({
  requestId: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  operatorId: z.string().optional(),
  operatorName: z.string().optional(),
  serviceType: z.string(),
  isEmergency: z.boolean().optional(),
  description: z.string(),
  status: z.string().optional(),
  location: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  timeFlexibility: z.string().optional(),
  budgetRange: z.string().optional(),
  imageCount: z.number().optional(),
  estimatedCost: z.string().optional(),
});

const snowDetailsSchema = z.object({
  areaSize: z.string().optional(),
  surfaceType: z.string().optional(),
  snowDepth: z.string().optional(),
  hasObstacles: z.boolean().optional(),
  needsSalting: z.boolean().optional(),
});

const towingDetailsSchema = z.object({
  vehicleType: z.string().optional(),
  vehicleCondition: z.string().optional(),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  destination: z.string().optional(),
  reason: z.string().optional(),
});

const haulingDetailsSchema = z.object({
  itemType: z.string().optional(),
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  needsLoadingHelp: z.boolean().optional(),
  disposalLocation: z.string().optional(),
  numberOfItems: z.string().optional(),
});

const courierDetailsSchema = z.object({
  packageSize: z.string().optional(),
  packageWeight: z.string().optional(),
  isFragile: z.boolean().optional(),
  deliveryInstructions: z.string().optional(),
  requiresSignature: z.boolean().optional(),
  destination: z.string().optional(),
});

export const insertServiceRequestSchema = baseServiceRequestSchema.extend({
  snowDetails: snowDetailsSchema.optional(),
  towingDetails: towingDetailsSchema.optional(),
  haulingDetails: haulingDetailsSchema.optional(),
  courierDetails: courierDetailsSchema.optional(),
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

// Businesses table - for multi-driver business management
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  businessId: text("business_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  businessLicense: text("business_license").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  totalDrivers: integer("total_drivers").notNull().default(0),
  totalJobs: integer("total_jobs").notNull().default(0),
  totalEarnings: decimal("total_earnings", { precision: 12, scale: 2 }).notNull().default("0"),
  rating: decimal("rating", { precision: 3, scale: 2 }).notNull().default("5.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  createdAt: true,
  totalDrivers: true,
  totalJobs: true,
  totalEarnings: true,
  rating: true,
});

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businesses.$inferSelect;

// Vehicles table - for multi-vehicle/equipment management
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  vehicleId: text("vehicle_id").notNull().unique(),
  operatorId: text("operator_id").notNull(),
  name: text("name").notNull(), // e.g., "Truck #1", "Snow Plow A"
  vehicleType: text("vehicle_type").notNull(), // "Pickup Truck", "Box Truck", "Snow Plow", etc.
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: text("year").notNull(),
  licensePlate: text("license_plate").notNull(),
  services: jsonb("services").notNull(), // Array of services this vehicle can perform
  isActive: integer("is_active").notNull().default(0), // For equipped tier: only one can be active
  photo: text("photo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

// Users table - for authentication and user management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // Will be null for mock auth
  role: text("role").notNull().default("customer"), // "customer" | "operator" | "business"
  operatorId: text("operator_id"), // Links to operators table if role is operator
  businessId: text("business_id"), // Links to businesses table if role is business
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  userId: true,
  name: true,
  email: true,
  passwordHash: true,
  role: true,
  operatorId: true,
  businessId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Sessions table - for authentication session management
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  userId: text("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  sessionId: true,
  userId: true,
  expiresAt: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
