export default function HistoryList({ history, onSelect, onDelete }) {
  return (
    <div className="history-list" id="history-list">
      {history.length === 0 ? (
        <div className="empty-history">
          <div className="icon">🗂️</div>
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
              🗑️
            </button>
          </article>
        ))
      )}
    </div>
  );
}
