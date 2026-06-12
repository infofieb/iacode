import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function CodeViewer({ generated, activeTab, setActiveTab }) {
  const [copied, setCopied] = useState(false);
  const { html, css, js, framework = 'html' } = generated;

  let tabs = [];
  if (framework === 'react') {
    tabs = [{ id: 'js', label: 'React (JSX)' }];
  } else if (framework === 'vue') {
    tabs = [{ id: 'html', label: 'Vue (SFC)' }];
  } else {
    tabs = [
      { id: 'html', label: 'HTML' },
      { id: 'css', label: 'CSS' },
      { id: 'js', label: 'JS' }
    ];
  }

  // Ensure active tab makes sense for current framework
  const validTab = tabs.find(t => t.id === activeTab) ? activeTab : tabs[0]?.id;

  const handleCopy = () => {
    const code = generated[validTab] || '';
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const getLanguage = (tab) => {
    if (framework === 'vue') return 'html';
    if (framework === 'react') return 'javascript';
    if (tab === 'js') return 'javascript';
    return tab;
  };

  const code = generated[validTab] || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
      <div className="tabs">
        {tabs.map(t => (
          <button 
            key={t.id}
            className={`tab-btn ${validTab === t.id ? 'active' : ''}`} 
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
        <div className="code-block" id="code-display" style={{ padding: 0, overflow: 'hidden' }}>
          {!code ? (
            <div style={{ padding: '16px' }}><span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>// Gere um componente para ver o código aqui</span></div>
          ) : (
            <SyntaxHighlighter 
              language={getLanguage(validTab)} 
              style={vscDarkPlus} 
              customStyle={{ margin: 0, padding: '16px', background: 'transparent', flex: 1, height: '100%', overflowY: 'auto' }}
            >
              {code}
            </SyntaxHighlighter>
          )}
        </div>
        <button 
          className={`copy-btn ${copied ? 'copied' : ''}`} 
          id="copy-btn" 
          onClick={handleCopy}
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}
