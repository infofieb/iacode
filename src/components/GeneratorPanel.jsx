import { useState } from 'react';
import { Send, Image as ImageIcon } from 'lucide-react';

export default function GeneratorPanel({ session, onShowAuth, isGenerating, setIsGenerating, setGenerated, setActiveTab, onSuccess }) {
  const [prompt, setPrompt] = useState('');
  const [tag, setTag] = useState('section');
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async () => {
    if (!prompt) {
      setErrorMsg('Descreva o componente!');
      return;
    }
    if (!session) {
      onShowAuth();
      return;
    }

    setErrorMsg('');
    setIsGenerating(true);
    setActiveTab('preview');
    
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
              // ignore parse errors for partial chunks
            }
          }
        }
      }
      
      const parsed = parseFinal(fullText);
      if (parsed) onSuccess({ ...parsed, prompt: prompt.slice(0, 80) });

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const parseStream = (text) => {
    const extract = (tag) => {
      const regex = new RegExp(`<${tag}>([\\s\\S]*?)(?:</${tag}>|$)`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    };
    
    setGenerated({
      html: extract('HTML'),
      css: extract('CSS'),
      js: extract('JS')
    });
  };

  const parseFinal = (text) => {
    const extract = (tag) => {
      const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i');
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
    <div className="prompt-container">
      <div className="input-group">
        <textarea
          className="prompt-input"
          placeholder="Descreva o componente que você quer criar... Ex: Um card de preço com fundo escuro e botão neon."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          disabled={isGenerating}
        />
        <div className="toolbar">
          <div className="tool-group">
            <button className="icon-btn" title="Anexar imagem (Breve)"><ImageIcon size={18} /></button>
            <select className="tag-select" value={tag} onChange={e => setTag(e.target.value)} disabled={isGenerating}>
              <option value="section">&lt;section&gt;</option>
              <option value="article">&lt;article&gt;</option>
              <option value="header">&lt;header&gt;</option>
              <option value="nav">&lt;nav&gt;</option>
              <option value="footer">&lt;footer&gt;</option>
              <option value="form">&lt;form&gt;</option>
              <option value="div">&lt;div&gt;</option>
            </select>
          </div>
          <button 
            className="btn-primary" 
            onClick={handleGenerate} 
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? 'Gerando...' : <><Send size={16} /> Gerar</>}
          </button>
        </div>
        {errorMsg && <div style={{ color: '#ff6b6b', marginTop: '0.5rem', fontSize: '0.9rem' }}>{errorMsg}</div>}
      </div>
    </div>
  );
}
