import { useState } from 'react';
import { ListTodo, Trash2, Plus, Database, AlertTriangle } from 'lucide-react';

export default function Sidebar({
  lists,
  activeListId,
  setActiveListId,
  handleAddList,
  handleDeleteList,
  dbMode
}) {
  const [newListTitle, setNewListTitle] = useState('');
  const [showAddList, setShowAddList] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    const success = await handleAddList(newListTitle.trim());
    if (success) {
      setNewListTitle('');
      setShowAddList(false);
    }
  };

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-primary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 8px',
      flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px 16px 8px', borderBottom: '1px solid var(--border-color)' }}>
        <ListTodo size={24} color="var(--color-brand)" />
        <span style={{ fontSize: '18px', fontWeight: '500', letterSpacing: '-0.2px' }}>Google Tasks</span>
      </div>

      {/* List items */}
      <nav style={{ flex: 1, overflowY: 'auto', marginTop: '16px' }} className="scroller">
        {lists.map(list => (
          <div 
            key={list.id} 
            onClick={() => setActiveListId(list.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '8px',
              marginBottom: '4px',
              cursor: 'pointer',
              backgroundColor: list.id === activeListId ? 'var(--color-brand-light)' : 'transparent',
              color: list.id === activeListId ? 'var(--color-brand)' : 'var(--text-primary)',
              fontWeight: list.id === activeListId ? '500' : '400',
            }}
            className="transition-all"
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
              {list.name}
            </span>
            {list.id !== 'default' && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteList(list.id);
                }}
                style={{
                  opacity: list.id === activeListId ? 0.7 : 0,
                  color: 'var(--color-danger)',
                  padding: '2px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
                className="list-delete-btn transition-all"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}

        {/* Add List input toggler */}
        {showAddList ? (
          <form onSubmit={onSubmit} style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="New list title" 
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--color-brand)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '4px', alignSelf: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => {
                  setShowAddList(false);
                  setNewListTitle('');
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--color-brand)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Create
              </button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setShowAddList(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              width: '100%',
              marginTop: '8px',
              fontSize: '14px',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            <span>Create new list</span>
          </button>
        )}
      </nav>

      {/* Database status config */}
      <div style={{
        padding: '12px 8px 4px 8px',
        borderTop: '1px solid var(--border-color)',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Database size={12} color={dbMode === 'firebase' ? 'var(--color-success)' : 'var(--text-tertiary)'} />
          <span>Mode: <strong>{dbMode === 'firebase' ? 'Firebase Sync' : 'Offline Demo'}</strong></span>
        </div>
        {dbMode === 'local' && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '4px', 
            backgroundColor: 'var(--color-brand-light)', 
            padding: '6px 8px', 
            borderRadius: '6px', 
            fontSize: '10px', 
            lineHeight: '1.3' 
          }}>
            <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-brand)' }} />
            <span>Running locally. Setup Firestore details in <code>.env</code> to sync.</span>
          </div>
        )}
      </div>
    </aside>
  );
}
