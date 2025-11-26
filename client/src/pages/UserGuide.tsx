import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import {
  ArrowLeft,
  MapPin,
  Search,
  Clock,
  CreditCard,
  MessageSquare,
  Star,
  Sparkles,
  FileText,
  Bell,
  ChevronRight
} from "lucide-react";

export function UserGuide() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/help">
          <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-help">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Help & Support
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
            Customer User Guide
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Everything you need to know about using Fleetly to find and hire professional operators
          </p>
        </div>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-black dark:text-white">
                <MapPin className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  1. Create Your Account
                </h3>
                <p>
                  Sign up with your email and create a secure password. This allows you to save
                  favorite operators, track service requests, and manage your job history.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  2. Enable Location Access
                </h3>
                <p>
                  Allow location permissions so we can show you nearby operators and calculate
                  accurate distances. You can also manually enter an address if you prefer.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  3. Set Up Your Profile
                </h3>
                <p>
                  Add your name and contact information. This speeds up the booking process for
                  future service requests.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-black dark:text-white">
                <Search className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                Finding Operators
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">Browse the Map</h3>
                <p className="mb-2">
                  View all available operators near you on an interactive map. Operators are
                  color-coded by tier:
                </p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>
                    <strong className="text-blue-600 dark:text-blue-400">Blue:</strong> Manual
                    Operators - Basic services (5km radius)
                  </li>
                  <li>
                    <strong className="text-purple-600 dark:text-purple-400">Purple:</strong>{" "}
                    Skilled & Equipped - Advanced equipment (15km radius)
                  </li>
                  <li>
                    <strong className="text-orange-600 dark:text-orange-400">Orange:</strong>{" "}
                    Professional Business - Multi-driver teams (unlimited radius)
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Filter by Service
                </h3>
                <p>
                  Use the service type filters to find operators offering specific services like
                  snow plowing, towing, hauling, or courier delivery.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Check Ratings & Reviews
                </h3>
                <p>
                  Click on any operator to view their full profile, including ratings, reviews from
                  past customers, services offered, and pricing.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-black dark:text-white">
                <Sparkles className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                AI Assist - Smart Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">What is AI Assist?</h3>
                <p>
                  AI Assist analyzes your job description and photos to recommend the most suitable
                  service type and nearby operators with estimated pricing.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">How to Use It</h3>
                <ol className="list-decimal ml-6 space-y-2">
                  <li>Describe your job in natural language</li>
                  <li>Upload photos of the work area (optional but recommended)</li>
                  <li>Click "Get AI Recommendations"</li>
                  <li>Review suggested services, operators, and price estimates</li>
                  <li>Select a recommendation to auto-fill your service request</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-black dark:text-white">
                <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                Requesting a Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Creating a Request
                </h3>
                <ol className="list-decimal ml-6 space-y-2">
                  <li>Select the service type (snow plowing, towing, hauling, or courier)</li>
                  <li>Choose emergency (immediate) or scheduled service</li>
                  <li>Enter your location or use current GPS location</li>
                  <li>Add a detailed description of the work needed</li>
                  <li>Upload photos to help operators assess the job (up to 10 photos)</li>
                  <li>Set your budget range</li>
                  <li>Submit your request to available operators</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-black dark:text-white">
                <MessageSquare className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                Managing Quotes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Receiving Quotes
                </h3>
                <p>
                  After submitting a request, operators will review the details and send you quotes.
                  You'll receive a notification for each quote received.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">Accepting a Quote</h3>
                <p className="mb-2">Click "Accept Quote" to confirm your choice. Once accepted:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>The operator is notified immediately</li>
                  <li>Other quotes are automatically declined</li>
                  <li>The job moves to your "Active Jobs" section</li>
                  <li>You'll see the operator's contact information</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">Declining Quotes</h3>
                <p>
                  If a quote doesn't meet your needs, you can decline it and continue reviewing
                  other quotes or browse alternative operators on the map.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-black dark:text-white">
                <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                Tracking Your Jobs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Real-Time Updates
                </h3>
                <p className="mb-2">Track your job status in real-time from the "My Request" page:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>
                    <strong>Pending:</strong> Waiting for operator quotes
                  </li>
                  <li>
                    <strong>Quoted:</strong> Quotes received, awaiting your decision
                  </li>
                  <li>
                    <strong>Accepted:</strong> Quote accepted, operator confirmed
                  </li>
                  <li>
                    <strong>In Progress:</strong> Operator is working on your job
                  </li>
                  <li>
                    <strong>Completed:</strong> Job finished, ready for review
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">Notifications</h3>
                <p className="mb-2">You'll receive instant notifications for:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>New quotes received</li>
                  <li>Quote acceptance confirmation</li>
                  <li>Job started</li>
                  <li>Job completed</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-black dark:text-white">
                <Star className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                Reviews & Ratings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Leaving a Review
                </h3>
                <p>
                  After a job is completed, you'll be prompted to rate your experience. Your honest
                  feedback helps other customers and improves operator quality.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Review Guidelines
                </h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Be honest and constructive</li>
                  <li>Focus on the service provided</li>
                  <li>Avoid personal attacks or offensive language</li>
                  <li>Mention specific positives and areas for improvement</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">Still Have Questions?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Can't find what you're looking for? Contact our support team for personalized help.
            </p>
            <Link href="/help">
              <Button
                className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                data-testid="button-contact-support"
              >
                Contact Support
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
