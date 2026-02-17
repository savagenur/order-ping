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
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <Link to={backTo} className="text-sm text-indigo-600 hover:text-indigo-700 mb-2 inline-block">
              {backText}
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          </div>
          {actionButton && (
            <button
              onClick={actionButton.onClick}
              disabled={actionButton.disabled}
              className="w-full sm:w-auto px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex gap-1 items-center justify-center"
            >
              {actionButton.icon} <p>{actionButton.text}</p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
