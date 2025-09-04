import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import StepIndicator from '../components/locker/common/StepIndicator';
import Step1HostName from '../components/locker/register/Step1HostName';
import Step2Basics from '../components/locker/register/Step2Basics';
import Step3OperatingTime from '../components/locker/register/Step3OperatingTime';
import Step4Conditions from '../components/locker/register/Step4Conditions';
import useLockerRegisterForm from '../hooks/useLockerRegisterForm';
import { getMemberIdFromToken } from '../utils/jwtUtil';
import '../styles/pages/register.css';

export default function LockerRegisterPage() {
  const navigate = useNavigate();
  const keeperId = getMemberIdFromToken(); 
  const f = useLockerRegisterForm({ keeperId });

  useEffect(() => {
    if (!keeperId) {
      navigate('/page/login', { replace: true, state: { next: '/page/lockers/register' } });
    }
  }, [keeperId, navigate]);

  const onBack = () => (f.step === 1 ? navigate(-1) : f.prev());

  return (
    <div className='airbng-register'>
      <div className="register-container">
        <Header headerTitle="보관소 등록" showBackButton onBack={onBack} />
        <StepIndicator current={f.step} />

        {f.step === 1 && (
          <Step1HostName
            hostName={f.hostName}
            setHostName={f.setHostName}
            onNext={f.next}
            disabled={!f.canNext}
          />
        )}

        {f.step === 2 && (
          <Step2Basics
            lockerName={f.lockerName} setLockerName={f.setLockerName}
            address={f.address} setAddress={f.setAddress}
            setAddressEnglish={f.setAddressEnglish}
            setAddressDetail={f.setAddressDetail}    // 훅에 포함되어 있어야 함
            setLat={f.setLat} setLng={f.setLng}
            images={f.images} setImages={f.setImages}
            onNext={f.next} disabled={!f.canNext}
          />
        )}

        {f.step === 3 && (
          <Step3OperatingTime
            startTime={f.startTime} setStartTime={f.setStartTime}
            endTime={f.endTime} setEndTime={f.setEndTime}
            onNext={f.next} disabled={!f.canNext}
          />
        )}

        {f.step === 4 && (
          <Step4Conditions
            items={f.jim}
            setItems={f.setJim}
            onSubmit={async () => {
              const { ok } = await f.submit();
              if (ok) navigate('/page/lockers');
            }}
            submitting={f.submitting}
            disabled={!f.canNext}
          />
        )}
      </div>
    </div>
  );
}
