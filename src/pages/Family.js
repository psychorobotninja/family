import React, { useEffect, useMemo, useState } from 'react';
import { participants } from '../data/participants';
import { fetchSharedState, mergeWishlists, saveSharedState } from '../utils/sharedState';

const styles = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '2rem 1rem',
    color: '#0f172a'
  },
  header: {
    marginBottom: '1.5rem',
    background: '#1e293b',
    color: '#fff',
    borderRadius: '16px',
    padding: '1.75rem'
  },
  filters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    marginTop: '1rem'
  },
  select: {
    padding: '0.5rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid #cbd5f5',
    minWidth: '220px'
  },
  button: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600
  },
  secondaryButton: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid #94a3b8',
    background: 'transparent',
    color: '#334155',
    cursor: 'pointer',
    fontWeight: 600
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1.5rem'
  },
  card: {
    background: '#fff',
    borderRadius: '18px',
    padding: '1.5rem',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.1)'
  },
  list: {
    paddingLeft: '1.25rem'
  },
  label: {
    display: 'block',
    fontWeight: 600,
    marginTop: '0.5rem'
  },
  editor: {
    marginTop: '1.25rem',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '1rem'
  },
  input: {
    width: '100%',
    padding: '0.5rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid #cbd5f5',
    marginTop: '0.35rem'
  },
  helper: {
    fontSize: '0.9rem',
    color: '#475569',
    marginTop: '0.25rem'
  },
  status: {
    marginTop: '0.85rem'
  },
  deleteButton: {
    marginLeft: '0.75rem',
    padding: '0.15rem 0.5rem',
    borderRadius: '6px',
    border: 'none',
    background: '#fee2e2',
    color: '#b91c1c',
    fontSize: '0.8rem',
    cursor: 'pointer'
  },
  link: {
    wordBreak: 'break-all',
    display: 'inline-block',
    maxWidth: '100%'
  }
};

const Family = ({ selectedUserId }) => {
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [wishlists, setWishlists] = useState(() => mergeWishlists());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ideaDraft, setIdeaDraft] = useState('');
  const [linkDraft, setLinkDraft] = useState('');
  const [editorStatus, setEditorStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  const visibleParticipants = useMemo(() => {
    if (!selectedPersonId) {
      return participants;
    }
    return participants.filter((person) => person.id === selectedPersonId);
  }, [selectedPersonId]);

  useEffect(() => {
    setIdeaDraft('');
    setLinkDraft('');
    setEditorStatus(null);
  }, [selectedUserId]);

  const persistWishlistChanges = async (nextWishlists, successText) => {
    setSaving(true);
    try {
      const payload = await saveSharedState({ wishlists: nextWishlists });
      setWishlists(mergeWishlists(payload.wishlists || nextWishlists));
      setEditorStatus({ type: 'success', text: successText });
    } catch (error) {
      setEditorStatus({ type: 'error', text: 'Unable to save changes. Try again when the sync service is available.' });
    } finally {
      setSaving(false);
    }
  };

  const ensureEditable = (personId) => {
    if (!selectedUserId) {
      setEditorStatus({ type: 'error', text: 'Select your name in the header before editing your list.' });
      return false;
    }
    if (personId !== selectedUserId) {
      setEditorStatus({ type: 'error', text: 'You can only edit your own list.' });
      return false;
    }
    return true;
  };

  const handleAddIdea = async (personId) => {
    if (!ensureEditable(personId)) {
      return;
    }
    if (!ideaDraft.trim()) {
      setEditorStatus({ type: 'error', text: 'Enter an idea before saving.' });
      return;
    }
    const trimmedIdea = ideaDraft.trim();
    const current = wishlists[personId] || { ideas: [], links: [] };
    const nextWishlists = {
      ...wishlists,
      [personId]: {
        ideas: [...current.ideas, trimmedIdea],
        links: [...current.links]
      }
    };
    setIdeaDraft('');
    await persistWishlistChanges(nextWishlists, 'Idea added to your list.');
  };

  const handleAddLink = async (personId) => {
    if (!ensureEditable(personId)) {
      return;
    }
    if (!linkDraft.trim()) {
      setEditorStatus({ type: 'error', text: 'Enter a URL before saving.' });
      return;
    }
    const trimmedLink = linkDraft.trim();
    try {
      const parsed = new URL(trimmedLink);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch (error) {
      setEditorStatus({ type: 'error', text: 'Please provide a valid URL (remember https://).' });
      return;
    }
    const current = wishlists[personId] || { ideas: [], links: [] };
    const nextWishlists = {
      ...wishlists,
      [personId]: {
        ideas: [...current.ideas],
        links: [...current.links, trimmedLink]
      }
    };
    setLinkDraft('');
    await persistWishlistChanges(nextWishlists, 'Link added to your list.');
  };

  const handleDeleteIdea = async (personId, ideaIndex) => {
    if (!ensureEditable(personId)) {
      return;
    }
    const current = wishlists[personId] || { ideas: [], links: [] };
    if (!current.ideas[ideaIndex]) {
      return;
    }
    const nextWishlists = {
      ...wishlists,
      [personId]: {
        ideas: current.ideas.filter((_, index) => index !== ideaIndex),
        links: [...current.links]
      }
    };
    await persistWishlistChanges(nextWishlists, 'Idea removed.');
  };

  const handleDeleteLink = async (personId, linkIndex) => {
    if (!ensureEditable(personId)) {
      return;
    }
    const current = wishlists[personId] || { ideas: [], links: [] };
    if (!current.links[linkIndex]) {
      return;
    }
    const nextWishlists = {
      ...wishlists,
      [personId]: {
        ideas: [...current.ideas],
        links: current.links.filter((_, index) => index !== linkIndex)
      }
    };
    await persistWishlistChanges(nextWishlists, 'Link removed.');
  };

  const refreshWishlists = async () => {
    setLoading(true);
    try {
      const payload = await fetchSharedState();
      setWishlists(mergeWishlists(payload.wishlists));
      setError('');
    } catch (err) {
      setError('Unable to load the shared wish lists right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const payload = await fetchSharedState();
        if (!cancelled) {
          setWishlists(mergeWishlists(payload.wishlists));
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError('Unable to load the shared wish lists right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main style={styles.container}>
      <section style={styles.header}>
        <h1 style={{ margin: 0 }}>Family Wish Lists</h1>
        <p style={{ marginTop: '0.75rem', maxWidth: '640px' }}>
          Browse every participant's shared ideas and links. Use the filter to focus on one person or show everyone at once to plan gifts faster.
        </p>
        <div style={styles.filters}>
          <select
            aria-label="Filter by family member"
            style={styles.select}
            value={selectedPersonId}
            onChange={(event) => setSelectedPersonId(event.target.value)}
          >
            <option value="">Show everyone</option>
            {participants.map((person) => (
              <option value={person.id} key={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          {selectedPersonId && (
            <button type="button" style={styles.secondaryButton} onClick={() => setSelectedPersonId('')}>
              Clear filter
            </button>
          )}
          {selectedUserId && (
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => setSelectedPersonId(selectedUserId)}
            >
              Jump to my list
            </button>
          )}
          <button
            type="button"
            style={{ ...styles.button, background: '#38bdf8', color: '#0f172a' }}
            onClick={refreshWishlists}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh lists'}
          </button>
        </div>
      </section>

      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      {loading ? (
        <p>Loading wish lists...</p>
      ) : (
        <div style={styles.grid}>
          {visibleParticipants.map((person) => {
            const wishlist = wishlists[person.id] || { ideas: [], links: [] };
            const canEdit = selectedUserId && person.id === selectedUserId;
            return (
              <article style={styles.card} key={person.id}>
                <h2 style={{ marginTop: 0 }}>{person.name}</h2>
                <div>
                  <strong>Ideas</strong>
                  <ul style={styles.list}>
                    {wishlist.ideas.length ? (
                      wishlist.ideas.map((idea, index) => (
                        <li key={`${person.id}-idea-${index}`}>
                          {idea}
                          {canEdit && (
                            <button
                              type="button"
                              style={styles.deleteButton}
                              onClick={() => handleDeleteIdea(person.id, index)}
                              disabled={saving}
                            >
                              Remove
                            </button>
                          )}
                        </li>
                      ))
                    ) : (
                      <li>No ideas yet.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <strong>Links</strong>
                  <ul style={styles.list}>
                    {wishlist.links.length ? (
                      wishlist.links.map((link, index) => (
                        <li key={`${person.id}-link-${index}`}>
                          <a href={link} target="_blank" rel="noreferrer">
                            <span style={styles.link}>{link}</span>
                          </a>
                          {canEdit && (
                            <button
                              type="button"
                              style={styles.deleteButton}
                              onClick={() => handleDeleteLink(person.id, index)}
                              disabled={saving}
                            >
                              Remove
                            </button>
                          )}
                        </li>
                      ))
                    ) : (
                      <li>No links yet.</li>
                    )}
                  </ul>
                </div>
                {canEdit && (
                  <div style={styles.editor}>
                    <p style={styles.helper}>Only you can edit your list. Everyone else sees it read-only.</p>
                    <div>
                      <label style={styles.label} htmlFor="my-idea-input">
                        Add a new idea
                      </label>
                      <input
                        id="my-idea-input"
                        style={styles.input}
                        value={ideaDraft}
                        onChange={(event) => setIdeaDraft(event.target.value)}
                        placeholder="e.g. Cozy throw blanket"
                        disabled={saving}
                      />
                      <button
                        type="button"
                        style={{ ...styles.button, marginTop: '0.5rem', background: '#2563eb', color: '#fff' }}
                        onClick={() => handleAddIdea(person.id)}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Add Idea'}
                      </button>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                      <label style={styles.label} htmlFor="my-link-input">
                        Add a new link
                      </label>
                      <input
                        id="my-link-input"
                        style={styles.input}
                        value={linkDraft}
                        onChange={(event) => setLinkDraft(event.target.value)}
                        placeholder="https://example.com/gift"
                        disabled={saving}
                      />
                      <button
                        type="button"
                        style={{ ...styles.button, marginTop: '0.5rem', background: '#0ea5e9', color: '#0f172a' }}
                        onClick={() => handleAddLink(person.id)}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Add Link'}
                      </button>
                    </div>
                    {editorStatus && (
                      <p
                        style={{
                          ...styles.status,
                          color: editorStatus.type === 'error' ? '#b91c1c' : '#047857'
                        }}
                      >
                        {editorStatus.text}
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
};

Family.defaultProps = {
  selectedUserId: ''
};

export default Family;