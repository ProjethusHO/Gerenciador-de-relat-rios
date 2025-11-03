import React, { useState, useEffect } from 'react';
import { Notification } from '../types';

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: number) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Set a timeout to trigger the exit animation just before the component is removed
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, 4700); // Slightly less than the 5s removal timer in App.tsx

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    // Allow animation to play before calling the main dismiss function
    setTimeout(() => onDismiss(notification.id), 300);
  };
  
  const typeStyles = {
    info: {
      bg: 'bg-blue-50 dark:bg-slate-700',
      iconBg: 'bg-blue-100 dark:bg-blue-800',
      iconText: 'text-blue-500 dark:text-blue-200',
      icon: <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/></svg>
    },
    success: {
      bg: 'bg-green-50 dark:bg-slate-700',
      iconBg: 'bg-green-100 dark:bg-green-800',
      iconText: 'text-green-500 dark:text-green-200',
      icon: <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/></svg>
    }
  };

  const styles = typeStyles[notification.type];

  return (
    <div
      className={`w-full max-w-xs p-4 text-gray-500 dark:text-gray-400 rounded-lg shadow-lg dark:shadow-slate-900 ${styles.bg} ${isExiting ? 'animate-fade-out' : 'animate-slide-in-right'} flex items-center space-x-4 rtl:space-x-reverse`}
      role="alert"
    >
        <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${styles.iconText} ${styles.iconBg} rounded-lg`}>
            {styles.icon}
        </div>
        <div className="ms-3 text-sm font-normal">{notification.message}</div>
        <button
            type="button"
            className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-slate-800 dark:hover:bg-slate-600"
            onClick={handleDismiss}
            aria-label="Close"
        >
            <span className="sr-only">Close</span>
            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
            </svg>
        </button>
    </div>
  );
};

export default NotificationToast;