import { httpAuth } from './http';

const unwrap = (res) => {
  // BaseResponse 형태라면 data.data에 실제 페이로드가 있음
  return res?.data?.result ?? res?.data?.data ?? res?.data;
};

/* ===== Conversations ===== */
export const getOrCreateConversation = async (peerId) => {
  const res = await httpAuth.post(`/chat/conversations/${peerId}`);
  return unwrap(res); // Conversation
};

export const getConversation = async (convId) => {
  const res = await httpAuth.get(`/chat/conversations/${convId}`);
  return unwrap(res); // Conversation
};

export const getConversationByPeer = async (peerId) => {
  const res = await httpAuth.get(`/chat/conversations/by-peer/${peerId}`);
  return unwrap(res); // Conversation
};

export const getPeerIdOf = async (convId) => {
  const res = await httpAuth.get(`/chat/conversations/${convId}/peer`);
  return unwrap(res); // Long
};

export const getPeerProfile = async (convId) => {
  const res = await httpAuth.get(`/chat/conversations/${convId}/peer`);
  return unwrap(res); // { id, name, nickname, profileUrl, displayName? }
};

/* ===== Inbox ===== */
export const fetchInbox = async ({ page = 0, size = 30 } = {}) => {
  const res = await httpAuth.get(`/chat/inbox`, { params: { page, size } });
  return unwrap(res); // List<Inbox>
};

export const getInboxOne = async (convId) => {
  const res = await httpAuth.get(`/chat/inbox/${convId}`);
  return unwrap(res); // Inbox
};

export const markRead = async (convId, lastSeenSeq) => {
  const res = await httpAuth.post(`/chat/inbox/${convId}/read`, null, { params: { lastSeenSeq } });
  return unwrap(res);
};

export const markAllRead = async (convId) => {
  const res = await httpAuth.post(`/chat/inbox/${convId}/read-all`);
  return unwrap(res);
};

/* ===== Messages ===== */
export const fetchMessages = async (convId, { beforeSeq, size = 30 } = {}) => {
  const res = await httpAuth.get(`/chat/conversations/${convId}/messages`, {
    params: { beforeSeq, size }
  });
  return unwrap(res); // List<Message> (최신 → 과거 순 주의)
};

export const sendTextByRest = async (convId, { text, msgId }) => {
  const res = await httpAuth.post(`/chat/conversations/${convId}/messages/text`, { text, msgId });
  return unwrap(res); // Message
};

/* ===== Attachments ===== */
export const uploadAttachment = async (convId, file, { kind = 'image', msgId }) => {
  const fd = new FormData();
  fd.append('file', file);
  const res = await httpAuth.post(`/chat/attachments/conversations/${convId}?kind=${kind}&msgId=${msgId}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return unwrap(res); // Message (첨부 포함된 메시지로 브로드캐스트됨)
};

export const getAttachmentsByMessage = async (msgId) => {
  const res = await httpAuth.get(`/chat/attachments/by-message/${msgId}`);
  return unwrap(res); // List<Attachment>
};

export const deleteAttachment = async (attachmentId) => {
  const res = await httpAuth.delete(`/chat/attachments/${attachmentId}`);
  return unwrap(res); // Message (삭제 반영된 메시지로 브로드캐스트됨)
};

/* ===== Presence ===== */
export const isOnline = async (userId) => {
  const res = await httpAuth.get(`/chat/presence/${userId}`);
  return unwrap(res); // boolean
};

export const mePresence = async () => {
  const res = await httpAuth.get(`/chat/presence/me`);
  return unwrap(res); // { userId, online, sessions }
};

export const isOnlineBulk = async (ids = []) => {
  const res = await httpAuth.get(`/chat/presence`, { params: { ids: ids.join(',') } });
  return unwrap(res); // { [id]: boolean }
};

export const fetchOnlineUsers = async ({ limit = 50, q = '' } = {}) => {
  const res = await httpAuth.get('/chat/presence/online-users', { params: { limit, q } });
  return unwrap(res); // [{ id, name, nickname, imageUrl, state }]
};

// 페이지형 온라인 유저 목록
export const fetchOnlineUsersPage = async ({
  offset = 0,
  size = 20,
  q = '',
  includeMe = false
} = {}) => {
  const res = await httpAuth.get('/chat/presence/online-users', {
    params: { offset, size, q, includeMe }
  });
  // { items: UserCardResponse[], nextOffset, hasMore }
  return unwrap(res);
};

// 30초 버킷 touch를 위한 핑
export const pingPresence = async () => {
  const res = await httpAuth.post('/chat/presence/ping');
  return unwrap(res);
};