import CircleFull from '../../../assets/circle_check_full.svg';
import CircleBlank from '../../../assets/circle_check_blank.svg';

export default function Step4Conditions({ items = [], setItems, onSubmit, submitting, disabled }) {
  const toggle = (id) => {
    const selectedCount = items.filter(i => i.selected).length;
    setItems(items.map(i => {
      if (i.id !== id) return i;
      if (i.selected && selectedCount === 1) return i; // 최소 1개 유지
      return { ...i, selected: !i.selected };
    }));
  };

  return (
    <div className="step step-4 active">
      <div className="form-group">
        <label>짐 보관 조건</label>

        {items.map(i => (
          <div key={i.id} className={`condition-row ${i.selected ? 'selected' : ''}`}>
            <span>{i.label}</span>

            <div className="input-wrapper">
              <div className="price-display">{i.price}</div>
              <input type="hidden" name={`price_${i.id}`} value={i.price} disabled={!i.selected} />
            </div>

            <button type="button" className="check-btn" onClick={() => toggle(i.id)}>
              <img src={i.selected ? CircleFull : CircleBlank} alt="선택" />
            </button>
          </div>
        ))}
      </div>

      <button className="submit-btn" onClick={onSubmit} disabled={disabled || submitting}>
        {submitting ? '등록 중…' : '등록'}
      </button>
    </div>
  );
}
