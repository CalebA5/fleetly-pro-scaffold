import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { ArrowLeft, MessageCircle, Users, Lightbulb, Heart } from "lucide-react";

export function CommunityForum() {
  const threads = [
    {
      title: "Tips for Winter Snow Plowing",
      category: "Operators",
      replies: 342,
      author: "SnowPro2024"
    },
    {
      title: "Best Practices for Customer Communication",
      category: "Best Practices",
      replies: 189,
      author: "OpExpert"
    },
    {
      title: "New Equipment? Share Your Setup",
      category: "Equipment",
      replies: 156,
      author: "TechTruck"
    },
    {
      title: "Getting 5-Star Ratings Consistently",
      category: "Tips & Tricks",
      replies: 284,
      author: "TopRated"
    },
    {
      title: "Community Event Announcement",
      category: "Events",
      replies: 98,
      author: "FleetlyTeam"
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
          <h1 className="text-4xl font-bold text-black dark:text-white mb-4">Community Forum</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Connect with other operators and customers. Share tips, ask questions, and learn from the Fleetly community.
          </p>
        </div>

        {/* Forum Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
              <div className="text-2xl font-bold text-black dark:text-white">5,234</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Members</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
              <div className="text-2xl font-bold text-black dark:text-white">18,456</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Posts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-red-600 dark:text-red-400" />
              <div className="text-2xl font-bold text-black dark:text-white">12,789</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Helpful Answers</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Threads */}
        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">Popular Discussions</h2>
        <div className="space-y-3">
          {threads.map((thread, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-black dark:text-white mb-1">{thread.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs font-medium">
                        {thread.category}
                      </span>
                      <span>Started by {thread.author}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-black dark:text-white">{thread.replies}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">replies</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <Card className="mt-8 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/30 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-black dark:text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Join the Conversation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Have a question or tip to share? Join our forum community and connect with operators and customers worldwide.
            </p>
            <Button className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200" data-testid="button-visit-forum">
              Visit Full Forum
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
