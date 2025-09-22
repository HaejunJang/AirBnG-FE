const mem = new Map(); // key: convId, value: { id, name, nickname, profileUrl }

export const peerCache = {
  get(convId) { return mem.get(convId); },
  set(convId, v) { if (convId) mem.set(convId, v); },
  has(convId) { return mem.has(convId); },
};