import path from 'path'
import type { CracoConfig } from '@craco/types'

const config: CracoConfig = {
  webpack: {
    alias: {
      '~/audioWorklets': path.resolve(__dirname, 'src', 'audioWorklets'),
    },
    configure: (webpackConfig) => ({
      ...webpackConfig,
      experiments: {
        asyncWebAssembly: true,
      },
    }),
  },
}

export default config
