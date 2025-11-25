import type { OperatorTier } from "./schema";

export interface MetricConfig {
  id: string;
  label: string;
  icon: string;
  tiers: OperatorTier[];
  format?: "currency" | "number" | "rating" | "distance";
}

export interface TabConfig {
  id: string;
  label: string;
  icon: string;
  tiers: OperatorTier[];
}

export interface DrawerMenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  tiers: OperatorTier[];
  isPlaceholder?: boolean;
}

export interface ServiceConfig {
  id: string;
  name: string;
  description: string;
  tiers: OperatorTier[];
  requiresCertification?: boolean;
  requiresBusinessLicense?: boolean;
  category: "micro" | "standard" | "professional";
}

export interface EquipmentLimits {
  maxVehicles: number;
  maxHeavyEquipment: number;
  maxToolSets: number;
  allowsFleet: boolean;
  multipleEquipmentPerJob: boolean;
}

export interface TierCapabilities {
  tier: OperatorTier;
  label: string;
  description: string;
  badge: string;
  radiusKm: number | null;
  radiusMax: number;
  gamifiedRadiusIncrease: boolean;
  equipmentLimits: EquipmentLimits;
  features: {
    scheduledJobs: boolean;
    jobFiltering: boolean;
    driverManagement: boolean;
    fleetManagement: boolean;
    jobAssignment: boolean;
    performanceTracking: boolean;
    auditLogs: boolean;
    businessAnalytics: boolean;
    driverPayroll: boolean;
    customerGroups: boolean;
  };
}

export const TIER_CAPABILITIES: Record<OperatorTier, TierCapabilities> = {
  manual: {
    tier: "manual",
    label: "Manual Operator",
    description: "Operators with hand tools and limited mobility, providing micro-services within a small radius",
    badge: "⛏️",
    radiusKm: 5,
    radiusMax: 8,
    gamifiedRadiusIncrease: true,
    equipmentLimits: {
      maxVehicles: 0,
      maxHeavyEquipment: 0,
      maxToolSets: 10,
      allowsFleet: false,
      multipleEquipmentPerJob: false,
    },
    features: {
      scheduledJobs: false,
      jobFiltering: false,
      driverManagement: false,
      fleetManagement: false,
      jobAssignment: false,
      performanceTracking: false,
      auditLogs: false,
      businessAnalytics: false,
      driverPayroll: false,
      customerGroups: true,
    },
  },
  equipped: {
    tier: "equipped",
    label: "Skilled & Equipped",
    description: "Operators with equipment and skills, including vehicles and heavy equipment",
    badge: "🚛",
    radiusKm: 15,
    radiusMax: 50,
    gamifiedRadiusIncrease: false,
    equipmentLimits: {
      maxVehicles: 3,
      maxHeavyEquipment: 3,
      maxToolSets: 20,
      allowsFleet: false,
      multipleEquipmentPerJob: false,
    },
    features: {
      scheduledJobs: true,
      jobFiltering: true,
      driverManagement: false,
      fleetManagement: false,
      jobAssignment: false,
      performanceTracking: true,
      auditLogs: false,
      businessAnalytics: false,
      driverPayroll: false,
      customerGroups: true,
    },
  },
  professional: {
    tier: "professional",
    label: "Professional Operator",
    description: "Registered businesses with fleets, multiple drivers, and licensed services",
    badge: "🏆",
    radiusKm: null,
    radiusMax: 999,
    gamifiedRadiusIncrease: false,
    equipmentLimits: {
      maxVehicles: 999,
      maxHeavyEquipment: 999,
      maxToolSets: 999,
      allowsFleet: true,
      multipleEquipmentPerJob: true,
    },
    features: {
      scheduledJobs: true,
      jobFiltering: true,
      driverManagement: true,
      fleetManagement: true,
      jobAssignment: true,
      performanceTracking: true,
      auditLogs: true,
      businessAnalytics: true,
      driverPayroll: true,
      customerGroups: true,
    },
  },
};

export const DASHBOARD_METRICS: MetricConfig[] = [
  { id: "dailyEarnings", label: "Today's Earnings", icon: "DollarSign", tiers: ["manual", "equipped", "professional"], format: "currency" },
  { id: "jobsNearby", label: "Jobs Nearby", icon: "MapPin", tiers: ["manual", "equipped", "professional"], format: "number" },
  { id: "activeJobs", label: "Active Jobs", icon: "Briefcase", tiers: ["manual", "equipped", "professional"], format: "number" },
  { id: "completedToday", label: "Completed Today", icon: "CheckCircle", tiers: ["manual", "equipped", "professional"], format: "number" },
  { id: "rating", label: "Rating", icon: "Star", tiers: ["manual", "equipped", "professional"], format: "rating" },
  { id: "equipmentStatus", label: "Equipment Status", icon: "Wrench", tiers: ["equipped", "professional"], format: "number" },
  { id: "driversActive", label: "Drivers Active", icon: "Users", tiers: ["professional"], format: "number" },
  { id: "fleetCount", label: "Fleet Count", icon: "Truck", tiers: ["professional"], format: "number" },
  { id: "radiusLimit", label: "Operating Radius", icon: "Target", tiers: ["manual"], format: "distance" },
];

export const DASHBOARD_TABS: TabConfig[] = [
  { id: "jobs", label: "Jobs", icon: "Briefcase", tiers: ["manual", "equipped", "professional"] },
  { id: "equipment", label: "Equipment", icon: "Wrench", tiers: ["manual", "equipped", "professional"] },
  { id: "services", label: "Services", icon: "Settings", tiers: ["manual", "equipped", "professional"] },
  { id: "history", label: "History", icon: "Clock", tiers: ["manual", "equipped", "professional"] },
  { id: "manpower", label: "Manpower", icon: "Users", tiers: ["professional"] },
];

export const DRAWER_MENU_ITEMS: DrawerMenuItem[] = [
  { id: "wallet", label: "Wallet", icon: "Wallet", path: "/wallet", tiers: ["manual", "equipped", "professional"] },
  { id: "payments", label: "Payments", icon: "CreditCard", path: "/payments", tiers: ["manual", "equipped", "professional"] },
  { id: "help", label: "Help & Support", icon: "HelpCircle", path: "/help", tiers: ["manual", "equipped", "professional"] },
  { id: "settings", label: "Settings", icon: "Settings", path: "/settings", tiers: ["manual", "equipped", "professional"] },
  { id: "legal", label: "Legal & Policies", icon: "FileText", path: "/legal", tiers: ["manual", "equipped", "professional"] },
  { id: "driverPayroll", label: "Driver Payroll", icon: "DollarSign", path: "/payroll", tiers: ["professional"], isPlaceholder: true },
  { id: "analytics", label: "Business Analytics", icon: "BarChart3", path: "/analytics", tiers: ["professional"], isPlaceholder: true },
];

export const TIER_SERVICES: ServiceConfig[] = [
  { id: "snow_shoveling", name: "Snow Shoveling", description: "Manual snow removal from driveways and walkways", tiers: ["manual", "equipped", "professional"], category: "micro" },
  { id: "lawn_maintenance", name: "Lawn Maintenance", description: "Basic lawn care and mowing", tiers: ["manual", "equipped", "professional"], category: "micro" },
  { id: "window_cleaning", name: "Window Cleaning", description: "Residential and commercial window cleaning", tiers: ["manual", "equipped", "professional"], category: "micro" },
  { id: "yard_cleanup", name: "Yard Cleanup", description: "General yard cleanup and debris removal", tiers: ["manual", "equipped", "professional"], category: "micro" },
  { id: "debris_removal", name: "Debris Removal", description: "Light debris and waste removal", tiers: ["manual", "equipped", "professional"], category: "micro" },
  { id: "local_errands", name: "Local Errands", description: "Helping with moving, truck loading, and local tasks", tiers: ["manual", "equipped", "professional"], category: "micro" },
  
  { id: "snow_plowing", name: "Snow Plowing", description: "Vehicle-mounted snow plowing services", tiers: ["equipped", "professional"], category: "standard" },
  { id: "towing", name: "Towing", description: "Vehicle towing and roadside assistance", tiers: ["equipped", "professional"], category: "standard" },
  { id: "hauling", name: "Hauling", description: "Material and equipment hauling", tiers: ["equipped", "professional"], category: "standard" },
  { id: "courier", name: "Courier Services", description: "Package and document delivery", tiers: ["equipped", "professional"], category: "standard" },
  { id: "drywall", name: "Drywall", description: "Drywall installation and repair", tiers: ["equipped", "professional"], category: "standard" },
  { id: "framing", name: "Framing", description: "Structural framing work", tiers: ["equipped", "professional"], category: "standard" },
  { id: "basic_home_repairs", name: "Basic Home Repairs", description: "General home maintenance and repairs", tiers: ["equipped", "professional"], category: "standard" },
  { id: "carpentry", name: "Carpentry", description: "Custom woodworking and carpentry", tiers: ["equipped", "professional"], category: "standard" },
  { id: "light_plumbing", name: "Light Plumbing", description: "Basic plumbing repairs", tiers: ["equipped", "professional"], requiresCertification: true, category: "standard" },
  { id: "electrician", name: "Electrician Services", description: "Basic electrical work", tiers: ["equipped", "professional"], requiresCertification: true, category: "standard" },
  
  { id: "roofing", name: "Roofing", description: "Roof installation and repair", tiers: ["professional"], requiresBusinessLicense: true, category: "professional" },
  { id: "licensed_plumbing", name: "Licensed Plumbing", description: "Full plumbing services", tiers: ["professional"], requiresBusinessLicense: true, requiresCertification: true, category: "professional" },
  { id: "licensed_electrical", name: "Licensed Electrical", description: "Full electrical services", tiers: ["professional"], requiresBusinessLicense: true, requiresCertification: true, category: "professional" },
  { id: "welding", name: "Welding", description: "Professional welding services", tiers: ["professional"], requiresCertification: true, category: "professional" },
  { id: "restoration", name: "Restoration", description: "Property restoration services", tiers: ["professional"], requiresBusinessLicense: true, category: "professional" },
  { id: "full_construction", name: "Full Construction", description: "General contracting and construction", tiers: ["professional"], requiresBusinessLicense: true, category: "professional" },
  { id: "heavy_hauling", name: "Heavy Hauling", description: "Commercial and heavy equipment hauling", tiers: ["professional"], category: "professional" },
];

export const EQUIPMENT_TYPES = {
  tools: [
    { id: "shovel", name: "Shovel", category: "snow", tiers: ["manual", "equipped", "professional"] },
    { id: "snow_blower", name: "Snow Blower", category: "snow", tiers: ["manual", "equipped", "professional"] },
    { id: "lawn_mower", name: "Lawn Mower", category: "lawn", tiers: ["manual", "equipped", "professional"] },
    { id: "rake", name: "Rake", category: "lawn", tiers: ["manual", "equipped", "professional"] },
    { id: "trimmer", name: "Trimmer", category: "lawn", tiers: ["manual", "equipped", "professional"] },
    { id: "window_squeegee", name: "Window Squeegee", category: "cleaning", tiers: ["manual", "equipped", "professional"] },
    { id: "pressure_washer", name: "Pressure Washer", category: "cleaning", tiers: ["equipped", "professional"] },
    { id: "power_tools", name: "Power Tools Set", category: "tools", tiers: ["equipped", "professional"] },
    { id: "welding_kit", name: "Welding Kit", category: "tools", tiers: ["professional"] },
  ],
  vehicles: [
    { id: "pickup_truck", name: "Pickup Truck", category: "vehicle", tiers: ["equipped", "professional"] },
    { id: "cargo_van", name: "Cargo Van", category: "vehicle", tiers: ["equipped", "professional"] },
    { id: "box_truck", name: "Box Truck", category: "vehicle", tiers: ["equipped", "professional"] },
    { id: "flatbed_truck", name: "Flatbed Truck", category: "vehicle", tiers: ["equipped", "professional"] },
    { id: "tow_truck", name: "Tow Truck", category: "vehicle", tiers: ["equipped", "professional"] },
    { id: "dump_truck", name: "Dump Truck", category: "vehicle", tiers: ["professional"] },
    { id: "semi_truck", name: "Semi Truck", category: "vehicle", tiers: ["professional"] },
  ],
  heavyEquipment: [
    { id: "snow_plow_attachment", name: "Snow Plow Attachment", category: "attachment", tiers: ["equipped", "professional"] },
    { id: "salt_spreader", name: "Salt Spreader", category: "attachment", tiers: ["equipped", "professional"] },
    { id: "trailer", name: "Trailer", category: "equipment", tiers: ["equipped", "professional"] },
    { id: "aerator", name: "Aerator", category: "equipment", tiers: ["equipped", "professional"] },
    { id: "excavator", name: "Excavator", category: "equipment", tiers: ["professional"] },
    { id: "bobcat", name: "Bobcat/Skid Steer", category: "equipment", tiers: ["professional"] },
  ],
};

export const EQUIPMENT_STATUSES = ["active", "maintenance", "reserved", "inactive"] as const;
export type EquipmentStatus = typeof EQUIPMENT_STATUSES[number];

export function getMetricsForTier(tier: OperatorTier): MetricConfig[] {
  return DASHBOARD_METRICS.filter(metric => metric.tiers.includes(tier));
}

export function getTabsForTier(tier: OperatorTier): TabConfig[] {
  return DASHBOARD_TABS.filter(tab => tab.tiers.includes(tier));
}

export function getDrawerMenuForTier(tier: OperatorTier): DrawerMenuItem[] {
  return DRAWER_MENU_ITEMS.filter(item => item.tiers.includes(tier));
}

export function getServicesForTier(tier: OperatorTier): ServiceConfig[] {
  return TIER_SERVICES.filter(service => service.tiers.includes(tier));
}

export function getEquipmentForTier(tier: OperatorTier, category: keyof typeof EQUIPMENT_TYPES) {
  return EQUIPMENT_TYPES[category].filter(item => item.tiers.includes(tier));
}

export function canAccessFeature(tier: OperatorTier, feature: keyof TierCapabilities["features"]): boolean {
  return TIER_CAPABILITIES[tier].features[feature];
}
