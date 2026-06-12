import { useState } from 'react';
import { supabase } from '../supabase';

export default function AuthModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          setError(signUpError.message);
        } else {
          onClose();
        }
      } else {
        setError(signInError.message);
      }
    } else {
      onClose();
    }
    setLoading(false);
  };

  return (
    <div id="auth-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(13,13,15,.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--card)', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontWeight: 600, fontSize: '18px', color: 'var(--text)' }}>Acesso ao Gerador</h3>
        <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.4 }}>Para gerar ou salvar componentes na nuvem, faça login informando seu e-mail.</p>
        
        {error && <p style={{ color: 'var(--red)', fontSize: '13px' }}>{error}</p>}
        
        <input 
          type="email" 
          id="auth-email" 
          placeholder="seu@email.com" 
          style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '12px', borderRadius: '8px', outline: 'none' }}
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input 
          type="password" 
          id="auth-password" 
          placeholder="Senha" 
          style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '12px', borderRadius: '8px', outline: 'none' }}
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        
        <button 
          id="btn-login-submit" 
          className="btn-generate" 
          style={{ padding: '12px', opacity: loading ? 0.7 : 1 }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Aguarde...' : 'Entrar / Cadastrar'}
        </button>
        <button 
          id="btn-close-auth" 
          style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '12px', cursor: 'pointer' }}
          onClick={onClose}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
