import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, MapPin, Phone, Truck, Wrench, Award, Clock, 
  Briefcase, MessageCircle, Calendar, Image, ChevronRight,
  ThumbsUp, Shield, CheckCircle2
} from "lucide-react";
import { OPERATOR_TIER_INFO, type Operator } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";
import { useState } from "react";

type OperatorReview = {
  ratingId: string;
  customerId: string;
  customerName?: string;
  rating: number;
  review: string | null;
  createdAt: string;
};

type PortfolioItem = {
  id: string;
  imageUrl: string;
  serviceType: string;
  description?: string;
  createdAt: string;
};

export const OperatorProfile = () => {
  const { operatorId } = useParams<{ operatorId: string }>();
  const [, setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState<PortfolioItem | null>(null);

  const { data: operator, isLoading } = useQuery<Operator>({
    queryKey: [`/api/operators/by-id/${operatorId}`],
    enabled: !!operatorId,
  });

  const { data: reviews = [] } = useQuery<OperatorReview[]>({
    queryKey: [`/api/operators/${operatorId}/reviews`],
    enabled: !!operatorId,
  });

  const { data: portfolio = [] } = useQuery<PortfolioItem[]>({
    queryKey: [`/api/operators/${operatorId}/portfolio`],
    enabled: !!operatorId,
  });

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    };
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 dark:fill-gray-700 text-gray-200 dark:text-gray-700"
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header onSignIn={() => {}} onSignUp={() => {}} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header onSignIn={() => {}} onSignUp={() => {}} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-8 pb-8">
              <p className="text-center text-gray-600 dark:text-gray-400 mb-4">Operator not found</p>
              <div className="flex justify-center">
                <Button onClick={() => setLocation("/customer/operators")} className="bg-orange-500 hover:bg-orange-600">
                  Back to Operators
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const tierInfo = OPERATOR_TIER_INFO[operator.activeTier || operator.operatorTier || "manual"];
  const rating = parseFloat(operator.rating || "0");
  const totalJobs = (operator as any).totalJobs || 0;
  const responseTime = "~15 min";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <Header onSignIn={() => {}} onSignUp={() => {}} />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <BackButton 
          fallbackPath="/customer/operators" 
          label="Back"
          className="mb-4"
        />

        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden mb-6">
          <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 px-6 py-8 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
              {operator.photo ? (
                <img 
                  src={operator.photo} 
                  alt={operator.name}
                  className="w-28 h-28 rounded-2xl object-cover ring-4 ring-white/30 shadow-2xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-4xl shadow-2xl ring-4 ring-white/30">
                  {operator.name.charAt(0)}
                </div>
              )}
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{operator.name}</h1>
                  {operator.isCertified === 1 && (
                    <Shield className="w-6 h-6 text-white/90" />
                  )}
                </div>
                
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    {renderStars(rating, 'sm')}
                    <span className="ml-1 font-semibold">{operator.rating || "0.0"}</span>
                  </div>
                  <span className="text-white/80 text-sm">({reviews.length} reviews)</span>
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                    <span className="mr-1">{tierInfo.badge}</span>
                    {tierInfo.label}
                  </Badge>
                  {operator.isOnline === 1 && (
                    <Badge className="bg-green-500/80 text-white border-0">
                      <span className="w-2 h-2 bg-white rounded-full mr-1.5 animate-pulse"></span>
                      Online
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            <div className="py-4 text-center">
              <div className="text-2xl font-bold text-black dark:text-white">{totalJobs}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Jobs Done</div>
            </div>
            <div className="py-4 text-center">
              <div className="text-2xl font-bold text-black dark:text-white">{responseTime}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Response</div>
            </div>
            <div className="py-4 text-center">
              <div className="text-2xl font-bold text-black dark:text-white">{rating.toFixed(1)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Rating</div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="about" className="mb-6">
          <TabsList className="w-full grid grid-cols-3 bg-white dark:bg-gray-900 rounded-xl p-1 shadow-sm border border-gray-100 dark:border-gray-800">
            <TabsTrigger value="about" className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              About
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Reviews ({reviews.length})
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Portfolio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-4">
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Contact</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{operator.address || "Location not specified"}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{operator.phone || "Available after booking"}</span>
                    </div>
                  </div>
                </div>

                {operator.vehicle && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Equipment</h3>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{operator.vehicle}</span>
                        {operator.licensePlate && (
                          <Badge variant="outline" className="ml-2 text-xs">{operator.licensePlate}</Badge>
                        )}
                      </div>
                    </div>
                    {operator.equipmentInventory && Array.isArray(operator.equipmentInventory) && operator.equipmentInventory.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {operator.equipmentInventory.map((item: any, idx: number) => (
                          <Badge key={idx} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-0">
                            <Wrench className="w-3 h-3 mr-1" />
                            {item.displayName || item}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {operator.services && Array.isArray(operator.services) && operator.services.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Services</h3>
                    <div className="flex flex-wrap gap-2">
                      {operator.services.map((service: string) => (
                        <Badge 
                          key={service} 
                          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 px-3 py-1"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">Verified Operator</p>
                    <p className="text-xs text-green-600 dark:text-green-400">Background checked & insured</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">No reviews yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Be the first to review this operator</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.ratingId} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold">
                              {(review.customerName || "C").charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {review.customerName || "Customer"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          {renderStars(review.rating, 'sm')}
                        </div>
                        {review.review && (
                          <p className="text-gray-700 dark:text-gray-300 text-sm mt-2 leading-relaxed">
                            "{review.review}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="mt-4">
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                {portfolio.length === 0 ? (
                  <div className="text-center py-8">
                    <Image className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">No portfolio items yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">This operator hasn't uploaded any work photos</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {portfolio.map((item) => (
                      <div 
                        key={item.id}
                        className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                        onClick={() => setSelectedImage(item)}
                      >
                        <img 
                          src={item.imageUrl} 
                          alt={item.serviceType}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-white text-sm font-medium truncate">{item.serviceType}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-2xl md:relative md:border-0 md:shadow-none md:bg-transparent md:p-0">
          <Button
            onClick={() => setLocation(`/customer/create-request?operatorId=${operator.operatorId}&operatorName=${encodeURIComponent(operator.name)}`)}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-6 text-lg font-semibold rounded-xl shadow-lg"
            data-testid="button-request-service"
          >
            Request Service
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh] relative">
            <img 
              src={selectedImage.imageUrl} 
              alt={selectedImage.serviceType}
              className="max-w-full max-h-[80vh] rounded-lg object-contain"
            />
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-white font-medium">{selectedImage.serviceType}</p>
              {selectedImage.description && (
                <p className="text-white/70 text-sm mt-1">{selectedImage.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
