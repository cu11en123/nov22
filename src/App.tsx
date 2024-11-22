import React, { useState, useEffect } from 'react';
import SetupWizard from './components/SetupWizard';
import ChatInterface from './components/ChatInterface';
import { checkAuthentication } from './utils/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await checkAuthentication();
      setIsAuthenticated(authStatus);
    };
    checkAuth();
  }, []);

  return (
    <div className="w-[500px] h-[500px] bg-gray-100 flex flex-col p-4">
      <h1 className="text-2xl font-bold text-blue-600 mb-4">Salesforce ChatGPT Extension</h1>
      {isAuthenticated ? (
        <ChatInterface />
      ) : (
        <SetupWizard onComplete={() => setIsAuthenticated(true)} />
      )}
    </div>
  );
}

export default App;