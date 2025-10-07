import api from './api';

export const skillService = {
  searchSkills: async (prefix, limit = 10) => {
    const response = await api.get('/skills', {
      params: { prefix, limit }
    });
    return response.data;
  },
};

export const profileService = {
  getProfile: async (userId) => {
    const response = await api.get(`/profile/${userId}`);
    return response.data;
  },
  
  updateProfile: async (userId, profileData) => {
    const response = await api.put(`/profile/${userId}`, profileData);
    return response.data;
  },
};

export const applicationService = {
  applyForJob: async (jobId, coverLetter) => {
    const response = await api.post('/applications', {
      job_id: jobId,
      cover_letter: coverLetter
    });
    return response.data;
  },
  
  getCandidateApplications: async () => {
    const response = await api.get('/applications/candidate');
    return response.data;
  },
  
  getJobApplications: async (jobId) => {
    const response = await api.get(`/applications/recruiter/${jobId}`);
    return response.data;
  },
  
  getRecentApplications: async () => {
    const response = await api.get('/applications/recruiter/recent');
    return response.data;
  },
  
  updateApplicationStatus: async (applicationId, status) => {
    const response = await api.put(`/applications/${applicationId}/status?status=${status}`);
    return response.data;
  }
};

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
    try {
      const formData = new FormData();
      formData.append('file', file); // Match the backend's expected field name 'file'
      
      const response = await api.post('/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Ensure we don't transform the FormData
        transformRequest: (data) => data,
      });
      
      return response.data;
    } catch (error) {
      // Make sure we rethrow the error after it's logged by axios interceptor
      throw error;
    }
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

  updateJob: async (jobId, jobData) => {
    const response = await api.put(`/jobs/${jobId}`, jobData);
    return response.data;
  },

  deleteJob: async (jobId) => {
    const response = await api.delete(`/jobs/${jobId}`);
    return response.data;
  },

  getMyJobs: async () => {
    const response = await api.get('/jobs/recruiter/my-jobs');
    return response.data;
  },
  
  getJobApplications: async (jobId) => {
    const response = await api.get(`/applications/recruiter/${jobId}`);
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


