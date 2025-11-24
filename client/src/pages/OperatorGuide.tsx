import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import {
  ArrowLeft,
  Shield,
  Truck,
  DollarSign,
  Star,
  Users,
  MapPin,
  Bell,
  FileText
} from "lucide-react";

export function OperatorGuide() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/help-support">
          <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-help">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Help & Support
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
            Operator Guide
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Everything you need to know about driving and earning with Fleetly
          </p>
        </div>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-black dark:text-white">
                <Truck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                Getting Started as an Operator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  1. Choose Your Tier
                </h3>
                <p className="mb-2">Select the tier that best matches your skills and equipment:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong className="text-blue-600 dark:text-blue-400">Manual Tier:</strong> Basic services with hand tools (5km operating radius)</li>
                  <li><strong className="text-purple-600 dark:text-purple-400">Skilled & Equipped Tier:</strong> Advanced equipment like plows and tow trucks (15km radius)</li>
                  <li><strong className="text-orange-600 dark:text-orange-400">Professional Business Tier:</strong> Multi-driver teams with fleet management (unlimited radius)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  2. Complete Tier Onboarding
                </h3>
                <p>Provide required information for your chosen tier, including services offered, pricing, availability, and verification documents.</p>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  3. Await Verification
                </h3>
                <p>Our team will review your submission within 24-48 hours. You'll receive an email notification once approved.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-black dark:text-white">
                <Shield className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                Verification & Approval
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  What We Verify
                </h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Business license or DBA (if applicable)</li>
                  <li>Insurance certificates</li>
                  <li>Driver's license and vehicle registration</li>
                  <li>Equipment certifications (for equipped tier)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Dashboard Access During Review
                </h3>
                <p>You can access your tier dashboard while verification is pending, but you cannot go online to receive jobs until your tier is approved.</p>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Adding More Tiers
                </h3>
                <p>You can add additional tiers at any time from the "Drive & Earn" page. Each tier requires separate verification.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-black dark:text-white">
                <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                Receiving & Managing Jobs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Going Online
                </h3>
                <p>Toggle the "Go Online" switch in your dashboard to start receiving job requests. You can only work on one tier at a time.</p>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Job Notifications
                </h3>
                <p>When customers send requests matching your services and location, you'll receive notifications with job details, budget, and customer information.</p>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Submitting Quotes
                </h3>
                <p className="mb-2">Review each request and submit a quote including:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Total price breakdown</li>
                  <li>Estimated completion time</li>
                  <li>Optional notes (e.g., special equipment needed)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Quote Expiry
                </h3>
                <p>Quotes expire after 12 hours. If a customer doesn't respond, the quote is automatically withdrawn.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-black dark:text-white">
                <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                Completing Jobs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Quote Acceptance
                </h3>
                <p>When a customer accepts your quote, you'll receive a notification. The job moves to your "Active Jobs" section with customer contact details.</p>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Job Progress Tracking
                </h3>
                <p className="mb-2">Update job status as you work:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Accepted:</strong> Quote accepted by customer</li>
                  <li><strong>En Route:</strong> Traveling to job site</li>
                  <li><strong>In Progress:</strong> Actively working</li>
                  <li><strong>Completed:</strong> Work finished</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Job Completion
                </h3>
                <p>Mark the job as complete when finished. Earnings are automatically tracked and added to your daily totals.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-black dark:text-white">
                <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                Earnings & Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Tracking Earnings
                </h3>
                <p>View today's earnings, monthly totals, and lifetime statistics directly in your dashboard. All earnings are stored persistently across sessions.</p>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Customer Group Unlocks
                </h3>
                <p>Complete 5 jobs per tier to unlock access to "Nearby Customer Groups" - a gamified feature that helps you find repeat business.</p>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Payment Schedule
                </h3>
                <p>Earnings are transferred to your bank account weekly on Fridays via direct deposit.</p>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Job History
                </h3>
                <p>Access your complete job history from the "Job History" page, with filters for date range and earnings summaries.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-black dark:text-white">
                <Star className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                Building Your Reputation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Customer Reviews
                </h3>
                <p>After completing a job, customers can rate your service with stars and written feedback. High ratings increase your visibility to customers.</p>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Tips for Success
                </h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Respond to requests promptly</li>
                  <li>Provide accurate quotes with clear pricing</li>
                  <li>Communicate proactively with customers</li>
                  <li>Complete jobs on time and professionally</li>
                  <li>Upload clear photos of completed work</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Professional Certification
                </h3>
                <p>Operators with verified certifications receive a "Certified" badge on their profile, increasing customer trust and booking rates.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-black dark:text-white">
                <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                Business Tier Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Multi-Driver Management
                </h3>
                <p>Add and manage multiple drivers from your business dashboard. Assign incoming requests to specific drivers based on availability and skills.</p>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Fleet Management
                </h3>
                <p>Track all vehicles in your fleet, including make, model, capacity, and current assignment status.</p>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Team Analytics
                </h3>
                <p>View team performance metrics including total earnings, jobs completed, average ratings, and driver comparisons.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-black dark:text-white">
                <MapPin className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                Operating Radius & Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Tier-Based Radius
                </h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Manual:</strong> Receive requests within 5km of your home location</li>
                  <li><strong>Equipped:</strong> Receive requests within 15km of your home location</li>
                  <li><strong>Professional:</strong> No radius limit - receive all requests in your service area</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-2">
                  Setting Your Location
                </h3>
                <p>During onboarding, enter your home or business address. This is used to calculate job proximity and cannot be changed after verification (contact support if relocation is needed).</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">Ready to Start Earning?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Join thousands of operators earning on their own schedule with Fleetly.
            </p>
            <Link href="/drive-earn">
              <Button
                className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 mr-4"
                data-testid="button-drive-earn"
              >
                Drive & Earn
              </Button>
            </Link>
            <Link href="/help-support">
              <Button variant="outline" data-testid="button-contact-support">
                Contact Support
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
