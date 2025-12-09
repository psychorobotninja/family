import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { participants } from '../data/participants';
import { fetchSharedState, mergeEvents, saveSharedState } from '../utils/sharedState';

const styles = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '2rem 1rem',
    color: '#0f172a'
  },
  hero: {
    background: '#0f172a',
    color: '#fff',
    padding: '2rem',
    borderRadius: '20px',
    marginBottom: '1.75rem'
  },
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  select: {
    padding: '0.55rem 0.85rem',
    borderRadius: '10px',
    border: '1px solid #cbd5f5',
    minWidth: '200px'
  },
  toggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontWeight: 600
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  eventCard: {
    borderRadius: '16px',
    padding: '1.25rem',
    border: '1px solid #e2e8f0',
    background: '#fff',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)'
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.2rem 0.55rem',
    borderRadius: '999px',
    fontSize: '0.85rem',
    fontWeight: 600
  },
  formCard: {
    borderRadius: '18px',
    padding: '1.5rem',
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    marginBottom: '1.5rem'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    flex: '1'
  },
  fieldRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  input: {
    padding: '0.55rem 0.85rem',
    borderRadius: '10px',
    border: '1px solid #cbd5f5',
    width: '100%'
  },
  textarea: {
    minHeight: '80px',
    resize: 'vertical'
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    marginTop: '1rem'
  },
  primaryButton: {
    background: '#0ea5e9',
    color: '#0f172a',
    border: 'none',
    borderRadius: '999px',
    padding: '0.55rem 1.25rem',
    fontWeight: 600,
    cursor: 'pointer'
  },
  secondaryButton: {
    background: 'transparent',
    color: '#0f172a',
    border: '1px solid #94a3b8',
    borderRadius: '999px',
    padding: '0.55rem 1.25rem',
    fontWeight: 600,
    cursor: 'pointer'
  },
  status: {
    marginTop: '1rem',
    fontWeight: 600
  },
  meta: {
    marginTop: '0.35rem',
    fontSize: '0.85rem',
    color: '#475569'
  }
};

const initialFormState = { title: '', date: '', type: 'birthday', location: '', note: '' };

const Calendar = ({ selectedUserId }) => {
  const [events, setEvents] = useState(() => mergeEvents());
  const [filterType, setFilterType] = useState('all');
  const [includePast, setIncludePast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(null);
  const [formValues, setFormValues] = useState(initialFormState);
  const [editingEventId, setEditingEventId] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const isMountedRef = useRef(true);
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const participantLookup = useMemo(() => {
    const lookup = {};
    participants.forEach((person) => {
      lookup[person.id] = person.name;
    });
    return lookup;
  }, []);

  const currentUserName = selectedUserId ? participantLookup[selectedUserId] || 'Family member' : '';

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await fetchSharedState();
      if (!isMountedRef.current) {
        return;
      }
      setEvents(mergeEvents(payload.events));
      setError('');
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }
      setError('Unable to load the shared calendar right now.');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchEvents]);

  const ensureEditable = () => {
    if (!selectedUserId) {
      setStatus({ type: 'error', text: 'Select your name in the header before editing the calendar.' });
      return false;
    }
    return true;
  };

  const persistEvents = async (nextEvents, successText) => {
    setSaving(true);
    try {
      const payload = await saveSharedState({ events: nextEvents });
      setEvents(mergeEvents(payload.events || nextEvents));
      setStatus({ type: 'success', text: successText });
    } catch (err) {
      setStatus({ type: 'error', text: 'Unable to sync the shared calendar. Try again soon.' });
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setStatus(null);
  };

  const resetForm = () => {
    setFormValues(initialFormState);
  };

  const handleAddEvent = async (event) => {
    event.preventDefault();
    if (!ensureEditable()) {
      return;
    }
    if (!formValues.title.trim()) {
      setStatus({ type: 'error', text: 'Give the event a title before saving.' });
      return;
    }
    if (!formValues.date) {
      setStatus({ type: 'error', text: 'Pick a date for the event.' });
      return;
    }
    const newEvent = {
      id: `event-${Date.now()}`,
      title: formValues.title.trim(),
      date: formValues.date,
      type: ['birthday', 'party', 'other'].includes(formValues.type) ? formValues.type : 'other',
      location: formValues.location.trim(),
      note: formValues.note.trim(),
      createdBy: selectedUserId,
      createdByName: currentUserName,
      updatedBy: selectedUserId,
      updatedByName: currentUserName,
      updatedAt: new Date().toISOString()
    };
    const nextEvents = [...events, newEvent];
    await persistEvents(nextEvents, 'Event added to the shared calendar.');
    resetForm();
  };

  const beginEditNote = (entry) => {
    if (!ensureEditable()) {
      return;
    }
    setEditingEventId(entry.id);
    setNoteDraft(entry.note || '');
    setStatus(null);
  };

  const cancelEditNote = () => {
    setEditingEventId('');
    setNoteDraft('');
  };

  const handleSaveNote = async () => {
    if (!ensureEditable() || !editingEventId) {
      return;
    }
    const nextEvents = events.map((entry) => {
      if (entry.id !== editingEventId) {
        return entry;
      }
      return {
        ...entry,
        note: noteDraft.trim(),
        updatedBy: selectedUserId,
        updatedByName: currentUserName,
        updatedAt: new Date().toISOString()
      };
    });
    await persistEvents(nextEvents, 'Note updated.');
    cancelEditNote();
  };

  const handleRefresh = () => {
    fetchEvents();
    setStatus(null);
  };

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [events]
  );

  const visibleEvents = useMemo(
    () =>
      sortedEvents.filter((event) => {
        const matchesType = filterType === 'all' || event.type === filterType;
        const occursLater = includePast || new Date(event.date) >= today;
        return matchesType && occursLater;
      }),
    [sortedEvents, filterType, includePast, today]
  );

  const nextBirthdays = useMemo(
    () =>
      sortedEvents
        .filter((event) => event.type === 'birthday' && new Date(event.date) >= today)
        .slice(0, 3),
    [sortedEvents, today]
  );

  const formatDate = (value) =>
    new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(new Date(value));

  const badgeStyles = (type) => {
    if (type === 'birthday') {
      return { ...styles.badge, background: '#fee2e2', color: '#b91c1c' };
    }
    return { ...styles.badge, background: '#cffafe', color: '#0f172a' };
  };

  return (
    <main style={styles.container}>
      <section style={styles.hero}>
        <h1 style={{ marginTop: 0 }}>Family Calendar</h1>
        <p style={{ maxWidth: '640px' }}>
          Keep birthdays, parties, and hosted events in one shared view so everyone can RSVP, add notes, and plan ahead.
        </p>
        {nextBirthdays.length > 0 && (
          <div style={{ marginTop: '1.25rem' }}>
            <strong>Upcoming birthdays</strong>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
              {nextBirthdays.map((event) => (
                <li key={event.id}>
                  {event.title} • {formatDate(event.date)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div style={styles.controls}>
        <select
          value={filterType}
          style={styles.select}
          onChange={(event) => setFilterType(event.target.value)}
        >
          <option value="all">All events</option>
          <option value="birthday">Birthdays</option>
          <option value="party">Parties</option>
          <option value="other">Other plans</option>
        </select>
        <label style={styles.toggle}>
          <input
            type="checkbox"
            checked={includePast}
            onChange={(event) => setIncludePast(event.target.checked)}
          />
          Show past events
        </label>
        <button type="button" style={styles.secondaryButton} onClick={handleRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh calendar'}
        </button>
      </div>

      <section style={styles.formCard}>
        <h2 style={{ marginTop: 0 }}>Add an event</h2>
        <p style={{ marginTop: '0.35rem', color: '#475569' }}>
          Everyone with a selected name can post updates. Notes can be edited later if plans change.
        </p>
        <form onSubmit={handleAddEvent}>
          <div style={styles.fieldRow}>
            <div style={styles.fieldGroup}>
              <label htmlFor="event-title">Title</label>
              <input
                id="event-title"
                name="title"
                style={styles.input}
                value={formValues.title}
                onChange={handleFieldChange}
                placeholder="e.g. Backyard potluck"
                disabled={saving}
              />
            </div>
            <div style={{ ...styles.fieldGroup, maxWidth: '220px' }}>
              <label htmlFor="event-date">Date</label>
              <input
                type="date"
                id="event-date"
                name="date"
                style={styles.input}
                value={formValues.date}
                onChange={handleFieldChange}
                disabled={saving}
              />
            </div>
            <div style={{ ...styles.fieldGroup, maxWidth: '180px' }}>
              <label htmlFor="event-type">Type</label>
              <select
                id="event-type"
                name="type"
                style={styles.input}
                value={formValues.type}
                onChange={handleFieldChange}
                disabled={saving}
              >
                <option value="birthday">Birthday</option>
                <option value="party">Party</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div style={{ ...styles.fieldGroup, marginTop: '1rem' }}>
            <label htmlFor="event-location">Location (optional)</label>
            <input
              id="event-location"
              name="location"
              style={styles.input}
              value={formValues.location}
              onChange={handleFieldChange}
              placeholder="City or host home"
              disabled={saving}
            />
          </div>
          <div style={{ ...styles.fieldGroup, marginTop: '1rem' }}>
            <label htmlFor="event-note">Planning notes</label>
            <textarea
              id="event-note"
              name="note"
              style={{ ...styles.input, ...styles.textarea }}
              value={formValues.note}
              onChange={handleFieldChange}
              placeholder="Menu ideas, gift themes, childcare reminders..."
              disabled={saving}
            />
          </div>
          <div style={styles.actions}>
            <button type="submit" style={styles.primaryButton} disabled={saving}>
              {saving ? 'Saving...' : 'Post event'}
            </button>
            <button type="button" style={styles.secondaryButton} onClick={resetForm} disabled={saving}>
              Clear form
            </button>
          </div>
        </form>
        {status && (
          <p
            style={{
              ...styles.status,
              color: status.type === 'error' ? '#b91c1c' : '#047857'
            }}
          >
            {status.text}
          </p>
        )}
        {error && <p style={{ ...styles.status, color: '#b91c1c' }}>{error}</p>}
      </section>

      {loading ? (
        <p>Loading shared events...</p>
      ) : (
        <section style={styles.timeline}>
          {visibleEvents.length === 0 && <p>No events match this view.</p>}
          {visibleEvents.map((event) => {
            const isEditing = editingEventId === event.id;
            return (
              <article key={event.id} style={styles.eventCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <h2 style={{ margin: 0 }}>{event.title}</h2>
                  <span style={badgeStyles(event.type)}>
                    {event.type === 'birthday'
                      ? 'Birthday'
                      : event.type === 'party'
                      ? 'Party'
                      : 'Plan'}
                  </span>
                </div>
                <p style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>{formatDate(event.date)}</p>
                <p style={{ margin: '0.25rem 0', color: '#475569' }}>
                  {event.location || 'Location TBA'}
                </p>
                {isEditing ? (
                  <div>
                    <textarea
                      style={{ ...styles.input, ...styles.textarea }}
                      value={noteDraft}
                      onChange={(evt) => setNoteDraft(evt.target.value)}
                      disabled={saving}
                    />
                    <div style={styles.actions}>
                      <button
                        type="button"
                        style={styles.primaryButton}
                        onClick={handleSaveNote}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save note'}
                      </button>
                      <button type="button" style={styles.secondaryButton} onClick={cancelEditNote} disabled={saving}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ marginBottom: 0 }}>{event.note || 'Add a note so everyone stays in sync.'}</p>
                )}
                <div style={styles.meta}>
                  <span>
                    Last updated {formatDate(event.updatedAt || event.date)}
                    {event.updatedByName ? ` by ${event.updatedByName}` : ''}
                  </span>
                  {!isEditing && selectedUserId && (
                    <button
                      type="button"
                      style={{ ...styles.secondaryButton, marginLeft: '0.75rem', padding: '0.35rem 0.85rem' }}
                      onClick={() => beginEditNote(event)}
                    >
                      Edit note
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
};

Calendar.defaultProps = {
  selectedUserId: ''
};

export default Calendar;
