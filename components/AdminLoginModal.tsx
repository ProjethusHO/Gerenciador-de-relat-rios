import React, { useState } from 'react';

interface AdminLoginModalProps {
  onClose: () => void;
  onLogin: (password: string) => boolean;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onLogin }) => {
  const [username] = useState('Jarvis');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(password);
    if (!success) {
      setError('Senha incorreta.');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Login de Administrador</h2>
            <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="username" className="block mb-2 text-sm font-medium text-slate-900 dark:text-white">Usuário</label>
            <input 
              type="text" 
              id="username"
              value={username}
              className="bg-slate-200 dark:bg-slate-700 border-transparent text-slate-500 dark:text-slate-400 text-sm rounded-lg block w-full p-2.5"
              readOnly
            />
          </div>
          <div>
            <label htmlFor="password"className="block mb-2 text-sm font-medium text-slate-900 dark:text-white">Senha</label>
            <input 
              type="password"
              id="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white"
              autoFocus
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-md">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginModal;
