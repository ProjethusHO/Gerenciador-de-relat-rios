import React, { useState, useMemo } from 'react';
import { TeamMember, Report, Tag } from '../types';
import ReportFilters, { ReportFiltersState } from './ReportFilters';
import ReportCard from './ReportCard';

interface AdminDashboardProps {
  reports: Report[];
  users: TeamMember[];
  tags: Tag[];
  onOpenCreateModal: () => void;
  onOpenTeamModal: () => void;
  onOpenTagsModal: () => void;
  onOpenSecurityModal: () => void;
  onOpenReportDetail: (reportId: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  reports,
  users,
  tags,
  onOpenCreateModal,
  onOpenTeamModal,
  onOpenTagsModal,
  onOpenSecurityModal,
  onOpenReportDetail,
}) => {
  const [filters, setFilters] = useState<ReportFiltersState>({
    searchTerm: '',
    status: 'all',
    authorId: 'all',
    tagIds: [],
  });
  
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const searchTermMatch = report.title.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const statusMatch = filters.status === 'all' || report.status === filters.status;
      const authorMatch = filters.authorId === 'all' || report.authorId === filters.authorId;
      const tagsMatch = filters.tagIds.length === 0 || filters.tagIds.every(tagId => report.tags?.some(t => t.id === tagId));
      return searchTermMatch && statusMatch && authorMatch && tagsMatch;
    });
  }, [reports, filters]);
  
  // Dummy currentUser for ReportCard, as admin sees all.
  const adminUser = { id: 'admin', name: 'Admin', email: 'admin@system.com', role: 'Administrador' };

  return (
    <>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Painel de Relatórios</h2>
          <div className="flex gap-2 flex-wrap">
            <button onClick={onOpenTeamModal} className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 shadow-sm">
              Equipe
            </button>
            <button onClick={onOpenTagsModal} className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 shadow-sm">
              Tags
            </button>
             <button onClick={onOpenSecurityModal} className="px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 shadow-sm">
              Segurança
            </button>
            <button onClick={onOpenCreateModal} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-md">
              Criar Relatório
            </button>
          </div>
      </div>
      
      <ReportFilters allUsers={users} allTags={tags} onFilterChange={setFilters} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredReports.map(report => (
          <ReportCard 
            key={report.id} 
            report={report} 
            author={users.find(u => u.id === report.authorId)}
            onCardClick={onOpenReportDetail}
            currentUser={adminUser}
            isAdmin={true}
          />
        ))}
      </div>
      {filteredReports.length === 0 && <p className="text-center text-slate-500 mt-8">Nenhum relatório encontrado com os filtros atuais.</p>}
    </>
  );
};

export default AdminDashboard;