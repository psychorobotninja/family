import React, { useEffect, useMemo, useRef, useState } from 'react';
import { participants } from '../data/participants';
import { fetchSharedState, mergeWishlists, saveSharedState } from '../utils/sharedState';

const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const styles = {
  container: {
    padding: '2rem 1rem',
    maxWidth: '1200px',
    margin: '0 auto',
    color: '#0d1b2a'
  },
  section: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)'
  },
  heading: {
    marginTop: 0,
    fontSize: '1.35rem'
  },
  label: {
    fontWeight: 600,
    display: 'block',
    marginBottom: '0.35rem'
  },
  select: {
    width: '100%',
    padding: '0.6rem',
    borderRadius: '6px',
    border: '1px solid #d0d7de',
    marginBottom: '0.75rem'
  },
  buttonRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem'
  },
  button: {
    padding: '0.55rem 1.2rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 600
  },
  secondaryButton: {
    padding: '0.55rem 1.2rem',
    borderRadius: '6px',
    border: '1px solid #2563eb',
    cursor: 'pointer',
    background: '#fff',
    color: '#2563eb',
    fontWeight: 600
  },
  message: {
    marginTop: '0.5rem'
  },
  error: {
    color: '#b91c1c'
  },
  success: {
    color: '#047857'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '1rem'
  },
  th: {
    textAlign: 'left',
    borderBottom: '1px solid #e5e7eb',
    padding: '0.5rem 0'
  },
  td: {
    padding: '0.45rem 0',
    borderBottom: '1px solid #f1f5f9'
  },
  list: {
    paddingLeft: '1.25rem'
  },
  statusBar: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.25rem'
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.25rem 0.65rem',
    borderRadius: '999px',
    fontSize: '0.85rem',
    background: '#e0f2fe',
    color: '#0369a1'
  }
};

const NameDraw = ({ selectedUserId }) => {
  const [assignments, setAssignments] = useState({});
  const [wishlistStore, setWishlistStore] = useState(() => mergeWishlists());
  const [manualMode, setManualMode] = useState(false);
  const [manualRecipientId, setManualRecipientId] = useState('');
  const [manualFeedback, setManualFeedback] = useState(null);
  const [drawFeedback, setDrawFeedback] = useState(null);
  const [revealMessage, setRevealMessage] = useState('');
  const [revealVerified, setRevealVerified] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [apiOffline, setApiOffline] = useState(false);
  const hydratedRef = useRef(false);

  const selectedParticipantId = selectedUserId || '';

  useEffect(() => {
    let cancelled = false;
    const fetchState = async () => {
      setIsLoading(true);
      try {
        const payload = await fetchSharedState();
        if (cancelled) {
          return;
        }
        setAssignments(payload.assignments || {});
        setWishlistStore(mergeWishlists(payload.wishlists));
        setApiError('');
        setApiOffline(false);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setAssignments({});
        setWishlistStore(mergeWishlists());
        setApiError('Sync service is offline. Start the Azure Functions API or set REACT_APP_STATE_ENDPOINT for local testing.');
        setApiOffline(true);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          hydratedRef.current = true;
        }
      }
    };

    fetchState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }
    let cancelled = false;

    const persist = async () => {
      setIsSaving(true);
      try {
        await saveSharedState({ assignments });
        if (!cancelled) {
          setApiError('');
          setApiOffline(false);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        setApiError('Saving changes failed. We will retry once the Azure Functions API is reachable.');
        setApiOffline(true);
      } finally {
        if (!cancelled) {
          setIsSaving(false);
        }
      }
    };

    persist();

    return () => {
      cancelled = true;
    };
  }, [assignments]);

  useEffect(() => {
    setManualMode(false);
    setManualRecipientId('');
    setManualFeedback(null);
    setRevealVerified(false);
    setRevealMessage('');
  }, [selectedParticipantId]);

  const participantMap = useMemo(() => {
    const map = new Map();
    participants.forEach((person) => {
      map.set(person.id, person);
    });
    return map;
  }, []);

  const usedRecipients = useMemo(() => new Set(Object.values(assignments)), [assignments]);
  const getDisplayName = (id) => participantMap.get(id)?.name || '--';
  const selectedParticipant = participantMap.get(selectedParticipantId);

  const handleManualSubmit = () => {
    if (!selectedParticipantId) {
      setManualFeedback({ type: 'error', text: 'Pick your name from the header before recording an entry.' });
      return;
    }
    if (!manualRecipientId) {
      setManualFeedback({ type: 'error', text: 'Select the person you drew.' });
      return;
    }

    const giver = participantMap.get(selectedParticipantId);
    const blocked = new Set([selectedParticipantId, ...(giver?.exclusions || [])]);
    if (blocked.has(manualRecipientId)) {
      setManualFeedback({ type: 'error', text: 'That assignment breaks the drawing rules. Pick someone else.' });
      return;
    }

    const recipientAlreadyTaken = Object.entries(assignments).some(
      ([giverId, recipientId]) => giverId !== selectedParticipantId && recipientId === manualRecipientId
    );
    if (recipientAlreadyTaken) {
      setManualFeedback({ type: 'error', text: 'That person is already assigned to someone else.' });
      return;
    }

    setAssignments((prev) => ({
      ...prev,
      [selectedParticipantId]: manualRecipientId
    }));
    setManualFeedback({ type: 'success', text: 'Assignment recorded for everyone.' });
    setManualMode(false);
    setManualRecipientId('');
  };

  const drawRemaining = () => {
    const unassigned = participants.filter((person) => !assignments[person.id]);

    if (!unassigned.length) {
      setDrawFeedback({ type: 'success', text: 'Everyone already has an assignment.' });
      return;
    }

    const shuffledGivers = shuffle(unassigned);
    const used = new Set(Object.values(assignments));

    const backtrack = (index, currentAssignments) => {
      if (index === shuffledGivers.length) {
        return currentAssignments;
      }

      const giver = shuffledGivers[index];
      const blocked = new Set([giver.id, ...(giver.exclusions || [])]);
      const candidates = shuffle(participants);

      for (const candidate of candidates) {
        if (blocked.has(candidate.id)) {
          continue;
        }
        if (used.has(candidate.id)) {
          continue;
        }

        currentAssignments[giver.id] = candidate.id;
        used.add(candidate.id);

        const solved = backtrack(index + 1, currentAssignments);
        if (solved) {
          return solved;
        }

        used.delete(candidate.id);
        delete currentAssignments[giver.id];
      }

      return null;
    };

    const result = backtrack(0, { ...assignments });

    if (result) {
      setAssignments(result);
      setDrawFeedback({ type: 'success', text: 'Remaining names assigned successfully!' });
    } else {
      setDrawFeedback({ type: 'error', text: 'Unable to find a valid combination. Adjust the manual entries and try again.' });
    }
  };

  const handleReveal = () => {
    if (!selectedParticipantId) {
      setRevealMessage('Select your name from the header first.');
      setRevealVerified(false);
      return;
    }
    const assignedId = assignments[selectedParticipantId];
    if (!assignedId) {
      setRevealMessage('No assignment found yet. Try again after the draw is complete.');
      setRevealVerified(false);
      return;
    }
    setRevealVerified(true);
    setRevealMessage(`You are shopping for ${getDisplayName(assignedId)}.`);
  };

  const manualRecipientOptions = selectedParticipantId
    ? participants.filter((person) => {
        const giverAssignment = assignments[selectedParticipantId];
        const giver = participantMap.get(selectedParticipantId);
        const blocked = new Set([selectedParticipantId, ...(giver?.exclusions || [])]);
        if (blocked.has(person.id)) {
          return false;
        }
        if (usedRecipients.has(person.id) && giverAssignment !== person.id) {
          return false;
        }
        return true;
      })
    : [];

  return (
    <main style={styles.container}>
      <div style={styles.statusBar}>
        <div>
          <h2 style={{ margin: 0 }}>Draw Names</h2>
          <p style={{ margin: '0.25rem 0 0' }}>
            {selectedParticipant ? `You are logged in as ${selectedParticipant.name}.` : 'Pick your name from the header to get started.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {isLoading && <span style={styles.statusPill}>Loading shared data...</span>}
          {isSaving && !isLoading && <span style={styles.statusPill}>Saving changes...</span>}
          {apiError && !isLoading && (
            <span style={{ ...styles.statusPill, background: '#fee2e2', color: '#b91c1c' }}>{apiOffline ? 'Sync offline' : 'Sync issue'}</span>
          )}
        </div>
      </div>

      <section style={styles.section}>
        <h2 style={styles.heading}>Choose Your Action</h2>
        <p>Reveal who you picked or record the person you already know. Both options update the shared gift list.</p>
        <div style={styles.buttonRow}>
          <button style={styles.button} type="button" disabled={!selectedParticipantId} onClick={handleReveal}>
            Reveal Who I Picked
          </button>
          <button
            style={styles.secondaryButton}
            type="button"
            disabled={!selectedParticipantId}
            onClick={() => {
              setManualMode(true);
              setManualFeedback(null);
            }}
          >
            Enter Manually
          </button>
        </div>
        {!selectedParticipantId && <p style={{ ...styles.message, ...styles.error }}>Select your name in the header first.</p>}
        {revealMessage && <p style={{ ...styles.message, ...(revealVerified ? styles.success : styles.error) }}>{revealMessage}</p>}
      </section>

      {manualMode && (
        <section style={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={styles.heading}>Manual Entry</h2>
            <button
              style={{ ...styles.secondaryButton, borderColor: '#d1d5db', color: '#475569' }}
              type="button"
              onClick={() => {
                setManualMode(false);
                setManualRecipientId('');
              }}
            >
              Cancel
            </button>
          </div>
          <p>{selectedParticipant ? `Recording an entry for ${selectedParticipant.name}.` : 'Pick yourself in the header to continue.'}</p>
          <label style={styles.label} htmlFor="manual-recipient">
            Who did you draw?
          </label>
          <select
            id="manual-recipient"
            style={styles.select}
            value={manualRecipientId}
            onChange={(event) => setManualRecipientId(event.target.value)}
          >
            <option value="">Select a person</option>
            {manualRecipientOptions.map((person) => (
              <option value={person.id} key={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          <button style={styles.button} type="button" onClick={handleManualSubmit}>
            Save Manual Assignment
          </button>
          {manualFeedback && (
            <p
              style={{
                ...styles.message,
                ...(manualFeedback.type === 'error' ? styles.error : styles.success)
              }}
            >
              {manualFeedback.text}
            </p>
          )}
        </section>
      )}

      <section style={styles.section}>
        <h2 style={styles.heading}>Draw Remaining Names</h2>
        <p>The draw respects every exclusion (spouses, yourself, etc.). Manual assignments stay in place.</p>
        <div style={styles.buttonRow}>
          <button style={styles.button} type="button" onClick={drawRemaining}>
            Assign Everyone Else
          </button>
          <button
            style={styles.secondaryButton}
            type="button"
            onClick={() => {
              setAssignments({});
              setManualFeedback(null);
              setDrawFeedback({ type: 'success', text: 'All assignments cleared.' });
            }}
          >
            Clear All Assignments
          </button>
        </div>
        {drawFeedback && (
          <p
            style={{
              ...styles.message,
              ...(drawFeedback.type === 'error' ? styles.error : styles.success)
            }}
          >
            {drawFeedback.text}
          </p>
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.heading}>Reveal Your Assignment</h2>
        <p>Your result stays hidden until you confirm who you are using the selector in the header.</p>
        <button style={styles.button} type="button" onClick={handleReveal}>
          Reveal Assignment
        </button>
        {revealMessage && <p style={{ ...styles.message, ...(revealVerified ? styles.success : styles.error) }}>{revealMessage}</p>}
        {revealVerified && assignments[selectedParticipantId] && (
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Wish List Preview</h3>
            <p>Share these ideas with whoever drew {getDisplayName(assignments[selectedParticipantId])}.</p>
            <strong>Ideas</strong>
            <ul style={styles.list}>
              {(wishlistStore[assignments[selectedParticipantId]]?.ideas || ['No ideas yet.']).map((idea, index) => (
                <li key={`${idea}-${index}`}>{idea}</li>
              ))}
            </ul>
            <strong>Links</strong>
            <ul style={styles.list}>
              {(wishlistStore[assignments[selectedParticipantId]]?.links || []).length ? (
                wishlistStore[assignments[selectedParticipantId]].links.map((link, index) => (
                  <li key={`${link}-${index}`}>
                    <a href={link} target="_blank" rel="noreferrer">
                      {link}
                    </a>
                  </li>
                ))
              ) : (
                <li>No links yet.</li>
              )}
            </ul>
          </div>
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.heading}>Current Pairings</h2>
        <p>Use this table to verify that every recipient is unique.</p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Giver</th>
              <th style={styles.th}>Recipient</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((person) => (
              <tr key={person.id}>
                <td style={styles.td}>{person.name}</td>
                <td style={styles.td}>{assignments[person.id] ? getDisplayName(assignments[person.id]) : '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

    </main>
  );
};

NameDraw.defaultProps = {
  selectedUserId: ''
};

export default NameDraw;
