import { Bell } from 'lucide-react';

interface NotificationBellProps {
  isSubscribed?: boolean;
  className?: string;
}

export default function NotificationBell({ isSubscribed = false, className = "" }: NotificationBellProps) {
  if (!isSubscribed) return null;

  return (
    <div 
      className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${className}`}
      style={{ backgroundColor: '#F59E0B' }}
    >
      <Bell className="w-3 h-3 text-white" />
    </div>
  );
}
