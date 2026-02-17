interface QueueHeaderProps {
  cartName: string;
}

export default function QueueHeader({ cartName }: QueueHeaderProps) {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center mb-2">
        <div className="flex items-center gap-2">
          <img 
            src="/fast-food-svgrepo-com.svg" 
            alt="Fast Food Icon" 
            className="w-10 h-10"
          />
          <h1 className="text-4xl font-bold text-gray-900">OrderPing</h1>
           <img 
            src="/chips-svgrepo-com.svg" 
            alt="Fast Food Icon" 
            className="w-10 h-10"
          />
        </div>
      </div>
      {cartName && (
        <p className="text-lg text-gray-700 font-medium">{cartName}</p>
      )}
      <p className="text-gray-600">Live Order Queue</p>
    </div>
  );
}
