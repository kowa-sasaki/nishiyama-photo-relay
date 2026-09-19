import { ILLUSTRATION_VIEWBOX } from '../lib/illustrationProjection'
import './ParkMapIllustration.css'

// 5つの公式定点の投影位置。SCALE/OFFSET等の投影定数を変更した場合、
// ParkMapIllustration.test.tsxの回帰テストが乖離を検知する。
// 大噴水前 (35.950000, 136.182041)
export const FOUNTAIN_ANCHOR = { x: 242, y: 461 }
// 西山動物園前 (35.948694, 136.180694)
export const DOUBUTSUEN_ANCHOR = { x: 60, y: 680 }
// つつじ園（結びの広場） (35.9503, 136.1815)
export const TSUTSUJIEN_ANCHOR = { x: 169.2, y: 411.4 }
// 上段の庭（もみじ） (35.951110, 136.184471)
export const JODAN_NO_NIWA_ANCHOR = { x: 570.8, y: 276.1 }
// 愛の鐘・展望台 (35.952414, 136.181033)
export const AI_NO_KANE_ANCHOR = { x: 106.0, y: 58.4 }

export function ParkMapIllustration() {
  return (
    <svg
      className="park-map-illustration"
      viewBox={ILLUSTRATION_VIEWBOX}
      role="img"
      aria-label="西山公園マップ"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="park-map-illustration__boundary"
        d="M40,705 C10,560 15,420 15,300 C10,160 40,40 140,40 C220,0 340,10 430,55 C520,100 580,180 600,280 C620,380 600,480 560,560 C520,640 460,690 380,705 C300,720 200,725 120,715 C85,710 55,712 40,705 Z"
      />
      {/* 車道。実測(公園管理事務所 35.9500047,136.1831145 / 北の庭 35.951809,136.184240)を
          投影した座標をもとに配置。歩道(park-map-illustration__path)とは色・太さで描き分ける */}
      <path
        className="park-map-illustration__road"
        d="M420,15 C408,150 396,320 387,461 C378,505 358,540 340,560"
      />
      <path className="park-map-illustration__road" d="M387,461 C430,380 490,300 520,240 C528,215 534,185 539.5,159.4" />
      {/* パンダらんど(35.952340,136.182773)周辺のエリアをうっすらと示す装飾ループ */}
      <path
        className="park-map-illustration__area"
        d="M300,71 C300,45 320,25 345,25 C375,25 390,50 385,80 C380,105 355,118 330,110 C310,103 300,90 300,71 Z"
      />
      {/* 北の庭(35.951809,136.184240)〜上段の庭周辺のエリアをうっすらと示す装飾ループ */}
      <path
        className="park-map-illustration__area"
        d="M520,150 C545,130 580,140 590,170 C600,200 595,240 580,265 C565,285 545,290 525,278 C515,255 510,230 510,200 C510,180 512,163 520,150 Z"
      />
      <path
        className="park-map-illustration__path"
        d="M60.0,680.0 C76.2,655.9 144.5,577.2 157.0,535.4 C169.5,493.6 129.6,461.3 135.0,429.2 C140.4,397.1 179.9,375.4 189.6,343.0 C199.3,310.6 196.8,271.4 193.4,234.5 C190.0,197.6 183.5,151.0 168.9,121.6 C154.3,92.2 116.5,68.6 106.0,58.0"
      />
      <path
        className="park-map-illustration__path"
        d="M242.0,461.0 C255.6,454.9 303.4,436.7 323.3,424.6 C343.2,412.6 349.9,399.9 361.2,388.7 C372.5,377.4 374.2,367.8 391.0,357.1 C407.8,346.4 438.5,334.2 461.8,324.3 C485.1,314.4 512.5,305.8 530.7,297.7 C548.9,289.6 564.3,279.6 571.0,276.0"
      />
      {/* 西山動物園(35.9506507,136.1808967)付近の建物ブロック */}
      <g className="park-map-illustration__buildings">
        <rect x="95" y="600" width="42" height="26" rx="3" transform="rotate(-8 116 613)" />
        <rect x="112" y="562" width="36" height="22" rx="3" transform="rotate(-8 130 573)" />
      </g>
      <g className="park-map-illustration__trees" transform="translate(95,168)">
        <ellipse
          className="park-map-illustration__tree park-map-illustration__tree--a"
          cx="0"
          cy="0"
          rx="40"
          ry="32"
        />
        <ellipse
          className="park-map-illustration__tree park-map-illustration__tree--b"
          cx="35"
          cy="-12"
          rx="28"
          ry="24"
        />
      </g>
      <g className="park-map-illustration__trees" transform="translate(553,276)">
        <ellipse
          className="park-map-illustration__tree park-map-illustration__tree--a"
          cx="0"
          cy="0"
          rx="36"
          ry="28"
        />
        <ellipse
          className="park-map-illustration__tree park-map-illustration__tree--b"
          cx="-30"
          cy="-10"
          rx="24"
          ry="20"
        />
      </g>
      <g className="park-map-illustration__fountain" transform={`translate(${FOUNTAIN_ANCHOR.x},${FOUNTAIN_ANCHOR.y})`}>
        <circle className="park-map-illustration__fountain-ring" r="18" />
        <circle className="park-map-illustration__fountain-ring" r="12" />
        <circle className="park-map-illustration__fountain-core" r="6" />
      </g>
      <circle
        className="park-map-illustration__marker"
        cx={DOUBUTSUEN_ANCHOR.x}
        cy={DOUBUTSUEN_ANCHOR.y}
        r="5"
      />
      <circle
        className="park-map-illustration__marker"
        cx={TSUTSUJIEN_ANCHOR.x}
        cy={TSUTSUJIEN_ANCHOR.y}
        r="5"
      />
      <circle
        className="park-map-illustration__marker"
        cx={JODAN_NO_NIWA_ANCHOR.x}
        cy={JODAN_NO_NIWA_ANCHOR.y}
        r="5"
      />
      <circle
        className="park-map-illustration__marker"
        cx={AI_NO_KANE_ANCHOR.x}
        cy={AI_NO_KANE_ANCHOR.y}
        r="5"
      />

      <text className="park-map-illustration__label" x={FOUNTAIN_ANCHOR.x + 24} y={FOUNTAIN_ANCHOR.y + 8}>
        大噴水
      </text>
      <text className="park-map-illustration__label" x={DOUBUTSUEN_ANCHOR.x + 14} y={DOUBUTSUEN_ANCHOR.y + 5}>
        西山動物園
      </text>
      <text className="park-map-illustration__label" x={TSUTSUJIEN_ANCHOR.x + 12} y={TSUTSUJIEN_ANCHOR.y + 5}>
        つつじ園
      </text>
      <text
        className="park-map-illustration__label"
        textAnchor="end"
        x={JODAN_NO_NIWA_ANCHOR.x - 14}
        y={JODAN_NO_NIWA_ANCHOR.y + 5}
      >
        上段の庭
      </text>
      <text className="park-map-illustration__label" x={AI_NO_KANE_ANCHOR.x + 12} y={AI_NO_KANE_ANCHOR.y + 5}>
        愛の鐘・展望台
      </text>
    </svg>
  )
}
