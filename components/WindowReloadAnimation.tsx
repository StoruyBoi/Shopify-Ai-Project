'use client';
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function WindowReloadAnimation() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    setShow(true);
    const timeout = setTimeout(() => setShow(false), 700); // 700ms animation
    return () => clearTimeout(timeout);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-indigo-50 dark:bg-gray-900 flex items-center justify-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0.7 }}
            animate={{ scale: 1.05, opacity: 0.9 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="flex flex-col items-center"
          >
            <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-300 mb-2 animate-pulse">Shopify Image Wizard</span>
            <span className="text-lg font-medium text-indigo-400 dark:text-indigo-200">Loading...</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
