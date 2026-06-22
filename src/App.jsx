import { useState, useEffect } from 'react';
import { subscribeToLists, saveList, deleteList, subscribeToTasks, saveTask, deleteTask, subscribeToFeatures, subscribeToVotes, submitVote, dbMode } from './firebase';
import Sidebar from './components/Sidebar';
import AiAssistant from './components/AiAssistant';
import TagFilters from './components/TagFilters';
import TaskInput from './components/TaskInput';
import TaskItem from './components/TaskItem';
import { ReminderPopup, BlockerWarning } from './components/AlertBanners';
import { Menu, Sparkles } from 'lucide-react';

function App() {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Database lists and tasks states
  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState('default');
  const [tasks, setTasks] = useState([]);
  
  // AI Panel states
  const [features, setFeatures] = useState([]);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answers, setAnswers] = useState([]);

  // Derive hasVoted state based on active features and localStorage
  const activeFeaturesForVote = features.filter(f => f.status === 'voting' || f.status === 'implementing');
  const votedFeatureId = localStorage.getItem('voted_feature_id');
  const hasVoted = votedFeatureId === 'custom' || activeFeaturesForVote.some(f => f.id === votedFeatureId);

  // Reminder states
  const [activeReminder, setActiveReminder] = useState(null);
  const [dismissedReminders, setDismissedReminders] = useState(new Set());

  // Blocker Warning states
  const [blockerWarning, setBlockerWarning] = useState({ parentTitle: '', show: false });

  // Tag states
  const [selectedTagFilter, setSelectedTagFilter] = useState(null);

  // Mobile layout states
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(false);
        setIsAssistantOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  // Subscribe to lists
  useEffect(() => {
    return subscribeToLists((data) => {
      setLists(data);
      if (data.length > 0 && !data.find(l => l.id === activeListId)) {
        setActiveListId(data[0].id);
      }
    });
  }, [activeListId]);

  // Subscribe to tasks for active list
  useEffect(() => {
    if (!activeListId) return;
    return subscribeToTasks(activeListId, (data) => {
      setTasks(data);
    });
  }, [activeListId]);

  // Subscribe to AI Sidebar features
  useEffect(() => {
    const unsubscribeFeatures = subscribeToFeatures((data) => {
      setFeatures(data);
      setSubmittingAnswer(false);
    });
    return () => unsubscribeFeatures();
  }, []);

  // Subscribe to all active unprocessed votes
  useEffect(() => {
    const unsubscribeVotes = subscribeToVotes((data) => {
      setAnswers(data || []);
    });
    return () => unsubscribeVotes();
  }, []);


  // Background reminder checker engine
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const activeTasksWithDue = tasks.filter(t => !t.completed && t.dueDate && t.dueTime);
      
      for (const task of activeTasksWithDue) {
        const [year, month, day] = task.dueDate.split('-').map(Number);
        const [hours, minutes] = task.dueTime.split(':').map(Number);
        const dueDateTime = new Date(year, month - 1, day, hours, minutes, 0);
        
        if (now >= dueDateTime && !dismissedReminders.has(task.id)) {
          setActiveReminder({
            id: task.id,
            title: task.title,
            dueText: `${task.dueDate} at ${task.dueTime}`
          });
          break;
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [tasks, dismissedReminders]);

  const handleUpdateDueDate = async (task, dueDate) => {
    try {
      await saveTask({
        ...task,
        dueDate
      });
    } catch (err) {
      console.error('Failed to update due date:', err);
    }
  };

  const handleUpdateDueTime = async (task, dueTime) => {
    try {
      await saveTask({
        ...task,
        dueTime
      });
    } catch (err) {
      console.error('Failed to update due time:', err);
    }
  };

  const handleDismissReminder = (taskId) => {
    setDismissedReminders(prev => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });
    setActiveReminder(null);
  };

  // Task Handlers
  const handleAddTask = async (title) => {
    try {
      await saveTask({
        listId: activeListId,
        title,
        completed: false,
        dueDate: '',
        createdAt: Date.now()
      });
      return true;
    } catch (err) {
      console.error('Failed to add task:', err);
      return false;
    }
  };

  const handleAddSubtask = async (parentTaskId, title) => {
    try {
      await saveTask({
        listId: activeListId,
        parentId: parentTaskId,
        title,
        completed: false,
        dueDate: '',
        createdAt: Date.now()
      });
      return true;
    } catch (err) {
      console.error('Failed to add subtask:', err);
      return false;
    }
  };

  const handleToggleTask = async (task) => {
    // If completing a task with no parent (meaning it's a parent task)
    if (!task.completed && !task.parentId) {
      const incompleteSubtasks = tasks.filter(t => t.parentId === task.id && !t.completed);
      if (incompleteSubtasks.length > 0) {
        setBlockerWarning({
          parentTitle: task.title,
          show: true
        });
        setTimeout(() => {
          setBlockerWarning(prev => {
            if (prev.parentTitle === task.title) {
              return { ...prev, show: false };
            }
            return prev;
          });
        }, 4000);
        return;
      }
    }

    try {
      await saveTask({
        ...task,
        completed: !task.completed
      });
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      // Cascade delete subtasks
      const childTasks = tasks.filter(t => t.parentId === taskId);
      for (const child of childTasks) {
        await deleteTask(child.id);
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Dynamic HSL Tag Color Generator
  const getTagColor = (tagName) => {
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
      hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return {
      bg: `hsl(${h}, 70%, 94%)`,
      text: `hsl(${h}, 70%, 25%)`,
      border: `hsl(${h}, 70%, 82%)`
    };
  };

  const handleAddTag = async (task, tagName) => {
    if (!tagName.trim()) return;
    const cleanTag = tagName.trim();
    const currentTags = task.tags || [];
    if (currentTags.includes(cleanTag)) return;
    
    try {
      await saveTask({
        ...task,
        tags: [...currentTags, cleanTag]
      });
    } catch (err) {
      console.error('Failed to add tag:', err);
    }
  };

  const handleRemoveTag = async (task, tagName) => {
    const currentTags = task.tags || [];
    try {
      await saveTask({
        ...task,
        tags: currentTags.filter(t => t !== tagName)
      });
    } catch (err) {
      console.error('Failed to remove tag:', err);
    }
  };

  // List Handlers
  const handleAddList = async (listName) => {
    const newListId = 'list_' + Date.now();
    try {
      await saveList({
        id: newListId,
        name: listName
      });
      setActiveListId(newListId);
      return true;
    } catch (err) {
      console.error('Failed to add list:', err);
      return false;
    }
  };

  const handleDeleteList = async (listId) => {
    if (lists.length <= 1) {
      alert('You must keep at least one task list.');
      return;
    }
    if (confirm('Are you sure you want to delete this list and all its tasks?')) {
      try {
        await deleteList(listId);
      } catch (err) {
        console.error('Failed to delete list:', err);
      }
    }
  };

  // AI Sidebar handlers
  const handleAnswerSubmit = async (featureId, selectedOptionText) => {
    if (!featureId) return;
    setSubmittingAnswer(true);
    try {
      await submitVote(featureId, selectedOptionText);
      localStorage.setItem('voted_feature_id', featureId);
    } catch (err) {
      console.error('Failed to submit vote:', err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleCustomSubmit = async (customText) => {
    if (!customText) return false;
    setSubmittingAnswer(true);
    try {
      await submitVote('custom', customText);
      localStorage.setItem('voted_feature_id', 'custom');
      return true;
    } catch (err) {
      console.error('Failed to submit custom suggestion:', err);
      return false;
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const allTagsInList = Array.from(new Set(tasks.flatMap(t => t.tags || []))).sort();

  const activeParentTasks = tasks.filter(t => !t.completed && (!t.parentId || !tasks.some(p => p.id === t.parentId)));
  const completedParentTasks = tasks.filter(t => t.completed && (!t.parentId || !tasks.some(p => p.id === t.parentId)));

  const filteredActiveParentTasks = activeParentTasks.filter(task => {
    if (!selectedTagFilter) return true;
    const hasTag = task.tags && task.tags.includes(selectedTagFilter);
    const subtasks = tasks.filter(t => t.parentId === task.id);
    const subtaskHasTag = subtasks.some(s => s.tags && s.tags.includes(selectedTagFilter));
    return hasTag || subtaskHasTag;
  });

  const filteredCompletedParentTasks = completedParentTasks.filter(task => {
    if (!selectedTagFilter) return true;
    const hasTag = task.tags && task.tags.includes(selectedTagFilter);
    const subtasks = tasks.filter(t => t.parentId === task.id);
    const subtaskHasTag = subtasks.some(s => s.tags && s.tags.includes(selectedTagFilter));
    return hasTag || subtaskHasTag;
  });

  const activeList = lists.find(l => l.id === activeListId);

  return (
    <div style={{ 
      display: 'flex', 
      height: '100dvh', 
      width: '100vw', 
      overflow: 'hidden',
      position: 'relative'
    }}>
      
      {/* Sidebar Backdrop overlay for Mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 999,
            backdropFilter: 'blur(2px)',
            transition: 'opacity 0.2s ease'
          }}
        />
      )}

      {/* Assistant Backdrop overlay for Mobile */}
      {isMobile && isAssistantOpen && (
        <div 
          onClick={() => setIsAssistantOpen(false)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 999,
            backdropFilter: 'blur(2px)',
            transition: 'opacity 0.2s ease'
          }}
        />
      )}

      {/* LEFT PANEL: Task Lists Selector */}
      <div style={isMobile ? {
        position: 'absolute',
        left: isSidebarOpen ? 0 : '-300px',
        width: 'min(280px, 85vw)',
        top: 0,
        bottom: 0,
        zIndex: 1000,
        transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        height: '100%'
      } : {}}>
        <Sidebar
          lists={lists}
          activeListId={activeListId}
          setActiveListId={setActiveListId}
          handleAddList={handleAddList}
          handleDeleteList={handleDeleteList}
          dbMode={dbMode}
          onClose={isMobile ? () => setIsSidebarOpen(false) : null}
        />
      </div>

      {/* CENTER PANEL: Tasks Board */}
      <main style={{
        flex: 1,
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        padding: isMobile ? '16px' : '24px 32px',
        height: '100%',
        overflowY: 'auto'
      }} className="scroller">
        
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                style={{ 
                  padding: '8px', 
                  color: 'var(--text-secondary)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Menu size={20} />
              </button>
            )}
            <h1 style={{ 
              fontSize: isMobile ? '22px' : '28px', 
              fontWeight: '400', 
              margin: 0, 
              color: 'var(--text-primary)', 
              letterSpacing: '-0.5px' 
            }}>
              {activeList?.name || 'My Tasks'}
            </h1>
          </div>

          {isMobile && (
            <button 
              onClick={() => setIsAssistantOpen(true)} 
              style={{ 
                padding: '8px 12px', 
                color: 'var(--color-brand)',
                borderRadius: '8px',
                backgroundColor: 'var(--color-brand-light)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              <Sparkles size={16} />
              <span>Assistant</span>
            </button>
          )}
        </div>

        {/* Tag Filter Bar */}
        <TagFilters
          allTagsInList={allTagsInList}
          selectedTagFilter={selectedTagFilter}
          setSelectedTagFilter={setSelectedTagFilter}
          getTagColor={getTagColor}
        />

        {/* New Task Entry */}
        <TaskInput onAddTask={handleAddTask} />

        {/* Active Tasks Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '32px' }}>
          {filteredActiveParentTasks.map(task => {
            const parentSubtasks = tasks.filter(t => t.parentId === task.id && (!selectedTagFilter || (t.tags && t.tags.includes(selectedTagFilter)) || (task.tags && task.tags.includes(selectedTagFilter))));
            return (
              <TaskItem
                key={task.id}
                task={task}
                subtasks={parentSubtasks}
                isSubtask={false}
                handleToggleTask={handleToggleTask}
                handleDeleteTask={handleDeleteTask}
                handleUpdateDueDate={handleUpdateDueDate}
                handleUpdateDueTime={handleUpdateDueTime}
                handleAddTag={handleAddTag}
                handleRemoveTag={handleRemoveTag}
                handleAddSubtask={handleAddSubtask}
                getTagColor={getTagColor}
                selectedTagFilter={selectedTagFilter}
                isMobile={isMobile}
              />
            );
          })}

          {tasks.filter(t => !t.completed).length === 0 && (
            <div style={{ padding: '24px 0', textAlign: 'left', color: 'var(--text-tertiary)', fontSize: '14px' }}>
              No active tasks. Add a task to get started!
            </div>
          )}
        </div>

        {/* Completed Tasks Section */}
        {completedParentTasks.length > 0 && (
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-secondary)',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '12px',
              textAlign: 'left'
            }}>
              Completed ({tasks.filter(t => t.completed).length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filteredCompletedParentTasks.map(task => {
                const completedSubtasks = tasks.filter(t => t.parentId === task.id && t.completed && (!selectedTagFilter || (t.tags && t.tags.includes(selectedTagFilter)) || (task.tags && task.tags.includes(selectedTagFilter))));
                return (
                  <TaskItem
                    key={task.id}
                    task={task}
                    subtasks={completedSubtasks}
                    isSubtask={false}
                    handleToggleTask={handleToggleTask}
                    handleDeleteTask={handleDeleteTask}
                    handleUpdateDueDate={handleUpdateDueDate}
                    handleUpdateDueTime={handleUpdateDueTime}
                    handleAddTag={handleAddTag}
                    handleRemoveTag={handleRemoveTag}
                    handleAddSubtask={handleAddSubtask}
                    getTagColor={getTagColor}
                    selectedTagFilter={selectedTagFilter}
                    isMobile={isMobile}
                  />
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* RIGHT PANEL: Gemini AI feedback sidebar */}
      <div style={isMobile ? {
        position: 'absolute',
        right: isAssistantOpen ? 0 : '-400px',
        width: 'min(360px, 85vw)',
        top: 0,
        bottom: 0,
        zIndex: 1000,
        transition: 'right 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        height: '100%',
        backgroundColor: 'var(--bg-secondary)'
      } : {}}>
        <AiAssistant
          theme={theme}
          toggleTheme={toggleTheme}
          features={features}
          submittingAnswer={submittingAnswer}
          hasVoted={hasVoted}
          answers={answers}
          handleAnswerSubmit={handleAnswerSubmit}
          handleCustomSubmit={handleCustomSubmit}
          onClose={isMobile ? () => setIsAssistantOpen(false) : null}
        />
      </div>

      {/* Embedded CSS animations */}
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(138, 180, 248, 0.4);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 12px rgba(138, 180, 248, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(138, 180, 248, 0);
          }
        }
        @keyframes slideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translate(-50%, 100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Reminder Popup Alert Banner */}
      <ReminderPopup
        activeReminder={activeReminder}
        onDismiss={handleDismissReminder}
        onComplete={async (id) => {
          const t = tasks.find(x => x.id === id);
          if (t) {
            await handleToggleTask(t);
          }
        }}
      />

      {/* Blocker Warning Popup Alert Banner */}
      <BlockerWarning
        blockerWarning={blockerWarning}
        onClose={() => setBlockerWarning({ ...blockerWarning, show: false })}
      />

    </div>
  );
}

export default App;
