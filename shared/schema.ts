import { pgTable, serial, text, timestamp, integer, decimal, jsonb, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Status Enums for Enhanced Quote Workflow
export const QUOTE_STATUSES = ["draft", "sent", "accepted", "operator_accepted", "customer_accepted", "customer_declined", "operator_declined", "operator_withdrawn", "expired", "counter_pending", "counter_sent"] as const;
export type QuoteStatus = typeof QUOTE_STATUSES[number];
export const quoteStatusSchema = z.enum(QUOTE_STATUSES);

export const SERVICE_REQUEST_STATUSES = ["pending", "operator_pending", "operator_accepted", "operator_declined", "assigned", "in_progress", "completed", "cancelled", "disputed"] as const;
export type ServiceRequestStatus = typeof SERVICE_REQUEST_STATUSES[number];
export const serviceRequestStatusSchema = z.enum(SERVICE_REQUEST_STATUSES);

export const DECLINE_REASONS = ["distance", "budget", "nature_of_job", "other"] as const;
export type DeclineReason = typeof DECLINE_REASONS[number];
export const declineReasonSchema = z.enum(DECLINE_REASONS);

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
  operatorTier: text("operator_tier"),
  subscribedTiers: text("subscribed_tiers").array().notNull().default([]),
  activeTier: text("active_tier"),
  viewTier: text("view_tier"),
  isCertified: integer("is_certified").notNull().default(1),
  businessLicense: text("business_license"),
  homeLatitude: decimal("home_latitude", { precision: 10, scale: 7 }),
  homeLongitude: decimal("home_longitude", { precision: 10, scale: 7 }),
  operatingRadius: decimal("operating_radius", { precision: 10, scale: 2 }),
  businessId: text("business_id"),
  businessName: text("business_name"),
  driverName: text("driver_name"),
  operatorTierProfiles: jsonb("operator_tier_profiles"),
  equipmentInventory: jsonb("equipment_inventory"),
  primaryVehicleImage: text("primary_vehicle_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOperatorSchema = createInsertSchema(operators).omit({
  id: true,
  createdAt: true,
});

export type InsertOperator = z.infer<typeof insertOperatorSchema>;
export type Operator = typeof operators.$inferSelect;

export type OperatorTier = "professional" | "equipped" | "manual";

export type TierApprovalStatus = "pending" | "under_review" | "approved" | "rejected" | "not_submitted";

export type OperatorTierProfile = {
  tier: OperatorTier;
  subscribed: boolean;
  onboardingCompleted: boolean;
  onboardedAt?: string;
  approvalStatus?: TierApprovalStatus;
  approvalSubmittedAt?: string;
  approvedAt?: string;
  rejectionReason?: string;
  canEarn?: boolean;
  vehicle?: string;
  licensePlate?: string;
  businessLicense?: string;
  businessName?: string;
  services?: string[];
  documents?: {
    driversLicense?: string;
    vehicleRegistration?: string;
    insurance?: string;
    businessLicense?: string;
    certifications?: string[];
  };
};

export type EquipmentItem = {
  id: string;
  tier: OperatorTier;
  displayName: string;
  category: "vehicle" | "equipment" | "tool";
  photoUrl?: string;
  capabilities?: string[];
  description?: string;
};

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
}, (table) => ({
  // CRITICAL: Unique constraint needed for onConflictDoUpdate to work
  uniqueOperatorTier: unique().on(table.operatorId, table.tier)
}));

export const insertOperatorTierStatsSchema = createInsertSchema(operatorTierStats).omit({
  id: true,
  createdAt: true,
});

export type InsertOperatorTierStats = z.infer<typeof insertOperatorTierStatsSchema>;
export type OperatorTierStats = typeof operatorTierStats.$inferSelect;

export const operatorDailyEarnings = pgTable("operator_daily_earnings", {
  id: serial("id").primaryKey(),
  operatorId: text("operator_id").notNull(),
  tier: text("tier").notNull(),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  jobsCompleted: integer("jobs_completed").notNull().default(0),
  // Uber-style earnings tracking
  earningsPending: decimal("earnings_pending", { precision: 10, scale: 2 }).notNull().default("0"), // Subject to customer review
  earningsAvailable: decimal("earnings_available", { precision: 10, scale: 2 }).notNull().default("0"), // Ready for payout
  earningsPaidOut: decimal("earnings_paid_out", { precision: 10, scale: 2 }).notNull().default("0"), // Already transferred
  earnings: decimal("earnings", { precision: 10, scale: 2 }).notNull().default("0"), // Legacy total field
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // CRITICAL: Unique constraint needed for onConflictDoUpdate to work
  uniqueOperatorTierDate: unique().on(table.operatorId, table.tier, table.date)
}));

export const insertOperatorDailyEarningsSchema = createInsertSchema(operatorDailyEarnings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOperatorDailyEarnings = z.infer<typeof insertOperatorDailyEarningsSchema>;
export type OperatorDailyEarnings = typeof operatorDailyEarnings.$inferSelect;

export const operatorMonthlyEarnings = pgTable("operator_monthly_earnings", {
  id: serial("id").primaryKey(),
  operatorId: text("operator_id").notNull(),
  tier: text("tier").notNull(),
  month: text("month").notNull(), // Format: YYYY-MM
  jobsCompleted: integer("jobs_completed").notNull().default(0),
  // Uber-style earnings tracking
  earningsPending: decimal("earnings_pending", { precision: 10, scale: 2 }).notNull().default("0"),
  earningsAvailable: decimal("earnings_available", { precision: 10, scale: 2 }).notNull().default("0"),
  earningsPaidOut: decimal("earnings_paid_out", { precision: 10, scale: 2 }).notNull().default("0"),
  earnings: decimal("earnings", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // CRITICAL: Unique constraint needed for onConflictDoUpdate to work
  uniqueOperatorTierMonth: unique().on(table.operatorId, table.tier, table.month)
}));

export const insertOperatorMonthlyEarningsSchema = createInsertSchema(operatorMonthlyEarnings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOperatorMonthlyEarnings = z.infer<typeof insertOperatorMonthlyEarningsSchema>;
export type OperatorMonthlyEarnings = typeof operatorMonthlyEarnings.$inferSelect;

export const operatorPenalties = pgTable("operator_penalties", {
  id: serial("id").primaryKey(),
  operatorId: text("operator_id").notNull(),
  tier: text("tier").notNull(),
  acceptedJobId: text("accepted_job_id").notNull(),
  penaltyAmount: decimal("penalty_amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(), // "cancellation_under_50_percent" | "customer_complaint" | etc.
  progress: integer("progress").notNull(), // Progress at time of penalty
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOperatorPenaltySchema = createInsertSchema(operatorPenalties).omit({
  id: true,
  createdAt: true,
});

export type InsertOperatorPenalty = z.infer<typeof insertOperatorPenaltySchema>;
export type OperatorPenalty = typeof operatorPenalties.$inferSelect;

// Operator Pricing Configuration - tier-specific pricing factors
export const operatorPricingConfigs = pgTable("operator_pricing_configs", {
  id: serial("id").primaryKey(),
  operatorId: text("operator_id").notNull(),
  tier: text("tier").notNull(), // "manual" | "equipped" | "professional"
  serviceType: text("service_type").notNull(), // "Snow Plowing" | "Towing" | "Hauling" | "Courier"
  baseRate: decimal("base_rate", { precision: 10, scale: 2 }).notNull().default('0'), // Base price for service
  perKmRate: decimal("per_km_rate", { precision: 10, scale: 2 }).notNull().default('0'), // Additional charge per kilometer
  urgencyMultipliers: jsonb("urgency_multipliers").notNull().default('{}'), // { "emergency": 1.5, "scheduled": 1.0 }
  minimumFee: decimal("minimum_fee", { precision: 10, scale: 2 }).notNull().default('0'), // Minimum charge regardless of distance
  autoCalcMeta: jsonb("auto_calc_meta"), // Metadata for auto-calculation logic
  isActive: integer("is_active").notNull().default(1), // 1 = active, 0 = disabled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one pricing config per operator/tier/service combination
  uniqueOperatorTierService: unique().on(table.operatorId, table.tier, table.serviceType),
}));

export const insertOperatorPricingConfigSchema = createInsertSchema(operatorPricingConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOperatorPricingConfig = z.infer<typeof insertOperatorPricingConfigSchema>;
export type OperatorPricingConfig = typeof operatorPricingConfigs.$inferSelect;

// Operator Quotes - quotes submitted by operators for service requests
export const operatorQuotes = pgTable("operator_quotes", {
  id: serial("id").primaryKey(),
  quoteId: text("quote_id").notNull().unique(), // Unique ID like "quote_123456789"
  serviceRequestId: text("service_request_id").notNull(), // FK to service_requests.requestId
  operatorId: text("operator_id").notNull(),
  operatorName: text("operator_name").notNull(),
  tier: text("tier").notNull(), // Which tier the operator is quoting as
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Final quote amount
  breakdown: jsonb("breakdown"), // { "baseRate": 50, "distanceCost": 20, "urgencyMultiplier": 1.5, "total": 105 }
  status: text("status").notNull().default("sent"), // QuoteStatus enum: "draft" | "sent" | "accepted" | "operator_accepted" | "customer_accepted" | "customer_declined" | "operator_declined" | "operator_withdrawn" | "expired" | "counter_pending" | "counter_sent"
  operatorAccepted: integer("operator_accepted").notNull().default(0), // 1 = operator has accepted (quote+accept workflow), 0 = quote only
  customerResponseNotes: text("customer_response_notes"), // Customer feedback on quote
  counterAmount: decimal("counter_amount", { precision: 10, scale: 2 }), // If customer counters
  autoCalcSnapshot: jsonb("auto_calc_snapshot"), // Snapshot of pricing factors used
  notes: text("notes"), // Operator's notes on the quote
  declineReason: text("decline_reason"), // DeclineReason enum: "distance" | "budget" | "nature_of_job" | "other"
  declineNotes: text("decline_notes"), // Additional explanation when operator declines
  expiresAt: timestamp("expires_at"), // Auto-decline after expiry (default 12 hours)
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"), // When customer responded
  history: jsonb("history").default('[]'), // Audit trail: [{ action: "created", timestamp, actor }]
}, (table) => ({
  // Index for fast lookups
  serviceRequestIdx: index("idx_quotes_service_request").on(table.serviceRequestId),
  operatorIdx: index("idx_quotes_operator").on(table.operatorId),
  statusIdx: index("idx_quotes_status").on(table.status),
  // Composite index for service request + status queries
  serviceRequestStatusIdx: index("idx_quotes_service_request_status").on(table.serviceRequestId, table.status),
}));

export const insertOperatorQuoteSchema = createInsertSchema(operatorQuotes).omit({
  id: true,
  submittedAt: true,
});

export type InsertOperatorQuote = z.infer<typeof insertOperatorQuoteSchema>;
export type OperatorQuote = typeof operatorQuotes.$inferSelect;

export const serviceRequests = pgTable("service_requests", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().unique(),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  operatorId: text("operator_id"),
  operatorName: text("operator_name"),
  serviceType: text("service_type").notNull(),
  serviceTypes: text("service_types").array(), // Multiple services for project mode
  isProjectMode: integer("is_project_mode").notNull().default(0), // 1 = bundled multi-service project
  pricingPreference: text("pricing_preference"), // "fixed" | "hourly" | "custom_quote"
  isEmergency: integer("is_emergency").notNull().default(0),
  urgencyLevel: text("urgency_level"), // Added urgency level column
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"), // ServiceRequestStatus enum: "pending" | "operator_pending" | "operator_accepted" | "operator_declined" | "assigned" | "in_progress" | "completed" | "cancelled" | "disputed"
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
  decisionAt: timestamp("decision_at"), // When operator accepted/declined
  // Uber-style payment and completion tracking
  completedAt: timestamp("completed_at"),
  paymentStatus: text("payment_status"), // pending, captured, available, paid_out, refunded
  paymentCapturedAt: timestamp("payment_captured_at"), // When customer was charged
  paymentAvailableAt: timestamp("payment_available_at"), // When earnings became available (after review window)
  paymentPaidOutAt: timestamp("payment_paid_out_at"), // When money was transferred to operator
  customerRating: integer("customer_rating"), // 1-5 stars
  customerReview: text("customer_review"),
  customerRatedAt: timestamp("customer_rated_at"),
  // Quote workflow fields
  quoteWindowExpiresAt: timestamp("quote_window_expires_at"), // When quote submissions close
  selectedQuoteId: text("selected_quote_id"), // FK to operatorQuotes.quoteId when customer accepts
  quoteStatus: text("quote_status").default("open"), // "open" | "decided" | "expired"
  quoteCount: integer("quote_count").default(0), // Denormalized count for fast filtering
  lastQuoteAt: timestamp("last_quote_at"), // Last time a quote was submitted
  // Dashboard routing fields - for real-time state management
  latestQuoteId: text("latest_quote_id"), // FK to most recent quote (helps route to "Quote Received" tab)
  assignedOperatorId: text("assigned_operator_id"), // FK to operator who accepted the job
  activeJobId: text("active_job_id"), // FK to acceptedJobs.acceptedJobId when job is active
}, (table) => ({
  // Composite index for status + emergency queries as recommended by architect
  statusEmergencyIdx: index("idx_service_requests_status_emergency").on(table.status, table.isEmergency),
}));

const baseServiceRequestSchema = z.object({
  customerId: z.string(),
  customerName: z.string(),
  operatorId: z.string().optional(),
  operatorName: z.string().optional(),
  serviceType: z.string(),
  serviceTypes: z.array(z.string()).optional(), // Multiple services for project mode
  isProjectMode: z.boolean().optional(), // Bundled multi-service project
  pricingPreference: z.enum(["fixed", "hourly", "custom_quote"]).optional(),
  isEmergency: z.boolean().optional(),
  urgencyLevel: z.string().optional(),
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

// Request Status Events - Track all status transitions for audit and real-time notifications
export const requestStatusEvents = pgTable("request_status_events", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().unique(),
  requestId: text("request_id").notNull(), // FK to service_requests.requestId
  actorRole: text("actor_role").notNull(), // "customer" | "operator" | "system"
  actorId: text("actor_id"), // User ID of who triggered the event
  actorName: text("actor_name"), // Name for display
  fromStatus: text("from_status"), // Previous status (null for initial creation)
  toStatus: text("to_status").notNull(), // New status
  eventType: text("event_type").notNull(), // "request_created" | "quote_submitted" | "quote_accepted" | "job_started" | "job_completed" | "request_declined" | etc.
  metadata: jsonb("metadata"), // Event-specific data: { quoteId, amount, reason, etc. }
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  requestIdx: index("idx_status_events_request").on(table.requestId),
  createdAtIdx: index("idx_status_events_created").on(table.createdAt),
  requestCreatedIdx: index("idx_status_events_request_created").on(table.requestId, table.createdAt),
}));

export const insertRequestStatusEventSchema = createInsertSchema(requestStatusEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertRequestStatusEvent = z.infer<typeof insertRequestStatusEventSchema>;
export type RequestStatusEvent = typeof requestStatusEvents.$inferSelect;

// Notifications - Store all notifications for users (both customers and operators)
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  notificationId: text("notification_id").notNull().unique(),
  userId: text("user_id").notNull(), // ID of user who receives the notification
  audienceRole: text("audience_role").notNull(), // "customer" | "operator"
  title: text("title").notNull(), // Short title: "New Quote Received"
  body: text("body").notNull(), // Longer description: "John Doe has submitted a quote for $150"
  type: text("type").notNull(), // "request_update" | "quote_received" | "job_started" | "job_completed" | etc.
  requestId: text("request_id"), // FK to service_requests.requestId (optional, for request-related notifications)
  statusEventId: text("status_event_id"), // FK to request_status_events.eventId (links to triggering event)
  metadata: jsonb("metadata"), // Additional data: { quoteId, operatorId, amount, etc. }
  readAt: timestamp("read_at"), // When user marked as read
  deliveryState: text("delivery_state").notNull().default("pending"), // "pending" | "delivered" | "read"
  expiresAt: timestamp("expires_at"), // Auto-expire notifications after certain time
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("idx_notifications_user").on(table.userId),
  deliveryStateIdx: index("idx_notifications_delivery").on(table.deliveryState),
  userDeliveryIdx: index("idx_notifications_user_delivery").on(table.userId, table.deliveryState),
  createdAtIdx: index("idx_notifications_created").on(table.createdAt),
}));

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

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
  phone: text("phone").notNull().default(""),
  businessLicense: text("business_license").notNull().default(""),
  address: text("address").notNull().default(""),
  city: text("city").notNull().default(""),
  state: text("state").notNull().default(""),
  zipCode: text("zip_code").notNull().default(""),
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
  nameLower: text("name_lower"), // Normalized lowercase name for fast lookups
  email: text("email").notNull().unique(),
  emailNormalized: text("email_normalized"), // Normalized email (removes Gmail dots, +aliases, etc.)
  passwordHash: text("password_hash"), // Will be null for mock auth
  role: text("role").notNull().default("customer"), // "customer" | "operator" | "business"
  operatorId: text("operator_id"), // Links to operators table if role is operator
  businessId: text("business_id"), // Links to businesses table if role is business
  isAdmin: integer("is_admin").notNull().default(0), // PHASE 2: Admin access flag (0 = false, 1 = true)
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

// Weather Alerts table - stores active weather alerts for proactive notifications
export const weatherAlerts = pgTable("weather_alerts", {
  id: serial("id").primaryKey(),
  alertId: text("alert_id").notNull().unique(), // NWS alert ID
  event: text("event").notNull(), // e.g., "Winter Storm Warning"
  headline: text("headline").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // "Extreme", "Severe", "Moderate", "Minor"
  urgency: text("urgency").notNull(), // "Immediate", "Expected", "Future"
  areaDesc: text("area_desc").notNull(), // Geographic area
  effective: timestamp("effective").notNull(),
  expires: timestamp("expires").notNull(),
  instruction: text("instruction"),
  category: text("category").notNull(), // "Met", "Safety", "Transport", etc.
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWeatherAlertSchema = createInsertSchema(weatherAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWeatherAlert = z.infer<typeof insertWeatherAlertSchema>;
export type WeatherAlert = typeof weatherAlerts.$inferSelect;

// Emergency Requests - For anonymous emergency help (SOS feature, no login required)
export const emergencyRequests = pgTable("emergency_requests", {
  id: serial("id").primaryKey(),
  emergencyId: text("emergency_id").notNull().unique(),
  contactName: text("contact_name"), // Optional - user may provide
  contactPhone: text("contact_phone"), // Required for emergency response
  contactEmail: text("contact_email"), // Optional
  serviceType: text("service_type").notNull(), // "towing", "roadside", "debris"
  description: text("description").notNull(),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  status: text("status").notNull().default("searching"), // "searching" | "operator_assigned" | "en_route" | "completed" | "cancelled"
  assignedOperatorId: text("assigned_operator_id"), // Operator who accepted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  customerId: text("customer_id"), // Linked if user logs in later
});

export const insertEmergencyRequestSchema = z.object({
  emergencyId: z.string(),
  contactName: z.string().optional(),
  contactPhone: z.string().min(10, "Phone number required for emergency"),
  contactEmail: z.string().email().optional().or(z.literal("")),
  serviceType: z.enum(["towing", "roadside", "debris", "snow_plowing", "hauling", "equipment_transport"]),
  description: z.string().min(10, "Please describe the emergency"),
  location: z.string().min(1, "Location is required"),
  latitude: z.string().or(z.number().transform(String)), // decimal columns expect strings
  longitude: z.string().or(z.number().transform(String)),
  status: z.string().optional().default("searching"),
  assignedOperatorId: z.string().optional(),
  customerId: z.string().optional(),
});

export type InsertEmergencyRequest = z.infer<typeof insertEmergencyRequestSchema>;
export type EmergencyRequest = typeof emergencyRequests.$inferSelect;
export type EmergencyStatus = "searching" | "operator_assigned" | "en_route" | "completed" | "cancelled";

// Dispatch Queue - Manages operator notifications and job queue system
export const dispatchQueue = pgTable("dispatch_queue", {
  id: serial("id").primaryKey(),
  queueId: text("queue_id").notNull().unique(),
  emergencyId: text("emergency_id"), // For emergency requests
  serviceRequestId: text("service_request_id"), // For regular service requests
  operatorId: text("operator_id").notNull(),
  queuePosition: integer("queue_position").notNull(), // 1 = first notified, 2 = second, etc.
  status: text("status").notNull().default("pending"), // "pending" | "notified" | "accepted" | "declined" | "expired"
  notifiedAt: timestamp("notified_at"),
  respondedAt: timestamp("responded_at"),
  expiresAt: timestamp("expires_at"), // Auto-decline after X minutes
  distanceKm: decimal("distance_km", { precision: 10, scale: 2 }), // Distance from operator to job
  // Priority snapshot fields (frozen at dispatch time for consistent prioritization)
  operatorRatingSnapshot: decimal("operator_rating_snapshot", { precision: 3, scale: 2 }), // Operator's rating when dispatched
  operatorAvgResponseTime: decimal("operator_avg_response_time", { precision: 10, scale: 2 }), // Avg response time in seconds
  responseTimeSeconds: integer("response_time_seconds"), // Time taken to respond to this specific request
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Composite indexes for efficient queries as recommended by architect
  serviceRequestStatusIdx: index("idx_dispatch_service_request_status").on(table.serviceRequestId, table.status),
  emergencyStatusIdx: index("idx_dispatch_emergency_status").on(table.emergencyId, table.status),
  operatorStatusIdx: index("idx_dispatch_operator_status").on(table.operatorId, table.status),
}));

export const insertDispatchQueueSchema = z.object({
  queueId: z.string(),
  emergencyId: z.string().optional(),
  serviceRequestId: z.string().optional(),
  operatorId: z.string(),
  queuePosition: z.number(),
  status: z.string().optional().default("pending"),
  notifiedAt: z.date().optional(),
  respondedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  distanceKm: z.string().or(z.number().transform(String)).optional(),
});

export type InsertDispatchQueue = z.infer<typeof insertDispatchQueueSchema>;
export type DispatchQueue = typeof dispatchQueue.$inferSelect;
export type DispatchStatus = "pending" | "notified" | "accepted" | "declined" | "expired";

// Equipment Media - Tool photos for manual operators showing their equipment
export const equipmentMedia = pgTable("equipment_media", {
  id: serial("id").primaryKey(),
  mediaId: text("media_id").notNull().unique(),
  operatorId: text("operator_id").notNull(),
  equipmentType: text("equipment_type").notNull(), // "snow_shovel", "rake", "snowblower", "ladder", etc.
  photoUrl: text("photo_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  isActive: integer("is_active").notNull().default(1), // Can be deactivated if equipment no longer available
});

export const insertEquipmentMediaSchema = createInsertSchema(equipmentMedia).omit({
  id: true,
  uploadedAt: true,
});

export type InsertEquipmentMedia = z.infer<typeof insertEquipmentMediaSchema>;
export type EquipmentMedia = typeof equipmentMedia.$inferSelect;

// Job Assignments - Selective customer acceptance from groups (customer-level granularity)
export const jobAssignments = pgTable("job_assignments", {
  id: serial("id").primaryKey(),
  assignmentId: text("assignment_id").notNull().unique(),
  groupId: text("group_id").notNull(), // Links to customer group
  customerId: text("customer_id").notNull(), // Individual customer within group
  operatorId: text("operator_id").notNull(),
  serviceRequestId: text("service_request_id"), // Links to actual service request
  status: text("status").notNull().default("pending"), // "pending" | "accepted" | "declined" | "completed" | "cancelled"
  acceptedAt: timestamp("accepted_at"),
  declinedAt: timestamp("declined_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertJobAssignmentSchema = createInsertSchema(jobAssignments).omit({
  id: true,
  createdAt: true,
});

export type InsertJobAssignment = z.infer<typeof insertJobAssignmentSchema>;
export type JobAssignment = typeof jobAssignments.$inferSelect;
export type JobAssignmentStatus = "pending" | "accepted" | "declined" | "completed" | "cancelled";

// Accepted Jobs - Persistent storage for operator-accepted jobs across sessions
export const acceptedJobs = pgTable("accepted_jobs", {
  id: serial("id").primaryKey(),
  acceptedJobId: text("accepted_job_id").notNull().unique(), // Unique ID for this acceptance
  operatorId: text("operator_id").notNull(), // Which operator accepted it
  jobSourceId: text("job_source_id").notNull(), // Original job/request ID (could be string or number converted to string)
  jobSourceType: text("job_source_type").notNull(), // "request" | "emergency" | "service_request" | "group"
  tier: text("tier").notNull(), // "manual" | "equipped" | "professional"
  status: text("status").notNull().default("accepted"), // "accepted" | "in_progress" | "completed" | "cancelled"
  progress: integer("progress").notNull().default(0), // 0-100 percentage
  jobData: jsonb("job_data").notNull(), // Full job/request details stored as JSON
  actualEarnings: decimal("actual_earnings", { precision: 10, scale: 2 }), // Actual earnings from this job
  cancelledByOperator: integer("cancelled_by_operator").default(0), // 1 if operator cancelled, 0 if customer/system cancelled
  acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
});

export const insertAcceptedJobSchema = createInsertSchema(acceptedJobs).omit({
  id: true,
  acceptedAt: true,
});

export type InsertAcceptedJob = z.infer<typeof insertAcceptedJobSchema>;
export type AcceptedJob = typeof acceptedJobs.$inferSelect;
export type AcceptedJobStatus = "accepted" | "in_progress" | "completed" | "cancelled";

// Job Messages - Customer-Operator Communication for active jobs
export const jobMessages = pgTable("job_messages", {
  id: serial("id").primaryKey(),
  messageId: text("message_id").notNull().unique(),
  jobId: text("job_id").notNull(), // Links to acceptedJobId or emergencyId
  jobType: text("job_type").notNull(), // "service_request" | "emergency"
  senderId: text("sender_id").notNull(), // customerId or operatorId
  senderType: text("sender_type").notNull(), // "customer" | "operator"
  senderName: text("sender_name").notNull(),
  content: text("content").notNull(),
  isRead: integer("is_read").notNull().default(0), // 0 = unread, 1 = read
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertJobMessageSchema = createInsertSchema(jobMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertJobMessage = z.infer<typeof insertJobMessageSchema>;
export type JobMessage = typeof jobMessages.$inferSelect;

// Live Operator Location - Real-time tracking for active jobs
export const operatorLiveLocations = pgTable("operator_live_locations", {
  id: serial("id").primaryKey(),
  operatorId: text("operator_id").notNull().unique(), // One entry per operator
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  heading: decimal("heading", { precision: 5, scale: 2 }), // Direction in degrees
  speed: decimal("speed", { precision: 5, scale: 2 }), // Speed in km/h
  accuracy: decimal("accuracy", { precision: 6, scale: 2 }), // GPS accuracy in meters
  activeJobId: text("active_job_id"), // Currently active job being worked on
  isEnRoute: integer("is_en_route").notNull().default(0), // 1 if traveling to job
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOperatorLiveLocationSchema = createInsertSchema(operatorLiveLocations).omit({
  id: true,
});

export type InsertOperatorLiveLocation = z.infer<typeof insertOperatorLiveLocationSchema>;
export type OperatorLiveLocation = typeof operatorLiveLocations.$inferSelect;

// Operator Service Areas - Geographic coverage for operator matching
export const operatorServiceAreas = pgTable("operator_service_areas", {
  id: serial("id").primaryKey(),
  operatorId: text("operator_id").notNull(),
  tier: text("tier").notNull(), // Which tier this area applies to
  countryCode: text("country_code").notNull(), // ISO2 country code (e.g., "US", "CA")
  countryName: text("country_name").notNull(),
  stateCode: text("state_code").notNull(), // State/Province code (e.g., "CA", "ON")
  stateName: text("state_name").notNull(),
  cityName: text("city_name").notNull(),
  cityLatitude: decimal("city_latitude", { precision: 10, scale: 7 }),
  cityLongitude: decimal("city_longitude", { precision: 10, scale: 7 }),
  neighborhoods: text("neighborhoods").array(), // Specific neighborhoods/areas within city
  coverageType: text("coverage_type").notNull().default("full_city"), // "full_city" | "neighborhoods_only"
  isPrimary: integer("is_primary").notNull().default(0), // 1 if this is the operator's primary/home city
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  operatorTierIdx: index("idx_service_areas_operator_tier").on(table.operatorId, table.tier),
  locationIdx: index("idx_service_areas_location").on(table.countryCode, table.stateCode, table.cityName),
  uniqueOperatorTierCity: unique().on(table.operatorId, table.tier, table.countryCode, table.stateCode, table.cityName),
}));

export const insertOperatorServiceAreaSchema = createInsertSchema(operatorServiceAreas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOperatorServiceArea = z.infer<typeof insertOperatorServiceAreaSchema>;
export type OperatorServiceArea = typeof operatorServiceAreas.$inferSelect;
export type CoverageType = "full_city" | "neighborhoods_only";

// Service area limits per tier
export const SERVICE_AREA_LIMITS = {
  manual: {
    maxCities: 1, // Home city only
    maxNeighborhoods: 3, // Up to 3 nearby neighborhoods
    description: "Operate within your home city and up to 3 nearby neighborhoods",
  },
  equipped: {
    maxCities: 3, // Up to 3 cities within same province
    maxNeighborhoods: null, // Full city coverage
    description: "Operate in up to 3 cities within your province/state",
  },
  professional: {
    maxCities: null, // Unlimited cities within country
    maxNeighborhoods: null, // Full coverage
    description: "Operate anywhere within your country with no limits",
  },
} as const;
