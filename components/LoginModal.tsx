
import React, { useState } from 'react';

interface LoginModalProps {
  onLogin: (identifier: string, password: string) => boolean;
  onAdminClick: () => void;
  usersCount: number;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onAdminClick, usersCount }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = onLogin(identifier, password);
    if (!success) {
      setError('Identificador ou senha inválidos.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col animate-slide-up">
        <header className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center">Acessar Sistema</h2>
        </header>
        {usersCount === 0 && (
          <div className="px-6 pb-4 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nenhum usuário cadastrado. Acesse como administrador para configurar a equipe.
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
          <div>
            <label htmlFor="identifier" className="block mb-2 text-sm font-medium text-slate-900 dark:text-white">E-mail ou Nome Completo</label>
            <input 
              type="text" 
              id="identifier"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white"
              required
              autoFocus
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
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-md">
            Entrar
          </button>
        </form>
        <footer className="p-4 border-t border-slate-200 dark:border-slate-700">
           <button onClick={onAdminClick} className="text-sm text-indigo-600 hover:underline w-full text-center">
             Acessar como Administrador
           </button>
        </footer>
      </div>
    </div>
  );
};

export default LoginModal;