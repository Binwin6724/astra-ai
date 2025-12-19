import { useState, useEffect, useRef, useCallback } from 'react';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '@/constants';

/**
 * Custom hook for managing job applications with localStorage persistence
 * @returns {Object} - Job applications state and actions
 */
export function useJobApplications() {
  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.JOBS);
    return saved ? JSON.parse(saved) : [];
  });

  // Ref for latest applications to avoid stale closures
  const applicationsRef = useRef(applications);

  useEffect(() => {
    applicationsRef.current = applications;
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(applications));
  }, [applications]);

  const saveJobApplication = useCallback((jobData) => {
    if (jobData.id) {
      setApplications((prev) =>
        prev.map((j) => (j.id === jobData.id ? jobData : j))
      );
      return `Job application for ${jobData.company} updated successfully.`;
    } else {
      const newJob = { ...jobData, id: Date.now().toString() };
      setApplications((prev) => [newJob, ...prev]);
      return `Successfully added ${newJob.role} at ${newJob.company} to your tracker.`;
    }
  }, []);

  const deleteJobApplication = useCallback((id) => {
    const jobToDelete = applicationsRef.current.find((j) => j.id === id);
    if (jobToDelete) {
      setApplications((prev) => prev.filter((j) => j.id !== id));
      return `Removed the application for ${jobToDelete.company} from your list.`;
    }
    return "I couldn't find that job application in your tracker.";
  }, []);

  const updateJobStatus = useCallback((companyName, newStatus) => {
    const job = applicationsRef.current.find((j) =>
      j.company.toLowerCase().includes(companyName.toLowerCase())
    );
    if (job) {
      setApplications((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j))
      );
      return `I've updated your status for ${job.company} to ${newStatus}.`;
    }
    return `I couldn't find an application for "${companyName}" in your tracker.`;
  }, []);

  const listJobs = useCallback(() => {
    const jobs = applicationsRef.current;
    if (jobs.length === 0) return "You haven't added any job applications yet.";

    const list = jobs
      .map((j, i) => `${i + 1}. ${j.company} - ${j.role} (${j.status})`)
      .join('\n');
    return `You have ${jobs.length} applications in your tracker:\n${list}`;
  }, []);

  const findJobByCompany = useCallback((companyName) => {
    return applicationsRef.current.find((j) =>
      j.company.toLowerCase().includes(companyName.toLowerCase())
    );
  }, []);

  const clearAllJobs = useCallback(() => {
    setApplications([]);
    localStorage.removeItem(STORAGE_KEYS.JOBS);
  }, []);

  return {
    applications,
    applicationsRef,
    saveJobApplication,
    deleteJobApplication,
    updateJobStatus,
    listJobs,
    findJobByCompany,
    clearAllJobs
  };
}

/**
 * Custom hook for managing app settings with localStorage persistence
 * @returns {Object} - Settings state and update function
 */
export function useSettings() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((newSettings) => {
    setSettings(newSettings);
  }, []);

  return {
    settings,
    settingsRef,
    updateSettings
  };
}
