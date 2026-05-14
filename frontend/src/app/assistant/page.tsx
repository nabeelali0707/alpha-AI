'use client';
import React, { useState } from 'react';

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Neural Core v2.4 initialized. Ready for market analysis. What is your query?', time: '08:00:00' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input, time: new Date().toLocaleTimeString([], { hour12: false }) };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Simulated AI response
    setTimeout(() => {
      const assistantMessage = { 
        role: 'assistant', 
        content: `Analyzing "${input}"... My neural patterns suggest a bullish divergence in the tech sector over the next 48 hours. Sentiment score: 0.84/1.0.`, 
        time: new Date().toLocaleTimeString([], { hour12: false }) 
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-md)', height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <h1 className="headline-lg">AI Neural Assistant</h1>
        <p className="data-mono" style={{ opacity: 0.5 }}>CONNECTED TO ALPHA_BRAIN_CLUSTER_01</p>
      </div>

      <div className="glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 'var(--spacing-md)' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', paddingBottom: 'var(--spacing-md)' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ 
              maxWidth: '80%', 
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              padding: 'var(--spacing-sm)',
              borderRadius: 'var(--radius-md)',
              background: msg.role === 'user' ? 'var(--tertiary-glow)' : 'var(--surface-bright)',
              border: `1px solid ${msg.role === 'user' ? 'var(--tertiary)' : 'var(--outline-variant)'}`
            }}>
              <div className="data-mono" style={{ fontSize: '10px', marginBottom: '4px', opacity: 0.6, color: msg.role === 'user' ? 'var(--tertiary)' : 'var(--primary)' }}>
                {msg.role === 'user' ? 'OPERATOR' : 'NEURAL_CORE'} // {msg.time}
              </div>
              <p style={{ lineHeight: 1.5 }}>{msg.content}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} style={{ display: 'flex', gap: 'var(--spacing-sm)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--outline-variant)' }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter query or ticker symbol..."
            style={{ 
              flex: 1, 
              background: 'rgba(0,0,0,0.3)', 
              border: '1px solid var(--outline)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '12px', 
              color: 'white',
              fontFamily: 'var(--font-body)'
            }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }}>EXECUTE</button>
        </form>
      </div>
    </div>
  );
}
