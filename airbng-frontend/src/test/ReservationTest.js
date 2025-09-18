function PayTest() {
  const [idemKey] = useState(() => crypto.randomUUID());
  const call = () =>
    fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payerId: 2,
        payeeId: 4,
        amount: 3000,
        fee: 0,
        method: "WALLET",
        idemKeyRaw: idemKey,
      }),
    });

  const handleClick = async () => {
    // 의도적으로 동시에 2번
    call();
    call();
  };

  return <button onClick={handleClick}>따닥 테스트</button>;
}
