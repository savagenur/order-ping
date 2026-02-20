import { X } from 'lucide-react';
import type { Cart } from '../../types/admin';

interface EditCartModalProps {
  show: boolean;
  cart: Cart | null;
  onClose: () => void;
  onSubmit: (data: {
    businessName: string;
    location: string;
    displayName: string;
    settings: {
      instagramHandle?: string;
      placeId?: string;
      websiteUrl?: string;
    };
    active: boolean;
  }) => void;
  submitting: boolean;
}

export default function EditCartModal({
  show,
  cart,
  onClose,
  onSubmit,
  submitting,
}: EditCartModalProps) {
  if (!show || !cart) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    const businessName = formData.get('businessName') as string;
    const location = formData.get('location') as string;
    const displayName = formData.get('displayName') as string;
    const instagramHandle = formData.get('instagramHandle') as string;
    const placeId = formData.get('placeId') as string;
    const websiteUrl = formData.get('websiteUrl') as string;
    const active = formData.get('active') === 'on';

    onSubmit({
      businessName,
      location,
      displayName,
      settings: {
        instagramHandle: instagramHandle || undefined,
        placeId: placeId || undefined,
        websiteUrl: websiteUrl || undefined,
      },
      active,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Edit Cart</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Read-only field */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Cart ID
            </label>
            <input
              type="text"
              value={cart.cartId}
              disabled
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-500 cursor-not-allowed"
              readOnly
            />
            <p className="text-xs text-zinc-500 mt-1">Cart ID cannot be changed</p>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Business Name
              </label>
              <input
                type="text"
                name="businessName"
                defaultValue={cart.businessName}
                required
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                defaultValue={cart.location}
                required
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              name="displayName"
              defaultValue={cart.displayName}
              required
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
            />
            <p className="text-xs text-zinc-500 mt-1">Name shown to customers in the queue</p>
          </div>

          {/* Social Links Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Social Links</h3>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Instagram Handle
              </label>
              <input
                type="text"
                name="instagramHandle"
                defaultValue={cart.settings?.instagramHandle || ''}
                placeholder="@yourcart"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Google Place ID
              </label>
              <input
                type="text"
                name="placeId"
                defaultValue={cart.settings?.placeId || ''}
                placeholder="ChIJd1y..."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Website URL
              </label>
              <input
                type="url"
                name="websiteUrl"
                defaultValue={cart.settings?.websiteUrl || ''}
                placeholder="https://yourcart.com"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="active"
                defaultChecked={cart.active}
                className="w-4 h-4 text-blue-500 bg-zinc-800 border-zinc-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-zinc-300">Active</span>
            </label>
            <p className="text-xs text-zinc-500 mt-1">Inactive carts won't appear in worker assignments</p>
          </div>

          {/* Danger Zone */}
          <div className="border-t border-zinc-800 pt-6">
            <h3 className="text-lg font-medium text-red-400 mb-4">Danger Zone</h3>
            <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
              <p className="text-sm text-red-300 mb-2">
                Sensitive actions that can affect cart operations:
              </p>
              <ul className="text-xs text-red-400 space-y-1">
                <li>• Deactivating cart removes it from worker assignments</li>
                <li>• Changing display name affects customer queue view</li>
                <li>• Updating location may impact customer experience</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
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
              disabled={submitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
