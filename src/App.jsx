import { useState, useEffect } from 'react';
import Header from './components/Header';
import GeneratorPanel from './components/GeneratorPanel';
import CodeViewer from './components/CodeViewer';
import PreviewIframe from './components/PreviewIframe';
import HistoryList from './components/HistoryList';
import AuthModal from './components/AuthModal';
import { supabase } from './supabase';

export default function App() {
  const [session, setSession] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeScreen, setActiveScreen] = useState('gerar');
  const [activeTab, setActiveTab] = useState('html');
  const [previewSize, setPreviewSize] = useState('mobile');
  
  const [generated, setGenerated] = useState({ html: '', css: '', js: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadHistory();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadHistory();
      else setHistory([]);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadHistory = async () => {
    const { data } = await supabase
      .from('components_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    
    if (data) {
      setHistory(data.map(d => ({
        ...d,
        ts: new Date(d.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      })));
    }
  };

  const showToast = (msg, type = '') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 2800);
  };

  const onGenerateSuccess = (item) => {
    if (session) {
      supabase.from('components_history').insert([{
        user_id: session.user.id,
        title: item.title,
        emoji: item.emoji,
        tag: item.tag,
        prompt: item.prompt,
        html: item.html,
        css: item.css,
        js: item.js
      }]).select().then(({data, error}) => {
        if (!error && data && data.length > 0) {
          data[0].ts = new Date(data[0].created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
          setHistory(prev => [data[0], ...prev]);
        }
      });
    }
    showToast('✨ Componente gerado!', 'success');
  };

  const handleSelectHistory = (item) => {
    setGenerated({ html: item.html, css: item.css, js: item.js });
    setActiveScreen('preview');
    showToast('✨ Componente carregado', 'success');
  };

  const handleDeleteHistory = async (id) => {
    setHistory(prev => prev.filter(h => h.id !== id));
    if (session) {
      await supabase.from('components_history').delete().eq('id', id);
    }
    showToast('Removido do histórico');
  };

  return (
    <div id="app">
      <Header 
        session={session} 
        onLoginClick={() => setShowAuthModal(true)} 
        onLogoutClick={() => supabase.auth.signOut()}
      />

      <main id="content" role="main">
        {/* Tela Gerar */}
        <section id="screen-gerar" className={`screen ${activeScreen === 'gerar' ? 'active' : ''}`}>
          <GeneratorPanel 
            session={session}
            onShowAuth={() => setShowAuthModal(true)}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            setGenerated={setGenerated}
            setActiveScreen={setActiveScreen}
            onSuccess={onGenerateSuccess}
            showToast={showToast}
          />
        </section>

        {/* Tela Preview */}
        <section id="screen-preview" className={`screen ${activeScreen === 'preview' ? 'active' : ''}`}>
          <div className="preview-toolbar">
            <button className={`device-btn ${previewSize === 'mobile' ? 'active' : ''}`} onClick={() => setPreviewSize('mobile')}>📱 Mobile</button>
            <button className={`device-btn ${previewSize === 'tablet' ? 'active' : ''}`} onClick={() => setPreviewSize('tablet')}>📏 Tablet</button>
            <button className={`device-btn ${previewSize === 'desktop' ? 'active' : ''}`} onClick={() => setPreviewSize('desktop')}>💻 Desktop</button>
          </div>
          {(!generated.html && !generated.css && !generated.js) ? (
            <div className="empty-preview">
              <div className="icon">🎨</div>
              <p>Gere um componente primeiro para ver o preview aqui</p>
            </div>
          ) : (
            <div className={`preview-frame-wrap ${previewSize}`} id="preview-wrap">
              <PreviewIframe generated={generated} />
            </div>
          )}
        </section>

        {/* Tela Código */}
        <section id="screen-codigo" className={`screen ${activeScreen === 'codigo' ? 'active' : ''}`}>
          <CodeViewer 
            generated={generated}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </section>

        {/* Tela Histórico */}
        <section id="screen-historico" className={`screen ${activeScreen === 'historico' ? 'active' : ''}`}>
          <p className="section-label" style={{ marginBottom: '12px' }}>Gerados recentemente</p>
          <HistoryList 
            history={history} 
            onSelect={handleSelectHistory}
            onDelete={handleDeleteHistory}
          />
        </section>
      </main>

      {/* Bottom Nav */}
      <nav id="nav">
        <div className={`nav-item ${activeScreen === 'gerar' ? 'active' : ''}`} onClick={() => setActiveScreen('gerar')}>
          <span className="nav-icon">✨</span><span className="nav-label">Gerar</span><span className="nav-dot"></span>
        </div>
        <div className={`nav-item ${activeScreen === 'preview' ? 'active' : ''}`} onClick={() => setActiveScreen('preview')}>
          <span className="nav-icon">👀</span><span className="nav-label">Preview</span><span className="nav-dot"></span>
        </div>
        <div className={`nav-item ${activeScreen === 'codigo' ? 'active' : ''}`} onClick={() => setActiveScreen('codigo')}>
          <span className="nav-icon">&lt;/&gt;</span><span className="nav-label">Código</span><span className="nav-dot"></span>
        </div>
        <div className={`nav-item ${activeScreen === 'historico' ? 'active' : ''}`} onClick={() => setActiveScreen('historico')}>
          <span className="nav-icon">🕒</span><span className="nav-label">Histórico</span><span className="nav-dot"></span>
        </div>
      </nav>

      {/* Generating Overlay */}
      {isGenerating && (
        <div id="generating-overlay" className="visible">
          <div className="gen-spinner"></div>
          <div className="gen-steps">
            <p className="gen-step visible">Analisando descrição...</p>
            <p className="gen-step visible">Escrevendo HTML + CSS...</p>
          </div>
        </div>
      )}

      {/* Toast */}
      <div id="toast" className={`${toastMsg ? 'show' : ''} ${toastType}`}>{toastMsg}</div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}
