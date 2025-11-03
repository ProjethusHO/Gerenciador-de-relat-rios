import React from 'react';

interface AvatarProps {
  name: string;
  className?: string;
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  const firstInitial = names[0]?.[0] || '';
  const secondInitial = names.length > 1 ? names[1]?.[0] || '' : '';
  return `${firstInitial}${secondInitial}`.toUpperCase();
};

const FNV1aHash = (str: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
};

const COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 
  'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
  'bg-rose-500'
];

const Avatar: React.FC<AvatarProps> = ({ name, className = 'w-10 h-10' }) => {
  const initials = getInitials(name);
  const colorIndex = FNV1aHash(name) % COLORS.length;
  const color = COLORS[colorIndex];

  return (
    <div title={name} className={`flex items-center justify-center rounded-full text-white font-bold ${color} ${className}`}>
      <span>{initials}</span>
    </div>
  );
};

export default Avatar;