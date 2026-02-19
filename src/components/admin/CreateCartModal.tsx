import type { CartInput } from '../../types/admin';
import { X } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Create New Cart</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              required
              value={formData.businessName}
              onChange={(e) => onChange({ ...formData, businessName: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
              placeholder="Taco King"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Location *
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => onChange({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
              placeholder="Downtown"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Display Name *
            </label>
            <input
              type="text"
              required
              value={formData.displayName}
              onChange={(e) => onChange({ ...formData, displayName: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
              placeholder="Taco King Downtown"
            />
            <p className="text-xs text-zinc-500 mt-1">
              This name will be shown to customers in the queue
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Instagram Handle
            </label>
            <input
              type="text"
              value={formData.settings.instagramHandle}
              onChange={(e) => onChange({ 
                ...formData, 
                settings: { ...formData.settings, instagramHandle: e.target.value }
              })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
              placeholder="@yourbusiness"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Google Maps Link
            </label>
            <input
              type="url"
              value={formData.settings.googleMapsLink}
              onChange={(e) => onChange({ 
                ...formData, 
                settings: { ...formData.settings, googleMapsLink: e.target.value }
              })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
              placeholder="https://maps.google.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Website URL
            </label>
            <input
              type="url"
              value={formData.settings.websiteUrl}
              onChange={(e) => onChange({ 
                ...formData, 
                settings: { ...formData.settings, websiteUrl: e.target.value }
              })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
              placeholder="https://yourwebsite.com"
            />
          </div>

          {cartIdPreview && (
            <div className="bg-zinc-800 p-3 rounded-md">
              <p className="text-xs text-zinc-500 mb-1">Auto-generated Cart ID:</p>
              <p className={`text-sm font-mono ${cartIdError ? 'text-red-400' : 'text-green-400'}`}>
                {cartIdPreview}
              </p>
              {cartIdError && (
                <p className="text-xs text-red-400 mt-1">{cartIdError}</p>
              )}
              {!cartIdError && cartIdPreview && (
                <p className="text-xs text-green-400 mt-1">✓ Available</p>
              )}
              {formData.displayName && (
                <p className="text-xs text-zinc-500 mt-2">
                  Display Name: {formData.displayName}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-300 border border-zinc-600 rounded-md hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !!cartIdError || !cartIdPreview}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Creating...' : 'Create Cart'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
