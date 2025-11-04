import { Link } from "react-router-dom";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Truck } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="text-center text-white max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold mb-6 animate-fade-in">
          Fleetly
        </h1>
        <p className="text-xl mb-12 text-white/90 animate-slide-up">
          Professional on-demand trucking, snow plowing, towing, and hauling services
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <Card className="bg-white/10 border-white/20 backdrop-blur animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Users className="w-6 h-6" />
                <span>For Customers</span>
              </CardTitle>
              <CardDescription className="text-white/80">
                Book professional services on-demand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/customer">
                <Button variant="secondary" size="lg" className="w-full">
                  Find Services
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 backdrop-blur animate-scale-in" style={{ animationDelay: "200ms" }}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Truck className="w-6 h-6" />
                <span>For Operators</span>
              </CardTitle>
              <CardDescription className="text-white/80">
                Join our network and grow your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/operator">
                <Button variant="accent" size="lg" className="w-full">
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
