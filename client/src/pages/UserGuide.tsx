import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { ArrowLeft, MapPin, Search, Clock, CreditCard, MessageSquare, Star } from "lucide-react";

export function UserGuide() {
  const sections = [
    {
      icon: Search,
      title: "Finding Services",
      content: "Browse our service categories or use AI Assist to get personalized recommendations. The interactive map shows available operators near you with real-time availability."
    },
    {
      icon: MapPin,
      title: "Location Setup",
      content: "Enable location services for accurate operator matching. Your location is used to find nearby operators and provide weather alerts for your area."
    },
    {
      icon: Clock,
      title: "Booking Services",
      content: "Select an operator and submit your request. You can choose immediate service or schedule for later. Include photos or descriptions for better operator estimates."
    },
    {
      icon: MessageSquare,
      title: "Communication",
      content: "Chat with operators directly through the app. Discuss job details, pricing, and any special requirements before service begins."
    },
    {
      icon: CreditCard,
      title: "Payment",
      content: "Pay securely after job completion. We support multiple payment methods and all transactions are protected by our guarantee."
    },
    {
      icon: Star,
      title: "Ratings & Reviews",
      content: "Rate your experience after service completion. Your feedback helps other customers and improves our operator community."
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
          <h1 className="text-4xl font-bold text-black dark:text-white mb-4">Customer User Guide</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Learn how to use Fleetly to get the services you need, when you need them.
          </p>
        </div>

        <div className="grid gap-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-black dark:text-white">
                    <Icon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
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

        <Card className="mt-8 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">Need More Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Can't find what you're looking for? Contact our support team or check out our FAQ section.
            </p>
            <Link href="/help">
              <Button className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200" data-testid="button-contact-support">
                Contact Support
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
