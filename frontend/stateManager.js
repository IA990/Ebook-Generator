// Lightweight Redux-like state manager for ebook form

class StateManager {
  constructor(storageKey = 'ebookFormState') {
    this.storageKey = storageKey;
    this.state = this.loadState() || this.getInitialState();
    this.listeners = [];
    this.undoStack = [];
    this.redoStack = [];
  }

  getInitialState() {
    return {
      title: '',
      author: '',
      description: '',
      chapters: [
        { title: '', content: '' }
      ],
      settings: {
        format: '6x9',
        font: 'times',
        fontSize: 12,
        ebookType: 'standard',
        margin: 50,
        lineHeight: 18,
        textAlign: 'left',
        pageCount: 10,
      }
    };
  }

  getState() {
    return this.state;
  }

  setState(newState) {
    this.undoStack.push(this.state);
    this.state = newState;
    this.redoStack = [];
    this.persistState();
    this.notify();
  }

  updateField(path, value) {
    const newState = JSON.parse(JSON.stringify(this.state));
    let target = newState;
    for (let i = 0; i < path.length - 1; i++) {
      target = target[path[i]];
    }
    target[path[path.length - 1]] = value;
    this.setState(newState);
  }

  addChapter() {
    const newState = JSON.parse(JSON.stringify(this.state));
    newState.chapters.push({ title: '', content: '' });
    this.setState(newState);
  }

  removeChapter(index) {
    const newState = JSON.parse(JSON.stringify(this.state));
    if (index >= 0 && index < newState.chapters.length) {
      newState.chapters.splice(index, 1);
      this.setState(newState);
    }
  }

  undo() {
    if (this.undoStack.length === 0) return;
    this.redoStack.push(this.state);
    this.state = this.undoStack.pop();
    this.persistState();
    this.notify();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    this.undoStack.push(this.state);
    this.state = this.redoStack.pop();
    this.persistState();
    this.notify();
  }

  persistState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to persist state:', e);
    }
  }

  loadState() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load state:', e);
    }
    return null;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }
}

export default StateManager;
