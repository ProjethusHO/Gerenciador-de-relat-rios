import React, { useState, useMemo } from 'react';
import { Report, TeamMember, ReportStatus } from '../types';
import ReportCard from './ReportCard';

type MemberTab = 'meus-processos' | 'acato' | 'assinatura' | 'concluidos';

interface MemberDashboardProps {
  reports: Report[];
  currentUser: TeamMember;
  users: TeamMember[];
  onOpenReportDetail: (reportId: string) => void;
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({ reports, currentUser, users, onOpenReportDetail }) => {
  const [activeTab, setActiveTab] = useState<MemberTab>('meus-processos');

  const filteredReports = useMemo(() => {
    switch(activeTab) {
      case 'meus-processos':
        return reports.filter(r => 
          (r.authorId === currentUser.id || r.team.some(m => m.id === currentUser.id)) &&
          r.status !== ReportStatus.Completed
        );
      case 'acato':
        return reports.filter(r => 
          r.status === ReportStatus.InReview &&
          r.team.some(m => m.id === currentUser.id) &&
          r.authorId !== currentUser.id &&
          !r.acknowledgements.some(ack => ack.memberId === currentUser.id)
        );
      case 'assinatura':
        return reports.filter(r => 
          r.status === ReportStatus.InReview &&
          r.team.some(m => m.id === currentUser.id) &&
          r.acknowledgements.some(ack => ack.memberId === currentUser.id) &&
          !r.signatures.some(sig => sig.memberId === currentUser.id)
        );
      case 'concluidos':
        return reports.filter(r => r.status === ReportStatus.Completed);
      default:
        return [];
    }
  }, [reports, activeTab, currentUser]);

  const TabButton: React.FC<{tabId: MemberTab, label: string}> = ({ tabId, label }) => (
     <button
        onClick={() => setActiveTab(tabId)}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
          activeTab === tabId 
          ? 'bg-indigo-600 text-white' 
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
      >
        {label}
      </button>
  );

  return (
    <>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">Meu Painel</h2>
        <div className="flex items-center gap-2 p-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg">
          <TabButton tabId="meus-processos" label="Meus Processos" />
          <TabButton tabId="acato" label="Acato" />
          <TabButton tabId="assinatura" label="Assinatura" />
          <TabButton tabId="concluidos" label="Concluídos" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredReports.map(report => (
          <ReportCard 
            key={report.id} 
            report={report} 
            author={users.find(u => u.id === report.authorId)}
            onCardClick={onOpenReportDetail}
            currentUser={currentUser}
            isAdmin={false}
          />
        ))}
      </div>
      {filteredReports.length === 0 && (
        <div className="text-center text-slate-500 mt-12">
            <h3 className="text-xl font-semibold mb-2">Nenhum processo aqui!</h3>
            <p>
                {activeTab === 'meus-processos' && "Você não tem processos pendentes atribuídos."}
                {activeTab === 'acato' && "Não há relatórios de outras equipes aguardando sua revisão."}
                {activeTab === 'assinatura' && "Não há relatórios aguardando sua assinatura final."}
                {activeTab === 'concluidos' && "Nenhum processo foi concluído ainda."}
            </p>
        </div>
      )}
    </>
  );
};

export default MemberDashboard;
