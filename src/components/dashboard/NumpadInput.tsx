import { motion, AnimatePresence } from "framer-motion";
import { useDashboardStore } from "../../stores/dashboardStore";
import { ORDER_COLOR_OPTIONS } from "../../lib/orderColors";

interface NumpadInputProps {
  onSubmit: () => void;
  loading: boolean;
}

const NUMPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"];

export default function NumpadInput({ onSubmit, loading }: NumpadInputProps) {
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

  const canSubmit = currentInput.length > 0 && !loading;

  return (
    <div className="h-full flex flex-col px-4 py-3 gap-2">
      {/* Big Display */}
      <div className="shrink-0">
        <AnimatePresence>
          {successFlash && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-emerald-500/20 border-2 border-emerald-500 rounded-2xl backdrop-blur-sm"
            >
              <span className="text-emerald-400 text-4xl font-bold mb-2">
                ✓ Added!
              </span>
              {lastAddedOrder && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-emerald-300 text-3xl font-bold">
                    Order #{lastAddedOrder}
                  </span>
                  <span className="text-emerald-200 text-2xl font-medium uppercase tracking-wider">
                    {selectedColor}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-semibold">
            Order Number
          </p>
          <div className="font-mono font-extrabold text-3xl text-white min-h-10 flex items-center justify-center">
            {currentInput ? (
              <motion.span
                key={currentInput}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                #{currentInput}
              </motion.span>
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
              className={`h-14 rounded-lg border-2 transition-all cursor-pointer ${
                selectedColor === color.name
                  ? "border-white scale-105 shadow-lg"
                  : "border-zinc-700 opacity-60 hover:opacity-80"
              }`}
              style={{
                backgroundColor: color.hex,
                boxShadow:
                  selectedColor === color.name
                    ? `0 0 16px -2px ${color.hex}`
                    : undefined,
              }}
              aria-label={color.name}
            />
          ))}
        </div>
        <p className="text-center text-xs text-zinc-400 mt-2 font-medium">
          {selectedColor}
        </p>
      </div>

      {/* Numpad Grid */}
      <div className="flex-1 grid grid-cols-3 gap-1.5 min-h-0">
        {NUMPAD_KEYS.map((key) => {
          const isAction = key === "C" || key === "⌫";
          return (
            <motion.button
              key={key}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleKey(key)}
              className={`h-full rounded-lg text-base font-bold flex items-center justify-center cursor-pointer select-none ${
                isAction
                  ? "bg-zinc-800 text-zinc-400 border border-zinc-700 active:bg-zinc-700"
                  : "bg-zinc-900 text-white border border-zinc-800 active:bg-blue-600 active:border-blue-500"
              }`}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {key}
            </motion.button>
          );
        })}
      </div>

      {/* ADD TO QUEUE Button */}
      <motion.button
        whileTap={canSubmit ? { scale: 0.95 } : undefined}
        onClick={canSubmit ? onSubmit : undefined}
        disabled={!canSubmit}
        className={`w-full py-8 rounded-lg text-base font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
          canSubmit
            ? "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 shadow-lg shadow-blue-600/20"
            : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
        }`}
      >
        {loading ? "Adding..." : "Add to Queue"}
      </motion.button>
    </div>
  );
}
