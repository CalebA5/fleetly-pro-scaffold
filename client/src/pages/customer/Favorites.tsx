import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/enhanced-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Heart, Star, MapPin, Truck, ArrowLeft, Trash2 } from "lucide-react";
import type { Operator, Favorite } from "@shared/schema";
import { OPERATOR_TIER_INFO } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

const CUSTOMER_ID = "CUST-001";

export const Favorites = () => {
  const { toast } = useToast();

  // Fetch customer's favorites
  const { data: favorites = [], isLoading: favoritesLoading } = useQuery<Favorite[]>({
    queryKey: [`/api/favorites/${CUSTOMER_ID}`],
  });

  // Fetch all operators
  const { data: allOperators = [], isLoading: operatorsLoading } = useQuery<Operator[]>({
    queryKey: ['/api/operators'],
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async (operatorId: string) => {
      await apiRequest(`/api/favorites/${CUSTOMER_ID}/${operatorId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${CUSTOMER_ID}`] });
      toast({
        title: "Removed from Favorites",
        description: "Operator removed from your favorites",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      });
    },
  });

  // Filter operators to show only favorites
  const favoriteOperators = allOperators.filter(op => 
    favorites.some(fav => fav.operatorId === op.operatorId)
  );

  const isLoading = favoritesLoading || operatorsLoading;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pb-20 md:pb-0">
      <Header />

      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/customer" data-testid="link-back">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
                <Heart className="w-6 h-6 fill-red-500 text-red-500" />
                My Favorites
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {favoriteOperators.length} {favoriteOperators.length === 1 ? 'operator' : 'operators'} saved
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
            </div>
          ) : favoriteOperators.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                No Favorites Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Start adding operators to your favorites to quickly access them later!
              </p>
              <Link href="/customer/operators" data-testid="link-browse-operators">
                <Button className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black">
                  Browse Operators
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteOperators.map((operator) => {
                const tier = operator.operatorTier || "professional";
                const tierInfo = OPERATOR_TIER_INFO[tier as keyof typeof OPERATOR_TIER_INFO];
                const tierColors = {
                  professional: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700",
                  equipped: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700",
                  manual: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700",
                };

                return (
                  <Card
                    key={operator.operatorId}
                    className="p-4 dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow"
                    data-testid={`card-favorite-${operator.operatorId}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-black dark:text-white">{operator.name}</h3>
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-medium border ${tierColors[tier as keyof typeof tierColors]}`}
                          >
                            {tierInfo.badge} {tier === "professional" ? "Pro" : tier === "equipped" ? "Equipped" : "Manual"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold text-black dark:text-white">{operator.rating}</span>
                          </div>
                          <span className="text-gray-500 dark:text-gray-400">•</span>
                          <span className="text-gray-600 dark:text-gray-400">{operator.totalJobs} jobs</span>
                        </div>
                      </div>
                      <Badge variant={operator.isOnline ? "default" : "secondary"} className={operator.isOnline ? "bg-green-500 dark:bg-green-600" : ""}>
                        {operator.isOnline ? "Online" : "Offline"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {(operator.services as string[]).slice(0, 3).map((service, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs dark:border-gray-600">
                          {service}
                        </Badge>
                      ))}
                      {(operator.services as string[]).length > 3 && (
                        <Badge variant="outline" className="text-xs dark:border-gray-600">
                          +{(operator.services as string[]).length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Truck className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{operator.vehicle}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{operator.address}</span>
                      </div>
                      {operator.hourlyRate && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-black dark:text-white">${operator.hourlyRate}/hr</span>
                          {tierInfo.pricingMultiplier !== 1.0 && (
                            <span className="text-orange-600 dark:text-orange-400 text-xs">
                              {tierInfo.pricingMultiplier}x price
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/customer/operators`} className="flex-1" data-testid={`link-view-${operator.operatorId}`}>
                        <Button
                          className="w-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                          size="sm"
                        >
                          View on Map
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFavoriteMutation.mutate(operator.operatorId)}
                        disabled={removeFavoriteMutation.isPending}
                        className="hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-500 hover:text-red-600"
                        data-testid={`button-remove-${operator.operatorId}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};
