import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AuthDialog } from "@/components/AuthDialog";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { WeatherAlertBanner } from "@/components/WeatherAlertBanner";
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
      // Always go to Drive & Earn page (tier selection/management)
      setLocation("/operator/onboarding");
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

      {/* Weather Alert Banner - Proactive Notifications */}
      <WeatherAlertBanner />

      {/* Hero Section with Location Search */}
      <section className="relative bg-white dark:bg-gray-900 py-12 md:py-20 overflow-hidden border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black dark:text-white leading-tight mb-4">
                Get the service you need, when you need it
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8">
                Professional snow plowing, towing, hauling, and courier services. Available 24/7.
              </p>

              {/* Interactive Location Search - Uber Style */}
              <div className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-black dark:bg-white flex-shrink-0"></div>
                    <Input
                      placeholder="Enter pickup location"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      className="flex-1 border-0 bg-gray-50 dark:bg-gray-700 focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white text-base"
                      data-testid="input-pickup-location"
                    />
                  </div>
                  <div className="h-px bg-gray-200 dark:bg-gray-700 ml-6"></div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded bg-black dark:bg-white flex-shrink-0"></div>
                    <Input
                      placeholder="Enter dropoff location (optional)"
                      value={dropoff}
                      onChange={(e) => setDropoff(e.target.value)}
                      className="flex-1 border-0 bg-gray-50 dark:bg-gray-700 focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white text-base"
                      data-testid="input-dropoff-location"
                    />
                  </div>
                </div>
                <Button 
                  size="lg" 
                  onClick={handleSearchService}
                  className="w-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-semibold"
                  data-testid="button-search-services"
                >
                  <Search className="mr-2 w-5 h-5" />
                  See available operators
                </Button>
              </div>

              {/* Quick Browse */}
              <div className="mt-4">
                <Link href="/customer/operators">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors font-semibold"
                    data-testid="button-browse-all-operators"
                  >
                    Or browse all operators
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Availability Preview - Shows After Search */}
            <div className="relative">
              {showAvailability ? (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl md:text-2xl font-bold text-black dark:text-white mb-6">
                    Available near you
                  </h3>
                  <div className="space-y-3">
                    <div 
                      onClick={() => handleRequestService("Snow Plowing")}
                      className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-all cursor-pointer" 
                      data-testid="card-service-snow"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center">
                          <Truck className="w-6 h-6 text-white dark:text-black" />
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
                      className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-all cursor-pointer" 
                      data-testid="card-service-towing"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center">
                          <Truck className="w-6 h-6 text-white dark:text-black" />
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
                      className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-all cursor-pointer" 
                      data-testid="card-service-hauling"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center">
                          <Truck className="w-6 h-6 text-white dark:text-black" />
                        </div>
                        <div>
                          <p className="font-semibold text-black dark:text-white">Hauling</p>
                          <p className="text-sm text-gray-500">12 min away</p>
                        </div>
                      </div>
                      <p className="font-bold text-black dark:text-white">$110/hr</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-6 text-center">
                    Click any service to continue
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl md:text-2xl font-bold text-black dark:text-white mb-6">
                    Our Services
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center">
                          <Truck className="w-6 h-6 text-white dark:text-black" />
                        </div>
                        <div>
                          <p className="font-semibold text-black dark:text-white">Snow Plowing</p>
                          <p className="text-sm text-gray-500">Professional clearing</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center">
                          <Truck className="w-6 h-6 text-white dark:text-black" />
                        </div>
                        <div>
                          <p className="font-semibold text-black dark:text-white">Towing</p>
                          <p className="text-sm text-gray-500">Emergency & scheduled</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center">
                          <Truck className="w-6 h-6 text-white dark:text-black" />
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

      {/* Trust & Features Section */}
      <section className="py-12 md:py-16 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-3">
              Why choose Fleetly
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Professional service you can trust
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="p-6 md:p-8 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-all">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 md:w-8 md:h-8 text-white dark:text-black" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Fast Response</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Operators arrive quickly when you need them most. Real-time tracking included.
              </p>
            </Card>
            <Card className="p-6 md:p-8 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-all">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 md:w-8 md:h-8 text-white dark:text-black" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Verified Operators</h3>
              <p className="text-gray-600 dark:text-gray-400">
                All operators are background-checked and professionally licensed for your safety.
              </p>
            </Card>
            <Card className="p-6 md:p-8 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-all">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-7 h-7 md:w-8 md:h-8 text-white dark:text-black" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Top-Rated Service</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose from highly-rated professionals with verified customer reviews.
              </p>
            </Card>
          </div>

          {/* Trust Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-12 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-2">10K+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed Services</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-2">500+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Verified Operators</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-2">4.9★</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-2">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Always Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-black dark:bg-white border-b border-gray-800 dark:border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white dark:text-black mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg md:text-xl text-gray-300 dark:text-gray-700 mb-8">
            Join thousands of customers who trust Fleetly for their service needs.
          </p>
          <Link href="/customer/operators">
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-gray-200 dark:bg-black dark:text-white dark:hover:bg-gray-800 font-semibold text-lg px-8 h-12 transition-colors"
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

      {/* Mobile Bottom Navigation */}
      {isAuthenticated && user?.role === "customer" && <MobileBottomNav />}
    </div>
  );
};

export default Index;
