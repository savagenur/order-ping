import { Link } from 'react-router-dom';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  backText?: string;
  actionButton?: {
    text: string;
    onClick: () => void;
    disabled?: boolean;
    icon?: React.ReactNode;
  };
}

export default function AdminHeader({
  title,
  subtitle,
  backTo = '/admin/dashboard',
  backText = '← Back to Dashboard',
  actionButton,
}: AdminHeaderProps) {
  return (
    <div className="bg-zinc-900 border-b border-zinc-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <Link to={backTo} className="text-sm text-blue-400 hover:text-blue-300 mb-2 inline-block transition">
              {backText}
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-sm text-zinc-400">{subtitle}</p>}
          </div>
          {actionButton && (
            <button
              onClick={actionButton.onClick}
              disabled={actionButton.disabled}
              className="w-full sm:w-auto px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex gap-1 items-center justify-center"
            >
              {actionButton.icon} <p>{actionButton.text}</p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
