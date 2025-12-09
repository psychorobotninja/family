import React, { useMemo, useState } from 'react';
import { familyEvents } from '../data/events';

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
  }
};

const Calendar = () => {
  const [filterType, setFilterType] = useState('all');
  const [includePast, setIncludePast] = useState(false);
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const sortedEvents = useMemo(
    () =>
      [...familyEvents].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    []
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
          Keep birthdays, parties, and hosted events in one shared view so everyone can RSVP and plan ahead.
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
        </select>
        <label style={styles.toggle}>
          <input
            type="checkbox"
            checked={includePast}
            onChange={(event) => setIncludePast(event.target.checked)}
          />
          Show past events
        </label>
      </div>

      <section style={styles.timeline}>
        {visibleEvents.length === 0 && <p>No events match this view.</p>}
        {visibleEvents.map((event) => (
          <article key={event.id} style={styles.eventCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{ margin: 0 }}>{event.title}</h2>
              <span style={badgeStyles(event.type)}>
                {event.type === 'birthday' ? 'Birthday' : 'Party'}
              </span>
            </div>
            <p style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>{formatDate(event.date)}</p>
            <p style={{ margin: '0.25rem 0', color: '#475569' }}>{event.location}</p>
            <p style={{ marginBottom: 0 }}>{event.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
};

export default Calendar;
