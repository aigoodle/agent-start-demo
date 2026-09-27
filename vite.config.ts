import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { agentStartMock } from './mock/plugin.js'

/**
 * MOCK !== 'false' 时由内置 mock 中间件直接应答 /api/agent-start/*，
 * 无需后端即可完整演示所有组件；
 * MOCK=false 时走 proxy 打到真实 spring-agent-start 后端。
 */
const useMock = (process.env.MOCK ?? 'true') !== 'false'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), ...(useMock ? [agentStartMock()] : [])],
  define: {
    __USE_MOCK__: JSON.stringify(useMock),
  },
  resolve: {
    // vue-agent-start 通过 link: 引入，其 node_modules 里也带有 vue/pinia 等，
    // dedupe 保证运行时只有一份实例。
    dedupe: [
      'vue',
      'pinia',
      'vue-router',
      '@ant-design/icons-vue',
      '@vue-flow/core',
      '@vue-flow/background',
      '@vue-flow/minimap',
      '@vue-flow/controls',
      '@vue-flow/node-resizer',
      'vue-draggable-next',
    ],
  },
  server: {
    fs: {
      // 允许访问 link: 的组件库源码（位于本项目的上级目录）
      allow: [fileURLToPath(new URL('..', import.meta.url))],
    },
    proxy: useMock
      ? undefined
      : {
          '/api': {
            target:
              process.env.VITE_AGENT_API_TARGET ?? 'http://localhost:18090',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            ws: true,
          },
        },
  },
})
