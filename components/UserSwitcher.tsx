import React from 'react';
import { TeamMember } from '../types';
import Avatar from './Avatar';

interface UserSwitcherProps {
  currentUser: TeamMember;
  onLogout: () => void;
  onChangePasswordClick: () => void;
  onSignatureSettingsClick: () => void;
}

const UserSwitcher: React.FC<UserSwitcherProps> = ({ currentUser, onLogout, onChangePasswordClick, onSignatureSettingsClick }) => {
  const isAdmin = currentUser.role === 'Administrador';
  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <div className="font-bold text-slate-800 dark:text-slate-100">{currentUser.name}</div>
        <div className="text-sm text-slate-500 dark:text-slate-400">{currentUser.role}</div>
      </div>
      <Avatar name={currentUser.name} className="w-12 h-12" />
      <div className="flex flex-col gap-1 items-start">
        {!isAdmin && (
            <button 
              onClick={onSignatureSettingsClick}
              className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
              title="Configurar sua senha de assinatura"
            >
              Senha de Assinatura
            </button>
        )}
        <button 
          onClick={onChangePasswordClick}
          className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
          title="Alterar sua senha de login"
        >
          Trocar Senha
        </button>
        <button 
          onClick={onLogout}
          className="text-xs text-slate-500 hover:underline dark:text-slate-400"
          title="Sair do sistema"
        >
          Sair
        </button>
      </div>
    </div>
  );
};

export default UserSwitcher;