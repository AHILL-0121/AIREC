import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { jobService } from '../../services';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';
import { Briefcase, MapPin, DollarSign, Clock, Heart, MessageCircle, Share2, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const JobFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');
  const [thought, setThought] = useState('');
  const [thoughts, setThoughts] = useState([
    {
      id: 1,
      user: 'Sarah Johnson',
      role: 'Software Engineer',
      content: 'Just got matched with 3 amazing opportunities! The AI matching is incredible 🎉',
      likes: 24,
      comments: 5,
      time: '2 hours ago',
    },
    {
      id: 2,
      user: 'Michael Chen',
      role: 'Data Scientist',
      content: 'Tip: Make sure to upload a detailed resume. The AI parsed all my skills perfectly and found jobs I never would have searched for!',
      likes: 18,
      comments: 3,
      time: '5 hours ago',
    },
  ]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const [jobsRes, recsRes] = await Promise.all([
        jobService.searchJobs({ limit: 20 }),
        jobService.getRecommendations(),
      ]);

      if (jobsRes.success) {
        setJobs(jobsRes.data);
      }
      if (recsRes.success) {
        setRecommendations(recsRes.data);
      }
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const response = await jobService.searchJobs({ query: searchQuery });
      if (response.success) {
        setJobs(response.data);
      }
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const handleShareThought = () => {
    if (!thought.trim()) return;
    
    const newThought = {
      id: thoughts.length + 1,
      user: user.full_name,
      role: 'Job Seeker',
      content: thought,
      likes: 0,
      comments: 0,
      time: 'Just now',
    };
    
    setThoughts([newThought, ...thoughts]);
    setThought('');
    toast.success('Thought shared!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/candidate/dashboard')}>
                <Briefcase className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold">SkillMatch AI</span>
              </div>
              <nav className="hidden md:flex space-x-4">
                <Button variant="ghost" onClick={() => navigate('/candidate/dashboard')}>Dashboard</Button>
                <Button variant="ghost" className="text-blue-600">Feed</Button>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={() => navigate('/candidate/upload-resume')}>
                Upload Resume
              </Button>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {user?.full_name?.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Sidebar - User Info */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.full_name?.charAt(0)}
                  </div>
                  <h3 className="font-semibold text-lg">{user?.full_name}</h3>
                  <p className="text-sm text-gray-600">Job Seeker</p>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-around text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{recommendations.length}</p>
                        <p className="text-xs text-gray-600">Matches</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{user?.skills?.length || 0}</p>
                        <p className="text-xs text-gray-600">Skills</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/candidate/skill-gaps')}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  View Skill Gaps
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('recommendations')}>
                  <Briefcase className="h-4 w-4 mr-2" />
                  My Recommendations
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tabs */}
            <div className="bg-white rounded-lg p-1 flex space-x-1">
              <button
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  activeTab === 'feed' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('feed')}
              >
                Community Feed
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  activeTab === 'jobs' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('jobs')}
              >
                Browse Jobs
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  activeTab === 'recommendations' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('recommendations')}
              >
                For You
              </button>
            </div>

            {/* Share Thought */}
            {activeTab === 'feed' && (
              <Card>
                <CardContent className="pt-6">
                  <Textarea
                    placeholder="Share your job search journey, tips, or thoughts..."
                    value={thought}
                    onChange={(e) => setThought(e.target.value)}
                    className="mb-3"
                  />
                  <Button onClick={handleShareThought} disabled={!thought.trim()}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Community Feed Tab */}
            {activeTab === 'feed' && (
              <div className="space-y-4">
                {thoughts.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {item.user.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{item.user}</h4>
                              <p className="text-xs text-gray-600">{item.role} • {item.time}</p>
                            </div>
                          </div>
                          <p className="mt-2 text-gray-700">{item.content}</p>
                          <div className="flex items-center space-x-4 mt-3">
                            <button className="flex items-center space-x-1 text-gray-600 hover:text-red-600">
                              <Heart className="h-4 w-4" />
                              <span className="text-sm">{item.likes}</span>
                            </button>
                            <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600">
                              <MessageCircle className="h-4 w-4" />
                              <span className="text-sm">{item.comments}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Browse Jobs Tab */}
            {activeTab === 'jobs' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Search jobs by title, skills, or company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <Button onClick={handleSearch}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {loading ? (
                  <p className="text-center text-gray-600">Loading jobs...</p>
                ) : jobs.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-gray-600">No jobs found. Try a different search.</p>
                    </CardContent>
                  </Card>
                ) : (
                  jobs.map((job) => <JobCard key={job.id} job={job} onClick={() => navigate(`/candidate/jobs/${job.id}`)} />)
                )}
              </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === 'recommendations' && (
              <div className="space-y-4">
                {recommendations.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <h3 className="font-semibold mb-2">No recommendations yet</h3>
                      <p className="text-sm text-gray-600 mb-4">Upload your resume to get AI-powered job matches</p>
                      <Button onClick={() => navigate('/candidate/upload-resume')}>
                        Upload Resume
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  recommendations.map((job) => <JobCard key={job.id} job={job} recommended onClick={() => navigate(`/candidate/jobs/${job.id}`)} />)
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const JobCard = ({ job, recommended, onClick }) => (
  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
    <CardContent className="pt-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold">{job.title}</h3>
            {recommended && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                {job.match_score}% Match
              </span>
            )}
          </div>
          <p className="text-gray-700 font-medium mb-2">{job.company}</p>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{job.description}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {job.required_skills?.slice(0, 5).map((skill, idx) => (
              <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                {skill}
              </span>
            ))}
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{job.min_experience}-{job.max_experience} years</span>
            </div>
            {job.salary_range && (
              <div className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4" />
                <span>{job.salary_range}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default JobFeed;
