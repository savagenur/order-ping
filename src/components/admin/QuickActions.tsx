import { Link } from 'react-router-dom';
import { ORDER_COLOR_OPTIONS } from '../../lib/orderColors';

export default function QuickActions() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/admin/carts"
          className="flex items-center p-4 border-2 border-zinc-700 rounded-lg hover:border-blue-500 hover:bg-zinc-800 transition group"
        >
          <div className={`shrink-0 ${ORDER_COLOR_OPTIONS[0].bg} rounded-md p-3 group-hover:${ORDER_COLOR_OPTIONS[0].bg.replace('/20', '/30')}`}>
            <svg className={`h-6 w-6 ${ORDER_COLOR_OPTIONS[0].text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-white">Manage Carts</h3>
            <p className="text-sm text-zinc-400">Create and manage food carts</p>
          </div>
        </Link>

        <Link
          to="/admin/workers"
          className="flex items-center p-4 border-2 border-zinc-700 rounded-lg hover:border-orange-500 hover:bg-zinc-800 transition group"
        >
          <div className={`shrink-0 ${ORDER_COLOR_OPTIONS[1].bg} rounded-md p-3 group-hover:${ORDER_COLOR_OPTIONS[1].bg.replace('/20', '/30')}`}>
            <svg className={`h-6 w-6 ${ORDER_COLOR_OPTIONS[1].text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-white">Manage Workers</h3>
            <p className="text-sm text-zinc-400">Create and assign workers to carts</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
