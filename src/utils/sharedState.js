import { defaultWishlists, participants } from '../data/participants';
import { familyEvents } from '../data/events';

export const STATE_API_ENDPOINT = process.env.REACT_APP_STATE_ENDPOINT || '/api/state';
export const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

const clone = (value) => JSON.parse(JSON.stringify(value));
const EVENT_TYPES = new Set(['birthday', 'party', 'other']);

const toIsoDateOnly = (value) => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return '';
  }
  return new Date(parsed).toISOString().slice(0, 10);
};

const toIsoTimestamp = (value) => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return new Date().toISOString();
  }
  return new Date(parsed).toISOString();
};

export const mergeWishlists = (remoteWishlists = {}) => {
  const merged = clone(defaultWishlists);
  Object.entries(remoteWishlists || {}).forEach(([personId, entry]) => {
    merged[personId] = {
      ideas: Array.isArray(entry?.ideas) ? entry.ideas : [],
      links: Array.isArray(entry?.links) ? entry.links : []
    };
  });
  participants.forEach(({ id }) => {
    if (!merged[id]) {
      merged[id] = { ideas: [], links: [] };
    }
  });
  return merged;
};

const sanitizeEventsList = (list = []) =>
  list
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const title = typeof entry.title === 'string' ? entry.title.trim() : '';
      const date = toIsoDateOnly(entry.date);
      if (!title || !date) {
        return null;
      }
      const id = typeof entry.id === 'string' && entry.id.trim() ? entry.id.trim() : `event-${date}-${Math.random().toString(36).slice(2, 8)}`;
      const location = typeof entry.location === 'string' ? entry.location.trim() : '';
      const note = typeof entry.note === 'string' ? entry.note.trim() : '';
      const createdBy = typeof entry.createdBy === 'string' ? entry.createdBy.trim() : '';
      const createdByName = typeof entry.createdByName === 'string' ? entry.createdByName.trim() : '';
      const updatedBy = typeof entry.updatedBy === 'string' && entry.updatedBy.trim() ? entry.updatedBy.trim() : createdBy;
      const updatedByName = typeof entry.updatedByName === 'string' && entry.updatedByName.trim() ? entry.updatedByName.trim() : createdByName;
      const updatedAt = toIsoTimestamp(entry.updatedAt || entry.createdAt);
      return {
        id,
        title,
        date,
        type: EVENT_TYPES.has(entry.type) ? entry.type : 'other',
        location,
        note,
        createdBy,
        createdByName,
        updatedBy,
        updatedByName,
        updatedAt
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

export const mergeEvents = (remoteEvents) => {
  if (Array.isArray(remoteEvents)) {
    return sanitizeEventsList(remoteEvents);
  }
  return sanitizeEventsList(familyEvents);
};

export const pruneMessages = (messages = []) => {
  if (!Array.isArray(messages)) {
    return [];
  }
  const now = Date.now();
  return messages
    .filter((entry) => {
      if (!entry || !entry.createdAt) {
        return false;
      }
      const created = new Date(entry.createdAt).getTime();
      return Number.isFinite(created) && now - created <= THIRTY_DAYS_MS;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const resolveEndpoint = () => {
  if (STATE_API_ENDPOINT && STATE_API_ENDPOINT !== '/api/state') {
    return STATE_API_ENDPOINT;
  }
  if (typeof window !== 'undefined' && window.__STATE_API_OVERRIDE__) {
    return window.__STATE_API_OVERRIDE__;
  }
  const env = process.env.REACT_APP_STATE_ENDPOINT || process.env.REACT_APP_API_BASE;
  return env || '/api/state';
};

export const fetchSharedState = async () => {
  const response = await fetch(resolveEndpoint(), {
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) {
    throw new Error('Failed to load shared state.');
  }
  return response.json();
};

export const saveSharedState = async (partialState) => {
  const response = await fetch(resolveEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partialState)
  });
  if (!response.ok) {
    throw new Error('Failed to save shared state.');
  }
  return response.json();
};
