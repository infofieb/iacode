export default function Header({ session, onLoginClick, onLogoutClick }) {
  return (
    <header id="topbar" role="banner">
      <div className="logo">
        <div className="logo-icon">&lt;/&gt;</div>
        CompGen
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span className="pill-badge" id="model-badge">Sonnet 4</span>
        {session ? (
          <button id="auth-btn" className="pill-badge" onClick={onLogoutClick} style={{ cursor: 'pointer', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            Sair
          </button>
        ) : (
          <button id="auth-btn" className="pill-badge" onClick={onLoginClick} style={{ cursor: 'pointer', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            Entrar
          </button>
        )}
      </div>
    </header>
  );
}
