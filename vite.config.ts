import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente do sistema (CodeSandbox Secrets, .env, etc)
  const env = loadEnv(mode, process.cwd(), '');

  // Tenta encontrar a chave em várias variações de nome para facilitar
  const apiKey = env.API_KEY || env.VITE_API_KEY || env.GOOGLE_API_KEY || '';

  if (!apiKey) {
    console.warn("⚠️ AVISO: Nenhuma API Key encontrada. A IA de voz não funcionará.");
    console.warn("No CodeSandbox: Adicione 'API_KEY' na aba 'Secrets' ou 'Env'.");
  }

  return {
    plugins: [react()],
    define: {
      // Injeta a chave no código do cliente de forma segura seguindo as regras da Google GenAI SDK
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})