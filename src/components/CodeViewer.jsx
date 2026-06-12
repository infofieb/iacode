import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CodeViewer({ html, css, js }) {
  const [copied, setCopied] = useState(null);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const renderBlock = (title, code, language, type) => {
    if (!code) return null;
    return (
      <div className="code-block" style={{ marginBottom: '1.5rem' }}>
        <div className="code-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e1e1e', padding: '0.5rem 1rem', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', borderBottom: '1px solid #333' }}>
          <span style={{ color: '#888', fontSize: '0.9rem', fontWeight: 600 }}>{title}</span>
          <button 
            onClick={() => handleCopy(code, type)}
            style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {copied === type ? <><Check size={16} color="#4ade80" /> Copiado</> : <><Copy size={16} /> Copiar</>}
          </button>
        </div>
        <SyntaxHighlighter 
          language={language} 
          style={vscDarkPlus} 
          customStyle={{ margin: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  };

  return (
    <div className="code-container" style={{ padding: '1rem', overflowY: 'auto', maxHeight: '100%' }}>
      {(!html && !css && !js) ? (
        <div style={{ textAlign: 'center', color: '#888', padding: '3rem' }}>O código gerado aparecerá aqui.</div>
      ) : (
        <>
          {renderBlock('HTML', html, 'html', 'html')}
          {renderBlock('CSS', css, 'css', 'css')}
          {renderBlock('JavaScript', js, 'javascript', 'js')}
        </>
      )}
    </div>
  );
}
