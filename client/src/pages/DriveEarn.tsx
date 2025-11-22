import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { OPERATOR_TIER_INFO, type Operator } from "@shared/schema";
import { 
  ArrowRight, 
  Award, 
  Truck,
  Snowflake, 
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
  const { user, isAuthenticated, isLoading: isAuthLoading, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  // Fetch operator data if user has operatorId
  const { data: operatorData, isLoading: isOperatorLoading } = useQuery<OperatorWithStats>({
    queryKey: [`/api/operators/by-id/${user?.operatorId}`],
    enabled: !!user?.operatorId && isAuthenticated,
  });

  // Show loading skeleton while auth is initializing
  if (isAuthLoading) {
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
              <div className="flex items-center justify-center gap-2">
                <CardTitle className="text-2xl">Get Started as an Operator</CardTitle>
                <InfoTooltip
                  content="Create an operator account to start earning with your vehicle. Choose your tier based on your equipment and services offered."
                  testId="button-info-get-started"
                  ariaLabel="Get started information"
                />
              </div>
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
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{info.label}</CardTitle>
                    <InfoTooltip
                      content={info.description}
                      testId={`button-info-tier-${tier}`}
                      ariaLabel={`${info.label} tier information`}
                    />
                  </div>
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

  // Show loading state while operator data is loading
  if (isOperatorLoading) {
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
  const activeTier = operatorData?.activeTier || operatorData?.operatorTier || null;

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
        return Snowflake;
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
            Drive & Earn
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Manage your operator tiers and start earning
          </p>
        </div>

        {/* My Tiers Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black dark:text-white">My Tiers</h2>
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
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="w-3 h-3" />
                          Tier Rating
                        </div>
                        <p className="text-lg font-bold text-black dark:text-white">
                          {tierStats?.rating ? Number(tierStats.rating).toFixed(1) : "New"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="w-3 h-3" />
                          Tier Jobs
                        </div>
                        <p className="text-lg font-bold text-black dark:text-white">
                          {tierStats?.jobsCompleted || 0}
                        </p>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <DollarSign className="w-3 h-3" />
                          Tier Earnings
                        </div>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          ${tierStats?.totalEarnings || "0.00"}
                        </p>
                      </div>
                      {tierStats?.lastActiveAt && (
                        <div className="space-y-1 col-span-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            Member Since
                          </div>
                          <p className="text-sm text-black dark:text-white">
                            {new Date(tierStats.lastActiveAt).toLocaleDateString('en-US', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      variant={isActive ? "hero" : "outline"}
                      className="w-full"
                      onClick={() => {
                        updateUser({ viewTier: tier as "professional" | "equipped" | "manual" });
                        setLocation(getTierDashboardPath(tier));
                      }}
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
                          variant="hero"
                          className="w-full"
                          onClick={() => setLocation(`/operator/onboarding?tier=${tier}`)}
                          data-testid={`button-add-tier-${tier}`}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add This Tier
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
