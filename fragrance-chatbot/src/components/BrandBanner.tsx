const BANNER_SVG = `<svg viewBox="0 0 1005 139" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto; display: block; margin: 0 auto; overflow: visible;">
<defs>
<linearGradient id="livelyAurora" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" stop-color="#fff0f6">
<animate attributeName="stop-color" dur="6s" repeatCount="indefinite" values="#fff0f6;#ffe5f0;#fff6fa;#ffeef6;#fff0f6"></animate>
</stop>
<stop offset="45%" stop-color="#ffffff"></stop>
<stop offset="100%" stop-color="#ffebf4">
<animate attributeName="stop-color" dur="6s" repeatCount="indefinite" values="#ffebf4;#ffd8ec;#fff0f7;#ffe2f0;#ffebf4"></animate>
</stop>
</linearGradient>
<linearGradient id="neonStreamBorder" x1="0%" y1="0%" x2="100%" y2="0%">
<stop offset="0%" stop-color="#ff2a85"></stop>
<stop offset="25%" stop-color="#ff75b5"></stop>
<stop offset="50%" stop-color="#ff1493"></stop>
<stop offset="75%" stop-color="#ffa6d2"></stop>
<stop offset="100%" stop-color="#ff2a85"></stop>
<animateTransform attributeName="gradientTransform" type="translate" from="-1 0" to="1 0" dur="2.8s" repeatCount="indefinite"></animateTransform>
</linearGradient>
<linearGradient id="crystalTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
<stop offset="0%" stop-color="#e6005c"></stop>
<stop offset="50%" stop-color="#ff007f"></stop>
<stop offset="100%" stop-color="#b8004f"></stop>
</linearGradient>
<radialGradient id="perfumeGem3D" cx="35%" cy="30%" r="70%">
<stop offset="0%" stop-color="#ffb3d9"></stop>
<stop offset="35%" stop-color="#ff2a8d"></stop>
<stop offset="80%" stop-color="#c4005e"></stop>
<stop offset="100%" stop-color="#6e0032"></stop>
</radialGradient>
<radialGradient id="fairyDustGold" cx="50%" cy="50%" r="50%">
<stop offset="0%" stop-color="#ffe680"></stop>
<stop offset="60%" stop-color="#ff80b3"></stop>
<stop offset="100%" stop-color="#ff1493" stop-opacity="0"></stop>
</radialGradient>
<filter id="superGlow" x="-30%" y="-30%" width="160%" height="160%">
<feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="#ff1493" flood-opacity="0.4"></feDropShadow>
<feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#ff69b4" flood-opacity="0.3"></feDropShadow>
</filter>
<filter id="capsuleShadow" x="-5%" y="-15%" width="110%" height="140%">
<feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="#ff2d87" flood-opacity="0.14"></feDropShadow>
<feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000000" flood-opacity="0.04"></feDropShadow>
</filter>
<filter id="textBackdrop" x="-10%" y="-20%" width="120%" height="140%">
<feDropShadow dx="0" dy="1" stdDeviation="6" flood-color="#ffffff" flood-opacity="0.9"></feDropShadow>
</filter>
</defs>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@700;800;900&display=swap');

    .title-text-bold {
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 38px;
      font-weight: 900;
      letter-spacing: -0.035em;
      fill: url(#crystalTitleGrad);
      dominant-baseline: central;
      filter: drop-shadow(0 2px 5px rgba(255, 20, 147, 0.18)) drop-shadow(0 1px 1px rgba(255, 255, 255, 0.9));
    }

    .sub-text-clean {
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 15.5px;
      font-weight: 700;
      letter-spacing: -0.015em;
      fill: #543343;
      dominant-baseline: central;
      filter: drop-shadow(0 1px 2px rgba(255, 255, 255, 0.9));
    }

    @keyframes bottleFloatPulse {
      0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
      50% { transform: translateY(-5px) rotate(5deg) scale(1.06); }
    }

    @keyframes haloOrbit {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.12); }
      100% { transform: rotate(360deg) scale(1); }
    }

    @keyframes starPulse1 {
      0%, 100% { transform: scale(0.7) rotate(0deg); opacity: 0.35; }
      50% { transform: scale(1.35) rotate(45deg); opacity: 1; filter: drop-shadow(0 0 6px #ff1493); }
    }

    @keyframes starPulse2 {
      0%, 100% { transform: scale(1.2) rotate(30deg); opacity: 0.9; filter: drop-shadow(0 0 5px #ff2a8d); }
      50% { transform: scale(0.6) rotate(-15deg); opacity: 0.3; }
    }

    @keyframes scentWaveFlow {
      0% { stroke-dashoffset: 0; opacity: 0.3; }
      50% { opacity: 0.75; }
      100% { stroke-dashoffset: -80; opacity: 0.3; }
    }

    @keyframes bubbleRiseLeft {
      0% { transform: translateY(8px) scale(0.8); opacity: 0; }
      50% { opacity: 0.8; }
      100% { transform: translateY(-16px) scale(1.1); opacity: 0; }
    }

    @keyframes bubbleRiseRight {
      0% { transform: translateY(10px) scale(0.7); opacity: 0; }
      50% { opacity: 0.85; }
      100% { transform: translateY(-14px) scale(1.15); opacity: 0; }
    }

    .anim-bottle-box { transform-origin: center; animation: bottleFloatPulse 3.2s ease-in-out infinite; }
    .anim-halo { transform-origin: center; animation: haloOrbit 7s linear infinite; }
    .anim-twinkle-left { transform-origin: center; animation: starPulse1 2.2s ease-in-out infinite; }
    .anim-twinkle-right { transform-origin: center; animation: starPulse1 2.5s ease-in-out infinite; animation-delay: 1.2s; }
    .anim-twinkle-acc { transform-origin: center; animation: starPulse2 1.8s ease-in-out infinite; }
    .scent-wave { stroke-dasharray: 6, 8; animation: scentWaveFlow 4s linear infinite; }
    .bubble-float-l { animation: bubbleRiseLeft 3.6s ease-in-out infinite; }
    .bubble-float-r { animation: bubbleRiseRight 3.2s ease-in-out infinite; animation-delay: 1.5s; }
  </style>
<rect fill="#fff5f9" width="1005" height="139" rx="36"></rect>
<circle cx="200" cy="70" r="75" fill="#ffb8d9" filter="blur(24px)" opacity="0.45"></circle>
<circle cx="502" cy="70" r="95" fill="#ffd5e7" filter="blur(28px)" opacity="0.55"></circle>
<circle cx="810" cy="70" r="75" fill="#ffb3d6" filter="blur(24px)" opacity="0.45"></circle>
<rect x="10" y="7" width="985" height="125" rx="36" fill="url(#livelyAurora)" stroke="url(#neonStreamBorder)" stroke-width="2.2" filter="url(#capsuleShadow)"></rect>
<path d="M 45 12 Q 502 18 960 12" stroke="#ffffff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity="0.95"></path>
<g opacity="0.6">
<path class="scent-wave" d="M 70 85 C 160 55, 250 95, 340 68" stroke="#ff70a5" stroke-width="2" fill="none" stroke-linecap="round"></path>
<path class="scent-wave" d="M 90 55 C 180 85, 260 45, 330 75" stroke="#ffa3cb" stroke-width="1.6" fill="none" stroke-linecap="round" style="animation-delay: -2s;"></path>
<path class="scent-wave" d="M 665 68 C 755 95, 845 55, 935 85" stroke="#ff70a5" stroke-width="2" fill="none" stroke-linecap="round"></path>
<path class="scent-wave" d="M 675 75 C 745 45, 825 85, 915 55" stroke="#ffa3cb" stroke-width="1.6" fill="none" stroke-linecap="round" style="animation-delay: -2s;"></path>
</g>
<g class="anim-twinkle-left" transform="translate(135, 68)">
<path d="M0,0 C15,0 20,-11 20,-26 C20,-11 25,0 40,0 C25,0 20,11 20,26 C20,11 15,0 0,0 Z" fill="#ff2a8d"></path>
<circle cx="20" cy="0" r="4" fill="#ffffff"></circle>
</g>
<g class="bubble-float-l">
<circle cx="85" cy="50" r="4.5" fill="none" stroke="#ff4081" stroke-width="1.4" opacity="0.8">
<animate attributeName="r" values="3.5;5;3.5" dur="2s" repeatCount="indefinite"></animate>
</circle>
<circle cx="86" cy="49" r="1.5" fill="#ffffff"></circle>
</g>
<g class="bubble-float-l" style="animation-delay: 1.8s;">
<circle cx="205" cy="92" r="3.8" fill="none" stroke="#ff1493" stroke-width="1.2" opacity="0.85"></circle>
<circle cx="206" cy="91" r="1.2" fill="#ffffff"></circle>
</g>
<circle cx="225" cy="46" r="3.2" fill="#ff007f" opacity="0.75">
<animate attributeName="opacity" values="0.3;1;0.3" dur="1.7s" repeatCount="indefinite"></animate>
</circle>
<circle cx="100" cy="98" r="2.5" fill="#ff7da7" opacity="0.8"></circle>
<circle cx="170" cy="38" r="2" fill="#ffa8cd" opacity="0.7"></circle>
<g class="anim-twinkle-right" transform="translate(835, 68)">
<path d="M0,0 C15,0 20,-11 20,-26 C20,-11 25,0 40,0 C25,0 20,11 20,26 C20,11 15,0 0,0 Z" fill="#ff2a8d"></path>
<circle cx="20" cy="0" r="4" fill="#ffffff"></circle>
</g>
<g class="bubble-float-r">
<circle cx="920" cy="52" r="4.5" fill="none" stroke="#ff4081" stroke-width="1.4" opacity="0.8">
<animate attributeName="r" values="3.5;5;3.5" dur="2.4s" repeatCount="indefinite"></animate>
</circle>
<circle cx="921" cy="51" r="1.5" fill="#ffffff"></circle>
</g>
<g class="bubble-float-r" style="animation-delay: 1s;">
<circle cx="785" cy="90" r="3.8" fill="none" stroke="#ff1493" stroke-width="1.2" opacity="0.85"></circle>
<circle cx="786" cy="89" r="1.2" fill="#ffffff"></circle>
</g>
<circle cx="770" cy="44" r="3.2" fill="#ff007f" opacity="0.75">
<animate attributeName="opacity" values="0.3;1;0.3" dur="2.1s" repeatCount="indefinite"></animate>
</circle>
<circle cx="895" cy="96" r="2.5" fill="#ff7da7" opacity="0.8"></circle>
<circle cx="820" cy="38" r="2" fill="#ffa8cd" opacity="0.7"></circle>
<circle cx="340" cy="42" r="2" fill="#ff66a8">
<animate attributeName="opacity" values="0.2;0.9;0.2" dur="1.5s" repeatCount="indefinite"></animate>
</circle>
<circle cx="660" cy="96" r="2" fill="#ff66a8">
<animate attributeName="opacity" values="0.2;0.9;0.2" dur="1.9s" repeatCount="indefinite"></animate>
</circle>
<ellipse cx="502.5" cy="48" rx="190" ry="24" fill="#ffffff" filter="blur(8px)" opacity="0.55"></ellipse>
<ellipse cx="502.5" cy="94" rx="200" ry="18" fill="#ffffff" filter="blur(6px)" opacity="0.65"></ellipse>
<g transform="translate(502.5, 48)">
<g transform="translate(-106, 0)">
<g class="anim-halo">
<ellipse cx="0" cy="0" rx="28" ry="11" fill="none" stroke="#ff7eb3" stroke-width="1.5" stroke-dasharray="8,5" opacity="0.8" transform="rotate(-15)"></ellipse>
<circle cx="26" cy="-6" r="2" fill="#ffe066"></circle>
<circle cx="-26" cy="6" r="1.5" fill="#ffffff"></circle>
</g>
<g class="anim-bottle-box" filter="url(#superGlow)">
<polygon points="-8,-16 8,-16 11,-24 -11,-24" fill="#ffffff" stroke="#ff007f" stroke-width="1.1"></polygon>
<polygon points="-4,-14 4,-14 2,-7 -2,-7" fill="#ff66a3"></polygon>
<rect x="-4.5" y="-16" width="9" height="3" rx="1" fill="#ffe066" stroke="#ff007f" stroke-width="0.6"></rect>
<polygon points="-16,-6 16,-6 22,13 0,23 -22,13" fill="url(#perfumeGem3D)" stroke="#ffffff" stroke-width="1.3"></polygon>
<path d="M0,-8 L2,-2 L8,0 L2,2 L0,8 L-2,2 L-8,0 L-2,-2 Z" fill="#ffffff">
<animate attributeName="opacity" values="0.75;1;0.75" dur="1.4s" repeatCount="indefinite"></animate>
<animate attributeName="transform" type="scale" values="0.9;1.15;0.9" dur="1.4s" repeatCount="indefinite"></animate>
</path>
<circle cx="5" cy="-2" r="1.8" fill="#ffffff"></circle>
<circle cx="-5" cy="4" r="1.2" fill="#ffffff" opacity="0.85"></circle>
</g>
</g>
<text class="title-text-bold" x="18" y="0" text-anchor="middle">향기요정</text>
<g class="anim-twinkle-acc" transform="translate(126, -12)">
<path d="M0,-8 L2.2,-2.2 L8,0 L2.2,2.2 L0,8 L-2.2,2.2 L-8,0 L-2.2,-2.2 Z" fill="#ff007f"></path>
<circle cx="0" cy="0" r="2.2" fill="#ffffff"></circle>
</g>
<circle cx="138" cy="4" r="2" fill="#ff4081" opacity="0.85"></circle>
</g>
<g transform="translate(502.5, 94)">
<text class="sub-text-clean" x="0" y="0" text-anchor="middle">대화로 나에게 꼭 맞는 시그니처 향을 찾아드려요 ✨</text>
</g>
</svg>`;

export default function BrandBanner() {
  return (
    <div
      className="mb-4 w-full shrink-0 drop-shadow-xl"
      dangerouslySetInnerHTML={{ __html: BANNER_SVG }}
    />
  );
}
