import type { CartInput } from '../../types/admin';

interface CreateCartModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: CartInput;
  onChange: (data: CartInput) => void;
  submitting: boolean;
  cartIdPreview: string;
  cartIdError: string;
}

export default function CreateCartModal({
  show,
  onClose,
  onSubmit,
  formData,
  onChange,
  submitting,
  cartIdPreview,
  cartIdError,
}: CreateCartModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Create New Cart</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              required
              value={formData.businessName}
              onChange={(e) => onChange({ ...formData, businessName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Taco King"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => onChange({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Downtown"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name *
            </label>
            <input
              type="text"
              required
              value={formData.displayName}
              onChange={(e) => onChange({ ...formData, displayName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Taco King Downtown"
            />
            <p className="text-xs text-gray-500 mt-1">
              This name will be shown to customers in the queue
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instagram Handle
            </label>
            <input
              type="text"
              value={formData.settings.instagramHandle}
              onChange={(e) => onChange({ 
                ...formData, 
                settings: { ...formData.settings, instagramHandle: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="@yourbusiness"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Maps Link
            </label>
            <input
              type="url"
              value={formData.settings.googleMapsLink}
              onChange={(e) => onChange({ 
                ...formData, 
                settings: { ...formData.settings, googleMapsLink: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://maps.google.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <input
              type="url"
              value={formData.settings.websiteUrl}
              onChange={(e) => onChange({ 
                ...formData, 
                settings: { ...formData.settings, websiteUrl: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://yourwebsite.com"
            />
          </div>

          {cartIdPreview && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-500 mb-1">Auto-generated Cart ID:</p>
              <p className={`text-sm font-mono ${cartIdError ? 'text-red-600' : 'text-green-600'}`}>
                {cartIdPreview}
              </p>
              {cartIdError && (
                <p className="text-xs text-red-600 mt-1">{cartIdError}</p>
              )}
              {!cartIdError && cartIdPreview && (
                <p className="text-xs text-green-600 mt-1">✓ Available</p>
              )}
              {formData.displayName && (
                <p className="text-xs text-gray-500 mt-2">
                  Display Name: {formData.displayName}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !!cartIdError || !cartIdPreview}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Creating...' : 'Create Cart'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
