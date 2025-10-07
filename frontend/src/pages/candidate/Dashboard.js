import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsService, jobService, profileService } from '../../services';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Briefcase, Upload, Target, TrendingUp, LogOut, User, Edit, FileText, Award, Building, MapPin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { toast } from 'sonner';

const CandidateDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const promises = [
        analyticsService.getDashboard(),
        jobService.getRecommendations()
      ];
      
      // Only fetch profile if user ID is available
      if (user?.id) {
        promises.push(profileService.getProfile(user.id));
      }
      
      const [statsRes, recsRes, profileRes] = await Promise.all(promises);

      if (statsRes.success) {
        setStats(statsRes.data);
      }

      if (recsRes.success) {
        setRecommendations(recsRes.data.slice(0, 5));
      }
      
      // Handle profile response only if we fetched it
      if (profileRes && profileRes.success) {
        setProfile(profileRes.data);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">SkillMatch AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user?.full_name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Candidate Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your job search overview.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Briefcase className="h-8 w-8 text-blue-600" />}
            title="Active Jobs"
            value={stats?.total_active_jobs || 0}
            description="Available positions"
          />
          <StatCard
            icon={<Target className="h-8 w-8 text-green-600" />}
            title="Recommended Matches"
            value={stats?.recommended_matches || 0}
            description="AI-powered matches"
          />
          <StatCard
            icon={<TrendingUp className="h-8 w-8 text-purple-600" />}
            title="Profile Status"
            value={stats?.profile_completion ? 'Complete' : 'Incomplete'}
            description={stats?.profile_completion ? 'All set!' : 'Upload resume'}
          />
        </div>

        <Tabs defaultValue="actions" className="mt-6 mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="actions">Dashboard</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="actions">
            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Get started with these actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" onClick={() => navigate('/candidate/upload-resume')}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Resume
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => navigate('/candidate/jobs')}>
                    <Briefcase className="h-4 w-4 mr-2" />
                    Browse Jobs
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => navigate('/candidate/skill-gaps')}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Skill Gaps
                  </Button>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Recommendations</CardTitle>
                  <CardDescription>Jobs matched to your profile</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-sm text-gray-500">Loading recommendations...</p>
                  ) : recommendations.length === 0 ? (
                    <p className="text-sm text-gray-500">Upload your resume to get personalized recommendations</p>
                  ) : (
                    <div className="space-y-3">
                      {recommendations.map((job) => (
                        <div
                          key={job.id}
                          className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                          onClick={() => navigate(`/candidate/jobs/${job.id}`)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-sm">{job.title}</h4>
                              <p className="text-xs text-gray-600">{job.company}</p>
                            </div>
                            <span className="text-xs font-semibold text-green-600">{job.match_score}% Match</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {recommendations.length > 0 && (
                    <Button variant="link" className="w-full mt-3" onClick={() => navigate('/candidate/jobs')}>
                      View All Jobs
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="profile">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Profile Overview */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>My Profile</CardTitle>
                    <Button size="sm" variant="ghost" onClick={() => navigate('/candidate/profile/edit')}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>{profile?.full_name?.charAt(0) || user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-lg">{profile?.full_name || user?.full_name || 'Your Name'}</h3>
                  <p className="text-gray-500 mb-2">{profile?.title || profile?.bio?.substring(0, 30) || 'Professional Title'}</p>
                  
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    <span>{profile?.location || 'Add your location'}</span>
                  </div>
                  
                  <div className="border-t w-full mt-4 pt-4">
                    <p className="text-sm text-gray-600 mb-1">Profile Completion</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${profile?.profile_complete ? 100 : (profile?.skills?.length ? 50 : 20)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {profile?.profile_complete ? '100% complete' : profile?.skills?.length ? '50% complete' : '20% complete'}
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/candidate/upload-resume')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Update Resume
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Profile Details */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Professional Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Experience */}
                    <div>
                      <div className="flex items-center mb-2">
                        <Building className="h-4 w-4 mr-2 text-gray-500" />
                        <h3 className="font-medium">Experience</h3>
                      </div>
                      {profile?.experience ? (
                        <div className="space-y-4">
                          {Array.isArray(profile.experience) ? (
                            profile.experience.map((exp, idx) => (
                              <div key={idx} className="border-l-2 border-gray-200 pl-4 ml-1">
                                <h4 className="font-medium">{exp.title || exp.position || 'Position'}</h4>
                                <p className="text-sm text-gray-600">{exp.company || 'Company'}</p>
                                {exp.duration && <p className="text-xs text-gray-500">{exp.duration}</p>}
                                {exp.description && <p className="text-sm mt-1">{exp.description}</p>}
                              </div>
                            ))
                          ) : typeof profile.experience === 'object' ? (
                            <div className="border-l-2 border-gray-200 pl-4 ml-1">
                              <h4 className="font-medium">{profile.experience.title || profile.experience.position || 'Position'}</h4>
                              <p className="text-sm text-gray-600">{profile.experience.company || 'Company'}</p>
                              {profile.experience.duration && <p className="text-xs text-gray-500">{profile.experience.duration}</p>}
                            </div>
                          ) : (
                            <div className="border-l-2 border-gray-200 pl-4 ml-1">
                              <h4 className="font-medium">Professional Experience</h4>
                              <p className="text-sm text-gray-600">{profile.experience} years</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No experience added yet</p>
                      )}
                    </div>
                    
                    {/* Skills */}
                    <div>
                      <div className="flex items-center mb-2">
                        <Award className="h-4 w-4 mr-2 text-gray-500" />
                        <h3 className="font-medium">Skills</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile?.skills && Array.isArray(profile.skills) && profile.skills.length > 0 ? (
                          profile.skills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-sm rounded-full">
                              {typeof skill === 'string' ? skill : skill.name || 'Skill'}
                            </span>
                          ))
                        ) : profile?.skills && typeof profile.skills === 'string' ? (
                          <span className="px-2 py-1 bg-gray-100 text-sm rounded-full">
                            {profile.skills}
                          </span>
                        ) : (
                          <p className="text-sm text-gray-500">No skills added yet</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Education */}
                    <div>
                      <div className="flex items-center mb-2">
                        <FileText className="h-4 w-4 mr-2 text-gray-500" />
                        <h3 className="font-medium">Education</h3>
                      </div>
                      {profile?.education ? (
                        <div className="space-y-4">
                          {Array.isArray(profile.education) ? (
                            profile.education.map((edu, idx) => (
                              <div key={idx} className="border-l-2 border-gray-200 pl-4 ml-1">
                                <h4 className="font-medium">{edu.degree || edu.title || 'Education'}</h4>
                                <p className="text-sm text-gray-600">{edu.institution || 'Institution'}</p>
                                {edu.year && <p className="text-xs text-gray-500">{edu.year}</p>}
                              </div>
                            ))
                          ) : typeof profile.education === 'object' ? (
                            <div className="border-l-2 border-gray-200 pl-4 ml-1">
                              <h4 className="font-medium">{profile.education.degree || profile.education.title || 'Education'}</h4>
                              <p className="text-sm text-gray-600">{profile.education.institution || 'Institution'}</p>
                              {profile.education.year && <p className="text-xs text-gray-500">{profile.education.year}</p>}
                            </div>
                          ) : (
                            <div className="border-l-2 border-gray-200 pl-4 ml-1">
                              <h4 className="font-medium">{profile.education}</h4>
                              <p className="text-sm text-gray-600">Education Level</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No education added yet</p>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => navigate('/candidate/profile/edit')} className="w-full">
                    Edit Profile
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, description }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <div>{icon}</div>
      </div>
    </CardContent>
  </Card>
);

export default CandidateDashboard;
