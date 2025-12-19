import React from 'react';
import { Calendar, Link2, Trash2, Edit2 } from 'lucide-react';
import StatusIcon from './StatusIcon';

/**
 * Displays a single job application card
 * @param {Object} props - Component props
 * @param {Object} props.job - Job application data
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 */
function JobCard({ job, onEdit, onDelete }) {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Offer':
        return 'bg-green-500/20 text-green-400';
      case 'Interviewing':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'Rejected':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-blue-500/20 text-blue-400';
    }
  };

  return (
    <div className="glass rounded-2xl p-5 border border-white/5 hover:border-violet-500/30 transition-all group animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors truncate">
            {job.role}
          </h3>
          <p className="text-violet-300/80 font-medium truncate">{job.company}</p>
        </div>
        <div className="flex gap-1 ml-2">
          <button
            onClick={() => onEdit(job)}
            className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => onDelete(job.id)}
            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <StatusIcon status={job.status} />
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusStyle(
              job.status
            )}`}
          >
            {job.status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <Calendar size={16} />
          <span>Applied on {job.dateApplied}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <Link2 size={16} />
          <span className="truncate">via {job.source}</span>
        </div>
      </div>
    </div>
  );
}

export default JobCard;
