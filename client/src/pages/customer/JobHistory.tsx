import React, { useState } from "react";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BackButton } from "@/components/BackButton";
import { Search, Download, Star, Calendar, MapPin } from "lucide-react";

const mockJobs = [
  {
    id: "JOB-2024-001",
    service: "Snow Plowing",
    operator: "Mike's Snow Service",
    date: "2024-01-15",
    location: "123 Main Street",
    status: "completed",
    total: 95.00,
    rating: 5,
    photos: ["before.jpg", "after.jpg"],
  },
  {
    id: "JOB-2024-002", 
    service: "Towing",
    operator: "QuickTow Express",
    date: "2024-01-10",
    location: "Highway 101",
    status: "completed",
    total: 185.50,
    rating: 4,
    photos: ["pickup.jpg"],
  },
  {
    id: "JOB-2024-003",
    service: "Courier",
    operator: "FastTrack Delivery",
    date: "2024-01-08",
    location: "Downtown Business District",
    status: "completed", 
    total: 45.00,
    rating: 5,
    photos: ["delivery.jpg"],
  },
  {
    id: "JOB-2024-004",
    service: "Hauling",
    operator: "Heavy Lift Hauling",
    date: "2024-01-05",
    location: "Industrial Zone",
    status: "cancelled",
    total: 0,
    rating: null,
    photos: [],
  },
];

export const JobHistory = () => {
  const [jobs] = useState(mockJobs);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesService = serviceFilter === "all" || job.service === serviceFilter;
    
    return matchesSearch && matchesStatus && matchesService;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success";
      case "cancelled": return "bg-destructive";
      case "in_progress": return "bg-warning";
      default: return "bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      case "in_progress": return "In Progress";
      default: return "Unknown";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-muted-foreground">Not rated</span>;
    
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted"
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({rating})</span>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link to="/customer">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Job History</h1>
          <p className="text-muted-foreground">View your past services and receipts</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-8 animate-fade-in">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
              </SelectContent>
            </Select>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="Snow Plowing">Snow Plowing</SelectItem>
                <SelectItem value="Towing">Towing</SelectItem>
                <SelectItem value="Courier">Courier</SelectItem>
                <SelectItem value="Hauling">Hauling</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Showing {filteredJobs.length} of {jobs.length} jobs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job List */}
      <div className="space-y-4">
        {filteredJobs.map((job, index) => (
          <Card 
            key={job.id} 
            className="animate-slide-up hover:shadow-md transition-shadow"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Job Info */}
                <div className="lg:col-span-2">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{job.service}</h3>
                      <p className="text-muted-foreground">{job.operator}</p>
                    </div>
                    <Badge className={getStatusColor(job.status)}>
                      {getStatusText(job.status)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(job.date)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{job.location}</span>
                    </div>
                  </div>
                </div>

                {/* Rating & Photos */}
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium mb-1">Rating</p>
                    {renderStars(job.rating)}
                  </div>
                  {job.photos.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Photos</p>
                      <p className="text-sm text-muted-foreground">
                        {job.photos.length} photo{job.photos.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>

                {/* Total & Actions */}
                <div className="text-right space-y-2">
                  <div>
                    <p className="text-2xl font-bold text-accent">
                      ${job.total.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      View Receipt
                    </Button>
                    {job.status === "completed" && !job.rating && (
                      <Button variant="secondary" size="sm" className="w-full">
                        Rate Service
                      </Button>
                    )}
                    {job.status === "completed" && (
                      <Button variant="ghost" size="sm" className="w-full">
                        Book Again
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredJobs.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">No jobs found matching your criteria.</p>
              <Link to="/customer">
                <Button variant="outline" className="mt-4">
                  Book Your First Service
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};