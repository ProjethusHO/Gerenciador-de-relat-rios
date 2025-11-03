import React, { useState, useEffect, useRef } from 'react';
import { Report, ReportStatus, TeamMember, Tag, ReportContent, ContentHistory } from '../types';
import Avatar from './Avatar';
import ReportEditor from './ReportEditor';

interface ReportDetailModalProps {
  report: Report;
  allUsers: TeamMember[];
  allTags: Tag[];
  currentUser: TeamMember;
  onClose: () => void;
  onSignReport: (reportId: string) => void;
  onAcknowledgeReport: (reportId: string, memberId: string) => void;
  onUpdateReportStatus: (reportId: string, status: ReportStatus) => void;
  onDeleteReport: (reportId: string) => void;
  onUpdateReportTags: (reportId: string, newTags: Tag[]) => void;
  onStartReport: (reportId: string) => void;
  onUpdateContent: (reportId: string, content: string) => void;
  onRestoreContentVersion: (reportId: string, historyEntry: ContentHistory) => void;
  onAddComment: (reportId: string, text: string) => void;
  onAddAttachment: (reportId: string, file: File) => void;
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

const parseReportContent = (content: string, title: string): ReportContent => {
  const defaultContent: ReportContent = {
    assunto: '', processo: title, interessado: '', ementa: '',
    relatorio: '', parecer: '',
  };
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === 'object' && parsed !== null) {
      return { ...defaultContent, ...parsed, processo: title };
    }
  } catch (e) {
    // If it's not JSON, it could be legacy Markdown or plain text.
    // The WYSIWYG editor will handle this gracefully.
    return { ...defaultContent, relatorio: content };
  }
  return { ...defaultContent, relatorio: content };
};

const HtmlRenderer: React.FC<{ html: string }> = ({ html }) => {
  return <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
};


const ContentDisplay: React.FC<{content: ReportContent}> = ({ content }) => (
  <div className="space-y-4">
    {Object.entries(content).map(([key, value]) => {
      if (!value || key === 'processo') return null;
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      const isHtml = key === 'relatorio' || key === 'parecer';
      return (
         <div key={key}>
            <h4 className="font-semibold text-slate-600 dark:text-slate-400">{label}</h4>
            <div className="text-slate-800 dark:text-slate-200 mt-1">
              {isHtml ? <HtmlRenderer html={value} /> : <p className="whitespace-pre-wrap">{value}</p>}
            </div>
         </div>
      )
    })}
  </div>
);

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report, allUsers, allTags, currentUser, onClose, onSignReport,
  onUpdateReportStatus, onDeleteReport, onUpdateReportTags, onStartReport,
  onUpdateContent, onRestoreContentVersion, onAddComment, onAddAttachment, onAcknowledgeReport,
}) => {
  const author = allUsers.find(u => u.id === report.authorId);
  const isUserInTeam = report.team.some(member => member.id === currentUser.id);
  const hasUserSigned = report.signatures.some(sig => sig.memberId === currentUser.id);
  const hasUserAcknowledged = report.acknowledgements.some(ack => ack.memberId === currentUser.id);
  const isAdmin = currentUser.role === 'Administrador';
  const isAuthor = currentUser.id === report.authorId;
  const isDraft = report.status === ReportStatus.Draft;
  const isInReview = report.status === ReportStatus.InReview;
  const isStarted = !!report.startedAt;
  
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [newComment, setNewComment] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsedContent = parseReportContent(report.content, report.title);

  const sortedTeam = [...report.team].sort((a, b) => {
    if (a.id === report.authorId) return -1;
    if (b.id === report.authorId) return 1;
    return a.name.localeCompare(b.name);
  });

  const handleStartEditing = () => {
    if (!isStarted) {
      onStartReport(report.id);
    }
    setIsEditingContent(true);
  };
  
  const handleAcknowledge = () => {
    if(!hasUserAcknowledged) {
        onAcknowledgeReport(report.id, currentUser.id);
    }
  }

  const handleSign = () => {
    if (!hasUserSigned) {
      onSignReport(report.id);
    }
  };

  const handleDelete = () => onDeleteReport(report.id);
  
  const handleAddComment = () => {
    if(newComment.trim()){
      onAddComment(report.id, newComment);
      setNewComment('');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onAddAttachment(report.id, file);
    }
  };

  const canAcknowledge = isUserInTeam && !isAuthor && isInReview && !hasUserAcknowledged;
  const canSign = isUserInTeam && isInReview && (isAuthor ? isDraft : hasUserAcknowledged) && !hasUserSigned;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] animate-slide-up" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{report.title}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                <div className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block ${getStatusChipStyle(report.status)}`}>{report.status}</div>
                <span>Prazo: {new Date(report.deadline).toLocaleDateString()}</span>
                {author && <span>Autor: {author.name}</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <main className="flex-1 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {isEditingContent ? (
             <ReportEditor
                report={report}
                allUsers={allUsers}
                onUpdateContent={onUpdateContent}
                onRestoreContentVersion={onRestoreContentVersion}
                onBack={() => setIsEditingContent(false)}
                onFinishAndSign={() => {
                  setIsEditingContent(false);
                  handleSign();
                }}
                isAuthor={isAuthor}
                isDraft={isDraft}
                hasUserSigned={hasUserSigned}
              />
          ) : (
          <>
            <div className="lg:col-span-2 space-y-6">
                 {report.status === ReportStatus.Completed && report.aiSummary && (
                    <div>
                        <h3 className="font-semibold text-lg text-indigo-800 dark:text-indigo-300 mb-2">Histórico do Processo (Gerado por IA)</h3>
                        <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap p-4 bg-indigo-50 dark:bg-slate-900/50 rounded-lg">{report.aiSummary}</div>
                    </div>
                 )}
                <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Conteúdo do Relatório</h3>
                      {isAuthor && isDraft && !hasUserSigned && <button onClick={handleStartEditing} className="px-3 py-1 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Editar Conteúdo</button>}
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                       <ContentDisplay content={parsedContent} />
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-2">Discussão</h3>
                    <div className="space-y-3">
                        {report.comments.map(comment => {
                            const commentAuthor = allUsers.find(u => u.id === comment.authorId);
                            return (
                                <div key={comment.id} className="flex items-start gap-3">
                                    <Avatar name={commentAuthor?.name || '?'} className="w-9 h-9 text-sm mt-1" />
                                    <div className="flex-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3">
                                        <div className="flex items-baseline gap-2">
                                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{commentAuthor?.name}</p>
                                            <p className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString()}</p>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{comment.text}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="mt-4 flex items-start gap-3">
                        <Avatar name={currentUser.name} className="w-9 h-9 text-sm mt-1" />
                        <div className="flex-1">
                          <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Adicionar um comentário..." rows={2} className="w-full form-textarea text-sm"></textarea>
                          <button onClick={handleAddComment} className="mt-2 px-3 py-1 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Enviar</button>
                        </div>
                    </div>
                </div>
            </div>

            <aside className="space-y-6">
                <div>
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-3">Equipe e Assinaturas</h3>
                    <ul className="space-y-3">
                        {sortedTeam.map(member => {
                            const signature = report.signatures.find(s => s.memberId === member.id);
                            return (
                            <li key={member.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar name={member.name} className="w-9 h-9 text-sm" />
                                    <div>
                                        <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{member.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{member.role}</p>
                                    </div>
                                </div>
                                {signature ? (
                                    <div className="text-right text-xs text-green-600 dark:text-green-400">
                                        <p className="font-semibold">Assinado</p>
                                        <p>{new Date(signature.signedAt).toLocaleDateString()}</p>
                                    </div>
                                ) : (
                                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Pendente</p>
                                )}
                            </li>
                            )
                        })}
                    </ul>
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Documentos</h3>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="text-sm font-medium text-indigo-600 hover:underline">Adicionar</button>
                    </div>
                    {report.attachments.length > 0 ? (
                        <ul className="space-y-2">
                          {report.attachments.map(file => (
                              <li key={file.id} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate" title={file.name}>{file.name}</p>
                                        <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                  </div>
                                  <a href={file.url} download={file.name} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600 dark:text-slate-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                  </a>
                              </li>
                          ))}
                        </ul>
                    ) : <p className="text-sm text-center text-slate-500 py-2">Nenhum documento anexado.</p>}
                </div>
                {isAdmin && (
                    <div>
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-3">Ações de Gestão</h3>
                        <div className="space-y-2">
                            <select value={report.status} onChange={(e) => onUpdateReportStatus(report.id, e.target.value as ReportStatus)} className="w-full form-select" disabled={report.status === ReportStatus.Completed}>
                                <option value={ReportStatus.Draft}>Mover para Rascunho</option>
                                <option value={ReportStatus.InReview}>Mover para Revisão</option>
                                <option value={ReportStatus.Completed}>Mover para Concluído</option>
                            </select>
                            <button onClick={handleDelete} className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Excluir Relatório</button>
                        </div>
                    </div>
                )}
            </aside>
          </>)}
        </main>
        
        {!isEditingContent && report.status !== ReportStatus.Completed && (
            <footer className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                {canAcknowledge && (
                    <button onClick={handleAcknowledge} className="px-6 py-2.5 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 shadow-md">
                        Acatar Relatório
                    </button>
                )}
                {canSign && (
                    <button onClick={handleSign} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-md">
                        Assinar Relatório
                    </button>
                )}
                 {hasUserSigned && (
                    <span className="px-6 py-2.5 bg-green-500 text-white font-semibold rounded-lg cursor-not-allowed shadow-md flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Assinado
                    </span>
                 )}
            </footer>
        )}
      </div>
    </div>
  );
};

export default ReportDetailModal;
