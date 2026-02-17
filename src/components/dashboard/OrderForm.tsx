import type { OrderInput } from "../../types/order";

interface OrderFormProps {
  formData: OrderInput;
  loading: boolean;
  onFormChange: (data: OrderInput) => void;
  onSubmit: (e: React.FormEvent) => void;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function OrderForm({ 
  formData, 
  loading, 
  onFormChange, 
  onSubmit, 
  onPhoneChange 
}: OrderFormProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Add New Order
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="customerName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Customer Name *
            </label>
            <input
              type="text"
              id="customerName"
              required
              value={formData.customerName}
              onChange={(e) =>
                onFormChange({ ...formData, customerName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
              maxLength={50}
            />
          </div>
          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={onPhoneChange}
              className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(555) 123-4567"
              maxLength={14}
            />
          </div>
          <div>
            <label
              htmlFor="orderDetails"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Order Details (Optional)
            </label>
            <input
              type="text"
              id="orderDetails"
              value={formData.orderDetails}
              onChange={(e) =>
                onFormChange({ ...formData, orderDetails: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2x Burger, 1x Fries"
              maxLength={200}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Adding..." : "Add Order"}
        </button>
      </form>
    </div>
  );
}
