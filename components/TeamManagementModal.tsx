import React, { useState, useRef } from 'react';
import { TeamMember } from '../types';
import Avatar from './Avatar';
import { extractMembersFromPdf } from '../services/geminiService';

interface TeamManagementModalProps {
  allUsers: TeamMember[];
  onClose: () => void;
  onAddUser: (name: string, role: string, email?: string) => void;
  onRemoveUser: (userId: string) => void;
}

const TeamManagementModal: React.FC<TeamManagementModalProps> = ({ allUsers, onClose, onAddUser, onRemoveUser }) => {
    const [suggestedMembers, setSuggestedMembers] = useState<{name: string, role: string}[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for manual user addition
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState('Membro');

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Por favor, selecione um arquivo PDF.');
            return;
        }

        setIsProcessing(true);
        setError('');
        setSuggestedMembers([]);

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = async () => {
            try {
                const base64String = (reader.result as string).split(',')[1];
                const members = await extractMembersFromPdf(base64String);
                
                const existingNames = new Set(allUsers.map(u => u.name));
                const newSuggestions = members.filter(m => !existingNames.has(m.name));
                setSuggestedMembers(newSuggestions);

                if (newSuggestions.length === 0 && members.length > 0) {
                  setError("Todos os membros do PDF já estão na equipe.");
                } else if (members.length === 0) {
                  setError("Nenhum membro encontrado no documento.");
                }
            } catch (err: any) {
                setError(err.message || 'Falha ao processar o PDF.');
            } finally {
                setIsProcessing(false);
            }
        };

        reader.onerror = () => {
            setError('Falha ao ler o arquivo.');
            setIsProcessing(false);
        };
        
        if (event.target) {
            event.target.value = '';
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleAddSuggestedUser = (name: string, role: string) => {
        onAddUser(name, role); // Email is optional, will be requested on first login
        setSuggestedMembers(prev => prev.filter(m => m.name !== name));
    };

    const handleAddUserManually = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim() && newRole.trim()) {
            onAddUser(newName, newRole, newEmail.trim() ? newEmail : undefined);
            setNewName('');
            setNewEmail('');
            setNewRole('Membro');
        }
    };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-slide-up" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gerenciar Equipe</h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <main className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Adicionar a partir de PDF</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Faça upload de um PDF de convocação para adicionar novos membros diretamente.
                    </p>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="application/pdf"
                      disabled={isProcessing}
                    />
                    <button 
                      type="button" 
                      onClick={triggerFileInput}
                      disabled={isProcessing}
                      className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? 'Processando...' : 'UPLOAD de Convocação'}
                    </button>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                    {suggestedMembers.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200">Membros extraídos:</h4>
                            <ul className="space-y-2 mt-2">
                              {suggestedMembers.map(member => (
                                  <li key={member.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                                      <div>
                                          <p className="font-semibold text-slate-900 dark:text-slate-100">{member.name}</p>
                                          <p className="text-sm text-slate-500 dark:text-slate-400">{member.role}</p>
                                      </div>
                                      <button onClick={() => handleAddSuggestedUser(member.name, member.role)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                                          Adicionar
                                      </button>
                                  </li>
                              ))}
                            </ul>
                        </div>
                    )}
                </div>

                <form onSubmit={handleAddUserManually} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Adicionar Manualmente</h3>
                    <div>
                        <label className="text-sm font-medium">Nome Completo</label>
                        <input value={newName} onChange={e => setNewName(e.target.value)} type="text" className="mt-1 w-full form-input" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium">E-mail (Opcional)</label>
                        <input value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" className="mt-1 w-full form-input" />
                    </div>
                     <div>
                        <label className="text-sm font-medium">Cargo</label>
                        <input value={newRole} onChange={e => setNewRole(e.target.value)} type="text" className="mt-1 w-full form-input" required />
                    </div>
                    <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Adicionar Membro</button>
                </form>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Membros Atuais</h3>
                {allUsers.length > 0 ? (
                  <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
                      {allUsers.map(user => (
                          <li key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                              <div className="flex items-center gap-4">
                                  <Avatar name={user.name} className="w-10 h-10 text-sm"/>
                                  <div>
                                      <p className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                                      <p className="text-sm text-slate-500 dark:text-slate-400">{user.email || 'E-mail pendente'}</p>
                                  </div>
                              </div>
                              <button onClick={() => onRemoveUser(user.id)} className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                                  Remover
                              </button>
                          </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-center text-slate-500 dark:text-slate-400 py-4">Nenhum membro na equipe ainda.</p>
                )}
            </div>
        </main>
        <footer className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
             <button type="button" onClick={onClose} className="px-6 py-2.5 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                Fechar
            </button>
        </footer>
      </div>
    </div>
  );
};

export default TeamManagementModal;