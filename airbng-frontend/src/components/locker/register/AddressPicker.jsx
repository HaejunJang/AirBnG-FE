import { useDaumPostcode, useKakaoGeocoder } from '../../../hooks/useExternalScripts';
import LocationSearch from '../../../assets/location_search_ic.svg';
import { useModal, Modal } from '../../common/ModalUtil';

export default function AddressPicker({ address, setAddress, setAddressEnglish, setLat, setLng }) {
    const daumReady = useDaumPostcode();
    const kakaoReady = useKakaoGeocoder();
    const modal = useModal();

    const openSearch = () => {
        if (!daumReady) {
            modal.showError('주소 검색 준비 중', '주소 검색 로딩 중입니다. 잠시만 기다려주세요.');
            return;
        }
        new window.daum.Postcode({
            oncomplete: (data) => {
                const kor = data.roadAddress || data.jibunAddress;
                const eng = data.roadAddressEnglish || data.jibunAddressEnglish;
                setAddress(kor);
                setAddressEnglish?.(eng || '');
                // 좌표 변환
                if (kakaoReady) {
                    const geocoder = new window.kakao.maps.services.Geocoder();
                    geocoder.addressSearch(kor, (result, status) => {
                        if (status === window.kakao.maps.services.Status.OK) {
                            setLat(parseFloat(result[0].y));
                            setLng(parseFloat(result[0].x));
                        } else {
                            modal.showError('좌표 변환 실패', '주소를 확인해주세요.');
                        }
                    });
                }
            },
            width: 500,
            height: 400,
        }).open();
    };

    return (
        <div className="form-group">
            <label>주소</label>
            <div className="input-with-icon" onClick={openSearch} id="locationInputWrapper">
                <img src={LocationSearch} className="location-icon" alt="주소 검색" />
                <input 
                    readOnly 
                    className='address-field'
                    placeholder="건물, 지번 또는 도로명 검색" 
                    value={address || ''} 
                />
            </div>
            <Modal {...modal.modalState} onClose={modal.hideModal} />
        </div>
    );
}