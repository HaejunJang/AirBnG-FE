import checkIcon from '../../../assets/check_ic.svg';
import lineImg from '../../../assets/check_line.svg';

import s1Full from '../../../assets/1_full_ic.svg';
import s2Full from '../../../assets/2_full_ic.svg';
import s3Full from '../../../assets/3_full_ic.svg';
import s4Full from '../../../assets/4_full_ic.svg';

import s2Blank from '../../../assets/2_blank_ic.svg';
import s3Blank from '../../../assets/3_blank_ic.svg';
import s4Blank from '../../../assets/4_blank_ic.svg';

const FULL = { 1: s1Full, 2: s2Full, 3: s3Full, 4: s4Full };
const BLANK = { 1: s2Blank, 2: s2Blank, 3: s3Blank, 4: s4Blank };

export default function StepIndicator({ current }) {
  return (
    <div className="step-indicator">
      <div className="step-wrapper">
         {[1,2,3,4].map((s, i) => (
          <div key={s} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <img
              className="step-icon"
              alt={`step-${s}`}
              src={current === s ? FULL[s] : current > s ? checkIcon : BLANK[s]}
            />
            {i < 3 && <img className="step-line" alt="line" src={lineImg} />}
          </div>
        ))}
      </div>
    </div>
  );
}
