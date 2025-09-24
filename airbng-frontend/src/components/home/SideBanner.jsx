import airbngImage from "../../assets/airbngImage.png";
import worldIcon from "../../assets/worldIcon.png"; // 글로브 아이콘 임포트 추가
import githubIcon2 from "../../assets/githubIcon2.png"; // 깃허브 아이콘 임포트

const GitHubIcon = () => (
  <img src={githubIcon2} className="side-banner__icon" alt="" aria-hidden />
);

const GlobeIcon = () => (
  <img src={worldIcon} className="side-banner__icon" alt="" aria-hidden />
);

const BannerHeader = () => (
  <header>
    <h2 className="side-banner__logo">AirBnG</h2>
    <p className="side-banner__tag">
      TEAM STORE
      <br />
      간단한 정보 들어갈 자리
    </p>
  </header>
);

const BannerImage = () => (
  <div className="side-banner__image">
    <img className="side-banner__art" src={airbngImage} alt="" aria-hidden />
  </div>
);

const BannerFooter = () => (
  <footer className="side-banner__footer">
    <a
      href="https://github.com/shinhanDsActeam/AirBnG"
      className="side-banner__link"
      target="_blank"
      rel="noreferrer"
    >
      <GitHubIcon />
      github.com/airbng
    </a>
    <a
      href=" https://airbng.shinhanacademy.co.kr/"
      className="side-banner__link"
      target="_blank"
      rel="noreferrer"
    >
      <GlobeIcon />
      www.airbng.co.kr
    </a>
  </footer>
);

export default function SideBanner() {
  return (
    <aside className="side-banner">
      <div className="side-banner__inner">
        <BannerHeader />
        <BannerImage />
        <BannerFooter />
      </div>
    </aside>
  );
}
