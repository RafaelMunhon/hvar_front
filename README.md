# HVAR Frontend - Plataforma de Criação de Conteúdo Multimídia

Uma aplicação React moderna para criação e edição de conteúdo multimídia, incluindo vídeos, audiobooks e importação de arquivos. Desenvolvida com TypeScript, Vite e Bootstrap.

## 🚀 Funcionalidades Principais

### 📹 Criação de Vídeos
- **Criar Vídeos**: Geração automática de vídeos a partir de textos
  - Seleção de tema do vídeo
  - Módulo específico
  - Avatar/Template personalizável
  - Busca de imagens integrada

- **Criar Vídeos Pexel**: Versão alternativa para geração de vídeos
  - Seleção de voz
  - Formato do vídeo (Mobile/Desktop)
  - Controle do número de cenas
  - Estilo musical
  - Opção de fonte das imagens

### 🎧 Criação de Audiobooks
- Seleção de texto para conversão
- Escolha de voz personalizada
- Controle de velocidade de reprodução
- Múltiplas opções de formato

### 📁 Importação de Arquivos
- Upload de arquivos com validação
- Processamento automático
- Histórico de importações
- Suporte a múltiplos formatos

### ✂️ Edição de Vídeos
- **Editar Vídeos Studio**: Editor avançado de vídeos
  - Edição de cenas
  - Ajuste de áudio
  - Efeitos visuais
  - Exportação em múltiplos formatos

### ⚙️ Configurações e Documentação
- Gerenciamento de preferências de usuário
- Configurações de API
- Personalização de interface
- Documentação completa do sistema

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Bootstrap 5 + React Bootstrap
- **Charts**: ApexCharts + Chart.js
- **Forms**: React Hook Form + Yup
- **Routing**: React Router DOM
- **Styling**: Sass
- **Deploy**: Docker + Google Cloud Platform

## 📋 Pré-requisitos

- Node.js 18 ou superior
- npm ou yarn
- Git

## 🚀 Como Executar

### 1. Instalação das Dependências

```bash
# Usando npm
npm install

# Ou usando yarn
yarn install
```

### 2. Executar em Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm start
# ou
npm run dev

# O projeto será aberto automaticamente em http://localhost:5173
```

### 3. Build para Produção

```bash
# Gerar build otimizado
npm run build

# Preview do build local
npm run preview
```

### 4. Outros Comandos Úteis

```bash
# Executar linting
npm run lint

# Formatar código
npm run format
```

## 🐳 Deploy com Docker

### Build da Imagem

```bash
docker build -t hvar-frontend .
```

### Executar Container

```bash
docker run -p 8080:8080 hvar-frontend
```

A aplicação estará disponível em `http://localhost:8080`

## ☁️ Deploy no Google Cloud Platform

O projeto está configurado para deploy automático no Google Cloud Run:

1. **Arquivo de Configuração**: `cloudbuild.yaml`
2. **Serviço**: `microservice-yduqs-frontend`
3. **Região**: `us-central1`

### Deploy Automático

```bash
# Enviar para Cloud Build
gcloud builds submit --config cloudbuild.yaml
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
├── pages/              # Páginas da aplicação
│   ├── Dashboard/      # Dashboard principal
│   ├── auth/          # Autenticação
│   ├── charts/        # Gráficos e visualizações
│   └── ...
├── routes/            # Configuração de rotas
├── hooks/             # Custom hooks
├── utils/             # Utilitários
├── types/             # Definições TypeScript
├── assets/            # Recursos estáticos
└── config/            # Configurações
```

## 🔧 Configuração de Desenvolvimento

### ESLint

Para desenvolvimento de produção, recomenda-se configurar o ESLint com regras de tipo:

```js
parserOptions: {
  ecmaVersion: 'latest',
  sourceType: 'module',
  project: ['./tsconfig.json', './tsconfig.node.json'],
  tsconfigRootDir: __dirname,
}
```

### Prettier

O projeto usa Prettier para formatação automática de código.

## 📊 Funcionalidades do Dashboard

- **Estatísticas em Tempo Real**: Métricas de visitas, receita, pedidos e usuários
- **Gráficos Interativos**: Relatórios semanais e anuais de vendas
- **Sistema de Chat**: Comunicação em tempo real
- **Gerenciamento de Projetos**: Acompanhamento de status e prazos

## 🔐 Autenticação

O sistema inclui:
- Login/Logout
- Gerenciamento de sessão
- Controle de acesso baseado em roles
- Integração com JWT

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona em:
- Desktop
- Tablet
- Mobile

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário.

## 📞 Suporte

Para suporte técnico ou dúvidas, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ usando React + TypeScript + Vite**
