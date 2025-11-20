import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ArrowLeft, User, Mail, Phone, MapPin, Edit, Save, X, Calendar, Star, Heart, TrendingUp } from "lucide-react";
import type { Customer, ServiceRequest, Favorite } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";

const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const CustomerProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const customerId = user?.id || "CUST-001";

  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: [`/api/customers/${customerId}`],
  });

  const { data: serviceRequests = [] } = useQuery<ServiceRequest[]>({
    queryKey: ['/api/service-requests'],
  });

  const { data: favorites = [] } = useQuery<Favorite[]>({
    queryKey: [`/api/favorites/${customerId}`],
  });

  const myRequests = serviceRequests.filter(req => req.customerId === customerId);
  const completedRequests = myRequests.filter(req => req.status === 'completed');
  const activeRequests = myRequests.filter(req => ['pending', 'accepted', 'in_progress'].includes(req.status));

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormValues) => 
      apiRequest(`/api/customers/${customerId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}`] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  // Update form when customer data loads
  useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        zipCode: customer.zipCode || "",
      });
    }
  }, [customer, form]);

  const onSubmit = (data: ProfileFormValues) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pb-20 md:pb-0">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-48 w-full mb-8" />
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pb-20 md:pb-0">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Link href="/customer">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Card className="mt-8">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground" data-testid="text-error">
                Profile not found
              </p>
            </CardContent>
          </Card>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pb-20 md:pb-0">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Hero Section */}
        <Card className="mb-8 overflow-hidden border-0 shadow-lg">
          <div className="h-32 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600" />
          <CardContent className="pt-0 pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 md:-mt-12">
              <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4 md:mb-0">
                <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-800 shadow-xl">
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white text-3xl font-bold">
                    {getInitials(customer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="mb-2 md:mb-4">
                  <h1 className="text-3xl font-bold text-black dark:text-white" data-testid="text-page-title">
                    {customer.name}
                  </h1>
                  <div className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="font-mono text-xs md:hidden">
                      {customer.customerId}
                    </Badge>
                    <span className="text-sm">Member since {new Date(parseInt(customer.customerId.split('-')[1])).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="hero"
                  size="lg"
                  data-testid="button-edit-profile"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Requests</p>
                  <p className="text-3xl font-bold text-black dark:text-white">{myRequests.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Completed</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{completedRequests.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Star className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{activeRequests.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Favorites</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">{favorites.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personal Information Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-orange-600" />
              Personal Information
            </CardTitle>
            <CardDescription>
              {isEditing ? "Update your personal details below" : "Your account information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {!isEditing ? (
              <div className="space-y-8">
                {/* Contact Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</p>
                    <p className="text-lg font-semibold flex items-center gap-2 text-black dark:text-white" data-testid="text-name">
                      <User className="w-4 h-4 text-orange-600" />
                      {customer.name}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</p>
                    <p className="text-lg flex items-center gap-2 text-black dark:text-white" data-testid="text-email">
                      <Mail className="w-4 h-4 text-orange-600" />
                      {customer.email}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</p>
                    <p className="text-lg flex items-center gap-2 text-black dark:text-white" data-testid="text-phone">
                      <Phone className="w-4 h-4 text-orange-600" />
                      {customer.phone}
                    </p>
                  </div>
                </div>

                {/* Address Section */}
                <div className="pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-black dark:text-white">
                    <MapPin className="w-5 h-5 text-orange-600" />
                    Location
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-3 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Street Address</p>
                      <p className="text-lg text-black dark:text-white" data-testid="text-address">
                        {customer.address || <span className="text-muted-foreground italic">Not provided</span>}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</p>
                      <p className="text-lg text-black dark:text-white" data-testid="text-city">
                        {customer.city || <span className="text-muted-foreground italic">Not provided</span>}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">State</p>
                      <p className="text-lg text-black dark:text-white" data-testid="text-state">
                        {customer.state || <span className="text-muted-foreground italic">Not provided</span>}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ZIP Code</p>
                      <p className="text-lg text-black dark:text-white" data-testid="text-zip">
                        {customer.zipCode || <span className="text-muted-foreground italic">Not provided</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="space-y-6">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Contact Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Full Name *</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-11" placeholder="John Doe" data-testid="input-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Email Address *</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" className="h-11" placeholder="john@example.com" data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Phone Number *</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-11" placeholder="(555) 123-4567" data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Location Details
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-sm font-semibold">Street Address</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-11" placeholder="123 Main St" data-testid="input-address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">City</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-11" placeholder="New York" data-testid="input-city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">State</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-11" placeholder="NY" data-testid="input-state" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">ZIP Code</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-11" placeholder="10001" data-testid="input-zip" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                    <Button
                      type="submit"
                      variant="hero"
                      size="lg"
                      disabled={updateMutation.isPending}
                      className="w-full sm:w-auto"
                      data-testid="button-save"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateMutation.isPending ? "Saving Changes..." : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={handleCancel}
                      disabled={updateMutation.isPending}
                      className="w-full sm:w-auto"
                      data-testid="button-cancel"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
      <MobileBottomNav />
    </div>
  );
};
