import { useMemo } from 'react';
import ImgUpload from '../../../assets/img_upload_ic.svg';
import { useModal, Modal } from '../../common/ModalUtil';


export default function ImageUploader({ files, setFiles, max = 5 }) {
    const previews = useMemo(() => files.map(f => URL.createObjectURL(f)), [files]);
    const modal = useModal();

    const onChange = (e) => {
        const incoming = Array.from(e.target.files || []);
        if (files.length + incoming.length > max) {
            modal.showError('업로드 제한', `사진은 최대 ${max}장까지 업로드할 수 있습니다.`);
            e.target.value = '';
            return;
        }
        setFiles([...files, ...incoming]);
        e.target.value = '';
    };

    const remove = (idx) => {
        const next = [...files];
        next.splice(idx, 1);
        setFiles(next);
    };

    return (
        <div>
            {/*<label>사진 업로드</label>*/}
            <div className="locker-image-upload-area">
                {files.length < max && (
                    <div className="image-upload-box" id="uploadIconBox">
                        <label>
                            <img src={ImgUpload} alt="사진 업로드" />
                            <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onChange} />
                        </label>
                    </div>
                )}
                <div id="image-preview-container" className="preview-list">
                    {previews.map((src, i) => (
                        <div key={i} className="preview-item">
                            <img src={src} alt={`preview-${i}`} />
                            <button type="button" onClick={() => remove(i)}>×</button>
                        </div>
                    ))}
                </div>
            </div>
            <Modal {...modal.modalState} onClose={modal.hideModal} />
        </div>
    );
}