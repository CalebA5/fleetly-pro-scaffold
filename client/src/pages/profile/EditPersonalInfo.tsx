import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Mail, Phone, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Operator } from "@shared/schema";

export const EditPersonalInfo = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const urlParams = new URLSearchParams(window.location.search);
  const fromRoute = urlParams.get("from") || "/profile";

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const { data: operatorData, isLoading } = useQuery<Operator>({
    queryKey: user?.operatorId ? [`/api/operators/by-id/${user.operatorId}`] : [],
    enabled: !!user?.operatorId,
  });

  useEffect(() => {
    if (user && operatorData) {
      setFormData({
        name: user.name || "",
        phone: operatorData.phone || "",
      });
    } else if (user) {
      setFormData({
        name: user.name || "",
        phone: "",
      });
    }
  }, [user, operatorData]);

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string }) => {
      if (user?.operatorId) {
        await apiRequest(`/api/operators/${user.operatorId}`, {
          method: "PATCH",
          body: JSON.stringify({ phone: data.phone }),
        });
      }
      await apiRequest(`/api/users/${user?.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: data.name }),
      });
      return data;
    },
    onSuccess: (data) => {
      updateUser({ name: data.name });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      if (user?.operatorId) {
        queryClient.invalidateQueries({ queryKey: [`/api/operators/by-id/${user.operatorId}`] });
      }
      toast({
        title: "Profile Updated",
        description: "Your personal information has been saved.",
      });
      navigate(fromRoute);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    navigate(fromRoute);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-4 max-w-lg">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to edit your profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-4 max-w-lg">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-3 -ml-2" 
            data-testid="button-back" 
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
            Edit Personal Info
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Update your name and contact details
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  data-testid="input-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  Email
                </Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                  data-testid="input-email"
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  data-testid="input-phone"
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={updateMutation.isPending}
                  data-testid="button-save"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};
