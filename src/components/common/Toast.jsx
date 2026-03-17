import { useEffect } from 'react';

export default function Toast({ message, onHide }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onHide, 2800);
    return () => clearTimeout(timer);
  }, [message, onHide]);

  return (
    <div className={`toast${message ? ' show' : ''}`}>
      {message}
    </div>
  );
}
