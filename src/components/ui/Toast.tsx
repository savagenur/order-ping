import { motion } from "framer-motion";
import { X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "error" | "success";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const bgColor = type === "error" ? "bg-red-500" : "bg-green-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm`}
    >
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="shrink-0 p-1 hover:bg-white/20 rounded transition"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
