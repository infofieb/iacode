import { Menu, LogIn, LogOut } from 'lucide-react';

export default function Header({ session, onLoginClick, onLogoutClick, onToggleSidebar }) {
  return (
    <header className="header">
      <div className="header-left">
        <button className="icon-btn" onClick={onToggleSidebar} aria-label="Menu">
          <Menu size={20} />
        </button>
        <div className="logo">
          <span className="logo-icon">✨</span>
          <h1>CompGen</h1>
        </div>
      </div>
      <div className="header-right">
        <span className="model-badge">Claude 3.5 Sonnet</span>
        {session ? (
          <button className="pill-badge" onClick={onLogoutClick}>
            <LogOut size={16} /> Sair
          </button>
        ) : (
          <button className="pill-badge" onClick={onLoginClick}>
            <LogIn size={16} /> Entrar
          </button>
        )}
      </div>
    </header>
  );
}
