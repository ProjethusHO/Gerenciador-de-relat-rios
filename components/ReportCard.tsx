
import React from 'react';
import { Report, TeamMember, ReportStatus, ReportContent } from '../types';
import Avatar from './Avatar';

interface ReportCardProps {
  report: Report;
  author: TeamMember | undefined;
  onCardClick: (reportId: string) => void;
  currentUser: TeamMember;
  isAdmin: boolean;
}

const getStatusChipStyle = (status: ReportStatus) => {
  switch (status) {
    case ReportStatus.Draft:
      return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    case ReportStatus.InReview:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case ReportStatus.Completed:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    default:
      return 'bg-gray-200 text-gray-800';
  }
};

const getTagChipStyle = (color: string) => {
  const styles: { [key: string]: string } = {
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  };
  return styles[color] || 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300';
};

const getDeadlineIndicatorStyle = (deadline: string, status: ReportStatus): string => {
  if (status === ReportStatus.Completed) {
    return 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'; // Neutral for completed/approved
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  const deadlineDate = new Date(`${deadline}T00:00:00`);

  const oneDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((deadlineDate.getTime() - today.getTime()) / oneDay);

  if (diffDays < 0) {
    return 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700'; // Overdue
  }
  if (diffDays <= 3) {
    return 'bg-yellow-50 dark:bg-yellow-800/30 border-yellow-300 dark:border-yellow-700'; // Due soon
  }
  return 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700'; // Safe
};

// Helper to safely parse the report content string
const parseReportContent = (content: string): Partial<ReportContent> => {
  try {
    const parsed = JSON.parse(content);
    return typeof parsed === 'object' ? parsed : { relatorio: content };
  } catch (e) {
    return { relatorio: content }; // Fallback for legacy or non-JSON content
  }
};


const ReportCard: React.FC<ReportCardProps> = ({ report, author, onCardClick, currentUser, isAdmin }) => {
  const isUserInTeam = report.team.some(member => member.id === currentUser.id);
  const userSignature = report.signatures.find(sig => sig.memberId === currentUser.id);
  const deadlineStyle = getDeadlineIndicatorStyle(report.deadline, report.status);
  const content = parseReportContent(report.content);
  const previewText = content.ementa || content.relatorio || 'Nenhum conteúdo adicionado ainda.';

  const sortedTeam = [...report.team].sort((a, b) => {
    if (a.id === report.authorId) return -1;
    if (b.id === report.authorId) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div 
      onClick={() => onCardClick(report.id)}
      className={`rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border flex flex-col ${deadlineStyle}`}
    >
      <header className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 truncate">{report.title}</h3>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <div className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${getStatusChipStyle(report.status)}`}>
            {report.status}
          </div>
          {report.tags?.map(tag => (
            <div key={tag.id} className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${getTagChipStyle(tag.color)}`}>
              {tag.label}
            </div>
          ))}
        </div>
      </header>
      <main className="p-4 flex-grow">
        {report.status === ReportStatus.Completed && report.aiSummary ? (
           <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-indigo-500 dark:text-indigo-400">Resumo por IA</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 italic">
                  "{report.aiSummary}"
              </p>
           </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
            {previewText}
          </p>
        )}
      </main>
      <footer className="p-4 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex justify-between items-center">
          <div>
            <p>Prazo: {new Date(report.deadline).toLocaleDateString()}</p>
            {author && <p className="mt-1">Autor: {author.name}</p>}
          </div>
          <div className="flex -space-x-2">
            {sortedTeam.map(member => (
              <Avatar key={member.id} name={member.name} className="w-8 h-8 border-2 border-white dark:border-slate-800" />
            ))}
          </div>
        </div>
        {isAdmin && report.status === ReportStatus.Draft ? (
            <div className={`mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 text-sky-600 dark:text-sky-400`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                <span>Processo Atribuído</span>
            </div>
        ) : isUserInTeam && report.status !== ReportStatus.Completed && (
          <div className={`mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 ${userSignature ? 'text-green-600' : 'text-amber-600'}`}>
            {userSignature ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Você assinou este relatório.</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <span>Sua assinatura está pendente.</span>
              </>
            )}
          </div>
        )}
      </footer>
    </div>
  );
};

export default ReportCard;
