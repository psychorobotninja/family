const { TableClient } = require('@azure/data-tables');

const TABLE_NAME = process.env.FAMILY_TABLE_NAME || 'FamilyState';
const PARTITION_KEY = 'state';
const ROW_KEY = 'current';
const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;
const DEFAULT_EVENTS = [
  {
    id: 'erin-birthday',
    title: "Erin's Birthday",
    date: '2025-02-18',
    type: 'birthday',
    location: 'Denver, CO',
    note: "Surprise brunch at Erin and Thomas' place."
  },
  {
    id: 'thomas-birthday',
    title: "Thomas's Birthday",
    date: '2025-03-29',
    type: 'birthday',
    location: 'Austin, TX',
    note: 'Dinner reservations downtown plus dessert back home.'
  },
  {
    id: 'family-reunion',
    title: 'Spring Family Party',
    date: '2025-04-20',
    type: 'party',
    location: "Ana's backyard",
    note: 'Potluck games, egg hunt for the kids, and name draw status check.'
  },
  {
    id: 'michele-birthday',
    title: "Michele's Birthday",
    date: '2025-07-08',
    type: 'birthday',
    location: 'Boulder, CO',
    note: 'Morning hike followed by lunch downtown.'
  },
  {
    id: 'holiday-party',
    title: 'Holiday Kickoff Party',
    date: '2025-11-29',
    type: 'party',
    location: "Wes & Michele's home",
    note: 'Decorate the tree, exchange early gifts, and finalize wish lists.'
  }
];
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

const sanitizeEvent = (event) => {
  if (!event || typeof event !== 'object') {
    return null;
  }
  const title = typeof event.title === 'string' ? event.title.trim() : '';
  const date = toIsoDateOnly(event.date);
  if (!title || !date) {
    return null;
  }
  const id = typeof event.id === 'string' && event.id.trim() ? event.id.trim() : `event-${date}-${Math.random().toString(36).slice(2, 8)}`;
  const note = typeof event.note === 'string' ? event.note.trim() : '';
  const location = typeof event.location === 'string' ? event.location.trim() : '';
  const createdBy = typeof event.createdBy === 'string' ? event.createdBy.trim() : '';
  const createdByName = typeof event.createdByName === 'string' ? event.createdByName.trim() : '';
  const updatedBy = typeof event.updatedBy === 'string' && event.updatedBy.trim() ? event.updatedBy.trim() : createdBy;
  const updatedByName = typeof event.updatedByName === 'string' && event.updatedByName.trim() ? event.updatedByName.trim() : createdByName;
  const updatedAt = toIsoTimestamp(event.updatedAt);
  return {
    id,
    title,
    date,
    type: EVENT_TYPES.has(event.type) ? event.type : 'other',
    location,
    note,
    createdBy,
    createdByName,
    updatedBy,
    updatedByName,
    updatedAt
  };
};

const sanitizeEvents = (events) => {
  const source = Array.isArray(events) ? events : DEFAULT_EVENTS;
  return source
    .map(sanitizeEvent)
    .filter(Boolean)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const DEFAULT_STATE = {
  assignments: {},
  wishlists: {},
  messages: [],
  events: sanitizeEvents(DEFAULT_EVENTS)
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const getTableClient = () => {
  const connectionString = process.env.STATE_STORAGE_CONNECTION || process.env.AzureWebJobsStorage;
  if (!connectionString) {
    throw new Error('Missing STATE_STORAGE_CONNECTION or AzureWebJobsStorage connection string.');
  }
  return TableClient.fromConnectionString(connectionString, TABLE_NAME);
};

const ensureTable = async (client) => {
  try {
    await client.createTable();
  } catch (error) {
    if (!error || error.statusCode !== 409) {
      throw error;
    }
  }
};

const pruneMessages = (messages = []) => {
  const now = Date.now();
  return (Array.isArray(messages) ? messages : [])
    .filter((entry) => {
      if (!entry || !entry.createdAt) {
        return false;
      }
      const created = new Date(entry.createdAt).getTime();
      return Number.isFinite(created) && now - created <= THIRTY_DAYS_MS;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const sanitizeMessage = (message) => {
  if (!message || typeof message !== 'object') {
    return null;
  }
  const text = typeof message.text === 'string' ? message.text.trim() : '';
  if (!text) {
    return null;
  }
  const authorName = typeof message.authorName === 'string' ? message.authorName.trim() : '';
  const authorId = typeof message.authorId === 'string' ? message.authorId.trim() : '';
  const createdTime = Date.parse(message.createdAt || '');
  const createdAt = Number.isFinite(createdTime) ? new Date(createdTime).toISOString() : new Date().toISOString();
  const id = typeof message.id === 'string' && message.id.trim() ? message.id.trim() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return { id, authorName, authorId, text, createdAt };
};

const ensureStateShape = (state = {}) => ({
  assignments: typeof state.assignments === 'object' && state.assignments !== null ? state.assignments : {},
  wishlists: typeof state.wishlists === 'object' && state.wishlists !== null ? state.wishlists : {},
  messages: pruneMessages(state.messages),
  events: sanitizeEvents(state.events)
});

const getState = async (client) => {
  try {
    const entity = await client.getEntity(PARTITION_KEY, ROW_KEY);
    const parsed = entity.data ? JSON.parse(entity.data) : DEFAULT_STATE;
    return ensureStateShape(parsed);
  } catch (error) {
    if (error && error.statusCode === 404) {
      return ensureStateShape(DEFAULT_STATE);
    }
    throw error;
  }
};

const saveState = async (client, state) => {
  const entity = {
    partitionKey: PARTITION_KEY,
    rowKey: ROW_KEY,
    data: JSON.stringify(state),
    lastUpdated: new Date().toISOString()
  };
  await client.upsertEntity(entity, 'Replace');
};

module.exports = async function (context, req) {
  const method = (req.method || 'GET').toUpperCase();

  if (method === 'OPTIONS') {
    context.res = { status: 200, headers: corsHeaders };
    return;
  }

  let client;
  try {
    client = getTableClient();
    await ensureTable(client);
  } catch (error) {
    context.log.error('Failed to initialize Table Storage', error);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: { message: 'Storage configuration error. See logs for details.' }
    };
    return;
  }

  try {
    if (method === 'GET') {
      const state = await getState(client);
      context.res = { status: 200, headers: corsHeaders, body: state };
      return;
    }

    if (method === 'POST') {
      const { assignments, wishlists, messages, events } = req.body || {};
      if (
        assignments === undefined &&
        wishlists === undefined &&
        messages === undefined &&
        events === undefined
      ) {
        context.res = {
          status: 400,
          headers: corsHeaders,
          body: { message: 'Provide assignments, wishlists, messages, and/or events in the request body.' }
        };
        return;
      }

      const current = await getState(client);
      const mergedState = { ...current };

      if (typeof assignments === 'object' && assignments !== null) {
        mergedState.assignments = assignments;
      }
      if (typeof wishlists === 'object' && wishlists !== null) {
        mergedState.wishlists = wishlists;
      }
      if (messages !== undefined) {
        const sanitized = Array.isArray(messages) ? messages.map(sanitizeMessage).filter(Boolean) : [];
        mergedState.messages = pruneMessages(sanitized);
      }
      if (events !== undefined) {
        mergedState.events = sanitizeEvents(events);
      }

      await saveState(client, mergedState);
      context.res = { status: 200, headers: corsHeaders, body: mergedState };
      return;
    }

    context.res = {
      status: 405,
      headers: corsHeaders,
      body: { message: `Method ${method} not allowed.` }
    };
  } catch (error) {
    context.log.error('State API error', error);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: { message: 'Unexpected error while processing the request.' }
    };
  }
};
