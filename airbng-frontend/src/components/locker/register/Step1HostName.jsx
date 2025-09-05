export default function Step1HostName({ hostName, setHostName, onNext, disabled }) {
    return (
        <div className="step step-1 active">
            <div className="form-group">
                <label htmlFor="hostName">호스트 이름</label>
                <input id="hostName" maxLength={10} value={hostName}
                onChange={(e)=>setHostName(e.target.value)} placeholder="10자 이내 입력" required />
            </div>
            <button className="next-btn" onClick={onNext} disabled={disabled}>다음</button>
        </div>
    );
}