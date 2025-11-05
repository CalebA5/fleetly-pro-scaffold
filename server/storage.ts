import type { 
  Job, InsertJob, UpdateJob, 
  Operator, InsertOperator,
  ServiceRequest, InsertServiceRequest,
  Customer, InsertCustomer
} from "@shared/schema";

export interface IStorage {
  getJobs(customerId?: string): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  getJobByNumber(jobNumber: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: UpdateJob): Promise<Job | undefined>;
  getOperators(service?: string): Promise<Operator[]>;
  getOperator(id: number): Promise<Operator | undefined>;
  getNearbyOperators(lat: number, lon: number, radiusMiles?: number): Promise<Operator[]>;
  getServiceRequests(customerId?: string): Promise<ServiceRequest[]>;
  getServiceRequest(id: number): Promise<ServiceRequest | undefined>;
  getServiceRequestByRequestId(requestId: string): Promise<ServiceRequest | undefined>;
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  updateServiceRequest(id: number, status: string, respondedAt?: Date): Promise<ServiceRequest | undefined>;
  getCustomer(customerId: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(customerId: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
}

export class MemStorage implements IStorage {
  private jobs: Job[] = [];
  private operators: Operator[] = [];
  private serviceRequests: ServiceRequest[] = [];
  private customers: Customer[] = [];
  private nextJobId = 1;
  private nextOperatorId = 1;
  private nextServiceRequestId = 1;
  private nextCustomerId = 1;

  constructor() {
    this.seedSampleData();
  }

  private seedSampleData() {
    this.seedOperators();
    this.seedJobs();
    this.seedCustomers();
  }

  private seedOperators() {
    const sampleOperators: Operator[] = [
      {
        id: this.nextOperatorId++,
        operatorId: "OP-001",
        name: "Mike's Snow Service",
        rating: "4.9",
        totalJobs: 234,
        services: ["Snow Plowing", "Ice Removal"],
        vehicle: "2023 Ford F-350 with V-Plow",
        licensePlate: "SNW-123",
        phone: "(555) 123-4567",
        email: "mike@snowservice.com",
        latitude: "40.7580",
        longitude: "-73.9855",
        address: "Manhattan, NY",
        isOnline: 1,
        hourlyRate: "95.00",
        availability: "available",
        photo: null,
        createdAt: new Date(),
      },
      {
        id: this.nextOperatorId++,
        operatorId: "OP-002",
        name: "QuickTow Express",
        rating: "4.7",
        totalJobs: 189,
        services: ["Towing", "Roadside Assistance"],
        vehicle: "2022 Chevy Silverado 3500 Tow Truck",
        licensePlate: "TOW-456",
        phone: "(555) 234-5678",
        email: "dispatch@quicktow.com",
        latitude: "40.7489",
        longitude: "-73.9680",
        address: "Queens, NY",
        isOnline: 1,
        hourlyRate: "125.00",
        availability: "available",
        photo: null,
        createdAt: new Date(),
      },
      {
        id: this.nextOperatorId++,
        operatorId: "OP-003",
        name: "Heavy Lift Hauling",
        rating: "4.8",
        totalJobs: 156,
        services: ["Hauling", "Debris Removal", "Moving"],
        vehicle: "2021 Ram 5500 Dump Truck",
        licensePlate: "HVY-789",
        phone: "(555) 345-6789",
        email: "contact@heavylift.com",
        latitude: "40.7306",
        longitude: "-73.9352",
        address: "Brooklyn, NY",
        isOnline: 1,
        hourlyRate: "110.00",
        availability: "available",
        photo: null,
        createdAt: new Date(),
      },
      {
        id: this.nextOperatorId++,
        operatorId: "OP-004",
        name: "FastTrack Delivery",
        rating: "4.9",
        totalJobs: 421,
        services: ["Courier", "Same-Day Delivery"],
        vehicle: "2023 Ford Transit Van",
        licensePlate: "FTD-321",
        phone: "(555) 456-7890",
        email: "courier@fasttrack.com",
        latitude: "40.7614",
        longitude: "-73.9776",
        address: "Midtown Manhattan, NY",
        isOnline: 1,
        hourlyRate: "65.00",
        availability: "available",
        photo: null,
        createdAt: new Date(),
      },
      {
        id: this.nextOperatorId++,
        operatorId: "OP-005",
        name: "AllSeason Plowing",
        rating: "4.6",
        totalJobs: 198,
        services: ["Snow Plowing", "Landscaping"],
        vehicle: "2020 GMC Sierra 2500 with Plow",
        licensePlate: "PLW-654",
        phone: "(555) 567-8901",
        email: "service@allseason.com",
        latitude: "40.7829",
        longitude: "-73.9654",
        address: "Upper West Side, NY",
        isOnline: 0,
        hourlyRate: "85.00",
        availability: "busy",
        photo: null,
        createdAt: new Date(),
      },
    ];

    this.operators.push(...sampleOperators);
  }

  private seedJobs() {
    const sampleJob: Job = {
      id: this.nextJobId++,
      jobNumber: "JOB-2024-001",
      service: "Snow Plowing",
      customerId: "CUST-001",
      customerName: "John Doe",
      operatorId: "OP-001",
      operatorName: "Mike's Snow Service",
      operatorRating: "4.8",
      operatorPhone: "(555) 123-4567",
      operatorVehicle: "2023 Ford F-350 with V-Plow",
      operatorLicensePlate: "SNW-123",
      status: "en_route",
      progress: 45,
      location: "123 Main Street, Springfield",
      estimatedArrival: "15 minutes",
      estimatedCompletion: "30 minutes",
      estimatedTotal: "95.00",
      actualTotal: null,
      jobSteps: [
        { step: "Job Created", completed: true, time: "2:30 PM" },
        { step: "Operator Assigned", completed: true, time: "2:32 PM" },
        { step: "En Route", completed: true, time: "2:45 PM", current: true },
        { step: "Arrived", completed: false, time: "Est. 3:00 PM" },
        { step: "Work Started", completed: false, time: "TBD" },
        { step: "Work Completed", completed: false, time: "TBD" },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.push(sampleJob);
  }

  private seedCustomers() {
    const sampleCustomer: Customer = {
      id: this.nextCustomerId++,
      customerId: "CUST-001",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "(555) 987-6543",
      address: "123 Main Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      photo: null,
      createdAt: new Date(),
    };
    this.customers.push(sampleCustomer);
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
    const newRequest: ServiceRequest = {
      id: this.nextServiceRequestId++,
      requestId: request.requestId,
      customerId: request.customerId,
      customerName: request.customerName,
      operatorId: request.operatorId,
      operatorName: request.operatorName,
      service: request.service,
      status: request.status || "pending",
      location: request.location,
      notes: request.notes || null,
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
}
