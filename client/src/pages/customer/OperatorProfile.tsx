import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { ArrowLeft, Star, MapPin, Phone, Truck, Wrench, Award } from "lucide-react";
import { OPERATOR_TIER_INFO, type Operator } from "@shared/schema";
import { format } from "date-fns";

export const OperatorProfile = () => {
  const { operatorId } = useParams<{ operatorId: string }>();
  const [, setLocation] = useLocation();

  const { data: operator, isLoading } = useQuery<Operator>({
    queryKey: [`/api/operators/by-id/${operatorId}`],
    enabled: !!operatorId,
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 dark:fill-gray-700 text-gray-200 dark:text-gray-700"
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header onSignIn={() => {}} onSignUp={() => {}} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header onSignIn={() => {}} onSignUp={() => {}} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600 dark:text-gray-400">Operator not found</p>
              <div className="flex justify-center mt-4">
                <Button onClick={() => setLocation("/customer/operators")}>
                  Back to Operators
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const tierInfo = OPERATOR_TIER_INFO[operator.activeTier || operator.operatorTier || "manual"];
  const rating = parseFloat(operator.rating || "0");

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-16">
      <Header onSignIn={() => {}} onSignUp={() => {}} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setLocation("/customer/operators")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Operators
        </Button>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardHeader className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
            <div className="flex items-start gap-6">
              {operator.photo ? (
                <img 
                  src={operator.photo} 
                  alt={operator.name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-orange-200 dark:ring-orange-800"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg flex-shrink-0">
                  {operator.name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-black dark:text-white mb-2">{operator.name}</h1>
                <div className="flex items-center gap-3 mb-3">
                  {renderStars(rating)}
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {operator.rating || "0.00"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <span className="mr-1">{tierInfo.badge}</span>
                    {tierInfo.label}
                  </Badge>
                  {operator.isOnline === 1 && (
                    <Badge className="bg-green-500 text-white">
                      Online
                    </Badge>
                  )}
                  {operator.isCertified === 1 && (
                    <Badge variant="outline">
                      <Award className="w-3 h-3 mr-1" />
                      Certified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">{operator.address || "Not specified"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">{operator.phone || "Hidden until booking"}</span>
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            {operator.vehicle && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Equipment</h3>
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">{operator.vehicle}</span>
                  {operator.licensePlate && (
                    <Badge variant="outline">{operator.licensePlate}</Badge>
                  )}
                </div>
                {operator.equipmentInventory && Array.isArray(operator.equipmentInventory) && operator.equipmentInventory.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {operator.equipmentInventory.map((item: any, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        <Wrench className="w-3 h-3 mr-1" />
                        {item.displayName || item}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Services */}
            {operator.services && Array.isArray(operator.services) && operator.services.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Services Offered</h3>
                <div className="flex flex-wrap gap-2">
                  {operator.services.map((service: string) => (
                    <Badge key={service} variant="outline" className="text-sm">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setLocation(`/customer/create-request?operatorId=${operator.operatorId}&operatorName=${encodeURIComponent(operator.name)}`)}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Request Service
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
