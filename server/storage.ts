import type { 
  Job, InsertJob, UpdateJob, 
  Operator, InsertOperator,
  ServiceRequest, InsertServiceRequest,
  Customer, InsertCustomer,
  Rating, InsertRating,
  Favorite, InsertFavorite,
  OperatorLocation, InsertOperatorLocation,
  CustomerServiceHistory, InsertCustomerServiceHistory,
  Business, InsertBusiness,
  Vehicle, InsertVehicle,
  User, InsertUser,
  Session, InsertSession,
  OperatorTierStats, InsertOperatorTierStats,
  AcceptedJob, InsertAcceptedJob,
  OperatorPricingConfig, InsertOperatorPricingConfig,
  OperatorQuote, InsertOperatorQuote,
  Wallet, InsertWallet,
  WalletTransaction, InsertWalletTransaction,
  PaymentCard, InsertPaymentCard
} from "@shared/schema";
import { db } from "./db";
import { operatorDailyEarnings, operatorMonthlyEarnings, operatorPenalties, acceptedJobs, operatorPricingConfigs, operatorQuotes, serviceRequests } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getJobs(customerId?: string): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  getJobByNumber(jobNumber: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: UpdateJob): Promise<Job | undefined>;
  getOperators(service?: string): Promise<Operator[]>;
  getOperator(id: number): Promise<Operator | undefined>;
  getOperatorByOperatorId(operatorId: string): Promise<Operator | undefined>;
  createOperator(operator: InsertOperator): Promise<Operator>;
  updateOperator(operatorId: string, updates: Partial<InsertOperator>): Promise<Operator | undefined>;
  getNearbyOperators(lat: number, lon: number, radiusMiles?: number): Promise<Operator[]>;
  getServiceRequests(customerId?: string): Promise<ServiceRequest[]>;
  getServiceRequest(id: number): Promise<ServiceRequest | undefined>;
  getServiceRequestByRequestId(requestId: string): Promise<ServiceRequest | undefined>;
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  updateServiceRequest(id: number, status: string, respondedAt?: Date): Promise<ServiceRequest | undefined>;
  getCustomer(customerId: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(customerId: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  
  // Ratings
  getRatings(operatorId?: string): Promise<Rating[]>;
  createRating(rating: InsertRating): Promise<Rating>;
  
  // Favorites
  getFavorites(customerId: string): Promise<Favorite[]>;
  addFavorite(customerId: string, operatorId: string): Promise<Favorite>;
  removeFavorite(customerId: string, operatorId: string): Promise<boolean>;
  isFavorite(customerId: string, operatorId: string): Promise<boolean>;
  
  // Operator Locations (real-time tracking)
  getOperatorLocation(operatorId: string): Promise<OperatorLocation | undefined>;
  updateOperatorLocation(location: InsertOperatorLocation): Promise<OperatorLocation>;
  getOperatorLocationHistory(operatorId: string, limit?: number): Promise<OperatorLocation[]>;
  
  // Customer Service History (for location-based grouping)
  getCustomerServiceHistory(operatorId: string, service: string, lat: number, lon: number, radiusMiles?: number): Promise<CustomerServiceHistory[]>;
  addServiceHistory(history: InsertCustomerServiceHistory): Promise<CustomerServiceHistory>;
  
  // Businesses (multi-driver management)
  getBusiness(businessId: string): Promise<Business | undefined>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(businessId: string, updates: Partial<InsertBusiness>): Promise<Business | undefined>;
  getBusinessDrivers(businessId: string): Promise<Operator[]>;
  createDriver(driver: InsertOperator): Promise<Operator>;
  removeDriver(driverId: string): Promise<boolean>;

  // Tier switching
  switchOperatorTier(operatorId: string, newTier: string): Promise<boolean>;
  addOperatorTier(operatorId: string, tier: string, details: any): Promise<boolean>;

  // Vehicle management
  getOperatorVehicles(operatorId: string): Promise<Vehicle[]>;
  getVehicle(vehicleId: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(vehicleId: string, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(vehicleId: string): Promise<boolean>;
  setActiveVehicle(operatorId: string, vehicleId: string): Promise<boolean>;

  // Authentication & Users
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUserId(userId: string): Promise<User | undefined>;
  updateUser(userId: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  
  // Sessions
  createSession(session: InsertSession): Promise<Session>;
  getSession(sessionId: string): Promise<Session | undefined>;
  deleteSession(sessionId: string): Promise<boolean>;
  deleteExpiredSessions(): Promise<number>;

  // Operator Tier Stats
  getOperatorTierStats(operatorId: string): Promise<OperatorTierStats[]>;
  getOperatorTierStat(operatorId: string, tier: string): Promise<OperatorTierStats | undefined>;
  createOperatorTierStat(stat: InsertOperatorTierStats): Promise<OperatorTierStats>;
  updateOperatorTierStat(operatorId: string, tier: string, updates: Partial<InsertOperatorTierStats>): Promise<OperatorTierStats | undefined>;
  incrementTierJobCount(operatorId: string, tier: string, earnings: number): Promise<void>;
  updateTierRating(operatorId: string, tier: string, newRating: number): Promise<void>;

  // Accepted Jobs (persistent operator job tracking)
  getAcceptedJobs(operatorId: string, tier?: string): Promise<AcceptedJob[]>;
  getAcceptedJob(acceptedJobId: string): Promise<AcceptedJob | undefined>;
  createAcceptedJob(job: InsertAcceptedJob): Promise<AcceptedJob>;
  updateAcceptedJobStatus(acceptedJobId: string, status: string): Promise<AcceptedJob | undefined>;
  updateAcceptedJobProgress(acceptedJobId: string, progress: number): Promise<AcceptedJob | undefined>;
  startAcceptedJob(acceptedJobId: string): Promise<AcceptedJob | undefined>;
  completeAcceptedJob(acceptedJobId: string, earnings: number): Promise<AcceptedJob | undefined>;
  cancelAcceptedJob(acceptedJobId: string, reason: string, cancelledByOperator: boolean): Promise<{ job: AcceptedJob | undefined; penalty?: number }>;
  getOperatorActiveJobs(operatorId: string, excludeTier?: string): Promise<AcceptedJob[]>;

  // Earnings & Penalties (persistent metrics tracking)
  getDailyEarnings(operatorId: string, tier: string, date: string): Promise<any | undefined>;
  upsertDailyEarnings(operatorId: string, tier: string, date: string, earningsToAdd: number, jobsToAdd: number): Promise<void>;
  getMonthlyEarnings(operatorId: string, tier: string, month: string): Promise<any | undefined>;
  upsertMonthlyEarnings(operatorId: string, tier: string, month: string, earningsToAdd: number, jobsToAdd: number): Promise<void>;
  getTodayEarnings(operatorId: string, tier: string): Promise<{ earnings: number; jobsCompleted: number }>;
  getMonthEarnings(operatorId: string, tier: string): Promise<{ earnings: number; jobsCompleted: number }>;
  createPenalty(operatorId: string, tier: string, acceptedJobId: string, amount: number, reason: string, progress: number): Promise<void>;

  // Pricing Configuration
  getOperatorPricingConfigs(operatorId: string, tier?: string): Promise<OperatorPricingConfig[]>;
  getPricingConfig(operatorId: string, tier: string, serviceType: string): Promise<OperatorPricingConfig | undefined>;
  createPricingConfig(config: InsertOperatorPricingConfig): Promise<OperatorPricingConfig>;
  updatePricingConfig(operatorId: string, tier: string, serviceType: string, updates: Partial<InsertOperatorPricingConfig>): Promise<OperatorPricingConfig | undefined>;
  
  // Quote Management
  createQuote(quote: InsertOperatorQuote): Promise<OperatorQuote>;
  getQuote(quoteId: string): Promise<OperatorQuote | undefined>;
  getQuotesByRequest(serviceRequestId: string): Promise<OperatorQuote[]>;
  getQuotesByOperator(operatorId: string): Promise<OperatorQuote[]>;
  updateQuote(quoteId: string, updates: Partial<InsertOperatorQuote>): Promise<OperatorQuote | undefined>;
  getOperatorQuoteForRequest(operatorId: string, serviceRequestId: string): Promise<OperatorQuote | undefined>;

  // Alternative operator matching (for declined jobs)
  findAlternativeOperators(serviceRequestId: string, excludeOperatorIds?: string[]): Promise<Array<Operator & { distanceKm: number }>>;

  // Wallet Management
  getWallet(userId: number): Promise<Wallet | undefined>;
  getOrCreateWallet(userId: number): Promise<Wallet>;
  updateWalletBalance(userId: number, amount: number, type: 'credit' | 'debit'): Promise<Wallet | undefined>;
  getWalletTransactions(userId: number, limit?: number, offset?: number, type?: string, tier?: string): Promise<WalletTransaction[]>;
  createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction>;
  
  // Payment Cards
  getPaymentCards(userId: number): Promise<PaymentCard[]>;
  getPaymentCard(cardId: number, userId: number): Promise<PaymentCard | undefined>;
  createPaymentCard(card: InsertPaymentCard): Promise<PaymentCard>;
  updatePaymentCard(cardId: number, userId: number, updates: Partial<InsertPaymentCard>): Promise<PaymentCard | undefined>;
  deletePaymentCard(cardId: number, userId: number): Promise<boolean>;
  setDefaultPaymentCard(cardId: number, userId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private jobs: Job[] = [];
  private operators: Operator[] = [];
  private serviceRequests: ServiceRequest[] = [];
  private customers: Customer[] = [];
  private ratings: Rating[] = [];
  private favorites: Favorite[] = [];
  private operatorLocations: OperatorLocation[] = [];
  private customerServiceHistory: CustomerServiceHistory[] = [];
  private businesses: Business[] = [];
  private users: User[] = [];
  private sessions: Session[] = [];
  private vehicles: Vehicle[] = [];
  private acceptedJobs: AcceptedJob[] = [];
  private dailyEarnings: Map<string, { earnings: number; jobsCompleted: number }> = new Map(); // key: "operatorId-tier-YYYY-MM-DD"
  private monthlyEarnings: Map<string, { earnings: number; jobsCompleted: number }> = new Map(); // key: "operatorId-tier-YYYY-MM"
  private penalties: Array<{ operatorId: string; tier: string; acceptedJobId: string; amount: number; reason: string; progress: number }> = [];
  private nextJobId = 1;
  private nextOperatorId = 1;
  private nextServiceRequestId = 1;
  private nextCustomerId = 1;
  private nextRatingId = 1;
  private nextFavoriteId = 1;
  private nextLocationId = 1;
  private nextHistoryId = 1;
  private nextBusinessId = 1;
  private nextUserId = 1;
  private nextSessionId = 1;
  private nextVehicleId = 1;
  private nextAcceptedJobId = 1;

  constructor() {
    // No demo data - clean slate for all operators
  }

  async getJobs(customerId?: string): Promise<Job[]> {
    if (customerId) {
      return this.jobs.filter((j) => j.customerId === customerId);
    }
    return this.jobs;
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.find((j) => j.id === id);
  }

  async getJobByNumber(jobNumber: string): Promise<Job | undefined> {
    return this.jobs.find((j) => j.jobNumber === jobNumber);
  }

  async createJob(job: InsertJob): Promise<Job> {
    const now = new Date();
    const newJob: Job = {
      id: this.nextJobId++,
      jobNumber: job.jobNumber,
      service: job.service,
      customerId: job.customerId,
      customerName: job.customerName,
      operatorId: job.operatorId || null,
      operatorName: job.operatorName || null,
      operatorRating: job.operatorRating || null,
      operatorPhone: job.operatorPhone || null,
      operatorVehicle: job.operatorVehicle || null,
      operatorLicensePlate: job.operatorLicensePlate || null,
      status: job.status || "pending",
      progress: job.progress || 0,
      location: job.location,
      estimatedArrival: job.estimatedArrival || null,
      estimatedCompletion: job.estimatedCompletion || null,
      estimatedTotal: job.estimatedTotal || null,
      actualTotal: job.actualTotal || null,
      jobSteps: job.jobSteps || null,
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.push(newJob);
    return newJob;
  }

  async updateJob(id: number, jobUpdate: UpdateJob): Promise<Job | undefined> {
    const index = this.jobs.findIndex((j) => j.id === id);
    if (index === -1) return undefined;

    this.jobs[index] = {
      ...this.jobs[index],
      ...jobUpdate,
      updatedAt: new Date(),
    };
    return this.jobs[index];
  }

  async getOperators(service?: string): Promise<Operator[]> {
    if (service) {
      return this.operators.filter((op) => {
        const services = op.services as string[];
        return services.includes(service);
      });
    }
    return this.operators;
  }

  async getOperator(id: number): Promise<Operator | undefined> {
    return this.operators.find((op) => op.id === id);
  }

  async getOperatorByOperatorId(operatorId: string): Promise<Operator | undefined> {
    return this.operators.find((op) => op.operatorId === operatorId);
  }

  async createOperator(operator: InsertOperator): Promise<Operator> {
    // Check for duplicate operatorId
    const existing = await this.getOperatorByOperatorId(operator.operatorId);
    if (existing) {
      throw new Error(`Operator with ID ${operator.operatorId} already exists`);
    }

    const tier = operator.operatorTier || "manual";
    const subscribedTiers: string[] = operator.subscribedTiers ? [...operator.subscribedTiers] : [tier];
    const activeTier = operator.activeTier || tier;

    // Ensure activeTier is in subscribedTiers
    if (!subscribedTiers.includes(activeTier)) {
      subscribedTiers.push(activeTier);
    }

    const newOperator: Operator = {
      id: this.nextOperatorId++,
      operatorId: operator.operatorId,
      name: operator.name,
      driverName: operator.driverName || operator.name,
      rating: "0",
      totalJobs: 0,
      services: operator.services || [],
      vehicle: operator.vehicle || "Not specified",
      licensePlate: operator.licensePlate || "N/A",
      phone: operator.phone || "",
      email: operator.email,
      latitude: operator.latitude || "0",
      longitude: operator.longitude || "0",
      address: operator.address || "",
      isOnline: operator.isOnline || 0,
      hourlyRate: operator.hourlyRate || "0",
      availability: operator.availability || "available",
      photo: operator.photo || null,
      operatorTier: tier,
      subscribedTiers,
      activeTier,
      isCertified: operator.isCertified || 0,
      businessLicense: operator.businessLicense || null,
      businessId: operator.businessId || null,
      businessName: operator.businessName || null,
      homeLatitude: operator.homeLatitude || operator.latitude || "0",
      homeLongitude: operator.homeLongitude || operator.longitude || "0",
      operatingRadius: operator.operatingRadius || null,
      createdAt: new Date(),
    };
    this.operators.push(newOperator);
    return newOperator;
  }

  async updateOperator(operatorId: string, updates: Partial<InsertOperator>): Promise<Operator | undefined> {
    const index = this.operators.findIndex((op) => op.operatorId === operatorId);
    if (index === -1) return undefined;

    this.operators[index] = {
      ...this.operators[index],
      ...updates,
    };
    return this.operators[index];
  }

  async getNearbyOperators(lat: number, lon: number, radiusMiles: number = 10): Promise<Operator[]> {
    const toRadians = (deg: number) => deg * (Math.PI / 180);
    const earthRadiusMiles = 3959;

    return this.operators
      .map((op) => {
        const opLat = parseFloat(op.latitude);
        const opLon = parseFloat(op.longitude);
        
        const dLat = toRadians(opLat - lat);
        const dLon = toRadians(opLon - lon);
        
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRadians(lat)) * Math.cos(toRadians(opLat)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = earthRadiusMiles * c;

        return { operator: op, distance };
      })
      .filter(({ distance }) => distance <= radiusMiles)
      .sort((a, b) => a.distance - b.distance)
      .map(({ operator }) => operator);
  }

  async getServiceRequests(customerId?: string): Promise<ServiceRequest[]> {
    if (customerId) {
      return await db.select().from(serviceRequests).where(eq(serviceRequests.customerId, customerId));
    }
    return await db.select().from(serviceRequests);
  }

  async getServiceRequest(id: number): Promise<ServiceRequest | undefined> {
    const results = await db.select().from(serviceRequests).where(eq(serviceRequests.id, id)).limit(1);
    return results[0];
  }

  async getServiceRequestByRequestId(requestId: string): Promise<ServiceRequest | undefined> {
    const results = await db.select().from(serviceRequests).where(eq(serviceRequests.requestId, requestId)).limit(1);
    return results[0];
  }

  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    // Build details object from service-specific fields
    let details: any = null;
    if (request.snowDetails) {
      details = { type: 'snow', payload: request.snowDetails };
    } else if (request.towingDetails) {
      details = { type: 'towing', payload: request.towingDetails };
    } else if (request.haulingDetails) {
      details = { type: 'hauling', payload: request.haulingDetails };
    } else if (request.courierDetails) {
      details = { type: 'courier', payload: request.courierDetails };
    }
    
    // TODO: Implement proper Mapbox Geocoding API integration to convert address to coordinates
    // For now, use mock coordinates (Toronto area) with slight randomization for testing
    const baseLat = 43.6532;
    const baseLon = -79.3832;
    const randomOffset = () => (Math.random() - 0.5) * 0.1; // Random offset within ~5km
    
    const latitude = request.latitude ? String(request.latitude) : String(baseLat + randomOffset());
    const longitude = request.longitude ? String(request.longitude) : String(baseLon + randomOffset());
    
    // Calculate quote window expiry (12 hours from now)
    const quoteWindowExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
    
    // Insert into database using Drizzle
    const [newRequest] = await db.insert(serviceRequests).values({
      requestId: `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customerId: request.customerId,
      customerName: request.customerName,
      operatorId: request.operatorId || null,
      operatorName: request.operatorName || null,
      serviceType: request.serviceType,
      isEmergency: request.isEmergency ? 1 : 0,
      urgencyLevel: request.urgencyLevel || null,
      description: request.description,
      status: request.status || "pending",
      location: request.location,
      latitude,
      longitude,
      preferredDate: request.preferredDate || null,
      preferredTime: request.preferredTime || null,
      timeFlexibility: request.timeFlexibility || null,
      budgetRange: request.budgetRange || null,
      imageCount: request.imageCount || 0,
      details,
      estimatedCost: request.estimatedCost || null,
      quoteWindowExpiresAt,
      quoteStatus: "open",
      quoteCount: 0,
    }).returning();
    
    return newRequest;
  }

  async updateServiceRequest(id: number, status: string, respondedAt?: Date): Promise<ServiceRequest | undefined> {
    const index = this.serviceRequests.findIndex((sr) => sr.id === id);
    if (index === -1) return undefined;

    this.serviceRequests[index] = {
      ...this.serviceRequests[index],
      status,
      respondedAt: respondedAt || new Date(),
    };
    return this.serviceRequests[index];
  }

  async getCustomer(customerId: string): Promise<Customer | undefined> {
    return this.customers.find((c) => c.customerId === customerId);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const now = new Date();
    const newCustomer: Customer = {
      id: this.nextCustomerId++,
      customerId: customer.customerId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address || null,
      city: customer.city || null,
      state: customer.state || null,
      zipCode: customer.zipCode || null,
      photo: customer.photo || null,
      createdAt: now,
    };
    this.customers.push(newCustomer);
    return newCustomer;
  }

  async updateCustomer(customerId: string, customerUpdate: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const index = this.customers.findIndex((c) => c.customerId === customerId);
    if (index === -1) return undefined;

    this.customers[index] = {
      ...this.customers[index],
      ...customerUpdate,
    };
    return this.customers[index];
  }

  // Ratings implementation
  async getRatings(operatorId?: string): Promise<Rating[]> {
    if (operatorId) {
      return this.ratings.filter((r) => r.operatorId === operatorId);
    }
    return this.ratings;
  }

  async createRating(rating: InsertRating): Promise<Rating> {
    const newRating: Rating = {
      id: this.nextRatingId++,
      ratingId: rating.ratingId,
      customerId: rating.customerId,
      operatorId: rating.operatorId,
      jobId: rating.jobId || null,
      rating: rating.rating,
      review: rating.review || null,
      createdAt: new Date(),
    };
    this.ratings.push(newRating);
    return newRating;
  }

  // Favorites implementation
  async getFavorites(customerId: string): Promise<Favorite[]> {
    return this.favorites.filter((f) => f.customerId === customerId);
  }

  async addFavorite(customerId: string, operatorId: string): Promise<Favorite> {
    const newFavorite: Favorite = {
      id: this.nextFavoriteId++,
      customerId,
      operatorId,
      createdAt: new Date(),
    };
    this.favorites.push(newFavorite);
    return newFavorite;
  }

  async removeFavorite(customerId: string, operatorId: string): Promise<boolean> {
    const index = this.favorites.findIndex(
      (f) => f.customerId === customerId && f.operatorId === operatorId
    );
    if (index === -1) return false;
    this.favorites.splice(index, 1);
    return true;
  }

  async isFavorite(customerId: string, operatorId: string): Promise<boolean> {
    return this.favorites.some(
      (f) => f.customerId === customerId && f.operatorId === operatorId
    );
  }

  // Operator Locations implementation
  async getOperatorLocation(operatorId: string): Promise<OperatorLocation | undefined> {
    const locations = this.operatorLocations
      .filter((l) => l.operatorId === operatorId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return locations[0];
  }

  async updateOperatorLocation(location: InsertOperatorLocation): Promise<OperatorLocation> {
    const newLocation: OperatorLocation = {
      id: this.nextLocationId++,
      operatorId: location.operatorId,
      jobId: location.jobId || null,
      latitude: location.latitude,
      longitude: location.longitude,
      heading: location.heading || null,
      speed: location.speed || null,
      timestamp: new Date(),
    };
    this.operatorLocations.push(newLocation);
    return newLocation;
  }

  async getOperatorLocationHistory(operatorId: string, limit: number = 10): Promise<OperatorLocation[]> {
    return this.operatorLocations
      .filter((l) => l.operatorId === operatorId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Customer Service History implementation
  async getCustomerServiceHistory(
    operatorId: string,
    service: string,
    lat: number,
    lon: number,
    radiusMiles: number = 5
  ): Promise<CustomerServiceHistory[]> {
    return this.customerServiceHistory.filter((h) => {
      if (h.operatorId !== operatorId || h.service !== service) return false;
      
      // Calculate distance if coordinates are available
      if (h.latitude && h.longitude) {
        const distance = this.calculateDistance(lat, lon, parseFloat(h.latitude), parseFloat(h.longitude));
        return distance <= radiusMiles;
      }
      return true;
    });
  }

  async addServiceHistory(history: InsertCustomerServiceHistory): Promise<CustomerServiceHistory> {
    const newHistory: CustomerServiceHistory = {
      id: this.nextHistoryId++,
      customerId: history.customerId,
      operatorId: history.operatorId,
      service: history.service,
      location: history.location,
      latitude: history.latitude || null,
      longitude: history.longitude || null,
      completedAt: new Date(),
    };
    this.customerServiceHistory.push(newHistory);
    return newHistory;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Business management implementation
  async getBusiness(businessId: string): Promise<Business | undefined> {
    return this.businesses.find((b) => b.businessId === businessId);
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    const newBusiness: Business = {
      id: this.nextBusinessId++,
      businessId: business.businessId,
      name: business.name,
      email: business.email,
      phone: business.phone,
      businessLicense: business.businessLicense,
      address: business.address,
      city: business.city,
      state: business.state,
      zipCode: business.zipCode,
      totalDrivers: 0,
      totalJobs: 0,
      totalEarnings: "0.00",
      rating: "5.00",
      createdAt: new Date(),
    };
    this.businesses.push(newBusiness);
    return newBusiness;
  }

  async updateBusiness(businessId: string, updates: Partial<InsertBusiness>): Promise<Business | undefined> {
    const index = this.businesses.findIndex((b) => b.businessId === businessId);
    if (index === -1) return undefined;

    this.businesses[index] = {
      ...this.businesses[index],
      ...updates,
    };
    return this.businesses[index];
  }

  async getBusinessDrivers(businessId: string): Promise<Operator[]> {
    return this.operators.filter((op) => op.businessId === businessId);
  }

  async createDriver(driver: InsertOperator): Promise<Operator> {
    const tier = driver.operatorTier || "professional";
    const newDriver: Operator = {
      id: this.nextOperatorId++,
      operatorId: driver.operatorId,
      name: driver.name,
      rating: driver.rating,
      totalJobs: driver.totalJobs || 0,
      services: driver.services,
      vehicle: driver.vehicle,
      licensePlate: driver.licensePlate,
      phone: driver.phone,
      email: driver.email || null,
      latitude: driver.latitude,
      longitude: driver.longitude,
      address: driver.address,
      isOnline: driver.isOnline || 0,
      hourlyRate: driver.hourlyRate || null,
      availability: driver.availability || "available",
      photo: driver.photo || null,
      operatorTier: tier,
      subscribedTiers: driver.subscribedTiers || [tier],
      activeTier: driver.activeTier || tier,
      isCertified: driver.isCertified || 1,
      businessLicense: driver.businessLicense || null,
      homeLatitude: driver.homeLatitude || null,
      homeLongitude: driver.homeLongitude || null,
      operatingRadius: driver.operatingRadius || null,
      businessId: driver.businessId || null,
      businessName: driver.businessName || null,
      driverName: driver.driverName || null,
      createdAt: new Date(),
    };
    this.operators.push(newDriver);

    // Update business total drivers count if applicable
    if (driver.businessId) {
      const business = await this.getBusiness(driver.businessId);
      if (business) {
        const totalDrivers = business.totalDrivers + 1;
        await this.updateBusiness(driver.businessId, {
          ...business,
          totalDrivers,
        });
      }
    }

    return newDriver;
  }

  async removeDriver(driverId: string): Promise<boolean> {
    const driverIndex = this.operators.findIndex((op) => op.operatorId === driverId);
    if (driverIndex === -1) return false;

    const driver = this.operators[driverIndex];
    const businessId = driver.businessId;

    // Remove driver from operators array
    this.operators.splice(driverIndex, 1);

    // Update business total drivers count if applicable
    if (businessId) {
      const business = await this.getBusiness(businessId);
      if (business) {
        const totalDrivers = Math.max(0, business.totalDrivers - 1);
        await this.updateBusiness(businessId, {
          ...business,
          totalDrivers,
        });
      }
    }

    return true;
  }

  async switchOperatorTier(operatorId: string, newTier: string): Promise<boolean> {
    const operator = this.operators.find((op) => op.operatorId === operatorId);
    if (!operator) return false;

    const subscribedTiers = operator.subscribedTiers || [operator.operatorTier];
    if (!subscribedTiers.includes(newTier)) return false;

    operator.activeTier = newTier;
    operator.operatorTier = newTier;

    return true;
  }

  async addOperatorTier(operatorId: string, tier: string, details: any): Promise<boolean> {
    const operator = this.operators.find((op) => op.operatorId === operatorId);
    if (!operator) return false;

    const subscribedTiers = operator.subscribedTiers || [operator.operatorTier];
    if (subscribedTiers.includes(tier)) return false;

    subscribedTiers.push(tier);
    operator.subscribedTiers = subscribedTiers;
    operator.activeTier = tier;
    operator.operatorTier = tier;

    if (details.vehicle) operator.vehicle = details.vehicle;
    if (details.licensePlate) operator.licensePlate = details.licensePlate;
    if (details.businessLicense) operator.businessLicense = details.businessLicense;
    if (details.services) {
      const servicesArray = details.services.split(',').map((s: string) => s.trim());
      operator.services = servicesArray;
    }

    if (tier === "professional") {
      operator.isCertified = 1;
      operator.operatingRadius = null;
    } else if (tier === "equipped") {
      operator.operatingRadius = "15.00";
    } else if (tier === "manual") {
      operator.operatingRadius = "5.00";
    }

    return true;
  }

  // Vehicle management methods
  private vehicles: Vehicle[] = [];
  private nextVehicleId = 1;

  async getOperatorVehicles(operatorId: string): Promise<Vehicle[]> {
    return this.vehicles.filter((v) => v.operatorId === operatorId);
  }

  async getVehicle(vehicleId: string): Promise<Vehicle | undefined> {
    return this.vehicles.find((v) => v.vehicleId === vehicleId);
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const newVehicle: Vehicle = {
      id: this.nextVehicleId++,
      ...vehicle,
      createdAt: new Date(),
    };
    this.vehicles.push(newVehicle);
    return newVehicle;
  }

  async updateVehicle(vehicleId: string, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const vehicle = this.vehicles.find((v) => v.vehicleId === vehicleId);
    if (!vehicle) return undefined;

    Object.assign(vehicle, updates);
    return vehicle;
  }

  async deleteVehicle(vehicleId: string): Promise<boolean> {
    const index = this.vehicles.findIndex((v) => v.vehicleId === vehicleId);
    if (index === -1) return false;
    this.vehicles.splice(index, 1);
    return true;
  }

  async setActiveVehicle(operatorId: string, vehicleId: string): Promise<boolean> {
    // For equipped tier: deactivate all vehicles, then activate the selected one
    const operatorVehicles = this.vehicles.filter((v) => v.operatorId === operatorId);
    
    // Deactivate all vehicles for this operator
    operatorVehicles.forEach((v) => (v.isActive = 0));
    
    // Activate the selected vehicle
    const targetVehicle = this.vehicles.find((v) => v.vehicleId === vehicleId);
    if (!targetVehicle) return false;
    
    targetVehicle.isActive = 1;
    return true;
  }

  // Accepted Jobs - Persistent job tracking
  async getAcceptedJobs(operatorId: string, tier?: string): Promise<AcceptedJob[]> {
    let jobs = this.acceptedJobs.filter((j) => j.operatorId === operatorId);
    if (tier) {
      jobs = jobs.filter((j) => j.tier === tier);
    }
    // Only return active jobs (not completed or cancelled)
    return jobs.filter((j) => j.status === "accepted" || j.status === "in_progress");
  }

  async getAcceptedJob(acceptedJobId: string): Promise<AcceptedJob | undefined> {
    return this.acceptedJobs.find((j) => j.acceptedJobId === acceptedJobId);
  }

  async createAcceptedJob(job: InsertAcceptedJob): Promise<AcceptedJob> {
    const newJob: AcceptedJob = {
      id: this.nextAcceptedJobId++,
      ...job,
      acceptedAt: new Date(),
      startedAt: null,
      completedAt: null,
      cancelledAt: null,
    };
    this.acceptedJobs.push(newJob);
    return newJob;
  }

  async updateAcceptedJobStatus(acceptedJobId: string, status: string): Promise<AcceptedJob | undefined> {
    const job = this.acceptedJobs.find((j) => j.acceptedJobId === acceptedJobId);
    if (!job) return undefined;
    job.status = status;
    return job;
  }

  async updateAcceptedJobProgress(acceptedJobId: string, progress: number): Promise<AcceptedJob | undefined> {
    const job = this.acceptedJobs.find((j) => j.acceptedJobId === acceptedJobId);
    if (!job) return undefined;
    job.progress = progress;
    return job;
  }

  async startAcceptedJob(acceptedJobId: string): Promise<AcceptedJob | undefined> {
    const job = this.acceptedJobs.find((j) => j.acceptedJobId === acceptedJobId);
    if (!job) return undefined;
    job.status = "in_progress";
    job.startedAt = new Date();
    job.progress = 0;
    return job;
  }

  async completeAcceptedJob(acceptedJobId: string, earnings: number): Promise<AcceptedJob | undefined> {
    const job = this.acceptedJobs.find((j) => j.acceptedJobId === acceptedJobId);
    if (!job) return undefined;
    job.status = "completed";
    job.completedAt = new Date();
    job.progress = 100;
    job.actualEarnings = earnings.toString();
    return job;
  }

  async cancelAcceptedJob(acceptedJobId: string, reason: string, cancelledByOperator: boolean): Promise<{ job: AcceptedJob | undefined; penalty?: number }> {
    const job = this.acceptedJobs.find((j) => j.acceptedJobId === acceptedJobId);
    if (!job) return { job: undefined };
    
    job.status = "cancelled";
    job.cancelledAt = new Date();
    job.cancellationReason = reason;
    job.cancelledByOperator = cancelledByOperator ? 1 : 0;
    
    let penalty: number | undefined;
    if (cancelledByOperator && job.progress < 50) {
      // Calculate penalty from budget range or estimated earnings
      const jobData = job.jobData as any;
      const budgetRange = jobData?.budgetRange || "$0";
      const match = budgetRange.match(/\$(\d+)-\$?(\d+)/);
      if (match) {
        const midpoint = (parseInt(match[1]) + parseInt(match[2])) / 2;
        penalty = midpoint;
      }
    }
    
    return { job, penalty };
  }

  async getOperatorActiveJobs(operatorId: string, excludeTier?: string): Promise<AcceptedJob[]> {
    let jobs = this.acceptedJobs.filter(
      (j) => j.operatorId === operatorId && (j.status === "accepted" || j.status === "in_progress")
    );
    if (excludeTier) {
      jobs = jobs.filter((j) => j.tier !== excludeTier);
    }
    return jobs;
  }

  // Earnings & Penalties methods - in-memory implementations
  async getDailyEarnings(operatorId: string, tier: string, date: string): Promise<any | undefined> {
    const key = `${operatorId}-${tier}-${date}`;
    return this.dailyEarnings.get(key);
  }

  async upsertDailyEarnings(operatorId: string, tier: string, date: string, earningsToAdd: number, jobsToAdd: number): Promise<void> {
    const key = `${operatorId}-${tier}-${date}`;
    const existing = this.dailyEarnings.get(key) || { earnings: 0, jobsCompleted: 0 };
    this.dailyEarnings.set(key, {
      earnings: existing.earnings + earningsToAdd,
      jobsCompleted: existing.jobsCompleted + jobsToAdd
    });
  }

  async getMonthlyEarnings(operatorId: string, tier: string, month: string): Promise<any | undefined> {
    const key = `${operatorId}-${tier}-${month}`;
    return this.monthlyEarnings.get(key);
  }

  async upsertMonthlyEarnings(operatorId: string, tier: string, month: string, earningsToAdd: number, jobsToAdd: number): Promise<void> {
    const key = `${operatorId}-${tier}-${month}`;
    const existing = this.monthlyEarnings.get(key) || { earnings: 0, jobsCompleted: 0 };
    this.monthlyEarnings.set(key, {
      earnings: existing.earnings + earningsToAdd,
      jobsCompleted: existing.jobsCompleted + jobsToAdd
    });
  }

  async getTodayEarnings(operatorId: string, tier: string): Promise<{ earnings: number; jobsCompleted: number }> {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const dailyData = await this.getDailyEarnings(operatorId, tier, today);
    return {
      earnings: dailyData?.earnings || 0,
      jobsCompleted: dailyData?.jobsCompleted || 0
    };
  }

  async getMonthEarnings(operatorId: string, tier: string): Promise<{ earnings: number; jobsCompleted: number }> {
    // Get current month in YYYY-MM format
    const month = new Date().toISOString().substring(0, 7);
    const monthlyData = await this.getMonthlyEarnings(operatorId, tier, month);
    return {
      earnings: monthlyData?.earnings || 0,
      jobsCompleted: monthlyData?.jobsCompleted || 0
    };
  }

  async createPenalty(operatorId: string, tier: string, acceptedJobId: string, amount: number, reason: string, progress: number): Promise<void> {
    this.penalties.push({
      operatorId,
      tier,
      acceptedJobId,
      amount,
      reason,
      progress
    });
  }

  async incrementTierJobCount(operatorId: string, tier: string, earnings: number): Promise<void> {
    // This method is a no-op for in-memory storage
    // In database implementation, this would update operatorTierStats table
    // For now, earnings tracking is handled by upsertDailyEarnings/upsertMonthlyEarnings
  }

  async updateTierRating(operatorId: string, tier: string, newRating: number): Promise<void> {
    // This method is a no-op for in-memory storage
    // In database implementation, this would update operatorTierStats table
  }

  // Pricing Configuration methods
  private pricingConfigs: OperatorPricingConfig[] = [];

  async getOperatorPricingConfigs(operatorId: string, tier?: string): Promise<OperatorPricingConfig[]> {
    return this.pricingConfigs.filter(
      (config) => config.operatorId === operatorId && (!tier || config.tier === tier)
    );
  }

  async getPricingConfig(operatorId: string, tier: string, serviceType: string): Promise<OperatorPricingConfig | undefined> {
    return this.pricingConfigs.find(
      (config) => 
        config.operatorId === operatorId && 
        config.tier === tier && 
        config.serviceType === serviceType
    );
  }

  async createPricingConfig(config: InsertOperatorPricingConfig): Promise<OperatorPricingConfig> {
    const newConfig: OperatorPricingConfig = {
      id: this.pricingConfigs.length + 1,
      ...config,
      isActive: config.isActive ?? 1,
      createdAt: new Date(),
      updatedAt: new Date()
    } as OperatorPricingConfig;
    this.pricingConfigs.push(newConfig);
    return newConfig;
  }

  async updatePricingConfig(
    operatorId: string, 
    tier: string, 
    serviceType: string, 
    updates: Partial<InsertOperatorPricingConfig>
  ): Promise<OperatorPricingConfig | undefined> {
    const index = this.pricingConfigs.findIndex(
      (config) => 
        config.operatorId === operatorId && 
        config.tier === tier && 
        config.serviceType === serviceType
    );
    
    if (index === -1) return undefined;
    
    this.pricingConfigs[index] = {
      ...this.pricingConfigs[index],
      ...updates,
      updatedAt: new Date()
    } as OperatorPricingConfig;
    
    return this.pricingConfigs[index];
  }

  // Quote Management methods
  private quotes: OperatorQuote[] = [];

  async createQuote(quote: InsertOperatorQuote): Promise<OperatorQuote> {
    const newQuote: OperatorQuote = {
      id: this.quotes.length + 1,
      ...quote,
      submittedAt: new Date()
    } as OperatorQuote;
    this.quotes.push(newQuote);
    return newQuote;
  }

  async getQuote(quoteId: string): Promise<OperatorQuote | undefined> {
    return this.quotes.find((q) => q.quoteId === quoteId);
  }

  async getQuotesByRequest(serviceRequestId: string): Promise<OperatorQuote[]> {
    return this.quotes.filter((q) => q.serviceRequestId === serviceRequestId);
  }

  async getQuotesByOperator(operatorId: string): Promise<OperatorQuote[]> {
    return this.quotes.filter((q) => q.operatorId === operatorId);
  }

  async updateQuote(quoteId: string, updates: Partial<InsertOperatorQuote>): Promise<OperatorQuote | undefined> {
    const index = this.quotes.findIndex((q) => q.quoteId === quoteId);
    if (index === -1) return undefined;
    
    this.quotes[index] = {
      ...this.quotes[index],
      ...updates
    } as OperatorQuote;
    
    return this.quotes[index];
  }

  async getOperatorQuoteForRequest(operatorId: string, serviceRequestId: string): Promise<OperatorQuote | undefined> {
    return this.quotes.find(
      (q) => q.operatorId === operatorId && q.serviceRequestId === serviceRequestId
    );
  }

  async findAlternativeOperators(serviceRequestId: string, excludeOperatorIds: string[] = []): Promise<Array<Operator & { distanceKm: number }>> {
    // Get the service request to extract location and service type
    const request = this.serviceRequests.find((r) => r.requestId === serviceRequestId);
    if (!request || !request.latitude || !request.longitude) {
      return [];
    }

    const requestLat = parseFloat(request.latitude.toString());
    const requestLon = parseFloat(request.longitude.toString());

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
    const matchingOperators = this.operators.filter((op) => {
      // Exclude already-declined operators
      if (excludeOperatorIds.includes(op.operatorId)) return false;

      // Check if operator offers this service type
      const services = Array.isArray(op.services) ? op.services : [];
      if (!services.includes(request.serviceType)) return false;

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

    return operatorsWithDistance;
  }

  // Wallet Management (in-memory implementation)
  private wallets: Wallet[] = [];
  private walletTransactions: WalletTransaction[] = [];
  private paymentCards: PaymentCard[] = [];
  private nextWalletId = 1;
  private nextTransactionId = 1;
  private nextPaymentCardId = 1;

  async getWallet(userId: number): Promise<Wallet | undefined> {
    return this.wallets.find((w) => w.userId === userId);
  }

  async getOrCreateWallet(userId: number): Promise<Wallet> {
    let wallet = await this.getWallet(userId);
    if (!wallet) {
      wallet = {
        id: this.nextWalletId++,
        userId,
        balance: "0.00",
        pendingBalance: "0.00",
        totalEarnings: "0.00",
        referralCredits: "0.00",
        currency: "CAD",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.wallets.push(wallet);
    }
    return wallet;
  }

  async updateWalletBalance(userId: number, amount: number, type: 'credit' | 'debit'): Promise<Wallet | undefined> {
    const wallet = await this.getOrCreateWallet(userId);
    const currentBalance = parseFloat(wallet.balance);
    const newBalance = type === 'credit' ? currentBalance + amount : currentBalance - amount;
    
    wallet.balance = newBalance.toFixed(2);
    if (type === 'credit') {
      wallet.totalEarnings = (parseFloat(wallet.totalEarnings) + amount).toFixed(2);
    }
    wallet.updatedAt = new Date();
    
    return wallet;
  }

  async getWalletTransactions(userId: number, limit = 50, offset = 0, type?: string, tier?: string): Promise<WalletTransaction[]> {
    let transactions = this.walletTransactions.filter((t) => t.userId === userId);
    
    if (type && type !== 'all') {
      transactions = transactions.filter((t) => t.type === type);
    }
    if (tier && tier !== 'all') {
      transactions = transactions.filter((t) => t.tier === tier);
    }
    
    return transactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
  }

  async createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction> {
    const newTransaction: WalletTransaction = {
      ...transaction,
      id: this.nextTransactionId++,
      createdAt: new Date(),
    };
    this.walletTransactions.push(newTransaction);
    return newTransaction;
  }

  // Payment Cards (in-memory implementation)
  async getPaymentCards(userId: number): Promise<PaymentCard[]> {
    return this.paymentCards
      .filter((c) => c.userId === userId)
      .sort((a, b) => (b.isDefault || 0) - (a.isDefault || 0));
  }

  async getPaymentCard(cardId: number, userId: number): Promise<PaymentCard | undefined> {
    return this.paymentCards.find((c) => c.id === cardId && c.userId === userId);
  }

  async createPaymentCard(card: InsertPaymentCard): Promise<PaymentCard> {
    const newCard: PaymentCard = {
      ...card,
      id: this.nextPaymentCardId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.paymentCards.push(newCard);
    return newCard;
  }

  async updatePaymentCard(cardId: number, userId: number, updates: Partial<InsertPaymentCard>): Promise<PaymentCard | undefined> {
    const index = this.paymentCards.findIndex((c) => c.id === cardId && c.userId === userId);
    if (index === -1) return undefined;
    
    this.paymentCards[index] = {
      ...this.paymentCards[index],
      ...updates,
      updatedAt: new Date(),
    };
    return this.paymentCards[index];
  }

  async deletePaymentCard(cardId: number, userId: number): Promise<boolean> {
    const index = this.paymentCards.findIndex((c) => c.id === cardId && c.userId === userId);
    if (index === -1) return false;
    
    this.paymentCards.splice(index, 1);
    return true;
  }

  async setDefaultPaymentCard(cardId: number, userId: number): Promise<boolean> {
    // First, unset all cards for this user
    this.paymentCards.forEach((c) => {
      if (c.userId === userId) {
        c.isDefault = 0;
      }
    });
    
    // Then set the specified card as default
    const card = this.paymentCards.find((c) => c.id === cardId && c.userId === userId);
    if (!card) return false;
    
    card.isDefault = 1;
    card.updatedAt = new Date();
    return true;
  }
}
