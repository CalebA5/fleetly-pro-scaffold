import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Snowflake, Car, Package, MapPin } from "lucide-react";

const services = [
  {
    id: "snow-plow",
    title: "Snow Plowing",
    description: "Professional snow removal for driveways and parking lots",
    icon: Snowflake,
    color: "text-blue-500",
    available: true,
  },
  {
    id: "tow",
    title: "Towing",
    description: "Emergency and scheduled vehicle towing services",
    icon: Car,
    color: "text-orange-500",
    available: true,
  },
  {
    id: "courier",
    title: "Courier",
    description: "Fast and reliable package delivery services",
    icon: Package,
    color: "text-green-500",
    available: true,
  },
  {
    id: "long-distance-tow",
    title: "Long Distance Tow",
    description: "Long-haul towing for vehicles and equipment",
    icon: MapPin,
    color: "text-purple-500",
    available: true,
  },
  {
    id: "haul",
    title: "Hauling",
    description: "Heavy equipment and material transportation",
    icon: Truck,
    color: "text-red-500",
    available: true,
  },
];

export const CustomerHome = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
          Welcome to Fleetly
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Professional on-demand trucking and specialty services. Choose your service below to get started.
        </p>
      </div>

      {/* Service Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <Card 
              key={service.id} 
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-accent/10 ${service.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    {service.available && (
                      <span className="text-xs text-success font-medium">Available Now</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {service.description}
                </CardDescription>
                <Link to="/customer/services" state={{ selectedService: service.id }}>
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                    Get Quote
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-hero rounded-2xl p-8 text-center text-white animate-fade-in">
        <h2 className="text-2xl font-bold mb-4">Need Help Choosing?</h2>
        <p className="text-white/90 mb-6 max-w-md mx-auto">
          Upload a photo and describe your needs. Our AI will recommend the best service for you.
        </p>
        <Link to="/customer/services">
          <Button variant="secondary" size="lg">
            Try AI Recommender
          </Button>
        </Link>
      </div>
    </div>
  );
};