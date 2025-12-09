const { TableClient } = require('@azure/data-tables');

const TABLE_NAME = process.env.FAMILY_TABLE_NAME || 'FamilyState';
const PARTITION_KEY = 'state';
const ROW_KEY = 'current';
const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;
const DEFAULT_STATE = { assignments: {}, wishlists: {}, messages: [] };

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
  messages: pruneMessages(state.messages)
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
      const { assignments, wishlists, messages } = req.body || {};
      if (!assignments && !wishlists && !messages) {
        context.res = {
          status: 400,
          headers: corsHeaders,
          body: { message: 'Provide assignments, wishlists, and/or messages in the request body.' }
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
