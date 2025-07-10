// Ambiente de desenvolvimento
const DEV_API_URL = 'http://127.0.0.1:5000/api'

// Ambiente de produção
const PROD_API_URL = 'https://microservice-yduqs-api-745371796940.us-central1.run.app/api'

// Exporta a URL da API baseada no ambiente
export const API_URL = process.env.NODE_ENV === 'development' ? DEV_API_URL : PROD_API_URL 