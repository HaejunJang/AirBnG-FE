import AddressPicker from './AddressPicker';
import ImageUploader from './ImageUploader';

export default function Step2Basics({
    lockerName, setLockerName,
    address, setAddress, addressDetail, setAddressDetail, setAddressEnglish, setLat, setLng,
    images, setImages,
    onNext, disabled
}) {
    return (
        <div className="step step-2 active">
            <div className="form-group">
                <label htmlFor="lockerName">보관소 이름</label>
                <input id="lockerName" value={lockerName}
                onChange={(e)=>setLockerName(e.target.value)} placeholder="한글, 영어, 숫자만 사용 가능" required />
            </div>

            <AddressPicker
                address={address}
                setAddress={setAddress}
                setAddressEnglish={setAddressEnglish}
                setAddressDetail={setAddressDetail}
                setLat={setLat}
                setLng={setLng}
            />

            {address && (
              <input 
                type="text" 
                id="detailAddress" 
                className='detail-address'
                placeholder="상세주소" 
                value={addressDetail}
                onChange={(e)=>setAddressDetail(e.target.value)} />
            )}

            <ImageUploader files={images} setFiles={setImages} />

            <button className="next-btn" onClick={onNext} disabled={disabled}>다음</button>
        </div>
    );
}