import React, { useState, useRef, useEffect } from 'react';
import { Send, Database, Search, FileText, Loader2 } from 'lucide-react';

export default function DataverseChatbot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your Harvard Dataverse assistant. I can help you search for datasets, retrieve metadata, and explore the Harvard Dataverse repository. What would you like to know?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: 'user', content: userMessage }
          ],
          system: `You are a helpful assistant for the Harvard Dataverse repository. You help users search for datasets, understand metadata, and navigate the Dataverse platform.

When users ask about datasets, you can:
- Search for datasets by keywords
- Explain what Harvard Dataverse is
- Help interpret dataset metadata
- Suggest relevant search terms
- Provide information about data access and citation

Be concise, helpful, and guide users to find the information they need. If you don't have specific information about a dataset, suggest how they could search for it on the Harvard Dataverse platform.`
        })
      });

      const data = await response.json();
      const assistantMessage = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { icon: Search, text: 'Search datasets', query: 'How do I search for datasets in Harvard Dataverse?' },
    { icon: Database, text: 'What is Dataverse?', query: 'What is Harvard Dataverse?' },
    { icon: FileText, text: 'Dataset metadata', query: 'What metadata is available for datasets?' }
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Harvard Dataverse Assistant</h1>
              <p className="text-sm text-gray-600">Search and explore research datasets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl rounded-2xl px-4 py-3 ${
                msg.role === 'user' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white text-gray-900 shadow-sm border border-gray-200'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                <Loader2 className="w-5 h-5 animate-spin text-red-600" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length === 1 && (
        <div className="px-4 pb-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-gray-600 mb-3">Quick actions:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(action.query);
                    setMessages(prev => [...prev, { role: 'user', content: action.query }]);
                    setIsLoading(true);
                    
                    fetch('https://api.anthropic.com/v1/messages', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        model: 'claude-sonnet-4-20250514',
                        max_tokens: 1000,
                        messages: [
                          ...messages.map(msg => ({ role: msg.role, content: msg.content })),
                          { role: 'user', content: action.query }
                        ],
                        system: `You are a helpful assistant for the Harvard Dataverse repository. You help users search for datasets, understand metadata, and navigate the Dataverse platform.

When users ask about datasets, you can:
- Search for datasets by keywords
- Explain what Harvard Dataverse is
- Help interpret dataset metadata
- Suggest relevant search terms
- Provide information about data access and citation

Be concise, helpful, and guide users to find the information they need. If you don't have specific information about a dataset, suggest how they could search for it on the Harvard Dataverse platform.`
                      })
                    })
                    .then(res => res.json())
                    .then(data => {
                      const assistantMessage = data.content
                        .filter(block => block.type === 'text')
                        .map(block => block.text)
                        .join('\n');
                      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
                      setInput('');
                    })
                    .catch(() => {
                      setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: 'I apologize, but I encountered an error. Please try again.'
                      }]);
                    })
                    .finally(() => setIsLoading(false));
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors text-left"
                >
                  <action.icon className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{action.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask about datasets, search queries, or Dataverse features..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            This chatbot helps you explore Harvard Dataverse. For actual dataset searches, visit{' '}
            <a href="https://dataverse.harvard.edu" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">
              dataverse.harvard.edu
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
