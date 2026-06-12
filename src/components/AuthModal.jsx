import { useState } from 'react';
import { supabase } from '../supabase';

export default function AuthModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Preencha email e senha');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    
    let { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error && error.message.includes('Invalid login credentials')) {
      const res = await supabase.auth.signUp({ email, password });
      error = res.error;
    }

    if (error) {
      setErrorMsg('Erro: ' + error.message);
      setLoading(false);
    } else {
      onClose();
    }
  };

  return (
    <div className="auth-overlay" style={{ display: 'flex' }}>
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose}>&times;</button>
        <h2>Login / Cadastro</h2>
        <p>Acesse seu histórico na nuvem</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          <input 
            type="email" 
            placeholder="Seu e-mail" 
            className="prompt-input" 
            style={{ width: '100%' }}
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Sua senha" 
            className="prompt-input" 
            style={{ width: '100%' }}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {errorMsg && <p style={{ color: '#ff6b6b', fontSize: '0.9rem' }}>{errorMsg}</p>}
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Aguarde...' : 'Entrar / Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
