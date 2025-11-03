import React, { useState, useEffect } from 'react';
import { TeamMember, Report, Tag, ReportContent } from '../types';
import Avatar from './Avatar';

interface CreateReportModalProps {
  onClose: () => void;
  onAddReport: (reportData: Omit<Report, 'id' | 'status' | 'comments' | 'attachments' | 'signatures' | 'acknowledgements' | 'startedAt' | 'aiSummary'>) => void;
  allUsers: TeamMember[];
  currentUser: TeamMember;
  isAdmin: boolean;
  allTags: Tag[];
  onAddTag: (label: string, color: string) => Tag;
}

const formatSeiProcessNumber = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, '').slice(0, 14);
  
  // Based on format: xx.xx.xxxxxxxxx-x (14 digits total)
  if (digitsOnly.length <= 2) return digitsOnly;
  if (digitsOnly.length <= 4) return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2)}`;
  if (digitsOnly.length <= 13) return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2, 4)}.${digitsOnly.slice(4)}`;

  return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2, 4)}.${digitsOnly.slice(4, 13)}-${digitsOnly.slice(13, 14)}`;
};

const COLORS = ['red', 'green', 'blue', 'purple', 'yellow', 'indigo', 'pink'];

const CreateReportModal: React.FC<CreateReportModalProps> = ({ onClose, onAddReport, allUsers, currentUser, isAdmin, allTags, onAddTag }) => {
  const [title, setTitle] = useState('');
  const [authorId, setAuthorId] = useState<string>(!isAdmin ? currentUser.id : '');
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set(!isAdmin ? [currentUser.id] : []));
  const [deadline, setDeadline] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());

  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState(COLORS[2]);
  
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdmin && authorId) {
        setSelectedTeamIds(prev => new Set(prev).add(authorId));
    }
  }, [authorId, isAdmin]);

  const handleTeamToggle = (memberId: string) => {
    if (memberId === authorId) return;
    setSelectedTeamIds(prev => {
      const newSet = new Set(prev);
      newSet.has(memberId) ? newSet.delete(memberId) : newSet.add(memberId);
      return newSet;
    });
  };
  
  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds(prev => {
      const newSet = new Set(prev);
      newSet.has(tagId) ? newSet.delete(tagId) : newSet.add(tagId);
      return newSet;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline || !authorId || selectedTeamIds.size === 0) {
      setError('Nº do Processo, autor, prazo e pelo menos um membro na equipe são obrigatórios.');
      return;
    }
    setError('');
    const reportTeam = allUsers.filter(user => selectedTeamIds.has(user.id));
    const reportTags = allTags.filter(tag => selectedTagIds.has(tag.id));
    
    const initialContent: ReportContent = {
      assunto: '',
      processo: title,
      interessado: '',
      ementa: '',
      relatorio: '',
      parecer: '',
    };
    
    onAddReport({
      title,
      content: JSON.stringify(initialContent, null, 2),
      authorId,
      team: reportTeam,
      deadline,
      tags: reportTags,
    });
  };

  const handleCreateAndSelectTag = () => {
    if (!newTagLabel.trim()) return;
    const existingTag = allTags.find(tag => tag.label.toLowerCase() === newTagLabel.trim().toLowerCase());
    if (existingTag) {
        setSelectedTagIds(prev => new Set(prev).add(existingTag.id));
    } else {
        const newTag = onAddTag(newTagLabel.trim(), newTagColor);
        setSelectedTagIds(prev => new Set(prev).add(newTag.id));
    }
    setNewTagLabel('');
    setNewTagColor(COLORS[2]);
  };

  return (
     <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-slide-up" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Criar Novo Relatório</h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <form onSubmit={handleSubmit} className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="form-label">Nº do Processo SEI</label>
              <input type="text" id="title" value={title} onChange={e => setTitle(formatSeiProcessNumber(e.target.value))} className="mt-1 w-full form-input" required placeholder="Ex: 12.34.123456789-0"/>
            </div>
             {isAdmin ? (
              <div>
                <label htmlFor="authorId" className="form-label">Autor do Relatório</label>
                <select id="authorId" value={authorId} onChange={e => setAuthorId(e.target.value)} className="mt-1 w-full form-select" required>
                  <option value="" disabled>Selecione um autor</option>
                  {allUsers.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select>
              </div>
            ) : (
                <div>
                    <label className="form-label">Autor do Relatório</label>
                    <input type="text" value={currentUser.name} readOnly className="mt-1 w-full form-input bg-slate-100 dark:bg-slate-700 cursor-not-allowed" />
                </div>
            )}
          </div>
          
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                <label className="form-label mb-2">Equipe Responsável</label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2 space-y-1">
                    {allUsers.map(user => (
                       <div key={user.id} onClick={() => handleTeamToggle(user.id)} className={`flex items-center gap-3 p-2 rounded-md cursor-pointer ${selectedTeamIds.has(user.id) ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'} ${user.id === authorId ? 'opacity-70 cursor-not-allowed' : ''}`}>
                           <input type="checkbox" checked={selectedTeamIds.has(user.id)} readOnly className="form-checkbox" disabled={user.id === authorId} />
                           <Avatar name={user.name} className="w-8 h-8 text-xs"/>
                           <div>
                               <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{user.name}</p>
                               <p className="text-xs text-slate-500 dark:text-slate-400">{user.role}</p>
                           </div>
                       </div>
                    ))}
                </div>
              </div>
              <div>
                <label htmlFor="deadline" className="form-label">Prazo Final</label>
                <input type="date" id="deadline" value={deadline} onChange={e => setDeadline(e.target.value)} className="mt-1 w-full form-input" required />
              </div>
           </div>
           
           <div>
             <label className="form-label mb-2">Tags</label>
             <div className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-wrap gap-2">
               {allTags.map(tag => (
                 <button type="button" key={tag.id} onClick={() => handleTagToggle(tag.id)} className={`px-2 py-1 text-xs font-semibold rounded-full border-2 ${selectedTagIds.has(tag.id) ? `border-${tag.color}-500 bg-${tag.color}-100 text-${tag.color}-700 dark:border-${tag.color}-400 dark:bg-${tag.color}-900 dark:text-${tag.color}-200` : `border-transparent bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300`}`}>{tag.label}</button>
               ))}
             </div>
           </div>
           
           <div className="p-4 border rounded-lg border-dashed border-slate-300 dark:border-slate-600 space-y-2">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Criar e Adicionar Nova Tag</h4>
                <div className="flex items-end gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex-grow w-full sm:w-auto"><input type="text" value={newTagLabel} onChange={e => setNewTagLabel(e.target.value)} placeholder="Rótulo da Tag" className="w-full form-input text-sm" /></div>
                    <div className="flex items-center gap-2">{COLORS.map(color => (<button type="button" key={color} onClick={() => setNewTagColor(color)} className={`w-6 h-6 rounded-full bg-${color}-500 ${newTagColor === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}></button>))}</div>
                    <button type="button" onClick={handleCreateAndSelectTag} className="px-3 py-1.5 text-sm font-semibold text-white bg-slate-600 rounded-md hover:bg-slate-700 whitespace-nowrap">Adicionar Tag</button>
                </div>
           </div>

           {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </form>
        <footer className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-6 py-2.5 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
            Cancelar
          </button>
          <button type="submit" onClick={handleSubmit} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-md">
            Salvar Relatório
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CreateReportModal;