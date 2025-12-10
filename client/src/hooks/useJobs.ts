import { useState, useCallback } from 'react';
import axios from '@/lib/axios';
import Swal from 'sweetalert2';

interface Job {
  _id: string;
  title: string;
  location: string;
  type: string;
  status: string;
  applicationsCount: number;
  views: number;
  createdAt: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
}

export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/employer/jobs');
      setJobs(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch jobs');
      Swal.fire('Error!', 'Failed to load jobs.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const createJob = useCallback(async (jobData: any) => {
    try {
      setLoading(true);
      const response = await axios.post('/jobs/createJob', jobData);
      setJobs(prev => [response.data, ...prev]);
      Swal.fire('Success!', 'Job created successfully!', 'success');
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to create job';
      Swal.fire('Error!', errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateJob = useCallback(async (id: string, jobData: any) => {
    try {
      setLoading(true);
      const response = await axios.put(`/employer/jobs/${id}`, jobData);
      setJobs(prev => prev.map(job => 
        job._id === id ? response.data : job
      ));
      Swal.fire('Success!', 'Job updated successfully!', 'success');
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update job';
      Swal.fire('Error!', errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteJob = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await axios.delete(`/employer/jobs/${id}`);
      setJobs(prev => prev.filter(job => job._id !== id));
      Swal.fire('Deleted!', 'Job has been deleted.', 'success');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to delete job';
      Swal.fire('Error!', errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateJobStatus = useCallback(async (id: string, status: string) => {
    try {
      setLoading(true);
      const response = await axios.patch(`/employer/jobs/${id}/status`, { status });
      setJobs(prev => prev.map(job => 
        job._id === id ? { ...job, status } : job
      ));
      Swal.fire('Success!', `Job status updated to ${status}.`, 'success');
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update status';
      Swal.fire('Error!', errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getJobStats = useCallback(async () => {
    try {
      const response = await axios.get('/employer/jobs/stats');
      return response.data;
    } catch (err: any) {
      Swal.fire('Error!', 'Failed to load job statistics.', 'error');
      throw err;
    }
  }, []);

  return {
    jobs,
    loading,
    error,
    fetchJobs,
    createJob,
    updateJob,
    deleteJob,
    updateJobStatus,
    getJobStats,
  };
};