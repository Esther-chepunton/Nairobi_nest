import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { modal as modalCopy } from "../lib/copy";

export default function Modal({ isOpen, onClose, message }) {
  const navigate = useNavigate();

  const goToAuth = () => {
    sessionStorage.setItem("authRedirect", window.location.pathname);
    onClose?.();
    navigate("/auth");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass-card p-6 w-full max-w-sm"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <h2 className="font-serif text-xl text-kijiji-text mb-3">{modalCopy.title}</h2>
            <p className="text-muted mb-6">
              {message || modalCopy.defaultMessage}
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-outline flex-1">
                {modalCopy.cancel}
              </button>
              <button type="button" onClick={goToAuth} className="btn-primary flex-1">
                {modalCopy.confirm}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
