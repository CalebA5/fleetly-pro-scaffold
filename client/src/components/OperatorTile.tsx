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
  operatorId: string;
  name: string;
  email: string;
  phone: string;
  photo: string | null;
  latitude: string;
  longitude: string;
  address: string;
  isOnline: number;
  hourlyRate: string | null;
  availability: string;
  activeTier: OperatorTier;
  subscribedTiers: OperatorTier[];
  operatorTierProfiles: any;
  equipmentInventory: any[];
  primaryVehicleImage: string | null;
  vehicle: string;
  licensePlate: string;
  services: string[];
  totalJobs: number;
  rating: string;
  tierStats: Record<string, {
    jobsCompleted: number;
    totalEarnings: string;
    rating: string;
    totalRatings: number;
    lastActiveAt: Date | null;
  }>;
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
};

export function OperatorTile({ operator, isFavorite = false, onFavoriteToggle }: OperatorTileProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showReviews, setShowReviews] = useState(false);
  const { user } = useAuth();
  const customerId = user?.id || "";
  
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
    setLocation(`/request-service?operatorId=${operator.operatorId}&operatorName=${encodeURIComponent(operator.name)}`);
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

  // Determine which tiers to display
  const hasProfessional = operator.subscribedTiers.includes("professional");
  const hasEquipped = operator.subscribedTiers.includes("equipped");
  const hasManual = operator.subscribedTiers.includes("manual");
  
  // Group skilled+equipped and manual together
  const hasSkilledOrManual = hasEquipped || hasManual;

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

  const TierBadge = ({ tier, isActive }: { tier: OperatorTier; isActive: boolean }) => {
    const tierInfo = OPERATOR_TIER_INFO[tier];
    const stats = operator.tierStats[tier];
    
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
          isActive
            ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 opacity-60"
        }`}
        data-testid={`tier-badge-${tier}`}
      >
        <span className="text-lg">{tierInfo.badge}</span>
        <div className="flex flex-col">
          <span className={`text-xs font-semibold ${isActive ? "text-orange-600 dark:text-orange-400" : "text-gray-600 dark:text-gray-400"}`}>
            {tierInfo.label.split(" ")[0]}
          </span>
          {stats && (
            <span className="text-[10px] text-gray-500 dark:text-gray-500">
              {stats.jobsCompleted} jobs
            </span>
          )}
        </div>
        {isActive && (
          <Badge variant="default" className="ml-auto text-[10px] px-1.5 py-0.5 h-auto bg-orange-500">
            Active
          </Badge>
        )}
      </div>
    );
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`operator-card-${operator.operatorId}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              {operator.photo ? (
                <img 
                  src={operator.photo} 
                  alt={operator.name}
                  className="w-12 h-12 rounded-full object-cover"
                  data-testid="operator-avatar"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                  {operator.name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-base" data-testid="operator-name">{operator.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {renderStars(parseFloat(operator.rating))}
                  <span className="text-xs text-gray-600 dark:text-gray-400" data-testid="operator-rating">
                    {operator.rating} ({operator.recentReviews.length} reviews)
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFavorite}
              disabled={favoriteMutation.isPending}
              className="h-8 w-8 p-0"
              data-testid="button-favorite"
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-4">
          {/* Tier Display */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Service Tiers
            </p>
            <div className="grid grid-cols-2 gap-2">
              {/* Professional Tier - Standalone */}
              {hasProfessional && (
                <div className="col-span-2">
                  <TierBadge tier="professional" isActive={operator.activeTier === "professional"} />
                </div>
              )}
              
              {/* Skilled & Manual - Combined */}
              {hasSkilledOrManual && (
                <div className="col-span-2 grid grid-cols-2 gap-2">
                  {hasEquipped && (
                    <TierBadge tier="equipped" isActive={operator.activeTier === "equipped"} />
                  )}
                  {hasManual && (
                    <TierBadge tier="manual" isActive={operator.activeTier === "manual"} />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Services */}
          {operator.services && operator.services.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Services
              </p>
              <div className="flex flex-wrap gap-1.5">
                {operator.services.slice(0, 3).map((service: string) => (
                  <Badge key={service} variant="secondary" className="text-xs" data-testid={`service-badge-${service}`}>
                    {service}
                  </Badge>
                ))}
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

          {/* Contact & Location */}
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 pt-2 border-t">
            {operator.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <span>{operator.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{operator.address}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
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
              onClick={() => setLocation(`/operators/${operator.operatorId}`)}
              data-testid="button-view-profile"
            >
              View Profile
            </Button>
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
