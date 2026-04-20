import { Session } from './types';

const SESSIONS_STORAGE_KEY = 'chatgpt-clone-sessions';

export const getSessions = async (): Promise<Session[]> => {
  try {
    const storedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
    return storedSessions ? JSON.parse(storedSessions) : [];
  } catch (error) {
    console.error('Error loading sessions:', error);
    return [];
  }
};

export const saveSessions = async (sessions: Session[]): Promise<void> => {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving sessions:', error);
  }
};

export const clearSessions = async (): Promise<void> => {
  try {
    localStorage.removeItem(SESSIONS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing sessions:', error);
  }
};