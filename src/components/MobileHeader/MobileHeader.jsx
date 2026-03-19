import logo from '../../assets/logo.png';

export default function MobileHeader({ drawerOpen, onToggleDrawer, onOpenModal }) {
  return (
    <div className="mobile-header">
      <div className="mobile-logo">
        <img className="logo-image" src={logo} alt="Relief Route logo" /> Relief Route
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
