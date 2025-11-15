import React, { useEffect, useCallback } from 'react';
import './Toast.css';

export default function Toast({ toast, onClose }) {
  const handleClose = useCallback(() => onClose && onClose(), [onClose]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => handleClose(), toast.duration || 3500);
    return () => clearTimeout(id);
  }, [toast, handleClose]);

  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      handleClose();
    }
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!toast) return null;

  return (
    <div
      className={`app-toast ${toast.type || 'info'}`}
      onClick={() => handleClose()}
      role="status"
      aria-live="polite"
      tabIndex={0}
      onKeyDown={onKey}
    >
      {toast.message}
    </div>
  );
}
