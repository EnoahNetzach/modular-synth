import { css } from 'glamor'
import React from 'react'

const animations = {
  appear: css.keyframes({
    '0%': { opacity: 0, transform: 'scale3d(0.7, 0.7, 0.7)' },
    '50%': { opacity: 0, transform: 'scale3d(0.7, 0.7, 0.7)' },
    '100%': { opacity: 1, transform: 'scale3d(1, 1, 1)' },
  }),
  colors: css.keyframes({
    '0%': { background: '#481e67', fill: '#fff' },
    '25%': { background: '#7d4aa2' },
    '50%': { background: '#944aa2', fill: '#d8d6c5' },
    '75%': { background: '#8a1b9e' },
    '100%': { background: '#481e67', fill: '#fff' },
  }),
  opacity: css.keyframes({
    '0%': { opacity: 0 },
    '91%': { opacity: 0 },
    '100%': { opacity: 1 },
  }),
  pulse: css.keyframes({
    '0%': { opacity: 1 },
    '30%': { opacity: 0.5 },
    '100%': { opacity: 1 },
  }),
  shapes: css.keyframes({
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
  }),
}

const container = css({
  alignItems: 'center',
  cursor: 'pointer',
  display: 'flex',
  height: '100vh',
  justifyContent: 'center',
  position: 'static',
  width: '100vw',
})

const splash = css({
  animation: `${animations.colors} 8s linear infinite`,
  height: '100vh',
  width: '100vw',
})

const title = css({
  animation: `${animations.appear} 4s linear`,
  fontSize: '3em',
  fontWeight: 'bold',
  transformOrigin: 'center center',
})

const text = css({
  animation: `${animations.opacity} 4.6s linear`,
  fontSize: '1em',
  transformOrigin: 'center center',
})

const background = css({
  fill: 'none',
  stroke: 'white',
  transform: 'translate(calc(50% - 350px), calc(40% - 260px))',
})

const shapes = {
  a: css({
    animation: `${animations.shapes} 2.2s linear, ${animations.pulse} 3.01s linear infinite`,
    fill: '#8a1b9e',
  }),
  b: css({
    animation: `${animations.shapes} 1.9s linear, ${animations.pulse} 3.2s linear infinite`,
    fill: '#8a1b9e',
  }),
  c: css({
    animation: `${animations.shapes} 1.95s linear, ${animations.pulse} 3s linear infinite`,
    fill: '#8a1b9e',
  }),
  d: css({
    animation: `${animations.shapes} 1.67s linear, ${animations.pulse} 3.3s linear infinite`,
    fill: '#8a1b9e',
  }),
  e: css({
    animation: `${animations.shapes} 2s linear, ${animations.pulse} 3.1s linear infinite`,
    fill: '#8a1b9e',
  }),
  f: css({
    animation: `${animations.shapes} 2.13s linear, ${animations.pulse} 2.95s linear infinite`,
    fill: '#8a1b9e',
  }),
  g: css({
    animation: `${animations.shapes} 2.26s linear, ${animations.pulse} 3.21s linear infinite`,
    fill: '#8a1b9e',
  }),
  h: css({
    animation: `${animations.shapes} 2.22s linear, ${animations.pulse} 2.9s linear infinite`,
    fill: '#8a1b9e',
  }),
  i: css({
    animation: `${animations.shapes} 2.01s linear, ${animations.pulse} 3.05s linear infinite`,
    fill: '#8a1b9e',
  }),
  j: css({
    animation: `${animations.shapes} 2.3s linear, ${animations.pulse} 2.98s linear infinite`,
    fill: '#8a1b9e',
  }),
  k: css({
    animation: `${animations.shapes} 2.04s linear, ${animations.pulse} 2.7s linear infinite`,
    fill: '#8a1b9e',
  }),
  l: css({
    animation: `${animations.shapes} 1.87s linear, ${animations.pulse} 3.24s linear infinite`,
    fill: '#8a1b9e',
  }),
  m: css({
    animation: `${animations.shapes} 1.96s linear, ${animations.pulse} 2.95s linear infinite`,
    fill: '#8a1b9e',
  }),
  n: css({
    animation: `${animations.shapes} 2.37s linear, ${animations.pulse} 3.13s linear infinite`,
    fill: '#8a1b9e',
  }),
  z: css({
    fill: '#8a1b9e',
  }),
}

export default ({ initialize }) => (
  <div {...container} onClick={initialize}>
    <svg {...splash}>
      <g {...background}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 520" width="700" height="520">
          <path {...shapes.a} d="M40,40v160l160,-160,Z" />
          <path {...shapes.b} d="M60,200v140l80,-80v-140,Z" />
          <path {...shapes.c} d="M160,240l180,-180h-140l-40,40,Z" />
          <path {...shapes.d} d="M60,360v80l160,-160v-80,Z" />
          <path {...shapes.e} d="M240,180v80l80,-80v-80,Z" />
          <path {...shapes.f} d="M340,80v80l80,-80,Z" />
          <path {...shapes.g} d="M300,460l80,-80v-240l-320,320,Z" />
          <path {...shapes.h} d="M400,360l240,-240v-60h-180l-60,60,Z" />
          <path {...shapes.i} d="M360,480l100,-100v-60l-160,160,Z" />
          <path {...shapes.j} d="M480,360l140,-140v-60l-140,140,Z" />
          <path {...shapes.k} d="M480,460l60,-60v-80l-140,140,Z" />
          <path {...shapes.l} d="M560,380l80,-80v-80l-80,80,Z" />
          <path {...shapes.m} d="M660,480v-180l-180,180,Z" />
        </svg>
      </g>

      <text {...title} dominantBaseline="middle" textAnchor="middle" x="50%" y="40%">
        Modular Synth
      </text>
      <text {...text} dominantBaseline="middle" textAnchor="middle" x="50%" y="45%">
        click to start
      </text>
    </svg>
  </div>
)
