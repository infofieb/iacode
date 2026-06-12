import { useState, useEffect } from 'react';
import Header from './components/Header';
import GeneratorPanel from './components/GeneratorPanel';
import CodeViewer from './components/CodeViewer';
import PreviewIframe from './components/PreviewIframe';
import HistoryList from './components/HistoryList';
import AuthModal from './components/AuthModal';
import { supabase } from './supabase';

function App() {
  const [session, setSession] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('preview');
  
  const [generated, setGenerated] = useState({ html: '', css: '', js: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadHistory();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
  };

  const handleSelectHistory = (item) => {
    setGenerated({ html: item.html, css: item.css, js: item.js });
    setActiveTab('preview');
  };

  const handleDeleteHistory = async (id) => {
    setHistory(prev => prev.filter(h => h.id !== id));
    if (session) {
      await supabase.from('components_history').delete().eq('id', id);
    }
  };

  return (
    <>
      <Header 
        session={session} 
        onLoginClick={() => setShowAuthModal(true)} 
        onLogoutClick={handleLogout}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className={`main-content ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
        <HistoryList 
          isOpen={isSidebarOpen} 
          history={history} 
          onSelect={handleSelectHistory}
          onDelete={handleDeleteHistory}
        />

        <section className="workspace">
          <GeneratorPanel 
            session={session}
            onShowAuth={() => setShowAuthModal(true)}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            setGenerated={setGenerated}
            setActiveTab={setActiveTab}
            onSuccess={onGenerateSuccess}
          />

          <div className="preview-area">
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                👀 Preview
              </button>
              <button 
                className={`tab ${activeTab === 'code' ? 'active' : ''}`}
                onClick={() => setActiveTab('code')}
              >
                &lt;/&gt; Código
              </button>
            </div>

            <div className="tab-content" style={{ display: activeTab === 'preview' ? 'flex' : 'none' }}>
              <PreviewIframe html={generated.html} css={generated.css} js={generated.js} />
            </div>

            <div className="tab-content" style={{ display: activeTab === 'code' ? 'block' : 'none' }}>
              <CodeViewer html={generated.html} css={generated.css} js={generated.js} />
            </div>
            
            {isGenerating && (
              <div className="generating-overlay">
                <div className="spinner"></div>
                <p>A Inteligência Artificial está criando seu componente...</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
}

export default App;
