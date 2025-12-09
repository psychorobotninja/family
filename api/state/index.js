const { TableClient } = require('@azure/data-tables');

const TABLE_NAME = process.env.FAMILY_TABLE_NAME || 'FamilyState';
const PARTITION_KEY = 'state';
const ROW_KEY = 'current';
const DEFAULT_STATE = { assignments: {}, wishlists: {} };

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

const getState = async (client) => {
  try {
    const entity = await client.getEntity(PARTITION_KEY, ROW_KEY);
    return entity.data ? JSON.parse(entity.data) : DEFAULT_STATE;
  } catch (error) {
    if (error && error.statusCode === 404) {
      return DEFAULT_STATE;
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
      const { assignments, wishlists } = req.body || {};
      if (!assignments && !wishlists) {
        context.res = {
          status: 400,
          headers: corsHeaders,
          body: { message: 'Provide assignments and/or wishlists in the request body.' }
        };
        return;
      }

      const current = await getState(client);
      const nextAssignments = typeof assignments === 'object' && assignments !== null ? assignments : current.assignments;
      const nextWishlists = typeof wishlists === 'object' && wishlists !== null ? wishlists : current.wishlists;
      const mergedState = {
        assignments: nextAssignments,
        wishlists: nextWishlists
      };

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
