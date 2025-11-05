import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/enhanced-button";
import { Card } from "@/components/ui/card";
import { AuthDialog } from "@/components/AuthDialog";
import { MapPin, ArrowRight, Truck, Clock, Shield, Star } from "lucide-react";

export const CustomerHome = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");

  const handleAuthClick = (tab: "signin" | "signup") => {
    setAuthTab(tab);
    setShowAuthDialog(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Modern Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Truck className="w-8 h-8 text-black dark:text-white" />
              <span className="ml-2 text-2xl font-bold text-black dark:text-white">Fleetly</span>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/customer/operator-map">
                <Button variant="ghost" className="text-gray-700 dark:text-gray-300" data-testid="link-find-operators">
                  Find Operators
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => handleAuthClick("signin")}
                data-testid="button-sign-in"
              >
                Sign in
              </Button>
              <Button 
                className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200" 
                onClick={() => handleAuthClick("signup")}
                data-testid="button-sign-up"
              >
                Sign up
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-white dark:bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-black dark:text-white leading-tight mb-6">
                On-demand trucking and specialty services
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Request snow plowing, towing, hauling, and courier services with just a few taps. Professional operators ready to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/customer/operator-map">
                  <Button 
                    size="lg" 
                    className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-lg px-8 py-6 h-auto"
                    data-testid="button-get-started"
                  >
                    Get started
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/customer/operators">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="text-lg px-8 py-6 h-auto border-2"
                    data-testid="button-browse-operators"
                  >
                    Browse operators
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
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
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
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
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
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
              </div>
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
            <Card className="p-8 text-center border-0 shadow-lg">
              <div className="w-16 h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white dark:text-black" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Fast response</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Operators arrive quickly when you need them most. Real-time tracking included.
              </p>
            </Card>
            <Card className="p-8 text-center border-0 shadow-lg">
              <div className="w-16 h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white dark:text-black" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Verified operators</h3>
              <p className="text-gray-600 dark:text-gray-400">
                All operators are background-checked and professionally licensed.
              </p>
            </Card>
            <Card className="p-8 text-center border-0 shadow-lg">
              <div className="w-16 h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white dark:text-black" />
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
      />
    </div>
  );
};
