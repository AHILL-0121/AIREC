import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { applicationService, jobService, resumeService } from '../../services';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Download, ExternalLink, CheckCircle, Clock, XCircle, Eye, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Applications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [downloadingResume, setDownloadingResume] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get recruiter's jobs
      const jobsResponse = await jobService.getMyJobs();
      if (jobsResponse.success) {
        setJobs(jobsResponse.data);
      }

      // Get all applications using the working endpoint
      const appResponse = await applicationService.getRecentApplications();
      if (appResponse.success) {
        const applicationsData = appResponse.data || [];
        // The backend already includes job and candidate info, so we just need to format it
        const formattedApplications = applicationsData.map(app => ({
          ...app,
          job_title: app.job?.title || 'Unknown Position',
          job_company: app.job?.company || 'Unknown Company',
          candidate_name: app.candidate?.full_name || app.candidate?.name || 'Unknown Candidate',
          candidate_email: app.candidate?.email || 'No email',
          application_date: app.created_at
        }));
        
        setApplications(formattedApplications);
      } else {
        console.error('Failed to load applications:', appResponse.error);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const response = await applicationService.updateApplicationStatus(applicationId, newStatus);
      
      if (response.success) {
        // Update the application status in the UI
        setApplications(applications.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        ));
        
        toast.success(`Application status changed to ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("There was a problem updating the application status");
    }
  };

  const handleDownloadResume = async (candidateId, candidateName) => {
    setDownloadingResume(prev => ({ ...prev, [candidateId]: true }));
    try {
      const response = await resumeService.downloadCandidateResume(candidateId);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${candidateName}_resume.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Resume downloaded successfully');
    } catch (error) {
      console.error('Error downloading resume:', error);
      if (error.response?.status === 404) {
        toast.error('Resume not found for this candidate');
      } else {
        toast.error('Failed to download resume');
      }
    } finally {
      setDownloadingResume(prev => ({ ...prev, [candidateId]: false }));
    }
  };

  const handleViewProfile = (candidateId) => {
    navigate(`/recruiter/candidate-profile/${candidateId}`);
  };

  // Filter applications based on selected job and status
  const filteredApplications = applications.filter(app => {
    const jobMatch = selectedJob === "all" || app.job_id === selectedJob;
    const statusMatch = statusFilter === "all" || app.status === statusFilter;
    return jobMatch && statusMatch;
  });

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'reviewed':
        return <CheckCircle className="h-4 w-4" />;
      case 'interview':
        return <ExternalLink className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Applications</h1>
          <p className="text-gray-600">Review and process candidate applications</p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="w-full sm:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Job
            </label>
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger>
                <SelectValue placeholder="Select Job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredApplications.length > 0 ? (
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Applications</CardTitle>
              <CardDescription>
                {filteredApplications.length} applications found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Date Applied</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{app.candidate?.full_name || 'Anonymous'}</div>
                          <div className="text-sm text-gray-500">{app.candidate?.email || 'No email'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link to={`/jobs/${app.job_id}`} className="hover:underline">
                          {app.job_title}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(app.created_at)}</TableCell>
                      <TableCell>
                        <div className={`px-2.5 py-0.5 rounded-full text-xs inline-flex items-center font-medium ${getStatusBadgeClass(app.status)}`}>
                          {getStatusIcon(app.status)}
                          <span className="ml-1">
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProfile(app.candidate_id)}
                            disabled={!app.candidate_id}
                          >
                            <User className="h-3.5 w-3.5 mr-1" />
                            Profile
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadResume(app.candidate_id, app.candidate?.full_name || 'candidate')}
                            disabled={!app.candidate_id || downloadingResume[app.candidate_id]}
                          >
                            {downloadingResume[app.candidate_id] ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="h-3.5 w-3.5 mr-1" />
                                Resume
                              </>
                            )}
                          </Button>
                          
                          <Select
                            value={app.status}
                            onValueChange={(value) => handleStatusChange(app.id, value)}
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="reviewed">Reviewed</SelectItem>
                              <SelectItem value="interview">Interview</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="accepted">Accepted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">No applications found</h3>
            <p className="mt-2 text-gray-500">
              There are no applications matching your current filters.
            </p>
            <Button 
              className="mt-4"
              onClick={() => {
                setSelectedJob("all");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;