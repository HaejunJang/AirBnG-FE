import '../../../styles/pages/register.css';

const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2,'0')}:00`);


export default function Step3OperatingTime({ startTime, setStartTime, endTime, setEndTime, onNext, disabled }) {
    return (
        <div className="step step-3 active">
            <div className="register-form-group">
                <label>운영 시간</label>
                <div className="time-select-group">
                    <div className="time-select-box">
                        <div className="time-label">Start with</div>
                        <select value={startTime} onChange={(e)=>setStartTime(e.target.value)}>
                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                    <div className="time-select-box">
                        <div className="time-label">End with</div>
                        <select value={endTime} onChange={(e)=>setEndTime(e.target.value)}>
                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            <button className="next-btn" onClick={onNext} disabled={disabled}>다음</button>
        </div>
    );
}