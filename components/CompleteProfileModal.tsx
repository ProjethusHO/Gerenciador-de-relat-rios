import React, { useState } from 'react';
import { TeamMember } from '../types';

interface CompleteProfileModalProps {
  user: TeamMember;
  onComplete: (email: string) => boolean;
  onCancel: () => void;
}

const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({ user, onComplete, onCancel }) => {
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (email !== confirmEmail) {
      setError('Os e-mails não coincidem.');
      return;
    }
    
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        setError('Por favor, insira um e-mail válido.');
        return;
    }

    const success = onComplete(email);
    if (!success) {
      setError('Este e-mail já está em uso por outro membro.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Complete seu Perfil</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Olá, {user.name}! Este é seu primeiro acesso. Por favor, cadastre seu e-mail para continuar.
          </p>
        </header>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-900 dark:text-white">Seu E-mail</label>
            <input 
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg block w-full p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-900 dark:text-white">Confirme seu E-mail</label>
            <input 
              type="email"
              value={confirmEmail}
              onChange={e => setConfirmEmail(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg block w-full p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <footer className="pt-2 flex justify-end gap-4">
            <button type="button" onClick={onCancel} className="px-6 py-2.5 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-md">
              Salvar e Continuar
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfileModal;
