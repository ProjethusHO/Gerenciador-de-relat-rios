import React from 'react';
import { Notification } from '../types';
import NotificationToast from './NotificationToast';

interface NotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: number) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] w-full max-w-xs space-y-3">
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;