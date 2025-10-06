import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsService, jobService } from '../../services';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Briefcase, Upload, Target, TrendingUp, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const CandidateDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, recsRes] = await Promise.all([
        analyticsService.getDashboard(),
        jobService.getRecommendations(),
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      }

      if (recsRes.success) {
        setRecommendations(recsRes.data.slice(0, 5));
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
