import { useEffect, useState, useCallback } from 'react';
import { Card, Col, Row, Form, Button, Table } from 'react-bootstrap';
import Select from 'react-select';
import { PageBreadcrumb } from '@/components';
import Swal from 'sweetalert2';
import { API_URL } from '@/config/api'

interface Voice {
	name: string;
	display: string;
	gender: string;
}

interface VideoFormat {
	value: string;
	label: string;
}

interface MusicStyle {
	value: string;
	label: string;
}

interface VideoInfo {
	URL: string;
	CREATE_DATE: string;
}

const CreateVideosPexel = () => {
	const [voices, setVoices] = useState<Voice[]>([]);
	const [selectedVoice, setSelectedVoice] = useState<string>('');
	const [loading, setLoading] = useState(true);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [theme, setTheme] = useState('');
	const [numScenes, setNumScenes] = useState<number>(6);
	const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);
	const [selectedMusic, setSelectedMusic] = useState<MusicStyle | null>(null);
	const [videos, setVideos] = useState<VideoInfo[]>([]);
	const [loadingVideos, setLoadingVideos] = useState(true);
	const [selectedSite, setSelectedSite] = useState('envato');

	const videoFormats: VideoFormat[] = [
		{ value: '1', label: 'Mobile (1080x1920)' },
		{ value: '2', label: 'Desktop (3840x2160)' }
	];

	const musicStyles: MusicStyle[] = [
		{ value: '1', label: 'Rock' },
		{ value: '2', label: 'Electronic' },
		{ value: '3', label: 'Jazz' },
		{ value: '4', label: 'Classical' },
		{ value: '5', label: 'Ambient' },
		{ value: '6', label: 'Pop' },
		{ value: '7', label: 'Funk' },
		{ value: '8', label: 'Hip Hop' },
		{ value: '9', label: 'Reggae' },
		{ value: '10', label: 'Latin' },
		{ value: '11', label: 'World' },
		{ value: '12', label: 'Lounge' },
		{ value: '13', label: 'Folk' },
		{ value: '14', label: 'Blues' }
	];

	// Função para buscar a lista de vídeos
	const fetchVideos = useCallback(async () => {
		try {
			setIsRefreshing(true);
			const response = await fetch(`${API_URL}/video_pexel/list`);
			if (!response.ok) throw new Error('Erro ao buscar vídeos');
			
			const data = await response.json();
			console.log('Vídeos atualizados:', data.videos || []);
			setVideos(data.videos || []);
		} catch (error) {
			console.error('Erro ao buscar vídeos:', error);
			Swal.fire({
				title: 'Erro!',
				text: 'Falha ao carregar lista de vídeos',
				icon: 'error'
			});
		} finally {
			setLoadingVideos(false);
			setIsRefreshing(false);
		}
	}, []);

	useEffect(() => {
		const fetchVoices = async () => {
			try {
				const response = await fetch(`${API_URL}/video_pexel/voices`);
				if (!response.ok) throw new Error('Erro ao buscar vozes');
				
				const data = await response.json();
				const voicesArray = Object.entries(data.voices).map(([key, value]: [string, any]) => ({
					name: value.name,
					display: value.display,
					gender: value.gender
				}));
				
				setVoices(voicesArray);
				console.log('Vozes carregadas:', voicesArray);
			} catch (error) {
				console.error('Erro:', error);
				Swal.fire({
					title: 'Erro!',
					text: 'Falha ao carregar vozes disponíveis',
					icon: 'error'
				});
			} finally {
				setLoading(false);
			}
		};

		fetchVoices();
		fetchVideos();
	}, [fetchVideos]);

	const handleSubmit = async () => {
		if (!selectedVoice || !selectedFormat || !selectedMusic) {
			Swal.fire({
				title: 'Atenção!',
				text: 'Preencha todos os campos obrigatórios',
				icon: 'warning'
			});
			return;
		}

		try {
			setIsGenerating(true);

			const response = await fetch(`${API_URL}/video_pexel/generate`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					voice: selectedVoice,
					format: selectedFormat.value,
					theme: theme || undefined,
					num_scenes: numScenes,
					music_style: selectedMusic.value,
					site: selectedSite
				})
			});

			const data = await response.json();

			if (!response.ok || data.status === 'error') {
				throw new Error(data.message || 'Erro ao gerar vídeo');
			}

			// Mostrar mensagem de sucesso apenas se não houver erro
			Swal.fire({
				title: 'Sucesso!',
				text: 'Vídeo está sendo gerado',
				icon: 'success'
			});

			// Limpar formulário após criação bem-sucedida
			setTheme('');
			setNumScenes(6);
			setSelectedFormat(null);
			setSelectedMusic(null);
			
			// Aguardar um momento para dar tempo do servidor processar
			setTimeout(() => {
				// Atualizar a lista de vídeos
				fetchVideos();
			}, 2000);
			
		} catch (error) {
			console.error('Erro:', error);
			Swal.fire({
				title: 'Erro!',
				text: error instanceof Error ? error.message : 'Falha ao gerar vídeo',
				icon: 'error'
			});
		} finally {
			setIsGenerating(false);
		}
	};

	// Função para forçar uma atualização manual da lista de vídeos
	const handleRefreshVideos = () => {
		fetchVideos();
	};

	return (
		<>
			<PageBreadcrumb title="Create Videos Pexel" subName="Pages" />
			<Row>
				<Col>
					<Card>
						<Card.Body>
							<h4 className="header-title mb-3">Configurações do Vídeo</h4>

							<Form.Group className="mb-3">
								<Form.Label>Voz</Form.Label>
								<Form.Select 
									value={selectedVoice}
									onChange={(e) => setSelectedVoice(e.target.value)}
									disabled={loading || isGenerating}
								>
									<option value="">Selecione uma voz...</option>
									{voices.map((voice, index) => (
										<option key={index} value={voice.name}>
											{voice.display} ({voice.gender})
										</option>
									))}
								</Form.Select>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Label>Formato do Vídeo</Form.Label>
								<Select
									options={videoFormats}
									value={selectedFormat}
									onChange={setSelectedFormat}
									placeholder="Selecione o formato..."
									isDisabled={isGenerating}
								/>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Label>Tema do Vídeo (opcional)</Form.Label>
								<Form.Control
									type="text"
									value={theme}
									onChange={(e) => setTheme(e.target.value)}
									placeholder="Digite um tema específico..."
									disabled={isGenerating}
								/>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Label>Número de Cenas (1-10)</Form.Label>
								<Form.Control
									type="number"
									value={numScenes}
									onChange={(e) => setNumScenes(Number(e.target.value))}
									min={1}
									max={10}
									disabled={isGenerating}
								/>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Label>Estilo Musical</Form.Label>
								<Select
									options={musicStyles}
									value={selectedMusic}
									onChange={setSelectedMusic}
									placeholder="Selecione o estilo musical..."
									isDisabled={isGenerating}
								/>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Label>Site para Busca de Imagens</Form.Label>
								<div>
									<Form.Check
										inline
										type="radio"
										id="site-envato"
										label="Envato"
										checked={selectedSite === 'envato'}
										onChange={() => setSelectedSite('envato')}
										disabled={isGenerating || !selectedFormat || !selectedMusic || loading}
									/>
									<Form.Check
										inline
										type="radio"
										id="site-pexel"
										label="Pexel"
										checked={selectedSite === 'pexel'}
										onChange={() => setSelectedSite('pexel')}
										disabled={isGenerating || !selectedFormat || !selectedMusic || loading}
									/>
								</div>
							</Form.Group>

							<div className="text-end">
								<Button 
									variant="primary"
									onClick={handleSubmit}
									disabled={loading || isGenerating || !selectedVoice || !selectedFormat || !selectedMusic}
								>
									{isGenerating ? (
										<>
											<span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
											Gerando Vídeo...
										</>
									) : (
										'Gerar Vídeo'
									)}
								</Button>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
			<Row className="mt-3">
				<Col>
					<Card>
						<Card.Body>
							<div className="d-flex justify-content-between align-items-center mb-3">
								<h4 className="header-title m-0">Vídeos Gerados</h4>
								<Button 
									variant="outline-secondary" 
									size="sm"
									onClick={handleRefreshVideos}
									disabled={isRefreshing}
								>
									{isRefreshing ? (
										<>
											<span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
											Atualizando...
										</>
									) : (
										<>
											<i className="ri-refresh-line me-1"></i>
											Atualizar Lista
										</>
									)}
								</Button>
							</div>
							<div className="table-responsive">
								<Table className="table-centered mb-0">
									<thead>
										<tr>
											<th>URL do Vídeo</th>
											<th>Data de Criação</th>
											<th>Ações</th>
										</tr>
									</thead>
									<tbody>
										{(loadingVideos || isRefreshing) ? (
											<tr>
												<td colSpan={3} className="text-center">
													<span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
													Carregando...
												</td>
											</tr>
										) : videos.length === 0 ? (
											<tr>
												<td colSpan={3} className="text-center">
													Nenhum vídeo encontrado
												</td>
											</tr>
										) : (
											videos.map((video, index) => (
												<tr key={`${video.URL}-${index}`}>
													<td>
														<a 
															href={video.URL} 
															target="_blank" 
															rel="noopener noreferrer"
															className="text-primary"
														>
															{video.URL.substring(0, 50)}...
														</a>
													</td>
													<td>
														{new Date(video.CREATE_DATE).toLocaleString()}
													</td>
													<td>
														<Button
															variant="outline-primary"
															size="sm"
															className="me-1"
															onClick={() => window.open(video.URL, '_blank')}
														>
															<i className="ri-video-line"></i>
														</Button>
													</td>
												</tr>
											))
										)}
									</tbody>
								</Table>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</>
	);
};

export default CreateVideosPexel;