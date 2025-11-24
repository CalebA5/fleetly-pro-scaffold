import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { ArrowLeft, MessageCircle, Users, Calendar, TrendingUp } from "lucide-react";

export function CommunityForum() {
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

        <div className="text-center mb-12">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-black dark:text-white" />
          <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
            Community Forum
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Connect with other Fleetly users, share experiences, and get advice from the community
          </p>
        </div>

        <Card className="mb-8 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">Coming Soon!</CardTitle>
            <CardDescription>
              We're building an amazing community platform for Fleetly users
            </CardDescription>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-gray-300">
            <p className="mb-4">
              Our community forum is currently under development. Soon you'll be able to:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Connect with other customers and operators</li>
              <li>Share tips and best practices</li>
              <li>Get advice from experienced users</li>
              <li>Participate in discussions about services and features</li>
              <li>Access exclusive community events and promotions</li>
            </ul>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-black dark:text-white mb-2">Community Members</h3>
              <p className="text-3xl font-bold text-black dark:text-white" data-testid="text-community-members-count">5,000+</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-black dark:text-white mb-2">Discussions</h3>
              <p className="text-3xl font-bold text-black dark:text-white" data-testid="text-discussions-count">1,200+</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Topics created</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-black dark:text-white mb-2">Activity</h3>
              <p className="text-3xl font-bold text-black dark:text-white" data-testid="text-weekly-activity-count">500+</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Posts per week</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">Get Notified When We Launch</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Be the first to know when our community forum goes live. Sign up for email notifications!
            </p>
            <Link href="/help-support">
              <Button
                className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                data-testid="button-notify-launch"
              >
                Contact Us for Updates
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
