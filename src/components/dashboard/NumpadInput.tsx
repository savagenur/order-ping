import { useDashboardStore } from "../../stores/dashboardStore";
import { ORDER_COLOR_OPTIONS } from "../../lib/orderColors";
import { memo, useState, useEffect } from "react";

interface NumpadInputProps {
  onSubmit: () => void;
  loading: boolean;
  initialOrderNumber?: number; // Optional for double-click reset
  onDoubleClick?: () => Promise<number>; // Optional custom double-click handler
}

const NUMPAD_KEYS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "C",
  "0",
  "⌫",
];

const NumpadInput = memo(function NumpadInput({
  onSubmit,
  loading,
  initialOrderNumber,
  onDoubleClick,
}: NumpadInputProps) {
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false);

  const {
    currentInput,
    selectedColor,
    successFlash,
    lastAddedOrder,
    appendDigit,
    clearInput,
    setSelectedColor,
  } = useDashboardStore();

  const handleKey = (key: string) => {
    if (key === "C") {
      clearInput();
    } else if (key === "⌫") {
      useDashboardStore.setState((s) => ({
        currentInput: s.currentInput.slice(0, -1),
      }));
    } else {
      appendDigit(key);
    }
  };

  const handleDoubleClick = async () => {
  if (onDoubleClick) {
    try {
      const orderNumber = await onDoubleClick();
      useDashboardStore.setState({
        currentInput: orderNumber.toString(),
      });
    } catch (error) {
      console.error('Error fetching order number on double-click:', error);
    }
  } else if (initialOrderNumber) {
    useDashboardStore.setState({
      currentInput: initialOrderNumber.toString(),
    });
  }
};

  const canSubmit = currentInput.length > 0 && !loading && !isButtonDisabled;

  useEffect(() => {
    if (isButtonDisabled) {
      const timer = setTimeout(() => {
        setIsButtonDisabled(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isButtonDisabled]);

  const handleSubmit = () => {
    if (canSubmit) {
      onSubmit();
      setIsButtonDisabled(true);
    }
  };

  return (
    <div className="h-full flex flex-col px-4 py-3 gap-3">
      {/* Big Display */}
      <div className="shrink-0 relative">
        {successFlash && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-emerald-500/20 border-2 border-emerald-500 rounded-2xl">
            <span className="text-emerald-400 text-4xl font-bold mb-2">
              ✓ Added!
            </span>
            {lastAddedOrder && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-emerald-300 text-4xl font-bold">
                  #{lastAddedOrder} {selectedColor}
                </span>
              </div>
            )}
          </div>
        )}

        <div
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center cursor-pointer relative"
          onDoubleClick={handleDoubleClick}
        >
          <p className={`text-xs text-zinc-500 uppercase tracking-wider mb-1 font-semibold ${successFlash ? 'opacity-0' : 'opacity-100'}`} style={{ transition: 'none' }}>
            Order Number
          </p>
          <div className={`font-mono font-extrabold text-5xl text-white min-h-14 flex items-center justify-center ${successFlash ? 'opacity-0' : 'opacity-100'}`} style={{ transition: 'none' }}>
            {currentInput ? (
              <span>#{currentInput}</span>
            ) : (
              <span className="text-zinc-700">#___</span>
            )}
          </div>
        </div>
      </div>

      {/* Color Selector */}
      <div className="shrink-0">
        <div className="grid grid-cols-4 gap-2">
          {ORDER_COLOR_OPTIONS.map((color) => (
            <button
              key={color.name}
              onClick={() => setSelectedColor(color.name)}
              className={`h-12 rounded-lg border-2 cursor-pointer ${
                selectedColor === color.name
                  ? "border-white"
                  : "border-zinc-700 opacity-50"
              }`}
              style={{ backgroundColor: color.hex }}
              aria-label={color.name}
            />
          ))}
        </div>
        <p className="text-center text-sm text-zinc-300 mt-2 font-semibold">
          {selectedColor}
        </p>
      </div>

      {/* Numpad Grid */}
      <div className="flex-1 grid grid-cols-3 gap-2 min-h-0">
        {NUMPAD_KEYS.map((key) => {
          const isAction = key === "C" || key === "⌫";
          return (
            <button
              key={key}
              onClick={() => handleKey(key)}
              className={`h-full rounded-xl text-2xl font-bold flex items-center justify-center cursor-pointer select-none ${
                isAction
                  ? "bg-zinc-800 text-zinc-300 border border-zinc-700 active:bg-zinc-600"
                  : "bg-zinc-900 text-white border border-zinc-800 active:bg-blue-600 active:border-blue-500"
              }`}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {key}
            </button>
          );
        })}
      </div>

      {/* ADD TO QUEUE Button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full py-6 rounded-xl text-lg font-bold uppercase tracking-wider cursor-pointer shrink-0 ${
          canSubmit
            ? "bg-blue-600 text-white active:bg-blue-700"
            : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
        }`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {isButtonDisabled ? "Wait..." : loading ? "Adding..." : "Add to Queue"}
      </button>
    </div>
  );
});

export default NumpadInput;
