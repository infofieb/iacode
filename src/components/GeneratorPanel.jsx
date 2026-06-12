import { useState } from 'react';

export default function GeneratorPanel({ session, onShowAuth, isGenerating, setIsGenerating, setGenerated, setActiveScreen, onSuccess, showToast }) {
  const [prompt, setPrompt] = useState('');
  const [tag, setTag] = useState('article');
  
  // Premium Features
  const [framework, setFramework] = useState('html'); // 'html', 'react', 'vue'
  const [styling, setStyling] = useState('css');      // 'css', 'tailwind'

  const tags = ['article', 'section', 'nav', 'aside', 'header', 'footer', 'form', 'main'];
  const frameworks = [{ id: 'html', label: 'Vanilla HTML' }, { id: 'react', label: 'React' }, { id: 'vue', label: 'Vue 3' }];
  const stylings = [{ id: 'css', label: 'Vanilla CSS' }, { id: 'tailwind', label: 'TailwindCSS' }];

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
    setGenerated({ html: '', css: '', js: '', framework, styling });

    try {
      const res = await fetch('/api/gerar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ prompt, tag, framework, styling })
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
        onSuccess({ ...parsed, prompt: prompt.slice(0, 80), framework, styling });
      } else {
        throw new Error('Não foi possível gerar o código.');
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
    setGenerated({ html: extract('HTML'), css: extract('CSS'), js: extract('JS'), framework, styling });
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

    if (!html && !css && !js) return null;
    return { title, emoji, tag, html, css, js };
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <p className="section-label">⚙️ Framework (Premium)</p>
          <div className="tags-row" style={{ marginBottom: 0 }}>
            {frameworks.map(f => (
              <button 
                key={f.id}
                className={`tag-chip ${framework === f.id ? 'selected' : ''}`} 
                onClick={() => setFramework(f.id)}
                disabled={isGenerating}
                style={{ borderColor: framework === f.id ? 'var(--amber)' : '', color: framework === f.id ? 'var(--amber)' : '' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p className="section-label">🎨 Estilo (Premium)</p>
          <div className="tags-row" style={{ marginBottom: 0 }}>
            {stylings.map(s => (
              <button 
                key={s.id}
                className={`tag-chip ${styling === s.id ? 'selected' : ''}`} 
                onClick={() => setStyling(s.id)}
                disabled={isGenerating}
                style={{ borderColor: styling === s.id ? 'var(--green)' : '', color: styling === s.id ? 'var(--green)' : '' }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="section-label">Tag Raiz</p>
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
