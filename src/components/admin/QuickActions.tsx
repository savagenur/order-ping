import { Link } from 'react-router-dom';

export default function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/admin/carts"
          className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition group"
        >
          <div className="shrink-0 bg-indigo-100 rounded-md p-3 group-hover:bg-indigo-200">
            <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">Manage Carts</h3>
            <p className="text-sm text-gray-600">Create and manage food carts</p>
          </div>
        </Link>

        <Link
          to="/admin/workers"
          className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition group"
        >
          <div className="shrink-0 bg-green-100 rounded-md p-3 group-hover:bg-green-200">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">Manage Workers</h3>
            <p className="text-sm text-gray-600">Create and assign workers to carts</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
