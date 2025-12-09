import React, { useEffect, useMemo, useState } from 'react';
import { participants } from '../data/participants';
import { fetchSharedState, pruneMessages, saveSharedState } from '../utils/sharedState';

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem 1rem',
    color: '#0f172a'
  },
  hero: {
    background: 'linear-gradient(135deg, #1d4ed8, #0f172a)',
    borderRadius: '18px',
    padding: '2rem',
    color: '#fff',
    marginBottom: '2rem',
    boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)'
  },
  board: {
    background: '#fff',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 8px 25px rgba(15, 23, 42, 0.08)'
  },
  textarea: {
    width: '100%',
    minHeight: '90px',
    borderRadius: '10px',
    border: '1px solid #cbd5f5',
    padding: '0.75rem',
    resize: 'vertical',
    fontSize: '1rem'
  },
  button: {
    marginTop: '0.75rem',
    padding: '0.65rem 1.25rem',
    background: '#2563eb',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer'
  },
  messageList: {
    marginTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  messageCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '1rem',
    background: '#f8fafc'
  }
};

const Home = ({ selectedUserId }) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedParticipant = useMemo(() => participants.find((person) => person.id === selectedUserId), [selectedUserId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const payload = await fetchSharedState();
      setMessages(pruneMessages(payload.messages || []));
      setError('');
    } catch (err) {
      setError('Unable to load the shared message board right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      try {
        const payload = await fetchSharedState();
        if (!cancelled) {
          setMessages(pruneMessages(payload.messages || []));
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError('Unable to load the shared message board right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatTimestamp = (value) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(value));
    } catch (err) {
      return value;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage('');
    if (!selectedParticipant) {
      setStatusMessage('Select your name in the header before posting a message.');
      return;
    }
    if (!messageText.trim()) {
      setStatusMessage('Type a message before posting.');
      return;
    }

    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      authorId: selectedParticipant.id,
      authorName: selectedParticipant.name,
      text: messageText.trim(),
      createdAt: new Date().toISOString()
    };

    const nextMessages = pruneMessages([newMessage, ...messages]);
    setSaving(true);
    try {
      const saved = await saveSharedState({ messages: nextMessages });
      setMessages(pruneMessages(saved.messages || nextMessages));
      setMessageText('');
      setStatusMessage('Message posted! Entries automatically clear after 30 days.');
    } catch (err) {
      setStatusMessage('Unable to post right now. Try again once the sync service is available.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={styles.container}>
      <section style={styles.hero}>
        <h1 style={{ marginTop: 0 }}>Welcome to the Family Hub</h1>
        <p style={{ maxWidth: '540px' }}>
          Stay on top of gift planning, share quick updates, and keep the entire family aligned. The message board below keeps the latest notes for everyone for 30 days.
        </p>
      </section>

      <section style={styles.board}>
        <header>
          <h2 style={{ marginTop: 0 }}>Message Board</h2>
          <p>Post an update while signed in with your name. Messages disappear automatically after 30 days.</p>
        </header>
        <form onSubmit={handleSubmit}>
          <textarea
            style={styles.textarea}
            placeholder={selectedParticipant ? `Share a note as ${selectedParticipant.name}...` : 'Select your name in the header to post.'}
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            disabled={!selectedParticipant || saving}
          />
          <button
            type="submit"
            style={styles.button}
            disabled={!selectedParticipant || saving}
          >
            {saving ? 'Posting...' : 'Post message'}
          </button>
        </form>
        {statusMessage && <p style={{ marginTop: '0.75rem' }}>{statusMessage}</p>}
        {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
        <div style={styles.messageList}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Latest messages</strong>
            <button type="button" style={{ ...styles.button, background: '#e2e8f0', color: '#0f172a' }} onClick={loadMessages} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          {loading && <p>Loading messages...</p>}
          {!loading && !messages.length && <p>No messages yet. Be the first to post!</p>}
          {!loading &&
            messages.map((message) => (
              <article style={styles.messageCard} key={message.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{message.authorName || 'Someone'}</strong>
                  <span style={{ fontSize: '0.9rem', color: '#475569' }}>{formatTimestamp(message.createdAt)}</span>
                </div>
                <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{message.text}</p>
              </article>
            ))}
        </div>
      </section>
    </main>
  );
};

Home.defaultProps = {
  selectedUserId: ''
};

export default Home;