import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente do sistema (CodeSandbox Secrets, .env, etc)
  const env = loadEnv(mode, process.cwd(), '');

  // Tenta encontrar a chave em várias variações de nome para facilitar
  const apiKey = env.VITE_GEMINI_API_KEY || env.API_KEY || env.VITE_API_KEY || env.GOOGLE_API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Injeta a chave no código do cliente de forma segura seguindo as regras da Google GenAI SDK
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})