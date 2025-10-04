import { v4 as uuidv4 } from "uuid";

const IDEM = "idem:";
/**
 * 멱등키 가져오기 (없으면 새로 생성)
 * @param {string} scope - 예: reservation:wallet:{lockerId}, wallet:topup:{walletId}
 * @returns {string} idemKey
 */
export function getOrCreateIdemKey(scope) {
  const key = sessionStorage.getItem(IDEM + scope);
  if (key) return key;
  const v = uuidv4();
  sessionStorage.setItem(IDEM + scope, v);
  return v;
}

/**
 * sessionStorage에서 idemKey 제거
 * @param {string} scope
 */
export function clearIdemKey(scope) {
  sessionStorage.removeItem(IDEM + scope);
}
