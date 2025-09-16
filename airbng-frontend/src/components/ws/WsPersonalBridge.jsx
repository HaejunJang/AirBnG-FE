import usePersonalQueues from '../../hooks/usePersonalQueues';

export default function WsPersonalBridge() {
  usePersonalQueues({
    // 서버 ACK → 채팅방에서 임시 메시지에 seq/시간 매핑
    onAck: (ack) => {
      try { window.dispatchEvent(new CustomEvent('ws:ack', { detail: ack })); } catch {}
    },
    onError: (err) => console.error('[WS ERROR]', err),
    onInboxHint: (hint) => {
        console.debug('[INBOX HINT]', hint);
    },
  });
  return null;
}