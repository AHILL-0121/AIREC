import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Briefcase, Target, TrendingUp, Users, Brain, BarChart3 } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">SkillMatch AI</span>
          </div>
          <div className="space-x-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button onClick={() => navigate('/signup')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Find Your Perfect Match with
            <span className="text-blue-600"> AI-Powered</span> Job Matching
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Advanced bipartite graph algorithms and AI-driven insights to connect talent with opportunity
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/signup')}>
              Start Matching
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Brain className="h-12 w-12 text-blue-600" />}
            title="AI Resume Parsing"
            description="Gemini AI automatically extracts skills, experience, and education from resumes"
          />
          <FeatureCard
            icon={<Target className="h-12 w-12 text-purple-600" />}
            title="Smart Matching"
            description="Bipartite graph algorithms find optimal candidate-job matches"
          />
          <FeatureCard
            icon={<TrendingUp className="h-12 w-12 text-green-600" />}
            title="Priority Ranking"
            description="Advanced heap-based ranking system for best candidates"
          />
          <FeatureCard
            icon={<BarChart3 className="h-12 w-12 text-orange-600" />}
            title="Analytics Dashboard"
            description="Comprehensive insights with bias detection and fairness metrics"
          />
          <FeatureCard
            icon={<Users className="h-12 w-12 text-pink-600" />}
            title="Skill Gap Analysis"
            description="Identify missing skills and get personalized recommendations"
          />
          <FeatureCard
            icon={<Briefcase className="h-12 w-12 text-indigo-600" />}
            title="Job Recommendations"
            description="Personalized job suggestions based on your profile"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Perfect Match?</h2>
          <p className="text-xl mb-8">Join thousands of candidates and recruiters using AI-powered matching</p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/signup')}>
            Create Free Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2025 SkillMatch AI. Powered by Gemini AI & Advanced Algorithms.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default Landing;
