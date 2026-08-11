import { CheckCircle, X } from 'lucide-react';

export default function Toast({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="toast">
      <CheckCircle size={20} />
      <span>{message}</span>
      <button onClick={onClose}><X size={16} /></button>
    </div>
  );
}
