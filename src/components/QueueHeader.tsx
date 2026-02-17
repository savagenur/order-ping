interface QueueHeaderProps {
  cartName: string;
}

export default function QueueHeader({ cartName }: QueueHeaderProps) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">OrderPing</h1>
      {cartName && (
        <p className="text-lg text-gray-700 font-medium">{cartName}</p>
      )}
      <p className="text-gray-600">Live Order Queue</p>
    </div>
  );
}
