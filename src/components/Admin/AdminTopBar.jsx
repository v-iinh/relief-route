import logo from '../../assets/logo.png';

export default function AdminTopBar() {
  return (
    <header className="admin-topbar">
      <div>
        <a className="admin-topbar-logo" href="/">
          <img className="admin-topbar-logo-image" src={logo} alt="Relief Route logo" />
          <span>Relief Route</span>
        </a>
        <div className="admin-topbar-label">Admin</div>
      </div>
    </header>
  );
}
