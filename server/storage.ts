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
  OperatorTierStats, InsertOperatorTierStats
} from "@shared/schema";

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
      return this.serviceRequests.filter((sr) => sr.customerId === customerId);
    }
    return this.serviceRequests;
  }

  async getServiceRequest(id: number): Promise<ServiceRequest | undefined> {
    return this.serviceRequests.find((sr) => sr.id === id);
  }

  async getServiceRequestByRequestId(requestId: string): Promise<ServiceRequest | undefined> {
    return this.serviceRequests.find((sr) => sr.requestId === requestId);
  }

  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const now = new Date();
    
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
    
    const newRequest: ServiceRequest = {
      id: this.nextServiceRequestId++,
      requestId: request.requestId,
      customerId: request.customerId,
      customerName: request.customerName,
      operatorId: request.operatorId || null,
      operatorName: request.operatorName || null,
      serviceType: request.serviceType,
      isEmergency: request.isEmergency ? 1 : 0,
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
      requestedAt: now,
      respondedAt: null,
    };
    this.serviceRequests.push(newRequest);
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
}
