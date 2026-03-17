export default function MobileHeader({ drawerOpen, onToggleDrawer, onOpenModal }) {
  return (
    <div className="mobile-header">
      <div className="mobile-logo">
        <span className="logo-pip" /> Relief Route
      </div>
      <div className="mobile-actions">
        <button className="add-btn" onClick={onOpenModal}>
          + Add
        </button>
        <button
          className={`mobile-list-btn${drawerOpen ? ' active' : ''}`}
          onClick={onToggleDrawer}
        >
          ☰ List
        </button>
      </div>
    </div>
  );
}
