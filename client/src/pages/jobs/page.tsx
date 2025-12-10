"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = async () => {
    try {
      const res = await api.get("/jobs/getJobs");
      setJobs(res.data.jobs);
    } catch (error) {
      console.error("Failed to load jobs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  if (loading) return <p>Loading jobs...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Available Jobs</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.map((job: any) => (
          <div key={job._id} className="border p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold">{job.title}</h2>
            <p className="text-gray-600">{job.location}</p>
            <p className="mt-2">{job.description.substring(0, 100)}...</p>

            <a
              href={`/jobs/${job._id}`}
              className="mt-4 inline-block text-blue-600 font-medium"
            >
              View Details →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
