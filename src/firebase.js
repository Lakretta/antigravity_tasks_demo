import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where 
} from 'firebase/firestore';

// Load config from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isFirebaseConfigured = !!firebaseConfig.projectId && firebaseConfig.projectId !== 'your_project_id_here';

let app = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('Firebase successfully initialized!');
  } catch (error) {
    console.error('Failed to initialize Firebase, falling back to mock database:', error);
  }
} else {
  console.log('No Firebase credentials found. Running in Local Demo Mode using LocalStorage.');
}

// ==========================================
// LocalStorage Mock DB Implementation
// ==========================================
const mockDb = {
  get(key, defaultValue) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    // Trigger custom event to notify listeners
    window.dispatchEvent(new CustomEvent(`mock-db-${key}`, { detail: value }));
  },
  subscribe(key, defaultValue, callback) {
    // Initial call
    callback(this.get(key, defaultValue));
    
    // Listener
    const handler = (e) => callback(e.detail);
    window.addEventListener(`mock-db-${key}`, handler);
    
    // Unsubscribe function
    return () => window.removeEventListener(`mock-db-${key}`, handler);
  }
};

// Seed mock database with initial values if empty
if (!localStorage.getItem('mock-lists')) {
  mockDb.set('mock-lists', [
    { id: 'default', name: 'My Tasks', createdAt: Date.now() },
    { id: 'work', name: 'Work', createdAt: Date.now() + 1 },
    { id: 'personal', name: 'Personal', createdAt: Date.now() + 2 }
  ]);
}

if (!localStorage.getItem('mock-tasks')) {
  mockDb.set('mock-tasks', [
    { id: '1', listId: 'default', title: 'Welcome to Google Tasks clone!', notes: 'This is a demo of Google Antigravity capability. Check tasks off to complete them.', completed: false, dueDate: '', createdAt: Date.now() },
    { id: '2', listId: 'default', title: 'Explore the AI feedback loop', notes: 'Look at the Gemini assistant sidebar on the right. You can choose features to build.', completed: false, dueDate: '', createdAt: Date.now() + 1 }
  ]);
}

if (!localStorage.getItem('mock-questions')) {
  mockDb.set('mock-questions', [
    {
      id: 'feature_selection',
      question: 'Which capability would you like Antigravity to build next?',
      options: [
        'Add reminders and due time alerts',
        'Enable Drag & Drop task reordering',
        'Create subtasks and lists hierarchy'
      ],
      active: true,
      createdAt: Date.now()
    }
  ]);
}

if (!localStorage.getItem('mock-answers')) {
  mockDb.set('mock-answers', []);
}

// ==========================================
// Unified API Surface
// ==========================================
export const dbMode = isFirebaseConfigured ? 'firebase' : 'local';

// 1. Task Lists
export const subscribeToLists = (callback) => {
  if (db) {
    const q = query(collection(db, 'lists'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const lists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(lists);
    });
  } else {
    return mockDb.subscribe('mock-lists', [], callback);
  }
};

export const saveList = async (list) => {
  const id = list.id || doc(collection(db || {}, 'lists')).id;
  const listData = { ...list, id, createdAt: list.createdAt || Date.now() };
  
  if (db) {
    await setDoc(doc(db, 'lists', id), listData);
  } else {
    const lists = mockDb.get('mock-lists', []);
    const idx = lists.findIndex(l => l.id === id);
    if (idx >= 0) lists[idx] = listData;
    else lists.push(listData);
    mockDb.set('mock-lists', lists);
  }
};

export const deleteList = async (listId) => {
  if (db) {
    await deleteDoc(doc(db, 'lists', listId));
  } else {
    const lists = mockDb.get('mock-lists', []).filter(l => l.id !== listId);
    mockDb.set('mock-lists', lists);
    
    // Also delete tasks in that list
    const tasks = mockDb.get('mock-tasks', []).filter(t => t.listId !== listId);
    mockDb.set('mock-tasks', tasks);
  }
};

// 2. Tasks CRUD
export const subscribeToTasks = (listId, callback) => {
  if (db) {
    const q = query(collection(db, 'tasks'), where('listId', '==', listId));
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      tasks.sort((a, b) => (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0));
      callback(tasks);
    });
  } else {
    return mockDb.subscribe('mock-tasks', [], (allTasks) => {
      callback(allTasks.filter(t => t.listId === listId));
    });
  }
};

export const saveTask = async (task) => {
  const id = task.id || doc(collection(db || {}, 'tasks')).id;
  const taskData = { ...task, id, createdAt: task.createdAt || Date.now() };

  if (db) {
    await setDoc(doc(db, 'tasks', id), taskData);
  } else {
    const tasks = mockDb.get('mock-tasks', []);
    const idx = tasks.findIndex(t => t.id === id);
    if (idx >= 0) tasks[idx] = taskData;
    else tasks.push(taskData);
    mockDb.set('mock-tasks', tasks);
  }
};

export const deleteTask = async (taskId) => {
  if (db) {
    await deleteDoc(doc(db, 'tasks', taskId));
  } else {
    const tasks = mockDb.get('mock-tasks', []).filter(t => t.id !== taskId);
    mockDb.set('mock-tasks', tasks);
  }
};

// 3. AI Sidebar (Questions & Answers)
export const subscribeToQuestions = (callback) => {
  if (db) {
    const q = query(collection(db, 'questions'), where('active', '==', true));
    return onSnapshot(q, (snapshot) => {
      const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      questions.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
      callback(questions);
    });
  } else {
    return mockDb.subscribe('mock-questions', [], (allQuestions) => {
      callback(allQuestions.filter(q => q.active));
    });
  }
};

export const subscribeToAnswers = (questionId, callback) => {
  if (db) {
    const q = query(collection(db, 'answers'), where('questionId', '==', questionId));
    return onSnapshot(q, (snapshot) => {
      const answers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(answers);
    });
  } else {
    return mockDb.subscribe('mock-answers', [], (allAnswers) => {
      callback(allAnswers.filter(a => a.questionId === questionId));
    });
  }
};

export const submitAnswer = async (questionId, selectedOptionIndex, selectedOptionText) => {
  const answerData = {
    questionId,
    selectedOptionIndex,
    selectedOptionText,
    submittedAt: Date.now(),
    processed: false
  };

  if (db) {
    // Add answer doc to Firestore
    await addDoc(collection(db, 'answers'), answerData);
  } else {
    const answers = mockDb.get('mock-answers', []);
    answers.push({ ...answerData, id: 'ans_' + Date.now() });
    mockDb.set('mock-answers', answers);
  }
};

export { db };
