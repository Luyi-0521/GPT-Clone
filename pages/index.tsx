import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatInterface from '../components/ChatInterface';
import { Session, Message } from '../lib/types';
import { getSessions, saveSessions } from '../lib/storage';

const Home: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      const storedSessions = await getSessions();
      setSessions(storedSessions);
      if (storedSessions.length > 0) {
        setActiveSession(storedSessions[0].id);
      }
    };
    loadSessions();
  }, []);

  const createNewSession = () => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      title: '新会话',
      messages: [],
      createdAt: new Date().toISOString()
    };
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    setActiveSession(newSession.id);
    saveSessions(updatedSessions);
  };

  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    setSessions(updatedSessions);
    if (activeSession === sessionId) {
      setActiveSession(updatedSessions.length > 0 ? updatedSessions[0].id : null);
    }
    saveSessions(updatedSessions);
  };

  const updateSession = (updatedSession: Session) => {
    const updatedSessions = sessions.map(session => 
      session.id === updatedSession.id ? updatedSession : session
    );
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
  };

  const updateSessionTitle = (sessionId: string, title: string) => {
    const updatedSessions = sessions.map(session =>
      session.id === sessionId
        ? { ...session, title, isTitleManuallyEdited: true }
        : session
    );
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
  };

  const activeSessionData = sessions.find(session => session.id === activeSession);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        sessions={sessions}
        activeSession={activeSession}
        onCreateSession={createNewSession}
        onDeleteSession={deleteSession}
        onSelectSession={setActiveSession}
        onUpdateSessionTitle={updateSessionTitle}
      />
      <ChatInterface 
        session={activeSessionData}
        onUpdateSession={updateSession}
      />
    </div>
  );
};

export default Home;