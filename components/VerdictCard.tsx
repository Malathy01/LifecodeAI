
import React, { useState } from 'react';
import { Verdict, User } from '../types';

interface VerdictCardProps {
  verdict: Verdict;
  onReport: () => void;
  onRelatedClick: (claim: string) => void;
  currentUser: User | null;
  onAddDoctorComment?: (comment: string) => void;
}

const VerdictCard: React.FC<VerdictCardProps> = ({ 
  verdict, 
  onReport, 
  onRelatedClick, 
  currentUser,
  onAddDoctorComment 
}) => {
  const [docComment, setDocComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TRUE': return 'text-green-600 bg-green-50 border-green-200';
      case 'FALSE': return 'text-red-600 bg-red-50 border-red-200';
      case 'PARTIAL': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'MISLEADING': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const handleDocSubmit = () => {
    if (onAddDoctorComment && docComment.trim()) {
      setIsSubmittingComment(true);
      setTimeout(() => {
        onAddDoctorComment(docComment);
        setDocComment('');
        setIsSubmittingComment(false);
      }, 500);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with Status and Confidence */}
      <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Original Claim</h3>
          <p className="text-lg font-semibold text-slate-800 italic">"{verdict.claim}"</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getStatusColor(verdict.status)}`}>
              {verdict.status}
            </span>
            <div className="mt-2 text-xs text-slate-400 font-medium">
              Based on {verdict.evidenceCount} verified studies
            </div>
          </div>
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
              <circle 
                cx="32" cy="32" r="28" fill="transparent" 
                stroke={verdict.confidenceScore > 70 ? '#10b981' : verdict.confidenceScore > 40 ? '#f59e0b' : '#ef4444'} 
                strokeWidth="6" 
                strokeDasharray={175.9} 
                strokeDashoffset={175.9 - (175.9 * verdict.confidenceScore) / 100} 
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-slate-700">{verdict.confidenceScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Content */}
      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-3">Scientific Hub Analysis</h4>
          <div className="text-slate-700 leading-relaxed prose prose-slate max-w-none">
            {verdict.summary.split(/(\[.*?\])/).map((part, i) => {
              if (part.startsWith('[') && part.includes(':')) {
                const [term, def] = part.slice(1, -1).split(':');
                return (
                  <span key={i} className="group relative inline-block">
                    <span className="bg-blue-50 text-blue-700 px-1 rounded cursor-help border-b border-blue-200 font-medium">
                      {term.trim()}
                    </span>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                      {def.trim()}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                    </span>
                  </span>
                );
              }
              return <span key={i}>{part}</span>;
            })}
          </div>
        </div>

        {/* Doctor's Perspective */}
        {(verdict.doctorComment || currentUser?.role === 'PROFESSIONAL') && (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h4 className="text-sm font-bold text-slate-800">Professional Clinical Viewpoint</h4>
              {verdict.doctorComment && (
                <span className="text-xs text-blue-600 font-bold bg-blue-100 px-2 py-0.5 rounded ml-auto">Verified Doctor Check</span>
              )}
            </div>
            {verdict.doctorComment ? (
              <p className="text-slate-600 text-sm italic">"{verdict.doctorComment}"</p>
            ) : currentUser?.role === 'PROFESSIONAL' ? (
              <div className="space-y-2">
                <textarea
                  value={docComment}
                  onChange={(e) => setDocComment(e.target.value)}
                  placeholder="As a professional, add your clinical note to help users..."
                  className="w-full text-sm p-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button 
                  onClick={handleDocSubmit}
                  disabled={isSubmittingComment || !docComment.trim()}
                  className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300"
                >
                  {isSubmittingComment ? 'Saving...' : 'Post Clinical Note'}
                </button>
              </div>
            ) : null}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Related Suggestions */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Related Discoveries</h4>
            <div className="flex flex-wrap gap-2">
              {verdict.relatedClaims.map((claim, idx) => (
                <button
                  key={idx}
                  onClick={() => onRelatedClick(claim)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all flex items-center space-x-1"
                >
                  <span>{claim}</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Grounding Sources</h4>
            <div className="space-y-2">
              {verdict.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-xs text-blue-600 hover:underline group"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span className="truncate max-w-[200px]">{source.title}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-100">
        <button 
          onClick={onReport}
          className="text-xs text-slate-500 hover:text-red-500 flex items-center space-x-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Report incorrect result</span>
        </button>
        <button className="text-xs font-bold text-blue-600 flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Share Analysis</span>
        </button>
      </div>
    </div>
  );
};

export default VerdictCard;
