import api from './api';

export const authService = {
  signup: async (email, password, full_name, role) => {
    const response = await api.post('/auth/signup', {
      email,
      password,
      full_name,
      role,
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/me', profileData);
    return response.data;
  },
};

export const resumeService = {
  uploadResume: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getParsedData: async () => {
    const response = await api.get('/resume/parsed-data');
    return response.data;
  },
};

export const jobService = {
  searchJobs: async (params) => {
    const response = await api.get('/jobs/search', { params });
    return response.data;
  },

  getRecommendations: async () => {
    const response = await api.get('/jobs/recommendations');
    return response.data;
  },

  getJob: async (jobId) => {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  },

  createJob: async (jobData) => {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },

  getMyJobs: async () => {
    const response = await api.get('/jobs/recruiter/my-jobs');
    return response.data;
  },
};

export const aiMatchService = {
  runMatching: async () => {
    const response = await api.post('/ai-match/run');
    return response.data;
  },

  getCandidatesForJob: async (jobId, limit = 20) => {
    const response = await api.get(`/ai-match/candidates/${jobId}`, {
      params: { limit },
    });
    return response.data;
  },

  getMatchScore: async (jobId) => {
    const response = await api.get(`/ai-match/score/${jobId}`);
    return response.data;
  },
};

export const analyticsService = {
  getBiasReport: async () => {
    const response = await api.get('/analytics/bias-report');
    return response.data;
  },

  getSkillGaps: async () => {
    const response = await api.get('/analytics/skill-gaps');
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },
};
