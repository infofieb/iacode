import { Trash2, Component } from 'lucide-react';

export default function HistoryList({ isOpen, history, onSelect, onDelete }) {
  return (
    <aside className="sidebar" style={{ width: isOpen ? '300px' : '0px', padding: isOpen ? '' : '0px', borderRight: isOpen ? '' : 'none', overflow: 'hidden' }}>
      <div className="sidebar-header" style={{ opacity: isOpen ? 1 : 0 }}>
        <h2>Seus Componentes</h2>
      </div>
      
      <div className="history-list" id="history-list" style={{ opacity: isOpen ? 1 : 0 }}>
        {history.length === 0 ? (
          <div className="empty-history">
            <div className="icon"><Component size={32} opacity={0.5} /></div>
            <p>Seus componentes gerados aparecem aqui</p>
          </div>
        ) : (
          history.map(item => (
            <article 
              key={item.id} 
              className="hist-card" 
              onClick={() => onSelect(item)}
            >
              <div className="hist-icon">{item.emoji}</div>
              <div className="hist-info">
                <p className="hist-title">{item.title}</p>
                <div className="hist-meta">
                  <span className="hist-tag">&lt;{item.tag}&gt;</span>
                  <span>{item.ts}</span>
                </div>
              </div>
              <button 
                className="hist-del" 
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                title="Deletar"
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))
        )}
      </div>
    </aside>
  );
}
