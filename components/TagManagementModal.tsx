import React, { useState } from 'react';
import { Tag } from '../types';

interface TagManagementModalProps {
  allTags: Tag[];
  onClose: () => void;
  onAddTag: (label: string, color: string) => void;
  onRemoveTag: (tagId: string) => void;
  onUpdateTag: (tagId: string, label: string, color: string) => void;
}

const COLORS = ['red', 'green', 'blue', 'purple', 'yellow', 'indigo', 'pink'];

const TagManagementModal: React.FC<TagManagementModalProps> = ({ allTags, onClose, onAddTag, onRemoveTag, onUpdateTag }) => {
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);

  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editedLabel, setEditedLabel] = useState('');
  const [editedColor, setEditedColor] = useState('');

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLabel.trim()) {
      onAddTag(newLabel, newColor);
      setNewLabel('');
      setNewColor(COLORS[0]);
    }
  };

  const handleEditClick = (tag: Tag) => {
    setEditingTag(tag);
    setEditedLabel(tag.label);
    setEditedColor(tag.color);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
  };

  const handleSaveEdit = () => {
    if (editingTag && editedLabel.trim()) {
      onUpdateTag(editingTag.id, editedLabel, editedColor);
      setEditingTag(null);
    }
  };

  const getTagStyle = (color: string) => {
    const styles: { [key: string]: string } = {
      red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    };
    return styles[color] || 'bg-gray-100 text-gray-800';
  };
  
  const getBgColor = (color: string) => {
      return `bg-${color}-500`;
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] animate-slide-up" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gerenciar Tags</h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <form onSubmit={handleAddTag} className="space-y-4 p-4 border rounded-lg border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold">Adicionar Nova Tag</h3>
            <div>
              <label className="block text-sm font-medium">Rótulo</label>
              <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)} className="mt-1 w-full form-input" />
            </div>
            <div>
              <label className="block text-sm font-medium">Cor</label>
              <div className="mt-1 flex gap-2">
                {COLORS.map(color => (
                  <button type="button" key={color} onClick={() => setNewColor(color)} className={`w-8 h-8 rounded-full ${getBgColor(color)} ${newColor === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}></button>
                ))}
              </div>
            </div>
            <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">Adicionar Tag</button>
          </form>
          <div>
            <h3 className="text-lg font-semibold">Tags Atuais</h3>
            <ul className="mt-2 space-y-2">
              {allTags.map(tag => (
                <li key={tag.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  {editingTag?.id === tag.id ? (
                    <div className="space-y-3">
                        <input type="text" value={editedLabel} onChange={e => setEditedLabel(e.target.value)} className="w-full form-input" />
                        <div className="flex gap-2">
                            {COLORS.map(color => (
                                <button type="button" key={color} onClick={() => setEditedColor(color)} className={`w-7 h-7 rounded-full ${getBgColor(color)} ${editedColor === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}></button>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={handleCancelEdit} className="px-3 py-1 text-sm font-semibold rounded-md">Cancelar</button>
                            <button onClick={handleSaveEdit} className="px-3 py-1 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Salvar</button>
                        </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${getTagStyle(tag.color)}`}>{tag.label}</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleEditClick(tag)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                          Editar
                        </button>
                        <button onClick={() => onRemoveTag(tag.id)} className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                          Remover
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TagManagementModal;