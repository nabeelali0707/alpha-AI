"use client";

import React, { useState } from 'react';

import { getRecommendation, getSentiment } from '@/lib/api';

type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
  time: string;
};

export default function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Neural Core initialized. Enter a ticker like AAPL or NVDA.', time: '08:00:00' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const ticker = input.trim().toUpperCase();
    const time = new Date().toLocaleTimeString([], { hour12: false });

    setMessages((prev) => [...prev, { role: 'user', content: ticker, time }]);
    setInput('');
    setLoading(true);

    try {
      const [sentiment, recommendation] = await Promise.all([
        getSentiment(ticker),
        getRecommendation(ticker),
      ]);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `${ticker}: ${recommendation.recommendation} with ${Math.round(recommendation.confidence * 100)}% confidence. Sentiment: ${sentiment.label ?? 'UNKNOWN'}.`,
          time: new Date().toLocaleTimeString([], { hour12: false }),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Failed to fetch backend analysis.',
          time: new Date().toLocaleTimeString([], { hour12: false }),
        },
      ]);
    } finally {
      setLoading(false);
    }
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
          <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }}>
            {loading ? 'RUNNING' : 'EXECUTE'}
          </button>
        </form>
      </div>
    </div>
  );
}
