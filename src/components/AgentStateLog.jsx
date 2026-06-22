export default function AgentStateLog({ hasVoted, processedOrPendingText }) {
  return (
    <div style={{
      marginTop: 'auto',
      width: '100%',
      backgroundColor: 'var(--bg-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '11px',
      fontFamily: 'monospace',
      textAlign: 'left',
      color: 'var(--text-secondary)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '6px' }}>
        <span style={{ color: 'var(--color-brand)' }}>agent_state.log</span>
        <span style={{ opacity: 0.6 }}>ACTIVE</span>
      </div>
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>&gt; git status --porcelain</div>
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-success)' }}>&gt; [A] src/App.jsx (modified)</div>
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {hasVoted ? '> Processing user choice: ' + processedOrPendingText : '> Ready. Waiting for response...'}
      </div>
    </div>
  );
}
