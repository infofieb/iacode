import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function CodeViewer({ code, language, type }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="code-block" id="code-display" style={{ padding: 0, overflow: 'hidden' }}>
        {!code ? (
          <div style={{ padding: '16px' }}><span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>// Gere um componente para ver o código aqui</span></div>
        ) : (
          <SyntaxHighlighter 
            language={language} 
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
  );
}
