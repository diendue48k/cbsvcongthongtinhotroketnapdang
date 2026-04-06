import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type AlertMessage = {
  title: string;
  message: string;
  type: 'success' | 'error';
};

interface AlertToastProps {
  alert: AlertMessage | null;
  onClose: () => void;
  duration?: number;
}

export default function AlertToast({ alert, onClose, duration = 3000 }: AlertToastProps) {
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [alert, onClose, duration]);

  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm w-full"
        >
          <div className={`bg-white rounded-2xl shadow-2xl border-l-4 p-4 pr-10 relative ${
            alert.type === 'success' ? 'border-green-500' : 'border-red-500'
          }`}>
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${alert.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                {alert.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{alert.title}</h3>
                <p className="text-xs text-slate-600 mt-1 font-medium">{alert.message}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
