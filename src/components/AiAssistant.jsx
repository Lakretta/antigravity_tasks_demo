import AssistantHeader from './AssistantHeader';
import PollResults from './PollResults';
import PollChoices from './PollChoices';
import AgentStateLog from './AgentStateLog';

export default function AiAssistant({
  theme,
  toggleTheme,
  aiQuestions,
  submittingAnswer,
  hasVoted,
  answers,
  handleAnswerSubmit,
  handleCustomSubmit
}) {
  const activeQuestion = aiQuestions[0];
  const totalVotes = answers ? answers.length : 0;
  
  // Calculate results if user has voted
  const voteResults = (activeQuestion && answers) ? activeQuestion.options.map((option, idx) => {
    const votesCount = answers.filter(a => a.selectedOptionIndex === idx).length;
    const percentage = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
    return {
      text: option,
      votes: votesCount,
      percent: percentage
    };
  }) : [];

  // Extract custom ideas from answers
  const customIdeas = answers ? answers.filter(a => a.selectedOptionIndex === -1) : [];

  // Get the last submitted answer text
  const processedOrPendingText = (activeQuestion && answers && answers.length > 0) ? answers[answers.length - 1].selectedOptionText : '';

  return (
    <section style={{
      width: '360px',
      backgroundColor: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100%'
    }}>
      {/* Gemini Header */}
      <AssistantHeader theme={theme} toggleTheme={toggleTheme} />

      {/* Content body */}
      <div style={{ flex: 1, padding: '24px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="scroller">
        
        {activeQuestion ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            
            {/* Question Card */}
            <div style={{ 
              backgroundColor: 'var(--bg-primary)', 
              borderRadius: '12px', 
              padding: '16px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <span style={{ color: 'var(--color-brand)', flexShrink: 0, marginTop: '2px', display: 'flex', alignItems: 'center' }}>★</span>
                <p style={{ fontSize: '14px', lineHeight: '1.45', fontWeight: '500', color: 'var(--text-primary)', textAlign: 'left', margin: 0 }}>
                  {activeQuestion.question}
                </p>
              </div>
              
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', textAlign: 'left', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                {hasVoted 
                  ? "Thank you for voting! Antigravity agent is reviewing options in real-time."
                  : "Select a suggested feature or suggest a custom idea below to let the Antigravity agent implement it."}
              </span>
            </div>

            {/* Options Section: Show Results if Voted, otherwise Show Choices */}
            {hasVoted ? (
              <PollResults
                voteResults={voteResults}
                totalVotes={totalVotes}
                customIdeas={customIdeas}
                processedOrPendingText={processedOrPendingText}
              />
            ) : (
              <PollChoices
                options={activeQuestion.options}
                submittingAnswer={submittingAnswer}
                onSubmitAnswer={handleAnswerSubmit}
                onSubmitCustom={handleCustomSubmit}
              />
            )}
          </div>
        ) : (
          /* Fallback Idle state if no questions are configured */
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '18px', 
            flex: 1, 
            textAlign: 'center',
            padding: '40px 10px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.1), rgba(155, 114, 248, 0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-brand)',
              animation: 'pulse 2s infinite ease-in-out'
            }}>
              ★
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)' }}>
                Awaiting Active Session
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', maxWidth: '260px', margin: 0 }}>
                There are currently no active design questions. Use the Antigravity agent CLI tool to seed a question into Firestore.
              </p>
            </div>
          </div>
        )}

        {/* Real-time Code Agent State Logger */}
        <AgentStateLog hasVoted={hasVoted} processedOrPendingText={processedOrPendingText} />
      </div>
    </section>
  );
}
