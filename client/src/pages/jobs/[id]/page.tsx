"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

export default function JobDetails({ params }: any) {
  const { id } = params;
  const [job, setJob] = useState<any>(null);

  const loadJob = async () => {
    try {
      const res = await api.get(`/jobs/getJob/${id}`);
      setJob(res.data);
    } catch (error) {
      console.error("Failed to load job", error);
    }
  };

  useEffect(() => {
    loadJob();
  }, [id]);

  if (!job) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">{job.title}</h1>
      <p className="text-gray-600">{job.location}</p>

      <div className="mt-4">
        <h2 className="font-semibold text-lg">Description</h2>
        <p>{job.description}</p>
      </div>

      <div className="mt-4">
        <h2 className="font-semibold text-lg">Skills Required</h2>
        <ul className="list-disc pl-6">
          {job.skills?.map((skill: string, i: number) => (
            <li key={i}>{skill}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
