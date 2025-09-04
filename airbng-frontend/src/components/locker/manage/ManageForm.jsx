import { useRef } from 'react';
import AddressPicker from '../register/AddressPicker';
import ImageUploader from '../register/ImageUploader';
import CircleFull from '../../../assets/circle_check_full.svg';
import CircleBlank from '../../../assets/circle_check_blank.svg';

export default function ManageForm({
  detail, setDetail,
  files, setFiles,
  replaceMode, setReplaceMode,
  onSubmit
}) {
  const fileInputRef = useRef(null);
  if (!detail) return null;
  const set = (k, v) => setDetail(prev => ({ ...prev, [k]: v }));

  const toggleJim = (id) => {
    const next = (detail.jimTypeResults || []).map(j =>
      j.jimTypeId === id ? { ...j, enabled: !j.enabled } : j
    );
    if (next.filter(j => j.enabled).length === 0) {
      alert('최소 하나 이상의 짐 타입을 선택해야 합니다.');
      return;
    }
    set('jimTypeResults', next);
  };

  const startReplace = () => fileInputRef.current?.click();

  const handleReplaceFiles = (e) => {
    const incoming = Array.from(e.target.files || []);
    if (incoming.length === 0) return;
    if (incoming.length > 5) {
      alert('사진은 최대 5장까지 업로드할 수 있습니다.');
      e.target.value = '';
      return;
    }
    setFiles(incoming);
    setReplaceMode(true);
    e.target.value = '';
  };

  const cancelReplace = () => {
    setFiles([]);
    setReplaceMode(false);
  };

  return (
    <div id="locker-manage-content">
      <div className="form-group">
        <label>보관소 이름</label>
        <input
          value={detail.lockerName || ''}
          onChange={e=>set('lockerName', e.target.value)}
          required
          type="text"
        />
      </div>

      <AddressPicker
        address={detail.address || ''}
        setAddress={(v)=>set('address', v)}
        setAddressEnglish={(v)=>set('addressEnglish', v)}
        setLat={(v)=>set('latitude', v)}
        setLng={(v)=>set('longitude', v)}
      />
      <input 
        type="text" 
        id="detailAddress" 
        className='detail-address'
        placeholder="상세주소" 
        value={detail.addressDetail || ''}
        onChange={(e)=>set('addressDetail', e.target.value)} />

      <div className="form-group">
        <label>이미지</label>

        {!replaceMode ? (
          <>
            <div className="preview-list">
              {(detail.images || []).map((src, i) => (
                <div key={i} className="preview-item">
                  <img src={src} alt={`image-${i}`} />
                </div>
              ))}
            </div>
            <div className="row-helper">
              <button type="button" className="save-btn" onClick={startReplace}>이미지 교체</button>
            </div>
            <input
              ref={fileInputRef}
              id="imageReplaceInput"
              type="file"
              accept="image/*"
              multiple
              style={{ display:'none' }}
              onChange={handleReplaceFiles}
            />
          </>
        ) : (
          <>
            <ImageUploader files={files} setFiles={setFiles} max={5} />
            <div className="row-helper">
              <button type="button" className="delete-locker-btn" onClick={cancelReplace}>교체 취소</button>
            </div>
          </>
        )}
      </div>

      <div className="form-group">
        <label>짐 part</label>
        {(detail.jimTypeResults || []).map(j => (
          <div key={j.jimTypeId} className={`condition-row ${j.enabled ? 'selected' : ''}`}>
            <span>{j.typeName}</span>
            <div className="input-wrapper">
              <div className="price-display">{j.pricePerHour}</div>
              <input type="hidden" name={`price_${j.jimTypeId}`} value={j.pricePerHour} disabled={!j.enabled} />
            </div>
            <button type="button" className="check-btn" onClick={()=>toggleJim(j.jimTypeId)}>
              <img src={j.enabled ? CircleFull : CircleBlank} alt="선택" />
            </button>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button className="save-btn" onClick={onSubmit}>수정하기</button>
      </div>
    </div>
  );
}
