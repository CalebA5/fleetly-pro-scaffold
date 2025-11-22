import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { ArrowLeft, UserCheck, TrendingUp, Briefcase, MapPin, Smartphone, Award } from "lucide-react";

export function OperatorGuide() {
  const sections = [
    {
      icon: UserCheck,
      title: "Getting Started",
      content: "Click 'Drive & Earn' to create an operator account. Choose your tier (Manual, Equipped, or Professional), complete your profile with services and vehicle details, and go online to start receiving requests."
    },
    {
      icon: MapPin,
      title: "Location & Availability",
      content: "Set your home location and operating radius. Customers will only see you in requests within your area. Update your availability status to control when you receive job requests."
    },
    {
      icon: Smartphone,
      title: "Managing Requests",
      content: "Receive notifications for nearby jobs matching your services. Review details, photos, and requirements before accepting or declining. Chat directly with customers to clarify job details."
    },
    {
      icon: Briefcase,
      title: "Completing Jobs",
      content: "Navigate to job locations using your preferred navigation app. Complete work professionally and confirm job completion in the app. Communication stays transparent throughout."
    },
    {
      icon: TrendingUp,
      title: "Growing Your Business",
      content: "Build your reputation through excellent service. Higher ratings lead to more job opportunities. Subscribe to additional tiers to access premium job requests and features."
    },
    {
      icon: Award,
      title: "Tier System",
      content: "Manual Tier: Entry-level, basic services. Equipped Tier: Professional with equipment. Professional Tier: Full business management. Upgrade anytime to expand your capabilities."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/help">
          <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-help">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Help
          </Button>
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-4">Operator Guide</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Learn how to become a Fleetly operator and grow your service business.
          </p>
        </div>

        <div className="grid gap-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-black dark:text-white">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300">{section.content}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">Ready to Start?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Join thousands of operators earning on Fleetly. Click the 'Drive & Earn' button in the header to get started.
            </p>
            <Link href="/operator/onboarding">
              <Button className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200" data-testid="button-start-earning">
                Start Earning
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
