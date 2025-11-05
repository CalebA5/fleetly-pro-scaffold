import { Link } from "wouter";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Truck, Snowflake, MapPin, Clock, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-black dark:bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background with Warm Accents */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
      
      {/* Floating Warm Orbs - Moving Background Elements */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl animate-float-delayed"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
      
      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      {/* Moving Icons - Decorative Elements */}
      <div className="absolute top-10 right-10 animate-float opacity-20">
        <Snowflake className="w-16 h-16 text-white icon-warm-glow" />
      </div>
      <div className="absolute bottom-10 left-10 animate-float-delayed opacity-20">
        <Truck className="w-20 h-20 text-white icon-warm-glow" />
      </div>
      <div className="absolute top-1/3 right-1/4 animate-float opacity-15">
        <MapPin className="w-12 h-12 text-orange-400" />
      </div>
      
      <div className="relative z-10 text-center text-white max-w-5xl mx-auto">
        {/* Logo with Warm Glow */}
        <div className="mb-8 animate-fade-in">
          <Truck className="w-20 h-20 mx-auto mb-4 text-white icon-warm-glow animate-pulse" />
        </div>
        
        <h1 className="text-7xl md:text-8xl font-bold mb-6 animate-slide-up text-warm-shadow">
          Fleetly
        </h1>
        
        <p className="text-2xl mb-4 text-white/90 animate-fade-in" style={{animationDelay: '0.2s'}}>
          Professional on-demand services at your fingertips
        </p>
        
        <p className="text-lg mb-12 text-white/70 max-w-2xl mx-auto animate-fade-in" style={{animationDelay: '0.3s'}}>
          Snow plowing • Towing • Hauling • Courier services
        </p>
        
        {/* Feature Highlights */}
        <div className="flex flex-wrap justify-center gap-6 mb-12 animate-slide-up" style={{animationDelay: '0.4s'}}>
          <div className="flex items-center gap-2 text-white/80 shadow-warm px-4 py-2 rounded-full bg-white/5 backdrop-blur">
            <Clock className="w-5 h-5 text-orange-400 icon-warm-glow" />
            <span>24/7 Available</span>
          </div>
          <div className="flex items-center gap-2 text-white/80 shadow-warm px-4 py-2 rounded-full bg-white/5 backdrop-blur">
            <Zap className="w-5 h-5 text-orange-400 icon-warm-glow" />
            <span>Instant Booking</span>
          </div>
          <div className="flex items-center gap-2 text-white/80 shadow-warm px-4 py-2 rounded-full bg-white/5 backdrop-blur">
            <MapPin className="w-5 h-5 text-orange-400 icon-warm-glow" />
            <span>Real-time Tracking</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl hover:bg-white/15 transition-all duration-300 animate-scale-in shadow-warm-glow hover:shadow-warm-glow hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center justify-center space-x-3 text-white text-2xl">
                <Users className="w-8 h-8 icon-warm-glow" />
                <span>For Customers</span>
              </CardTitle>
              <CardDescription className="text-white/80 text-lg">
                Book professional services on-demand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/customer">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="w-full bg-white text-black hover:bg-gray-100 text-lg shadow-warm-glow"
                  data-testid="button-customer-portal"
                >
                  Find Services
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur-xl hover:bg-white/15 transition-all duration-300 animate-scale-in shadow-warm-glow hover:shadow-warm-glow hover:scale-105" style={{ animationDelay: "200ms" }}>
            <CardHeader>
              <CardTitle className="flex items-center justify-center space-x-3 text-white text-2xl">
                <Truck className="w-8 h-8 icon-warm-glow" />
                <span>For Operators</span>
              </CardTitle>
              <CardDescription className="text-white/80 text-lg">
                Join our network and grow your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/operator">
                <Button 
                  variant="accent" 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 text-lg shadow-warm-glow"
                  data-testid="button-operator-portal"
                >
                  Start Earning
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
