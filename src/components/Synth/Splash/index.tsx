import css from './index.module.css'

interface Props {
  initialize: () => void
}

export default function Splash({ initialize }: Props) {
  return (
    <div className={css.container} onClick={initialize}>
      <svg className={css.splash}>
        <g className={css.background}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 520" width="700" height="520">
            <path className={`${css.shape} ${css.a}`} d="M40,40v160l160,-160,Z" />
            <path className={`${css.shape} ${css.b}`} d="M60,200v140l80,-80v-140,Z" />
            <path className={`${css.shape} ${css.c}`} d="M160,240l180,-180h-140l-40,40,Z" />
            <path className={`${css.shape} ${css.d}`} d="M60,360v80l160,-160v-80,Z" />
            <path className={`${css.shape} ${css.e}`} d="M240,180v80l80,-80v-80,Z" />
            <path className={`${css.shape} ${css.f}`} d="M340,80v80l80,-80,Z" />
            <path className={`${css.shape} ${css.g}`} d="M300,460l80,-80v-240l-320,320,Z" />
            <path className={`${css.shape} ${css.h}`} d="M400,360l240,-240v-60h-180l-60,60,Z" />
            <path className={`${css.shape} ${css.i}`} d="M360,480l100,-100v-60l-160,160,Z" />
            <path className={`${css.shape} ${css.j}`} d="M480,360l140,-140v-60l-140,140,Z" />
            <path className={`${css.shape} ${css.k}`} d="M480,460l60,-60v-80l-140,140,Z" />
            <path className={`${css.shape} ${css.l}`} d="M560,380l80,-80v-80l-80,80,Z" />
            <path className={`${css.shape} ${css.m}`} d="M660,480v-180l-180,180,Z" />
          </svg>
        </g>

        <text className={css.title} dominantBaseline="middle" textAnchor="middle" x="50%" y="40%">
          Modular Synth
        </text>
        <text className={css.text} dominantBaseline="middle" textAnchor="middle" x="50%" y="45%">
          click to start
        </text>
      </svg>
    </div>
  )
}
