import React, { useState } from 'react';

interface ChangePasswordModalProps {
  onClose: () => void;
  onChangePassword: (oldPassword: string, newPassword: string) => boolean;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose, onChangePassword }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('As novas senhas não coincidem.');
      return;
    }
    if (newPassword.length < 3) { // Simplified for demo purposes
        setError('A nova senha deve ter pelo menos 3 caracteres.');
        return;
    }
    const success = onChangePassword(oldPassword, newPassword);
    if (success) {
      alert("Senha alterada com sucesso!");
      onClose();
    } else {
      setError('A senha antiga está incorreta.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Alterar Senha</h2>
        </header>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-900 dark:text-white">Senha Atual</label>
            <input 
              type="password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg block w-full p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-900 dark:text-white">Nova Senha</label>
            <input 
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg block w-full p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-900 dark:text-white">Confirmar Nova Senha</label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg block w-full p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <footer className="pt-2 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-6 py-2.5 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-md">
              Salvar
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
