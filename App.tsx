import React, { useState, useEffect } from 'react';
import { TeamMember, Report, ReportStatus, Notification, Tag, Comment, Attachment, ContentHistory } from './types';
import { INITIAL_USERS, INITIAL_REPORTS, ALL_TAGS } from './constants';
import { generateReportSummary } from './services/geminiService';
import UserSwitcher from './components/UserSwitcher';
import LoginModal from './components/LoginModal';
import AdminLoginModal from './components/AdminLoginModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import CreateReportModal from './components/CreateReportModal';
import ReportDetailModal from './components/ReportDetailModal';
import TeamManagementModal from './components/TeamManagementModal';
import TagManagementModal from './components/TagManagementModal';
import NotificationContainer from './components/NotificationContainer';
import AdminDashboard from './components/AdminDashboard';
import MemberDashboard from './components/MemberDashboard';
import SetSignaturePasswordModal from './components/SetSignaturePasswordModal';
import ConfirmActionModal from './components/ConfirmActionModal';
import SecuritySettingsModal from './components/SecuritySettingsModal';
import CompleteProfileModal from './components/CompleteProfileModal';
import './components/ReportEditor'; // Ensure ReportEditor is part of the build context if needed


// Mock passwords - in a real app, this would be handled securely on a backend.
const MOCK_PASSWORDS: { [key: string]: string } = {
  'user-1': '123',
  'user-2': '123',
  'user-3': '123',
  'user-4': '123',
};
const ADMIN_PASSWORD = 'admin';

const App: React.FC = () => {
  const [users, setUsers] = useState<TeamMember[]>(INITIAL_USERS);
  const [passwords, setPasswords] = useState<{ [key: string]: string }>(MOCK_PASSWORDS);
  const [signaturePasswords, setSignaturePasswords] = useState<{ [key: string]: string }>({});
  const [exceptionPassword, setExceptionPassword] = useState('admin123');
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
  const [tags, setTags] = useState<Tag[]>(ALL_TAGS);
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Modal states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [actionToConfirm, setActionToConfirm] = useState<{ type: 'sign' | 'delete', reportId: string } | null>(null);
  const [userCompletingProfile, setUserCompletingProfile] = useState<TeamMember | null>(null);

  useEffect(() => {
    // Load signature passwords from local storage on startup
    const saved = localStorage.getItem('signaturePasswords');
    if (saved) {
      setSignaturePasswords(JSON.parse(saved));
    }
  }, []);

  const addNotification = (message: string, type: 'info' | 'success' = 'info') => {
    const newNotification: Notification = { id: Date.now(), message, type };
    setNotifications(prev => [...prev, newNotification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };
  
  const handleLogin = (identifier: string, password: string): boolean => {
    const user = users.find(u => (u.email?.toLowerCase() === identifier.toLowerCase() || u.name.toLowerCase() === identifier.toLowerCase()));
    if (user && passwords[user.id] === password) {
      if (!user.email) {
        // First time login, needs to set email
        setUserCompletingProfile(user);
        setActiveModal('completeProfile');
        return true; // Indicates password was correct, but needs profile completion
      }
      setCurrentUser(user);
      setIsAdmin(false);
      addNotification(`Bem-vindo(a), ${user.name}!`, 'success');
      return true;
    }
    return false;
  };
  
  const handleCompleteProfile = (email: string): boolean => {
    if (!userCompletingProfile) return false;

    // Check if email already exists
    if (users.some(u => u.email?.toLowerCase() === email.toLowerCase() && u.id !== userCompletingProfile.id)) {
        return false; // Email is a duplicate
    }
    
    const updatedUser = { ...userCompletingProfile, email };
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    
    // Now log the user in
    setCurrentUser(updatedUser);
    setUserCompletingProfile(null);
    setActiveModal(null);
    addNotification(`Perfil atualizado! Bem-vindo(a), ${updatedUser.name}!`, 'success');

    return true;
  };

  const handleAdminLogin = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
        setCurrentUser({ id: 'admin', name: 'Jarvis', email: 'admin@system.com', role: 'Administrador'});
        setIsAdmin(true);
        setActiveModal(null);
        addNotification('Acesso de administrador concedido.', 'success');
        return true;
    }
    return false;
  };

  const handleLogout = () => {
    addNotification(`Até logo, ${currentUser?.name}!`);
    setCurrentUser(null);
    setIsAdmin(false);
  };

  const handleChangePassword = (oldPass: string, newPass: string): boolean => {
    if (currentUser && !isAdmin) {
      if (passwords[currentUser.id] === oldPass) {
        setPasswords(prev => ({...prev, [currentUser.id]: newPass}));
        setActiveModal(null);
        addNotification('Senha alterada com sucesso!', 'success');
        return true;
      }
    }
    return false;
  }

  const handleSetSignaturePassword = (password: string): boolean => {
    if (currentUser && !isAdmin) {
      const newPasswords = {...signaturePasswords, [currentUser.id]: password};
      setSignaturePasswords(newPasswords);
      localStorage.setItem('signaturePasswords', JSON.stringify(newPasswords)); // Persist to local storage
      setActiveModal(null);
      addNotification('Senha de assinatura configurada com sucesso!', 'success');
      return true;
    }
    return false;
  };

  const handleSetExceptionPassword = (password: string): boolean => {
    if(isAdmin) {
      setExceptionPassword(password);
      setActiveModal(null);
      addNotification('Senha de exceções foi atualizada!', 'success');
      return true;
    }
    return false;
  };

  const handleAddReport = (reportData: Omit<Report, 'id' | 'status' | 'comments' | 'attachments' | 'signatures' | 'acknowledgements' | 'startedAt' | 'aiSummary' | 'contentHistory'>) => {
    const newReport: Report = {
      ...reportData,
      id: `report-${Date.now()}`,
      status: ReportStatus.Draft,
      comments: [],
      attachments: [],
      signatures: [],
      acknowledgements: [],
      startedAt: null,
      aiSummary: null,
      contentHistory: [],
    };
    setReports(prev => [newReport, ...prev]);
    setActiveModal(null);
    addNotification('Novo relatório criado com sucesso!', 'success');
  };

  const confirmSignReport = (reportId: string, passwordAttempt: string): boolean => {
      if (!currentUser || signaturePasswords[currentUser.id] !== passwordAttempt) {
        return false;
      }

      const reportToUpdate = reports.find(r => r.id === reportId);
      if (!reportToUpdate) return false;

      // Add signature
      let updatedReports = reports.map(r => {
        if (r.id === reportId) {
          const newSignatures = [...r.signatures, { memberId: currentUser.id, signedAt: new Date().toISOString() }];
          return { ...r, signatures: newSignatures };
        }
        return r;
      });

      // Check for automatic status transitions
      let finalReport = updatedReports.find(r => r.id === reportId)!;
      let statusChanged = false;

      // 1. If author signs a draft, move to InReview
      if (finalReport.authorId === currentUser.id && finalReport.status === ReportStatus.Draft) {
        finalReport.status = ReportStatus.InReview;
        addNotification('Relatório movido para Revisão.', 'info');
        statusChanged = true;
      }

      // 2. Check for 50% + 1 signatures to auto-complete
      const requiredSignatures = Math.floor(finalReport.team.length / 2) + 1;
      if (finalReport.signatures.length >= requiredSignatures && finalReport.status !== ReportStatus.Completed) {
        finalReport.status = ReportStatus.Completed;
        statusChanged = true;
        // Trigger AI summary generation in the background (no await needed for UI)
        generateAndSetSummary(finalReport.id);
        addNotification(`Relatório concluído automaticamente com ${finalReport.signatures.length} assinaturas.`, 'success');
      }
      
      if(statusChanged){
        setReports(updatedReports.map(r => r.id === reportId ? finalReport : r));
      } else {
        setReports(updatedReports);
      }
      
      addNotification('Relatório assinado!', 'success');
      setActionToConfirm(null);
      return true;
  };

  const handleAcknowledgeReport = (reportId: string, memberId: string) => {
    setReports(prevReports => prevReports.map(r => {
      if (r.id === reportId && !r.acknowledgements.some(a => a.memberId === memberId)) {
        const newAcks = [...r.acknowledgements, { memberId, signedAt: new Date().toISOString() }];
        return { ...r, acknowledgements: newAcks };
      }
      return r;
    }));
     addNotification('Relatório acatado para revisão.', 'success');
  }

  const generateAndSetSummary = async (reportId: string) => {
    const reportToSummarize = reports.find(r => r.id === reportId);
     if (!reportToSummarize) return;

    try {
      addNotification('Gerando resumo com IA...', 'info');
      const teamMemberNames = reportToSummarize.team.map(m => m.name).join(', ');
      const summary = await generateReportSummary(reportToSummarize, teamMemberNames);
      setReports(prev => prev.map(r => r.id === reportId ? {...r, aiSummary: summary} : r));
      addNotification('Resumo gerado com sucesso!', 'success');
    } catch (error: any) {
      addNotification(error.message || 'Falha ao gerar resumo.', 'info');
    }
  }
  
  const handleUpdateReportStatus = async (reportId: string, status: ReportStatus) => {
      const reportToUpdate = reports.find(r => r.id === reportId);
      if (!reportToUpdate) return;
      
      setReports(prev => prev.map(r => r.id === reportId ? {...r, status } : r));
      addNotification(`Status do relatório atualizado para "${status}".`);

      if (status === ReportStatus.Completed && !reportToUpdate.aiSummary) {
          await generateAndSetSummary(reportId);
      }
  };

  const confirmDeleteReport = (reportId: string, passwordAttempt: string): boolean => {
      if (!isAdmin || passwordAttempt !== exceptionPassword) return false;
      
      setReports(prev => prev.filter(r => r.id !== reportId));
      setActiveModal(null);
      setActionToConfirm(null);
      addNotification('Relatório excluído com sucesso.', 'info');
      return true;
  };
  
  const handleUpdateReportTags = (reportId: string, newTags: Tag[]) => {
    setReports(prev => prev.map(r => r.id === reportId ? {...r, tags: newTags} : r));
    addNotification('Tags do relatório atualizadas.', 'success');
  };
  
  const handleStartReport = (reportId: string) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, startedAt: new Date().toISOString() } : r));
  };

  const handleUpdateReportContent = (reportId: string, newContentString: string) => {
    setReports(prev => prev.map(r => {
        if (r.id === reportId) {
            // Do not save if content is identical, to avoid empty history entries
            if (r.content === newContentString) {
                return r;
            }
            const historyEntry: ContentHistory = {
                content: r.content, // The content *before* this update
                timestamp: new Date().toISOString(),
                editorId: currentUser!.id,
            };
            const newHistory = [...(r.contentHistory || []), historyEntry];
            return { ...r, content: newContentString, contentHistory: newHistory };
        }
        return r;
    }));
  };

  const handleRestoreContentVersion = (reportId: string, historyEntry: ContentHistory) => {
    setReports(prev => prev.map(r => {
        if (r.id === reportId) {
            // Save the current state to history before restoring
            const preRestoreHistoryEntry: ContentHistory = {
                content: r.content,
                timestamp: new Date().toISOString(),
                editorId: currentUser!.id,
            };
            return {
                ...r,
                content: historyEntry.content,
                contentHistory: [...(r.contentHistory || []), preRestoreHistoryEntry],
            };
        }
        return r;
    }));
    addNotification('Versão do conteúdo restaurada.', 'success');
  };

  const handleAddComment = (reportId: string, text: string) => {
    if (!currentUser) return;
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      authorId: currentUser.id,
      text,
      createdAt: new Date().toISOString(),
    };
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, comments: [...r.comments, newComment] } : r));
  };
  
  const handleAddAttachment = (reportId: string, file: File) => {
    if (!currentUser) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const newAttachment: Attachment = {
        id: `file-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: reader.result as string, // Store the Data URL
        uploadedById: currentUser.id,
        uploadedAt: new Date().toISOString(),
      };
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, attachments: [...r.attachments, newAttachment] } : r));
      addNotification(`Arquivo "${file.name}" anexado.`, 'success');
    };
  };

  const handleAddUser = (name: string, role: string, email?: string) => {
      if (email && users.some(u => u.email === email)) {
        addNotification(`O email ${email} já está em uso.`, 'info');
        return;
      }
      const newUser: TeamMember = { 
        id: `user-${Date.now()}`, 
        name, 
        email: email || null,
        role 
      };
      setUsers(prev => [...prev, newUser]);
      setPasswords(prev => ({...prev, [newUser.id]: '123'})); // Default password
      addNotification(`Usuário ${name} adicionado.`, 'success');
  };

  const handleRemoveUser = (userId: string) => {
      const isUserInReport = reports.some(r => r.authorId === userId || r.team.some(t => t.id === userId));
      if (isUserInReport) {
          addNotification('Não é possível remover usuário que está em um relatório.', 'info');
          return;
      }
      setUsers(prev => prev.filter(u => u.id !== userId));
      addNotification('Usuário removido.', 'info');
  };
  
  const handleAddTag = (label: string, color: string): Tag => {
      const newTag: Tag = { id: `tag-${Date.now()}`, label, color };
      setTags(prev => [...prev, newTag]);
      addNotification(`Tag "${label}" adicionada.`, 'success');
      return newTag;
  }

  const handleRemoveTag = (tagId: string) => {
      setTags(prev => prev.filter(t => t.id !== tagId));
      setReports(prev => prev.map(r => ({ ...r, tags: r.tags?.filter(t => t.id !== tagId)})));
      addNotification('Tag removida.', 'info');
  }

  const handleUpdateTag = (tagId: string, label: string, color: string) => {
    setTags(prev => prev.map(t => (t.id === tagId ? { ...t, label, color } : t)));
    addNotification(`Tag "${label}" atualizada.`, 'success');
  };

  const openReportDetail = (reportId: string) => {
    setSelectedReportId(reportId);
    setActiveModal('detail');
  };

  if (!currentUser) {
    return (
      <>
        <LoginModal onLogin={handleLogin} onAdminClick={() => setActiveModal('adminLogin')} usersCount={users.length} />
        {activeModal === 'adminLogin' && <AdminLoginModal onClose={() => setActiveModal(null)} onLogin={handleAdminLogin} />}
        {activeModal === 'completeProfile' && userCompletingProfile && (
            <CompleteProfileModal 
                user={userCompletingProfile}
                onComplete={handleCompleteProfile}
                onCancel={() => {
                    setUserCompletingProfile(null);
                    setActiveModal(null);
                }}
            />
        )}
      </>
    );
  }

  const selectedReport = reports.find(r => r.id === selectedReportId);

  return (
    <div className="bg-slate-100 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-200 font-sans">
      <NotificationContainer notifications={notifications} onDismiss={id => setNotifications(prev => prev.filter(n => n.id !== id))} />
      
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Sistema de Relatórios</h1>
          <UserSwitcher 
            currentUser={currentUser} 
            onLogout={handleLogout} 
            onChangePasswordClick={() => setActiveModal('changePassword')}
            onSignatureSettingsClick={() => setActiveModal('setSignaturePassword')}
          />
        </div>
      </header>
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAdmin ? (
            <AdminDashboard
              reports={reports}
              users={users}
              tags={tags}
              onOpenCreateModal={() => setActiveModal('create')}
              onOpenTeamModal={() => setActiveModal('team')}
              onOpenTagsModal={() => setActiveModal('tags')}
              onOpenSecurityModal={() => setActiveModal('security')}
              onOpenReportDetail={openReportDetail}
            />
        ) : (
            <MemberDashboard
              reports={reports}
              currentUser={currentUser}
              users={users}
              onOpenReportDetail={openReportDetail}
            />
        )}
      </main>
      
      {/* Modals */}
      {activeModal === 'create' && (
        <CreateReportModal 
          onClose={() => setActiveModal(null)} 
          onAddReport={handleAddReport} 
          allUsers={users} 
          currentUser={currentUser}
          isAdmin={isAdmin}
          allTags={tags}
          onAddTag={handleAddTag}
        />
      )}
      {activeModal === 'detail' && selectedReport && (
        <ReportDetailModal 
            onClose={() => setActiveModal(null)} 
            report={selectedReport} 
            allUsers={users} 
            allTags={tags} 
            currentUser={currentUser}
            onAcknowledgeReport={handleAcknowledgeReport}
            onSignReport={(reportId) => setActionToConfirm({ type: 'sign', reportId })}
            onUpdateReportStatus={handleUpdateReportStatus} 
            onDeleteReport={(reportId) => setActionToConfirm({ type: 'delete', reportId })}
            onUpdateReportTags={handleUpdateReportTags}
            onStartReport={handleStartReport}
            onUpdateContent={handleUpdateReportContent}
            onRestoreContentVersion={handleRestoreContentVersion}
            onAddComment={handleAddComment}
            onAddAttachment={handleAddAttachment}
        />
      )}
      {actionToConfirm && (
          <ConfirmActionModal
            isOpen={!!actionToConfirm}
            onClose={() => setActionToConfirm(null)}
            onConfirm={(password) => {
              if (actionToConfirm.type === 'sign') {
                return confirmSignReport(actionToConfirm.reportId, password);
              }
              if (actionToConfirm.type === 'delete') {
                return confirmDeleteReport(actionToConfirm.reportId, password);
              }
              return false;
            }}
            title={actionToConfirm.type === 'delete' ? 'Confirmar Exclusão' : 'Confirmar Assinatura'}
            description={actionToConfirm.type === 'delete' ? 'Esta ação é irreversível. Insira a senha de exceções para confirmar.' : 'Para assinar, por favor, insira sua senha de assinatura.'}
            passwordLabel={actionToConfirm.type === 'delete' ? 'Senha de Exceções' : 'Senha de Assinatura'}
          />
      )}
      {activeModal === 'changePassword' && !isAdmin && <ChangePasswordModal onClose={() => setActiveModal(null)} onChangePassword={handleChangePassword} />}
      {activeModal === 'setSignaturePassword' && !isAdmin && <SetSignaturePasswordModal onClose={() => setActiveModal(null)} onSetPassword={handleSetSignaturePassword}/>}
      {activeModal === 'team' && isAdmin && <TeamManagementModal onClose={() => setActiveModal(null)} allUsers={users} onAddUser={handleAddUser} onRemoveUser={handleRemoveUser} />}
      {activeModal === 'tags' && isAdmin && <TagManagementModal onClose={() => setActiveModal(null)} allTags={tags} onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} onUpdateTag={handleUpdateTag} />}
      {activeModal === 'security' && isAdmin && <SecuritySettingsModal onClose={() => setActiveModal(null)} onSetPassword={handleSetExceptionPassword} currentPassword={exceptionPassword} />}

    </div>
  );
};

export default App;
