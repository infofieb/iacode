import { useState } from 'react';

export default function GeneratorPanel({ session, onShowAuth, isGenerating, setIsGenerating, setGenerated, setActiveScreen, onSuccess, showToast }) {
  const [prompt, setPrompt] = useState('');
  const [tag, setTag] = useState('article');

  const tags = ['article', 'section', 'nav', 'aside', 'header', 'footer', 'form', 'main'];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast('⚠️ Descreva o componente', 'error');
      return;
    }
    if (!session) {
      onShowAuth();
      return;
    }

    setIsGenerating(true);
    setGenerated({ html: '', css: '', js: '' });

    try {
      const res = await fetch('/api/gerar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ prompt, tag })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = typeof err.error === 'string' ? err.error : err.error?.message;
        throw new Error(msg || `API retornou status ${res.status}`);
      }

      setActiveScreen('codigo');

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'content_block_delta' || data.type === 'message_delta') {
                const text = data.delta?.text || '';
                fullText += text;
                parseStream(fullText);
              }
            } catch (e) {
              // ignore
            }
          }
        }
      }
      
      const parsed = parseFinal(fullText);
      if (parsed) {
        onSuccess({ ...parsed, prompt: prompt.slice(0, 80) });
      } else {
        throw new Error('Não foi possível gerar HTML/CSS.');
      }

    } catch (err) {
      showToast(`Erro: ${err.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const parseStream = (text) => {
    const extract = (t) => {
      const regex = new RegExp(`<${t}>([\\s\\S]*?)(?:</${t}>|$)`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    };
    setGenerated({ html: extract('HTML'), css: extract('CSS'), js: extract('JS') });
  };

  const parseFinal = (text) => {
    const extract = (t) => {
      const regex = new RegExp(`<${t}>([\\s\\S]*?)</${t}>`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    };
    const title = extract('TITLE') || 'Componente';
    const emoji = extract('EMOJI') || '✨';
    const html = extract('HTML');
    const css = extract('CSS');
    const js = extract('JS');

    if (!html && !css) return null;
    return { title, emoji, tag, html, css, js };
  };

  return (
    <>
      <p className="section-label">Tipo de componente</p>
      <div className="tags-row" id="tags-row">
        {tags.map(t => (
          <button 
            key={t}
            className={`tag-chip ${tag === t ? 'selected' : ''}`} 
            onClick={() => setTag(t)}
            disabled={isGenerating}
          >
            {t}
          </button>
        ))}
      </div>

      <p className="section-label">Descreva o componente</p>
      <div className="prompt-area">
        <textarea 
          id="prompt" 
          placeholder="Ex: Card de produto com imagem, nome, preço e botão de comprar. Visual escuro com borda neon." 
          maxLength="600"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          disabled={isGenerating}
        />
        <div className="prompt-footer">
          <span className="char-count" id="char-count" style={{ color: prompt.length > 500 ? 'var(--amber)' : 'var(--muted)' }}>
            {prompt.length} / 600
          </span>
          <span className="pill-badge" id="selected-tag-badge">{tag}</span>
        </div>
      </div>

      <button className={`btn-generate ${isGenerating ? 'loading' : ''}`} id="btn-generate" onClick={handleGenerate} disabled={isGenerating}>
        <span className="btn-text">✨ Gerar Componente</span>
        <span className="spinner"></span>
      </button>
    </>
  );
}
