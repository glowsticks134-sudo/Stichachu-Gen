/**
 * Shared Discord client reference.
 *
 * Lets utility modules (aliasGenerator, etc.) access the Discord client
 * without needing it passed as a parameter through every function call.
 *
 * Set once at startup via setClient(). Read anywhere via getClient().
 */

let _client = null;

/** Store the Discord client after login. Call once in index.js. */
export function setClient(client) {
  _client = client;
}

/** Retrieve the stored client. Throws if called before setClient(). */
export function getClient() {
  if (!_client) throw new Error('Discord client not initialised — call setClient() first');
  return _client;
}

/** Unix timestamp (ms) of when the bot came online. Set in the ready event. */
export let botStartTime = null;
export function setBotStartTime() {
  botStartTime = Date.now();
}
