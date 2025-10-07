import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { applicationService } from '../../services';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { SearchIcon, FilterIcon } from 'lucide-react';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  interview: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  accepted: 'bg-blue-100 text-blue-800',
  withdrawn: 'bg-gray-100 text-gray-800'
};

const Applications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateSort, setDateSort] = useState('newest');
  
  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationService.getUserApplications();
      
      if (response.success) {
        setApplications(response.data || []);
      } else {
        setError('Failed to load applications');
      }
    } catch (err) {
      setError('Error loading application data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Filter and sort applications
  const filteredApplications = applications
    .filter(app => {
      // Apply status filter
      if (statusFilter !== 'all' && app.status !== statusFilter) {
        return false;
      }
      
      // Apply search filter
      if (searchTerm && 
          !app.job_title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !app.company.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by date
      if (dateSort === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else {
        return new Date(a.created_at) - new Date(b.created_at);
      }
    });

  // Handle status change
  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const response = await applicationService.updateApplicationStatus(applicationId, newStatus);
      
      if (response.success) {
        // Update the application in the local state
        setApplications(prevApplications => 
          prevApplications.map(app => 
            app._id === applicationId ? { ...app, status: newStatus } : app
          )
        );
      }
    } catch (error) {
      console.error('Failed to update application status:', error);
    }
  };

  // Application count by status
  const getStatusCounts = () => {
    const counts = {
      total: applications.length,
      pending: 0,
      interview: 0,
      rejected: 0,
      accepted: 0,
      withdrawn: 0
    };
    
    applications.forEach(app => {
      if (counts[app.status] !== undefined) {
        counts[app.status]++;
      }
    });
    
    return counts;
  };
  
  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
            <p className="text-gray-600">Track and manage your job applications</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Link to="/jobs">
              <Button>Find More Jobs</Button>
            </Link>
          </div>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Card className={statusFilter === 'all' ? 'ring-2 ring-blue-500' : ''}>
            <CardContent className="pt-6" onClick={() => setStatusFilter('all')}>
              <div className="text-2xl font-bold">{statusCounts.total}</div>
              <p className="text-muted-foreground text-sm">All Applications</p>
            </CardContent>
          </Card>
          
          <Card className={statusFilter === 'pending' ? 'ring-2 ring-blue-500' : ''}>
            <CardContent className="pt-6" onClick={() => setStatusFilter('pending')}>
              <div className="text-2xl font-bold">{statusCounts.pending}</div>
              <p className="text-muted-foreground text-sm">Pending</p>
            </CardContent>
          </Card>
          
          <Card className={statusFilter === 'interview' ? 'ring-2 ring-blue-500' : ''}>
            <CardContent className="pt-6" onClick={() => setStatusFilter('interview')}>
              <div className="text-2xl font-bold">{statusCounts.interview}</div>
              <p className="text-muted-foreground text-sm">Interview</p>
            </CardContent>
          </Card>
          
          <Card className={statusFilter === 'accepted' ? 'ring-2 ring-blue-500' : ''}>
            <CardContent className="pt-6" onClick={() => setStatusFilter('accepted')}>
              <div className="text-2xl font-bold">{statusCounts.accepted}</div>
              <p className="text-muted-foreground text-sm">Accepted</p>
            </CardContent>
          </Card>
          
          <Card className={statusFilter === 'rejected' ? 'ring-2 ring-blue-500' : ''}>
            <CardContent className="pt-6" onClick={() => setStatusFilter('rejected')}>
              <div className="text-2xl font-bold">{statusCounts.rejected}</div>
              <p className="text-muted-foreground text-sm">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <div className="w-40">
                <Select value={dateSort} onValueChange={setDateSort}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredApplications.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied On
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((app) => (
                  <tr key={app._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{app.job_title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{app.company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(app.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Select
                        value={app.status}
                        onValueChange={(value) => handleStatusChange(app._id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue>
                            <span className={`px-2 py-1 text-xs rounded-full ${statusColors[app.status]}`}>
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="withdrawn">Withdrawn</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Link to={`/jobs/${app.job_id}`}>
                          <Button variant="outline" size="sm">View Job</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No applications found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all'
                ? "Try adjusting your search filters"
                : "You haven't applied to any jobs yet"}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link to="/jobs">
                <Button>Browse Available Jobs</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;