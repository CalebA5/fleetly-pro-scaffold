import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/enhanced-button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign, Users, Snowflake, AlertCircle, CheckCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";

interface ServiceRequest {
  id: number;
  requestId: string;
  customerName: string;
  serviceType: string;
  location: string;
  description: string;
  isEmergency: number;
  budgetRange: string;
  distance?: number; // Distance from operator's home in km
}

interface CustomerGroup {
  id: string;
  location: string;
  customerCount: number;
  totalValue: string;
  customers: Array<{
    name: string;
    address: string;
    service: string;
  }>;
  distance: number;
  expiresIn: number; // minutes
}

export default function ManualOperatorDashboard() {
  const { user } = useAuth();
  const [acceptedJobs, setAcceptedJobs] = useState<number[]>([]);

  // Mock data for customer grouping - in production, this would come from backend
  const mockCustomerGroups: CustomerGroup[] = [
    {
      id: "CG-001",
      location: "Oak Street Area",
      customerCount: 4,
      totalValue: "$180-240",
      customers: [
        { name: "John Smith", address: "123 Oak St", service: "Driveway snow removal" },
        { name: "Mary Johnson", address: "125 Oak St", service: "Walkway clearing" },
        { name: "Bob Wilson", address: "127 Oak St", service: "Driveway & walkway" },
        { name: "Sarah Davis", address: "131 Oak St", service: "Full property clearing" },
      ],
      distance: 1.2,
      expiresIn: 45,
    },
    {
      id: "CG-002",
      location: "Maple Avenue",
      customerCount: 3,
      totalValue: "$120-180",
      customers: [
        { name: "Tom Brown", address: "456 Maple Ave", service: "Driveway clearing" },
        { name: "Lisa Green", address: "458 Maple Ave", service: "Walkway & steps" },
        { name: "Mike Taylor", address: "462 Maple Ave", service: "Driveway snow removal" },
      ],
      distance: 2.8,
      expiresIn: 30,
    },
  ];

  // Use operator-specific endpoint that filters by tier and radius
  const operatorId = user?.operatorId || "OP-MANUAL-001";
  
  const { data: nearbySnowRequests = [], isLoading } = useQuery<ServiceRequest[]>({
    queryKey: [`/api/service-requests/for-operator/${operatorId}`],
    enabled: !!operatorId,
  });

  const handleAcceptJob = (requestId: number) => {
    setAcceptedJobs([...acceptedJobs, requestId]);
    // In production, send accept request to backend
  };

  const handleAcceptGroup = (groupId: string) => {
    // In production, send bulk accept to backend
    alert(`Accepted all ${mockCustomerGroups.find(g => g.id === groupId)?.customerCount} customers in group!`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-16 md:pb-0">
      <Header
        onSignIn={() => {}}
        onSignUp={() => {}}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section with Plow to Earn Branding */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Snowflake className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white">
                Plow to Earn Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manual Operator • 5km Operating Radius
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Today's Earnings</p>
                  <p className="text-2xl font-bold text-black dark:text-white">$0</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Jobs Nearby</p>
                  <p className="text-2xl font-bold text-black dark:text-white">{nearbySnowRequests.length}</p>
                </div>
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Customer Groups</p>
                  <p className="text-2xl font-bold text-black dark:text-white">{mockCustomerGroups.length}</p>
                </div>
                <Users className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed Today</p>
                  <p className="text-2xl font-bold text-black dark:text-white">0</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Grouping Section - PRIORITY for manual operators */}
        <div className="mb-8">
          <Card className="border-2 border-orange-200 dark:border-orange-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-black dark:text-white">
                      Nearby Customer Groups
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Accept multiple customers in the same area for maximum efficiency
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-orange-500 text-white">
                  BOOST EARNINGS
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockCustomerGroups.length > 0 ? (
                mockCustomerGroups.map((group) => (
                  <div
                    key={group.id}
                    className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-orange-500 dark:hover:border-orange-500 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-black dark:text-white">
                            {group.location}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {group.customerCount} customers
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {group.distance}km away
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {group.totalValue}
                          </span>
                          <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                            <Clock className="w-4 h-4" />
                            Expires in {group.expiresIn}min
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAcceptGroup(group.id)}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        data-testid={`button-accept-group-${group.id}`}
                      >
                        Accept All
                      </Button>
                    </div>
                    
                    {/* Customer list */}
                    <div className="space-y-2">
                      {group.customers.map((customer, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              {customer.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-black dark:text-white truncate">
                              {customer.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                              {customer.address}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {customer.service}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-500">
                    No customer groups available yet. Check back soon!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Individual Jobs Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-black dark:text-white">
              Individual Jobs Nearby
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Snow plowing requests within 5km of your home
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                ))}
              </div>
            ) : nearbySnowRequests.length > 0 ? (
              <div className="space-y-3">
                {nearbySnowRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-orange-500 dark:hover:border-orange-500 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-black dark:text-white">
                            {request.customerName}
                          </h3>
                          {request.isEmergency === 1 && (
                            <Badge className="bg-red-500 text-white">
                              Emergency
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {request.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {request.location}
                            {request.distance && ` (${request.distance}km)`}
                          </span>
                          {request.budgetRange && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {request.budgetRange}
                            </span>
                          )}
                        </div>
                      </div>
                      {acceptedJobs.includes(request.id) ? (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accepted
                        </Badge>
                      ) : (
                        <Button
                          onClick={() => handleAcceptJob(request.id)}
                          className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
                          data-testid={`button-accept-${request.id}`}
                        >
                          Accept Job
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Snowflake className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                  No Jobs Available
                </h3>
                <p className="text-gray-500 dark:text-gray-500 max-w-md mx-auto">
                  There are no snow plowing jobs within 5km of your home right now. Check back after the next snowfall!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Operating Radius Info */}
        <div className="mt-6">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-black dark:text-white mb-1">
                    Operating Radius: 5km
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    As a manual operator, you can only accept jobs within 5 kilometers of your registered home address. This ensures efficient service delivery and prevents operator clashing in neighborhoods.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
