import StateManager from './stateManager.js';

describe('StateManager', () => {
  let stateManager;

  beforeEach(() => {
    localStorage.clear();
    stateManager = new StateManager('testState');
  });

  test('initial state is correct', () => {
    const state = stateManager.getState();
    expect(state.title).toBe('');
    expect(state.chapters.length).toBe(1);
    expect(state.settings.format).toBe('6x9');
  });

  test('setState updates state and notifies listeners', () => {
    const listener = jest.fn();
    stateManager.subscribe(listener);

    const newState = { ...stateManager.getState(), title: 'New Title' };
    stateManager.setState(newState);

    expect(stateManager.getState().title).toBe('New Title');
    expect(listener).toHaveBeenCalledWith(newState);
  });

  test('updateField updates nested field', () => {
    stateManager.updateField(['title'], 'Updated Title');
    expect(stateManager.getState().title).toBe('Updated Title');

    stateManager.updateField(['settings', 'fontSize'], 14);
    expect(stateManager.getState().settings.fontSize).toBe(14);
  });

  test('addChapter adds a new chapter', () => {
    const initialLength = stateManager.getState().chapters.length;
    stateManager.addChapter();
    expect(stateManager.getState().chapters.length).toBe(initialLength + 1);
  });

  test('removeChapter removes chapter by index', () => {
    stateManager.addChapter();
    const initialLength = stateManager.getState().chapters.length;
    stateManager.removeChapter(0);
    expect(stateManager.getState().chapters.length).toBe(initialLength - 1);
  });

  test('undo and redo work correctly', () => {
    stateManager.updateField(['title'], 'First');
    stateManager.updateField(['title'], 'Second');
    expect(stateManager.getState().title).toBe('Second');

    stateManager.undo();
    expect(stateManager.getState().title).toBe('First');

    stateManager.redo();
    expect(stateManager.getState().title).toBe('Second');
  });

  test('state persists and loads from localStorage', () => {
    stateManager.updateField(['title'], 'Persisted Title');
    const newManager = new StateManager('testState');
    expect(newManager.getState().title).toBe('Persisted Title');
  });
});
