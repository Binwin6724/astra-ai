import React, { useState } from 'react';
import { Briefcase, Plus, RefreshCcw, Loader2 } from 'lucide-react';
import JobCard from './JobCard';
import JobModal from './JobModal';

/**
 * Job applications dashboard component
 * @param {Object} props - Component props
 * @param {Array} props.applications - Job applications array
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onSave - Save handler
 * @param {boolean} props.isGmailConnected - Gmail connection status
 * @param {Function} props.onSyncGmail - Gmail sync handler
 * @param {boolean} props.isSyncing - Syncing state
 */
function JobDashboard({
  applications,
  onDelete,
  onSave,
  isGmailConnected,
  onSyncGmail,
  isSyncing,
  timezone
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const handleOpenAddModal = () => {
    setEditingJob(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (job) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto pb-20">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Job Applications
            </h2>
            <p className="text-gray-400">
              Manage and track your career opportunities in one place.
            </p>
          </div>
          <div className="flex gap-3">
            {isGmailConnected && (
              <button
                onClick={onSyncGmail}
                disabled={isSyncing}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold border border-white/10 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSyncing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <RefreshCcw size={18} />
                )}
                {isSyncing ? 'Syncing...' : 'Sync Gmail'}
              </button>
            )}
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-violet-600/20 active:scale-95"
            >
              <Plus size={20} />
              Add Application
            </button>
          </div>
        </header>

        {applications.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center border-dashed border-2 border-white/10">
            <Briefcase size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-gray-300">
              No applications tracked yet
            </h3>
            <p className="text-gray-500 mt-2">
              {isGmailConnected
                ? 'Try syncing with Gmail to automatically find your applications.'
                : 'Ask Astra to add a job for you, or click "Add Application" above.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onEdit={handleOpenEditModal}
                onDelete={onDelete}
                timezone={timezone}
              />
            ))}
          </div>
        )}
      </div>

      <JobModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={onSave}
        editingJob={editingJob}
      />
    </div>
  );
}

export default JobDashboard;
