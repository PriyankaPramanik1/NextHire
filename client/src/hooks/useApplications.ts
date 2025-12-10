import { useState, useCallback } from 'react';
import axios from '@/lib/axios';
import Swal from 'sweetalert2';

interface Application {
  _id: string;
  applicant: {
    _id: string;
    name: string;
    email: string;
    profile?: {
      title?: string;
      profilePicture?: { url: string };
      skills?: string[];
      experience?: string;
      location?: string;
    };
  };
  job: {
    _id: string;
    title: string;
    location: string;
  };
  status: string;
  coverLetter: string;
  appliedAt: string;
  resume?: { url: string };
}

export const useApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async (filters?: {
    status?: string;
    jobId?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.jobId) params.append('jobId', filters.jobId);

      const response = await axios.get(`/employer/applications?${params}`);
      setApplications(response.data.applications);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch applications');
      Swal.fire('Error!', 'Failed to load applications.', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateApplicationStatus = useCallback(async (id: string, status: string, note?: string) => {
    try {
      setLoading(true);
      const response = await axios.put(`/applications/${id}/status`, { status, note });
      
      setApplications(prev => prev.map(app => 
        app._id === id ? { ...app, status } : app
      ));
      
      Swal.fire('Success!', `Application status updated to ${status}.`, 'success');
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update status';
      Swal.fire('Error!', errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadResume = useCallback(async (applicationId: string) => {
    try {
      const response = await axios.get(`/applications/${applicationId}/resume`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `resume-${applicationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      Swal.fire('Error!', 'Failed to download resume.', 'error');
    }
  }, []);

  const sendEmail = useCallback(async (applicationId: string, subject: string, body: string) => {
    try {
      await axios.post(`/applications/${applicationId}/email`, {
        subject,
        body,
      });
      Swal.fire('Success!', 'Email sent successfully.', 'success');
    } catch (err: any) {
      Swal.fire('Error!', 'Failed to send email.', 'error');
    }
  }, []);

  const getApplicationStats = useCallback(async () => {
    try {
      const response = await axios.get('/employer/applications/stats');
      return response.data;
    } catch (err: any) {
      Swal.fire('Error!', 'Failed to load application statistics.', 'error');
      throw err;
    }
  }, []);

  return {
    applications,
    loading,
    error,
    fetchApplications,
    updateApplicationStatus,
    downloadResume,
    sendEmail,
    getApplicationStats,
  };
};