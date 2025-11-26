import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Heart, MapPin, Phone, Truck, Award, Wrench } from "lucide-react";
import { OPERATOR_TIER_INFO, type OperatorTier } from "@shared/schema";
import { useLocation } from "wouter";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

type OperatorCard = {
  cardId: string;
  tierType: "professional" | "equipped_manual";
  includedTiers: string[];
  isActive: boolean;
  operatorId: string;
  name: string;
  email: string;
  phone: string;
  photo: string | null;
  latitude: string;
  longitude: string;
  address: string;
  isOnline: number;
  hourlyRate: string;
  availability: string;
  activeTier: OperatorTier;
  subscribedTiers: OperatorTier[];
  services: string[];
  vehicle: string;
  licensePlate: string;
  equipmentInventory: any[];
  primaryVehicleImage: string | null;
  totalJobs: number;
  rating: string;
  recentReviews: Array<{
    ratingId: string;
    customerId: string;
    rating: number;
    review: string | null;
    createdAt: Date;
  }>;
  reviewCount: number;
};

type OperatorTileProps = {
  operator: OperatorCard;
  isFavorite?: boolean;
  onFavoriteToggle?: (operatorId: string, isFavorite: boolean) => void;
  isSelf?: boolean;
};

export function OperatorTile({ operator, isFavorite = false, onFavoriteToggle, isSelf: isSelfProp }: OperatorTileProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showReviews, setShowReviews] = useState(false);
  const { user } = useAuth();
  const customerId = user?.id || "";
  
  // Self-detection: prevent users from interacting with their own operator card
  const isSelf = isSelfProp ?? (user?.operatorId && operator.operatorId === user.operatorId);
  
  const favoriteMutation = useMutation({
    mutationFn: async (data: { operatorId: string; customerId: string; isFavorite: boolean }) => {
      if (data.isFavorite) {
        return apiRequest(`/api/favorites/${data.operatorId}`, {
          method: "DELETE"
        });
      } else {
        return apiRequest("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            customerId: data.customerId, 
            operatorId: data.operatorId 
          })
        });
      }
    },
    onSuccess: () => {
      // Invalidate both general and customer-specific favorites caches
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${customerId}`] });
      if (onFavoriteToggle) {
        onFavoriteToggle(operator.operatorId, !isFavorite);
      }
      toast({
        title: isFavorite ? "Removed from favorites" : "Added to favorites",
        description: `${operator.name} ${isFavorite ? "removed from" : "added to"} your favorites.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRequestService = () => {
    setLocation(`/customer/create-request?operatorId=${operator.operatorId}&operatorName=${encodeURIComponent(operator.name)}`);
  };

  const handleToggleFavorite = () => {
    if (!customerId) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add favorites.",
        variant: "destructive",
      });
      return;
    }
    favoriteMutation.mutate({ 
      operatorId: operator.operatorId, 
      customerId,
      isFavorite 
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 dark:fill-gray-700 text-gray-200 dark:text-gray-700"
            }`}
          />
        ))}
      </div>
    );
  };

  // Get tier info for display
  const getTierDisplay = () => {
    if (operator.tierType === "professional") {
      return {
        badge: OPERATOR_TIER_INFO.professional.badge,
        label: OPERATOR_TIER_INFO.professional.label,
        tier: "professional" as OperatorTier
      };
    } else {
      // For equipped_manual, show the tiers included
      const badges = operator.includedTiers.map(t => OPERATOR_TIER_INFO[t as OperatorTier].badge).join(" + ");
      const labels = operator.includedTiers.map(t => OPERATOR_TIER_INFO[t as OperatorTier].label).join(" & ");
      return {
        badge: badges,
        label: labels,
        tier: operator.includedTiers[0] as OperatorTier
      };
    }
  };

  const tierDisplay = getTierDisplay();

  return (
    <>
      <Card className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-2 relative ${
        isSelf 
          ? 'border-blue-300 dark:border-blue-700 ring-2 ring-blue-200/50 dark:ring-blue-800/50' 
          : 'hover:border-orange-200 dark:hover:border-orange-900'
      }`} data-testid={`operator-card-${operator.cardId}`}>
        {/* Self-indicator badge */}
        {isSelf && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold shadow-md">
              Your Operator
            </Badge>
          </div>
        )}
        
        {/* Favorite button - prominent top-right corner (disabled for own operator) */}
        <div className="absolute top-3 right-3 z-10">
          {isSelf ? (
            <div 
              className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-200/80 dark:bg-gray-700/80 backdrop-blur-sm cursor-not-allowed"
              title="Cannot favorite your own operator"
            >
              <Heart className="h-5 w-5 text-gray-400 opacity-50" />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFavorite}
              disabled={favoriteMutation.isPending}
              className="h-10 w-10 p-0 hover:bg-red-50 dark:hover:bg-red-950 rounded-full shadow-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm"
              data-testid="button-favorite"
            >
              <Heart className={`h-5 w-5 transition-all ${isFavorite ? "fill-red-500 text-red-500 scale-110" : "text-gray-400"}`} />
            </Button>
          )}
        </div>

        <CardHeader className="pb-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
          <div className="flex items-start gap-4 pr-12">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {operator.photo && (
                <img 
                  src={operator.photo} 
                  alt={operator.name}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-orange-200 dark:ring-orange-800 flex-shrink-0"
                  data-testid="operator-avatar"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 
                  className="font-bold text-lg leading-tight mb-1" 
                  data-testid="operator-name"
                  title={operator.name}
                >
                  {operator.name.length > 30 ? `${operator.name.substring(0, 27)}...` : operator.name}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {renderStars(parseFloat(operator.rating))}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid="operator-rating">
                    {operator.rating}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({operator.reviewCount} {operator.reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  {operator.isOnline === 1 && (
                    <Badge className="bg-green-500 text-white text-xs">
                      Online
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pb-4">
          {/* Tier Display - Modern Design with Selective Glow for Combined Tiers */}
          <div className="space-y-2">
            {operator.tierType === "equipped_manual" && operator.includedTiers.length > 1 ? (
              // For combined equipped+manual tiles: show both tiers but only highlight the active one
              <div className="space-y-2">
                {operator.includedTiers.map((tierName) => {
                  const tier = tierName as OperatorTier;
                  const isThisTierActive = operator.activeTier === tier;
                  const tierInfo = OPERATOR_TIER_INFO[tier];
                  
                  return (
                    <div 
                      key={tier}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                        isThisTierActive
                          ? "border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 shadow-lg shadow-orange-200/50 dark:shadow-orange-900/30"
                          : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 opacity-60"
                      }`}
                      data-testid={`tier-badge-${tier}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{tierInfo.badge}</span>
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${isThisTierActive ? "text-orange-700 dark:text-orange-300" : "text-gray-600 dark:text-gray-500"}`}>
                            {tierInfo.label}
                          </span>
                          {isThisTierActive && (
                            <span className="text-xs text-gray-600 dark:text-gray-500">
                              {operator.totalJobs} jobs completed
                            </span>
                          )}
                        </div>
                      </div>
                      {isThisTierActive && (
                        <Badge className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-3 py-1 animate-pulse">
                          ACTIVE
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // For professional or single-tier tiles: show as before
              <div 
                className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                  operator.isActive
                    ? "border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 shadow-lg shadow-orange-200/50 dark:shadow-orange-900/30"
                    : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 opacity-75"
                }`}
                data-testid={`tier-badge-${operator.tierType}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tierDisplay.badge}</span>
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold ${operator.isActive ? "text-orange-700 dark:text-orange-300" : "text-gray-700 dark:text-gray-400"}`}>
                      {tierDisplay.label}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-500">
                      {operator.totalJobs} jobs completed
                    </span>
                  </div>
                </div>
                {operator.isActive && (
                  <Badge className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-3 py-1 animate-pulse">
                    ACTIVE
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Services */}
          {operator.services && operator.services.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Services
              </p>
              <div className="flex flex-wrap gap-1.5">
                {operator.services.slice(0, 3).map((service: any, idx: number) => {
                  const serviceName = typeof service === 'string' ? service : (service?.name || service?.serviceType || 'Service');
                  const serviceKey = typeof service === 'string' ? service : (service?.id || idx);
                  return (
                    <Badge key={serviceKey} variant="secondary" className="text-xs" data-testid={`service-badge-${serviceKey}`}>
                      {serviceName}
                    </Badge>
                  );
                })}
                {operator.services.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{operator.services.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Vehicle & Equipment Info */}
          {(operator.vehicle || operator.primaryVehicleImage) && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Equipment
              </p>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-500" />
                <span className="text-sm" data-testid="operator-vehicle">{operator.vehicle}</span>
              </div>
              {operator.equipmentInventory && operator.equipmentInventory.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {operator.equipmentInventory.slice(0, 3).map((item: any, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      <Wrench className="h-3 w-3 mr-1" />
                      {item.displayName}
                    </Badge>
                  ))}
                  {operator.equipmentInventory.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{operator.equipmentInventory.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recent Review Snippet */}
          {operator.recentReviews.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Latest Review
                </p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowReviews(true)}
                  className="h-auto p-0 text-xs text-orange-600"
                  data-testid="button-view-reviews"
                >
                  View all ({operator.recentReviews.length})
                </Button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2.5" data-testid="review-snippet">
                <div className="flex items-center gap-2 mb-1">
                  {renderStars(operator.recentReviews[0].rating)}
                  <span className="text-xs text-gray-500">
                    {format(new Date(operator.recentReviews[0].createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                {operator.recentReviews[0].review && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    "{operator.recentReviews[0].review}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Contact & Location - Mysterious: hide phone, show only location */}
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 pt-2 border-t">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{operator.address}</span>
            </div>
          </div>
          
          {/* Mysterious Hint */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-lg px-4 py-2.5 border border-orange-200/50 dark:border-orange-900/50">
            <p className="text-xs text-orange-800 dark:text-orange-300 font-medium">
              📞 Contact & rates revealed after service request
            </p>
          </div>

          {/* Action Buttons - Disabled for own operator to prevent self-service */}
          <div className="flex gap-2 pt-2">
            {isSelf ? (
              <>
                <div 
                  className="flex-1 relative"
                  title="Cannot request services from yourself"
                >
                  <Button
                    className="w-full bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-60 blur-[1px]"
                    size="sm"
                    disabled
                    data-testid="button-request-service-disabled"
                  >
                    Request Service
                  </Button>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded shadow-sm">
                      Your Operator
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(`/customer/operator-profile/${operator.operatorId}`)}
                  data-testid="button-view-profile"
                >
                  View Profile
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleRequestService}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  size="sm"
                  data-testid="button-request-service"
                >
                  Request Service
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(`/customer/operator-profile/${operator.operatorId}`)}
                  data-testid="button-view-profile"
                >
                  View Profile
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reviews Dialog */}
      <Dialog open={showReviews} onOpenChange={setShowReviews}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Customer Reviews</DialogTitle>
            <DialogDescription>
              {operator.name} • {operator.recentReviews.length} reviews • {operator.rating} average rating
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              {operator.recentReviews.map((review) => (
                <div key={review.ratingId} className="border-b pb-4 last:border-0" data-testid={`review-${review.ratingId}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-500">
                      {format(new Date(review.createdAt), "MMMM d, yyyy")}
                    </span>
                  </div>
                  {review.review && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">{review.review}</p>
                  )}
                </div>
              ))}
              {operator.recentReviews.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">No reviews yet</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
