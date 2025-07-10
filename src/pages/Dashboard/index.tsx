import { Col, Row, Card } from 'react-bootstrap'
import { PageBreadcrumb } from '@/components'

const Dashboard = () => {
	const pages = [
		{
			title: "Criar Vídeos",
			description: "Gere vídeos automaticamente a partir de textos.",
			features: [
				"Tema do vídeo",
				"Módulo específico",
				"Avatar/Template",
				"Opção de busca de imagens"
			],
			icon: "ri-video-line"
		},
		{
			title: "Criar Vídeos Pexel",
			description: "Versão alternativa para geração de vídeos.",
			features: [
				"Seleção de voz",
				"Formato do vídeo (Mobile/Desktop)",
				"Número de cenas",
				"Estilo musical",
				"Opção de fonte das imagens"
			],
			icon: "ri-movie-line"
		},
		{
			title: "Criar Audiobook",
			description: "Ferramenta para geração de audiobooks.",
			features: [
				"Seleção de texto",
				"Escolha de voz",
				"Controle de velocidade",
				"Opções de formato"
			],
			icon: "ri-headphone-line"
		},
		{
			title: "Importar Arquivos",
			description: "Ferramenta para importação de arquivos.",
			features: [
				"Upload de arquivos",
				"Validação de formato",
				"Processamento automático",
				"Histórico de importações"
			],
			icon: "ri-upload-cloud-line"
		},
		{
			title: "Editar Vídeos Studio",
			description: "Editor avançado de vídeos.",
			features: [
				"Edição de cenas",
				"Ajuste de áudio",
				"Efeitos visuais",
				"Exportação em múltiplos formatos"
			],
			icon: "ri-film-line"
		},
		{
			title: "Configurações",
			description: "Gerencie as configurações do sistema.",
			features: [
				"Preferências de usuário",
				"Configurações de API",
				"Personalização de interface",
				"Gerenciamento de conta"
			],
			icon: "ri-settings-line"
		},
		{
			title: "Documentação",
			description: "Acesse a documentação completa do sistema.",
			features: [
				"Guias de uso",
				"Exemplos práticos",
				"Referência da API",
				"Tutoriais em vídeo"
			],
			icon: "ri-file-text-line",
			link: "/documentacao/index.html"
		},
		{
			title: "Arquivo Funcionalidades da Interface Gráfica",
			description: "Funcionalidades da Interface Gráfica / Workflow de Transformação.",
			features: [
				"Introdução",
				"Sumário",
				"",
				"",
			],
			icon: "ri-file-text-line",
			link: "https://docs.google.com/document/d/1vqFWXxnfJMD5vgNgJmi2SiVc054wDXffxVofR6-VZNs/edit?tab=t.0"
		}
	]

	return (
		<>
			<PageBreadcrumb title="Bem-vindo!" subName="Dashboard" />
			<Row>
				{pages.map((page, idx) => (
					<Col md={4} key={idx} className="mb-4">
						<Card className="h-100">
							<Card.Body>
								<div className="d-flex align-items-center mb-3">
									<i className={`${page.icon} h2 mb-0 me-2`}></i>
									<h5 className="mb-0">{page.title}</h5>
								</div>
								<p className="text-muted">{page.description}</p>
								<ul className="list-unstyled mb-3">
									{page.features.map((feature, i) => (
										<li key={i} className="mb-1">
											<i className="ri-checkbox-circle-line text-success me-1"></i>
											{feature}
										</li>
									))}
								</ul>
								{page.link && (
									<div className="text-end">
										<a 
											href={page.link} 
											target="_blank" 
											rel="noopener noreferrer"
											className="btn btn-primary btn-sm"
										>
											{page.link.includes('docs.google.com') ? 'Acessar Arquivo' : 'Acessar Documentação'}
											<i className="ri-external-link-line ms-1"></i>
										</a>
									</div>
								)}
							</Card.Body>
						</Card>
					</Col>
				))}
			</Row>
		</>
	)
}

export default Dashboard
