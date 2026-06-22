import { useState } from 'react';
import { X, Check } from 'lucide-react';

export default function PollChoices({
  options,
  submittingAnswer,
  onSubmitAnswer,
  onSubmitCustom
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [customProposal, setCustomProposal] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleAnswerSubmit = () => {
    if (selectedOption === null) return;
    onSubmitAnswer(selectedOption);
    setSelectedOption(null);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customProposal.trim()) return;
    onSubmitCustom(customProposal.trim());
    setCustomProposal('');
    setShowCustomInput(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Selectable Standard Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {options.map((option, idx) => (
          <div 
            key={idx}
            onClick={() => { setSelectedOption(idx); setShowCustomInput(false); }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '10px',
              border: '2px solid ' + (selectedOption === idx ? 'var(--color-brand)' : 'var(--border-color)'),
              backgroundColor: selectedOption === idx ? 'var(--color-brand-light)' : 'var(--bg-primary)',
              cursor: 'pointer',
              textAlign: 'left'
            }}
            className="transition-all"
          >
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: '2px solid ' + (selectedOption === idx ? 'var(--color-brand)' : 'var(--text-tertiary)'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '2px',
              backgroundColor: selectedOption === idx ? 'var(--color-brand)' : 'transparent'
            }}>
              {selectedOption === idx && <Check size={10} color="#fff" />}
            </div>
            <span style={{ 
              fontSize: '13.5px', 
              lineHeight: '1.4', 
              color: selectedOption === idx ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: selectedOption === idx ? '500' : '400'
            }}>
              {option}
            </span>
          </div>
        ))}
      </div>

      {/* Custom Suggestion toggle link */}
      {!showCustomInput && (
        <button
          type="button"
          onClick={() => { setShowCustomInput(true); setSelectedOption(null); }}
          style={{
            fontSize: '13px',
            color: 'var(--color-brand)',
            fontWeight: '500',
            alignSelf: 'flex-start',
            padding: '4px 8px',
            borderRadius: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
          className="hover:bg-brand-light"
        >
          + Suggest a custom feature...
        </button>
      )}

      {/* Custom Suggestion Input Form */}
      {showCustomInput && (
        <form onSubmit={handleCustomSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backgroundColor: 'var(--bg-primary)',
          border: '1px dashed var(--color-brand)',
          padding: '12px',
          borderRadius: '10px'
        }}>
          <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-brand)' }}>Custom Proposal</span>
            <button type="button" onClick={() => setShowCustomInput(false)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
          <textarea
            rows={3}
            placeholder="Describe your custom feature idea..."
            value={customProposal}
            onChange={(e) => setCustomProposal(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              fontSize: '13px',
              color: 'var(--text-primary)',
              resize: 'none',
              outline: 'none'
            }}
            required
            autoFocus
          />
          <button
            type="submit"
            disabled={!customProposal.trim() || submittingAnswer}
            style={{
              backgroundColor: (!customProposal.trim() || submittingAnswer) ? 'var(--border-color)' : 'var(--color-brand)',
              color: (!customProposal.trim() || submittingAnswer) ? 'var(--text-tertiary)' : '#fff',
              padding: '8px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              border: 'none',
              cursor: (!customProposal.trim() || submittingAnswer) ? 'not-allowed' : 'pointer'
            }}
          >
            Submit Custom Suggestion
          </button>
        </form>
      )}

      {/* Standard Option Submit Button */}
      {!showCustomInput && (
        <button 
          onClick={handleAnswerSubmit}
          disabled={selectedOption === null || submittingAnswer}
          style={{
            backgroundColor: (selectedOption === null || submittingAnswer) ? 'var(--border-color)' : 'var(--color-brand)',
            color: (selectedOption === null || submittingAnswer) ? 'var(--text-tertiary)' : '#fff',
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '500',
            marginTop: '10px',
            border: 'none',
            cursor: (selectedOption === null || submittingAnswer) ? 'not-allowed' : 'pointer'
          }}
        >
          Submit Choice to Antigravity
        </button>
      )}
    </div>
  );
}
