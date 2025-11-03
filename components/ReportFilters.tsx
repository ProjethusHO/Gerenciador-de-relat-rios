import React, { useState, useEffect } from 'react';
import { TeamMember, ReportStatus, Tag } from '../types';

export interface ReportFiltersState {
  searchTerm: string;
  status: ReportStatus | 'all';
  authorId: string | 'all';
  tagIds: string[];
}

interface ReportFiltersProps {
  allUsers: TeamMember[];
  allTags: Tag[];
  onFilterChange: (filters: ReportFiltersState) => void;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({ allUsers, allTags, onFilterChange }) => {
  const [filters, setFilters] = useState<ReportFiltersState>({
    searchTerm: '',
    status: 'all',
    authorId: 'all',
    tagIds: [],
  });

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (tagId: string) => {
    setFilters(prev => {
      const newTagIds = new Set(prev.tagIds);
      if (newTagIds.has(tagId)) {
        newTagIds.delete(tagId);
      } else {
        newTagIds.add(tagId);
      }
      return { ...prev, tagIds: Array.from(newTagIds) };
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="searchTerm" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Buscar por Nº do Processo
          </label>
          <input
            type="text"
            id="searchTerm"
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleInputChange}
            className="mt-1 w-full form-input"
            placeholder="Ex: 25.50.000038771-0"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleInputChange}
            className="mt-1 w-full form-select"
          >
            <option value="all">Todos</option>
            {Object.values(ReportStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="authorId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Autor
          </label>
          <select
            id="authorId"
            name="authorId"
            value={filters.authorId}
            onChange={handleInputChange}
            className="mt-1 w-full form-select"
          >
            <option value="all">Todos</option>
            {allUsers.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tags</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => handleTagToggle(tag.id)}
                className={`px-2 py-1 text-xs font-semibold rounded-full border-2 ${
                  filters.tagIds.includes(tag.id)
                    ? 'border-indigo-500 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                    : 'border-transparent bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;