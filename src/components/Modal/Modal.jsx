import AddLocationForm from './AddLocationForm';

export default function Modal({ isOpen, onClose, onToast }) {
  return (
    <div
      className={`modal-overlay${isOpen ? ' open' : ''}`}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal-head">
          <div className="modal-title">Add a location</div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          {isOpen && (
            <AddLocationForm onClose={onClose} onToast={onToast} />
          )}
        </div>
      </div>
    </div>
  );
}
