import { defaultWishlists, participants } from '../data/participants';

export const STATE_API_ENDPOINT = process.env.REACT_APP_STATE_ENDPOINT || '/api/state';
export const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

const clone = (value) => JSON.parse(JSON.stringify(value));

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
