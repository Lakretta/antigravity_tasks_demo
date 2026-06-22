import { Lightbulb, Sparkles } from 'lucide-react';

export default function PollResults({
  voteResults,
  totalVotes,
  customIdeas,
  processedOrPendingText
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Poll Results ({totalVotes} votes)
      </span>

      {/* Standard Option Results with progress bar backgrounds */}
      {voteResults.map((result, idx) => (
        <div 
          key={idx}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            overflow: 'hidden',
            textAlign: 'left'
          }}
        >
          {/* Glassmorphic progress bar background */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: `${result.percent}%`,
            backgroundColor: 'var(--color-brand-light)',
            opacity: 0.8,
            zIndex: 1,
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
          
          <span style={{ zIndex: 2, fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: '500', flex: 1, paddingRight: '8px' }}>
            {result.text}
          </span>
          <span style={{ zIndex: 2, fontSize: '12.5px', color: 'var(--color-brand)', fontWeight: '600', flexShrink: 0 }}>
            {result.votes} {result.votes === 1 ? 'vote' : 'votes'} ({result.percent}%)
          </span>
        </div>
      ))}

      {/* Custom Ideas Static List */}
      {customIdeas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <Lightbulb size={14} color="var(--color-brand)" />
            <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Custom Ideas Suggested
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {customIdeas.map((idea, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px dashed var(--border-color)',
                  fontSize: '13px',
                  textAlign: 'left',
                  color: 'var(--text-primary)',
                  lineHeight: '1.4'
                }}
              >
                "{idea.selectedOptionText}"
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending loop indicator */}
      <div style={{
        marginTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px',
        borderRadius: '12px',
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        gap: '12px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.1), rgba(155, 114, 248, 0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-brand)',
          animation: 'pulse 2s infinite ease-in-out'
        }}>
          <Sparkles size={20} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Choice Submitted!
          </span>
          <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
            The Antigravity Agent has detected the choice: <strong>"{processedOrPendingText}"</strong>. It will now generate components, run validation tests, and update the app.
          </p>
        </div>
      </div>
    </div>
  );
}
