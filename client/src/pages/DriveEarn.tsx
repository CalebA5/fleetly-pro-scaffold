import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { OPERATOR_TIER_INFO, type Operator } from "@shared/schema";
import { 
  ArrowRight, 
  Award, 
  Truck,
  Wrench, 
  Users, 
  Plus, 
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Star
} from "lucide-react";
import { AuthDialog } from "@/components/AuthDialog";

type OperatorWithStats = Operator & {
  tierStats?: Record<string, {
    jobsCompleted: number;
    totalEarnings: string;
    rating: string;
    totalRatings: number;
    lastActiveAt: Date | null;
  }>;
};

export const DriveEarn = () => {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  // Fetch operator data if user has operatorId
  const { data: operatorData, isLoading } = useQuery<OperatorWithStats>({
    queryKey: [`/api/operators/by-id/${user?.operatorId}`],
    enabled: !!user?.operatorId && isAuthenticated,
  });

  // If not authenticated, show auth prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pb-20 md:pb-0">
        <Header onSignIn={() => setShowAuthDialog(true)} onSignUp={() => setShowAuthDialog(true)} />
        
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4">
              Drive & Earn with Fleetly
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Join thousands of operators earning on their own schedule
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Get Started as an Operator</CardTitle>
              <CardDescription>Sign in or create an account to begin</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowAuthDialog(true)}
                data-testid="button-sign-in"
              >
                Sign In
              </Button>
              <Button
                variant="hero"
                size="lg"
                onClick={() => setShowAuthDialog(true)}
                data-testid="button-sign-up"
              >
                Sign Up
              </Button>
            </CardContent>
          </Card>

          {/* Tier Overview Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(OPERATOR_TIER_INFO).map(([tier, info]) => (
              <Card key={tier} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-4xl mb-2">{info.badge}</div>
                  <CardTitle className="text-lg">{info.label}</CardTitle>
                  <CardDescription className="text-sm">{info.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate Multiplier:</span>
                      <span className="font-semibold">{info.pricingMultiplier}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service Radius:</span>
                      <span className="font-semibold">
                        {info.radiusKm ? `${info.radiusKm}km` : "Unlimited"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <MobileBottomNav />
        <AuthDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          defaultTab="signup"
          signupRole="operator"
        />
      </div>
    );
  }

  // If no operator profile yet, redirect to onboarding
  if (!user?.operatorId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pb-20 md:pb-0">
        <Header />
        
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4">
              Welcome to Drive & Earn
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Choose your operator tier to get started
            </p>
            <Button
              variant="hero"
              size="lg"
              onClick={() => setLocation("/operator/onboarding")}
              data-testid="button-start-onboarding"
            >
              <Plus className="w-5 h-5 mr-2" />
              Get Started
            </Button>
          </div>

          {/* Tier Overview Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(OPERATOR_TIER_INFO).map(([tier, info]) => (
              <Card key={tier} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-4xl mb-2">{info.badge}</div>
                  <CardTitle className="text-lg">{info.label}</CardTitle>
                  <CardDescription className="text-sm">{info.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate Multiplier:</span>
                      <span className="font-semibold">{info.pricingMultiplier}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service Radius:</span>
                      <span className="font-semibold">
                        {info.radiusKm ? `${info.radiusKm}km` : "Unlimited"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <MobileBottomNav />
      </div>
    );
  }

  // User has operator profile - show their tiers and dashboards
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pb-20 md:pb-0">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-48 w-full mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  const subscribedTiers = operatorData?.subscribedTiers || [];
  const activeTier = operatorData?.activeTier || operatorData?.operatorTier || "manual";

  const getTierDashboardPath = (tier: string) => {
    switch (tier) {
      case "professional":
        return "/business";
      case "equipped":
        return "/equipped-operator";
      case "manual":
        return "/manual-operator";
      default:
        return "/operator";
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "professional":
        return Award;
      case "equipped":
        return Truck;
      case "manual":
        return Wrench;
      default:
        return Users;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pb-20 md:pb-0">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4" data-testid="text-page-title">
            Drive & Earn Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Manage your operator tiers and start earning
          </p>
        </div>

        {/* My Tiers Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black dark:text-white">My Active Tiers</h2>
            <Button
              variant="outline"
              onClick={() => setLocation("/operator/onboarding")}
              data-testid="button-add-tier"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Tier
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {subscribedTiers.map((tier) => {
              const tierInfo = OPERATOR_TIER_INFO[tier as keyof typeof OPERATOR_TIER_INFO];
              const TierIcon = getTierIcon(tier);
              const tierStats = operatorData?.tierStats?.[tier];
              const isActive = tier === activeTier;

              return (
                <Card 
                  key={tier} 
                  className={`hover:shadow-xl transition-all ${
                    isActive ? 'ring-2 ring-orange-500 shadow-lg' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-4xl">{tierInfo.badge}</div>
                      {isActive && (
                        <Badge variant="default" className="bg-orange-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{tierInfo.label}</CardTitle>
                    <CardDescription>{tierInfo.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Tier Stats */}
                    {tierStats && (
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <TrendingUp className="w-3 h-3" />
                            Jobs Completed
                          </div>
                          <p className="text-lg font-bold text-black dark:text-white">
                            {tierStats.jobsCompleted}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <DollarSign className="w-3 h-3" />
                            Earnings
                          </div>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            ${tierStats.totalEarnings}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="w-3 h-3" />
                            Rating
                          </div>
                          <p className="text-lg font-bold text-black dark:text-white">
                            {tierStats.rating || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            Reviews
                          </div>
                          <p className="text-lg font-bold text-black dark:text-white">
                            {tierStats.totalRatings}
                          </p>
                        </div>
                      </div>
                    )}

                    <Button
                      variant={isActive ? "hero" : "outline"}
                      className="w-full"
                      onClick={() => setLocation(getTierDashboardPath(tier))}
                      data-testid={`button-dashboard-${tier}`}
                    >
                      <TierIcon className="w-4 h-4 mr-2" />
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}

            {/* Add Tier Card */}
            {subscribedTiers.length < 3 && (
              <Card className="border-dashed border-2 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all cursor-pointer">
                <CardContent 
                  className="flex flex-col items-center justify-center h-full min-h-[300px] p-6"
                  onClick={() => setLocation("/operator/onboarding")}
                  data-testid="button-add-tier-card"
                >
                  <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center mb-4">
                    <Plus className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                    Add New Tier
                  </h3>
                  <p className="text-sm text-center text-muted-foreground">
                    Expand your earning potential by adding another operator tier
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Available Tiers Section - Show unsubscribed tiers */}
        {subscribedTiers.length < 3 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6">
              Available Tiers to Add
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {Object.entries(OPERATOR_TIER_INFO)
                .filter(([tier]) => !subscribedTiers.includes(tier as any))
                .map(([tier, info]) => {
                  const TierIcon = getTierIcon(tier);
                  return (
                    <Card key={tier} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="text-4xl mb-2">{info.badge}</div>
                        <CardTitle className="text-lg">{info.label}</CardTitle>
                        <CardDescription className="text-sm">{info.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Rate Multiplier:</span>
                            <span className="font-semibold">{info.pricingMultiplier}x</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Service Radius:</span>
                            <span className="font-semibold">
                              {info.radiusKm ? `${info.radiusKm}km` : "Unlimited"}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setLocation("/operator/onboarding")}
                          data-testid={`button-register-${tier}`}
                        >
                          <TierIcon className="w-4 h-4 mr-2" />
                          Register for {info.label}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
};
