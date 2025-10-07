import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import IndeedJobSearch from '../../components/IndeedJobSearch.jsx';
import { jobService, applicationService, analyticsService } from '../../services';
import { BadgeCheck, PlusCircle, User, Briefcase, Clock, MapPin } from 'lucide-react';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    newApplications: 0,
    interviewed: 0
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [diversityMetrics, setDiversityMetrics] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    // Update page title with recruiter name
    if (user?.full_name) {
      document.title = `${user.full_name} - Recruiter Dashboard | SkillMatch AI`;
    } else {
      document.title = 'Recruiter Dashboard | SkillMatch AI';
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get data with individual error handling to prevent one failure from breaking everything
      const [statsRes, jobsRes, applicationsRes, metricsRes] = await Promise.allSettled([
        analyticsService.getDashboard().catch(e => ({ success: false, error: e })),
        jobService.getMyJobs().catch(e => ({ success: false, error: e })),
        applicationService.getRecentApplications().catch(e => ({ success: false, error: e })),
        analyticsService.getBiasReport().catch(e => ({ success: false, error: e }))
      ]);

      // Extract results from Promise.allSettled
      const stats = statsRes.status === 'fulfilled' ? statsRes.value : { success: false };
      const jobs = jobsRes.status === 'fulfilled' ? jobsRes.value : { success: false };
      const applications = applicationsRes.status === 'fulfilled' ? applicationsRes.value : { success: false };
      const metrics = metricsRes.status === 'fulfilled' ? metricsRes.value : { success: false };

      // Initialize stats first
      let initialStats = {
        activeJobs: 0,
        totalApplications: 0,
        newApplications: 0,
        interviewed: 0
      };

      if (jobs.success) {
        const jobsData = jobs.data || [];
        setRecentJobs(jobsData.slice(0, 5));
        
        // Update active jobs count from actual jobs data
        initialStats.activeJobs = jobsData.filter(job => job.status === 'active').length;
        
        // Count applications from jobs data
        let totalApps = 0;
        let newApps = 0;
        let interviewed = 0;
        
        jobsData.forEach(job => {
          if (job.applications_count) {
            totalApps += job.applications_count;
          }
          if (job.new_applications_count) {
            newApps += job.new_applications_count;
          }
          if (job.interviewed_count) {
            interviewed += job.interviewed_count;
          }
        });
        
        initialStats.totalApplications = totalApps;
        initialStats.newApplications = newApps;
        initialStats.interviewed = interviewed;
      } else {
        console.log('Failed to load jobs:', jobs.error);
      }

      if (applications.success) {
        const applicationsData = applications.data || [];
        setRecentApplications(applicationsData.slice(0, 5));
        
        // Update stats with applications data if available
        if (applicationsData.length > 0) {
          initialStats.totalApplications = applicationsData.length;
          initialStats.newApplications = applicationsData.filter(app => app.status === 'pending').length;
          initialStats.interviewed = applicationsData.filter(app => app.status === 'interviewed').length;
        }
      } else {
        console.log('Failed to load applications:', applications.error);
      }

      // Set the final stats
      setStats(initialStats);

      if (metrics.success) {
        setDiversityMetrics(metrics.data);
      } else {
        console.log('Failed to load diversity metrics:', metrics.error);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.full_name || 'Recruiter'}
            </h1>
            <p className="text-gray-600">
              {user?.company && (
                <span className="inline-flex items-center mr-3">
                  <Briefcase className="mr-1 h-4 w-4" />
                  {user.company}
                </span>
              )}
              Manage your job postings and applicants
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Link to="/recruiter/post-job">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Post New Job
              </Button>
            </Link>
          </div>
        </div>

        {/* Recruiter Profile Card */}
        {user && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{user.full_name}</h3>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      {user.company && (
                        <span className="flex items-center">
                          <Briefcase className="mr-1 h-4 w-4" />
                          {user.company}
                        </span>
                      )}
                      {user.location && (
                        <span className="flex items-center">
                          <MapPin className="mr-1 h-4 w-4" />
                          {user.location}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        Recruiter
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Member since</p>
                  <p className="text-sm font-medium">
                    {user.created_at ? formatDate(user.created_at) : 'Recently'}
                  </p>
                </div>
              </div>
              {user.bio && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm text-gray-700">{user.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Active Jobs</p>
                  <p className="text-2xl font-bold">{stats.activeJobs}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Applications</p>
                  <p className="text-2xl font-bold">{stats.totalApplications}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <User className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">New Applications</p>
                  <p className="text-2xl font-bold">{stats.newApplications}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Interviewed</p>
                  <p className="text-2xl font-bold">{stats.interviewed}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <BadgeCheck className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" className="mt-6 mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="indeed">Indeed Integration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Jobs */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Job Postings</CardTitle>
                  <CardDescription>Your most recently posted jobs</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentJobs.length > 0 ? (
                    <div className="space-y-4">
                      {recentJobs.map(job => (
                        <Link 
                          to={`/recruiter/jobs/${job.id}`} 
                          key={job.id}
                          className="block"
                        >
                          <div className="border rounded-lg p-4 hover:bg-gray-50 transition">
                            <div className="flex justify-between">
                              <h3 className="font-medium">{job.title}</h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Posted {formatDate(job.created_at)} • {job.applications_count || 0} applications
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500 mb-4">You haven't posted any jobs yet</p>
                      <Link to="/recruiter/post-job">
                        <Button>Post Your First Job</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
                {recentJobs.length > 0 && (
                  <CardFooter>
                    <Link to="/recruiter/jobs" className="text-blue-600 hover:underline text-sm">
                      View all job postings
                    </Link>
                  </CardFooter>
                )}
              </Card>

              {/* Recent Applications */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Applications</CardTitle>
                  <CardDescription>Recently received job applications</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentApplications.length > 0 ? (
                    <div className="space-y-4">
                      {recentApplications.map(app => (
                        <Link 
                          to={`/recruiter/applications/${app.id}`} 
                          key={app.id}
                          className="block"
                        >
                          <div className="border rounded-lg p-4 hover:bg-gray-50 transition">
                            <div className="flex justify-between">
                              <div>
                                <h3 className="font-medium">{app.candidate?.full_name || app.candidate?.name || 'Unknown Candidate'}</h3>
                                <p className="text-sm text-gray-500">Applied for: {app.job?.title || 'Unknown Position'}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                app.status === 'interview' ? 'bg-green-100 text-green-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Applied {formatDate(app.created_at)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No applications received yet</p>
                    </div>
                  )}
                </CardContent>
                {recentApplications.length > 0 && (
                  <CardFooter>
                    <Link to="/recruiter/applications" className="text-blue-600 hover:underline text-sm">
                      View all applications
                    </Link>
                  </CardFooter>
                )}
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Job Performance Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Performance</CardTitle>
                  <CardDescription>Analytics for your job postings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Applications per Job</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="space-y-2">
                          {recentJobs.slice(0, 3).map(job => (
                            <div key={job.id || job._id} className="flex items-center">
                              <div className="w-32 truncate mr-2">
                                <span className="text-xs">{job.title}</span>
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-blue-500 h-full" 
                                    style={{ width: `${Math.min((job.applications_count || 0) * 5, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                              <span className="ml-2 text-xs font-medium">{job.applications_count || 0}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Conversion Rate</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Views</p>
                          <p className="font-bold">{stats.total_views || 0}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Applications</p>
                          <p className="font-bold">{stats.totalApplications}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Conversion</p>
                          <p className="font-bold">
                            {stats.total_views ? ((stats.totalApplications / stats.total_views) * 100).toFixed(1) : 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Time to Fill (Days)</h3>
                      <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-3xl font-bold">{stats.avg_time_to_fill || 0}</span>
                          <p className="text-xs text-gray-500 mt-1">Average days to fill positions</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Candidate Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Candidate Analytics</CardTitle>
                  <CardDescription>Insights about your applicant pool</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Candidate Source</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="h-4 bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div className="bg-blue-500 h-full" style={{ width: '45%' }}></div>
                          <div className="bg-green-500 h-full float-left" style={{ width: '30%' }}></div>
                          <div className="bg-purple-500 h-full float-left" style={{ width: '15%' }}></div>
                          <div className="bg-yellow-500 h-full float-left" style={{ width: '10%' }}></div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs mt-3">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-1 bg-blue-500"></div>
                            <span>Direct: 45%</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-1 bg-green-500"></div>
                            <span>Referrals: 30%</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-1 bg-purple-500"></div>
                            <span>Job Boards: 15%</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-1 bg-yellow-500"></div>
                            <span>Social: 10%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Application Status</h3>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <p className="text-xs text-gray-500">New</p>
                          <p className="font-bold">{stats.newApplications}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Reviewed</p>
                          <p className="font-bold">{stats.reviewed_applications || 0}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Interviewed</p>
                          <p className="font-bold">{stats.interviewed}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Hired</p>
                          <p className="font-bold">{stats.hired_count || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Top Candidate Skills</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="space-y-2">
                          {['JavaScript', 'React', 'Python', 'Machine Learning', 'SQL'].map((skill, idx) => (
                            <div key={skill} className="flex items-center">
                              <div className="w-32 truncate mr-2">
                                <span className="text-xs">{skill}</span>
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-green-500 h-full" 
                                    style={{ width: `${90 - (idx * 15)}%` }}
                                  ></div>
                                </div>
                              </div>
                              <span className="ml-2 text-xs font-medium">{90 - (idx * 15)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="indeed">
            <IndeedJobSearch />
          </TabsContent>
        </Tabs>
        
        {/* Diversity Metrics */}
        {diversityMetrics && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Diversity Metrics</CardTitle>
                <CardDescription>Analysis of candidate diversity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Gender Distribution</h3>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      {diversityMetrics.gender_diversity?.map((item, idx) => (
                        <div
                          key={`gender-bar-${item.label || idx}`}
                          className={`h-full float-left ${
                            idx === 0 ? 'bg-blue-500' : 
                            idx === 1 ? 'bg-pink-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs">
                      {diversityMetrics.gender_diversity?.map((item, idx) => (
                        <div key={`gender-${item.label || idx}`} className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-1 ${
                            idx === 0 ? 'bg-blue-500' : 
                            idx === 1 ? 'bg-pink-500' : 'bg-purple-500'
                          }`}></div>
                          <span>{item.label}: {item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Experience Level</h3>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      {diversityMetrics.experience_distribution?.map((item, idx) => (
                        <div
                          key={`experience-bar-${item.label || idx}`}
                          className={`h-full float-left ${
                            idx === 0 ? 'bg-green-500' : 
                            idx === 1 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs">
                      {diversityMetrics.experience_distribution?.map((item, idx) => (
                        <div key={`experience-${item.label || idx}`} className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-1 ${
                            idx === 0 ? 'bg-green-500' : 
                            idx === 1 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span>{item.label}: {item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Educational Background</h3>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      {diversityMetrics.education_distribution?.map((item, idx) => (
                        <div
                          key={`education-bar-${item.label || idx}`}
                          className={`h-full float-left ${
                            idx === 0 ? 'bg-indigo-500' : 
                            idx === 1 ? 'bg-orange-500' : 
                            idx === 2 ? 'bg-cyan-500' : 'bg-gray-500'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs">
                      {diversityMetrics.education_distribution?.map((item, idx) => (
                        <div key={`education-${item.label || idx}`} className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-1 ${
                            idx === 0 ? 'bg-indigo-500' : 
                            idx === 1 ? 'bg-orange-500' : 
                            idx === 2 ? 'bg-cyan-500' : 'bg-gray-500'
                          }`}></div>
                          <span>{item.label}: {item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link to="/recruiter/diversity-analysis" className="text-blue-600 hover:underline text-sm">
                  View detailed diversity report
                </Link>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterDashboard;