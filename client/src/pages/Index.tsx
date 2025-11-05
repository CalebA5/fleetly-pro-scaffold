import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AuthDialog } from "@/components/AuthDialog";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, ArrowRight, Truck, Clock, Shield, Star, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [, setLocation] = useLocation();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [signupRole, setSignupRole] = useState<"customer" | "operator">("customer");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [showAvailability, setShowAvailability] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const handleAuthClick = (tab: "signin" | "signup", role: "customer" | "operator" = "customer") => {
    setAuthTab(tab);
    setSignupRole(role);
    setShowAuthDialog(true);
  };

  const handleDriveAndEarn = () => {
    if (isAuthenticated) {
      // Check if operator profile is complete
      if (user?.operatorProfileComplete) {
        setLocation("/operator");
      } else {
        // Prompt to complete profile
        toast({
          title: "Complete Your Operator Profile",
          description: "Please fill out your profile and vehicle information to start earning.",
        });
        setLocation("/operator/onboarding");
      }
    } else {
      // Show signup dialog for operator role
      handleAuthClick("signup", "operator");
    }
  };

  const handleSearchService = () => {
    if (pickup) {
      setShowAvailability(true);
    }
  };

  const handleRequestService = (service: string) => {
    if (!isAuthenticated) {
      // Show auth dialog before allowing service request
      setShowAuthDialog(true);
    } else {
      // Redirect to service request page
      setLocation("/customer/service-request");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Modern Header */}
      <Header 
        onSignIn={() => handleAuthClick("signin")}
        onSignUp={() => handleAuthClick("signup")}
        onDriveAndEarn={handleDriveAndEarn}
      />

      {/* Hero Section with Location Search */}
      <section className="relative bg-white dark:bg-gray-900 py-20 overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 animate-gradient-shift"></div>
        
        {/* Floating Decorative Elements */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-orange-200/30 dark:bg-orange-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-amber-200/30 dark:bg-amber-500/10 rounded-full blur-3xl animate-float-delayed"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <h1 className="text-5xl lg:text-6xl font-bold text-black dark:text-white leading-tight mb-6 text-warm-shadow">
                Get the service you need, when you need it
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 animate-fade-in">
                Snow plowing, towing, hauling, and courier services. Professional operators ready 24/7.
              </p>

              {/* Interactive Location Search - Uber Style */}
              <div className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-warm-glow animate-slide-up">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-black dark:bg-white"></div>
                    <Input
                      placeholder="Enter pickup location"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      className="flex-1 text-lg border-0 bg-gray-50 dark:bg-gray-700 focus-visible:ring-2"
                      data-testid="input-pickup-location"
                    />
                  </div>
                  <div className="h-px bg-gray-200 dark:bg-gray-700 ml-6"></div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded bg-black dark:bg-white"></div>
                    <Input
                      placeholder="Enter dropoff location (optional)"
                      value={dropoff}
                      onChange={(e) => setDropoff(e.target.value)}
                      className="flex-1 text-lg border-0 bg-gray-50 dark:bg-gray-700 focus-visible:ring-2"
                      data-testid="input-dropoff-location"
                    />
                  </div>
                </div>
                <Button 
                  size="lg" 
                  onClick={handleSearchService}
                  className="w-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-lg py-6 h-auto shadow-warm-glow"
                  data-testid="button-search-services"
                >
                  <Search className="mr-2 w-5 h-5" />
                  See available operators
                </Button>
              </div>

              {/* Quick Browse */}
              <div className="mt-6">
                <Link href="/customer/operator-map">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="text-lg px-8 py-6 h-auto border-2 hover:scale-105 transition-all"
                    data-testid="button-browse-all-operators"
                  >
                    Or browse all operators
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Availability Preview - Shows After Search */}
            <div className="relative animate-slide-in-right">
              {showAvailability ? (
                <div className="bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 shadow-2xl shadow-warm">
                  <h3 className="text-2xl font-bold text-black dark:text-white mb-4">
                    Available near you
                  </h3>
                  <div className="space-y-4">
                    <div 
                      onClick={() => handleRequestService("Snow Plowing")}
                      className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg shadow-warm hover:shadow-warm-glow transition-all hover:scale-105 cursor-pointer animate-slide-up" 
                      style={{animationDelay: '0.1s'}}
                      data-testid="card-service-snow"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center shadow-warm">
                          <Truck className="w-6 h-6 text-white dark:text-black icon-warm-glow" />
                        </div>
                        <div>
                          <p className="font-semibold text-black dark:text-white">Snow Plowing</p>
                          <p className="text-sm text-gray-500">5 min away</p>
                        </div>
                      </div>
                      <p className="font-bold text-black dark:text-white">$95/hr</p>
                    </div>
                    <div 
                      onClick={() => handleRequestService("Towing")}
                      className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg shadow-warm hover:shadow-warm-glow transition-all hover:scale-105 cursor-pointer animate-slide-up" 
                      style={{animationDelay: '0.2s'}}
                      data-testid="card-service-towing"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center shadow-warm">
                          <Truck className="w-6 h-6 text-white dark:text-black icon-warm-glow" />
                        </div>
                        <div>
                          <p className="font-semibold text-black dark:text-white">Towing</p>
                          <p className="text-sm text-gray-500">8 min away</p>
                        </div>
                      </div>
                      <p className="font-bold text-black dark:text-white">$125/hr</p>
                    </div>
                    <div 
                      onClick={() => handleRequestService("Hauling")}
                      className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg shadow-warm hover:shadow-warm-glow transition-all hover:scale-105 cursor-pointer animate-slide-up" 
                      style={{animationDelay: '0.3s'}}
                      data-testid="card-service-hauling"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center shadow-warm">
                          <Truck className="w-6 h-6 text-white dark:text-black icon-warm-glow" />
                        </div>
                        <div>
                          <p className="font-semibold text-black dark:text-white">Hauling</p>
                          <p className="text-sm text-gray-500">12 min away</p>
                        </div>
                      </div>
                      <p className="font-bold text-black dark:text-white">$110/hr</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
                    Click any service to continue
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 shadow-2xl shadow-warm">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg shadow-warm hover:shadow-warm-glow transition-all hover:scale-105 animate-slide-up" style={{animationDelay: '0.1s'}}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center shadow-warm">
                          <Truck className="w-6 h-6 text-white dark:text-black icon-warm-glow" />
                        </div>
                        <div>
                          <p className="font-semibold text-black dark:text-white">Snow Plowing</p>
                          <p className="text-sm text-gray-500">Professional clearing</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg shadow-warm hover:shadow-warm-glow transition-all hover:scale-105 animate-slide-up" style={{animationDelay: '0.2s'}}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center shadow-warm">
                          <Truck className="w-6 h-6 text-white dark:text-black icon-warm-glow" />
                        </div>
                        <div>
                          <p className="font-semibold text-black dark:text-white">Towing</p>
                          <p className="text-sm text-gray-500">Emergency & scheduled</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg shadow-warm hover:shadow-warm-glow transition-all hover:scale-105 animate-slide-up" style={{animationDelay: '0.3s'}}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center shadow-warm">
                          <Truck className="w-6 h-6 text-white dark:text-black icon-warm-glow" />
                        </div>
                        <div>
                          <p className="font-semibold text-black dark:text-white">Hauling</p>
                          <p className="text-sm text-gray-500">Junk & debris removal</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-black dark:text-white mb-12">
            Why choose Fleetly
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 text-center border-0 shadow-warm hover:shadow-warm-glow transition-all">
              <div className="w-16 h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-warm">
                <Clock className="w-8 h-8 text-white dark:text-black icon-warm-glow" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Fast response</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Operators arrive quickly when you need them most. Real-time tracking included.
              </p>
            </Card>
            <Card className="p-8 text-center border-0 shadow-warm hover:shadow-warm-glow transition-all">
              <div className="w-16 h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-warm">
                <Shield className="w-8 h-8 text-white dark:text-black icon-warm-glow" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Verified operators</h3>
              <p className="text-gray-600 dark:text-gray-400">
                All operators are background-checked and professionally licensed.
              </p>
            </Card>
            <Card className="p-8 text-center border-0 shadow-warm hover:shadow-warm-glow transition-all">
              <div className="w-16 h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-warm">
                <Star className="w-8 h-8 text-white dark:text-black icon-warm-glow" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Top rated</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Read reviews and ratings from other customers before you book.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black dark:bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white dark:text-black mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-gray-300 dark:text-gray-700 mb-8">
            Join thousands of customers who trust Fleetly for their trucking and specialty service needs.
          </p>
          <Link href="/customer/operator-map">
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-gray-100 dark:bg-black dark:text-white dark:hover:bg-gray-800 text-lg px-8 py-6 h-auto"
              data-testid="button-cta-find-operators"
            >
              Find operators near you
              <MapPin className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
        defaultTab={authTab}
        signupRole={signupRole}
      />
    </div>
  );
};

export default Index;
