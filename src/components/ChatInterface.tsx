import React, { useState } from 'react';
import { Send, Loader } from 'lucide-react';
import { processUserInput } from '../utils/chatProcessor';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await processUserInput(input);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      let errorMessage = 'An error occurred. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-auto mb-4 p-2">
        {messages.map((message, index) => (
          <div key={index} className={`mb-2 p-2 rounded ${message.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-200'}`}>
            {message.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your command..."
          className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded-r hover:bg-blue-700 transition-colors" disabled={isLoading}>
          {isLoading ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;