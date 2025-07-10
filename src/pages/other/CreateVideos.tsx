import { useState, useEffect } from 'react'
import {
	Card,
	Col,
	Row,
	Button,
	Form,
	Table,
} from 'react-bootstrap'
import Select from 'react-select'
import avatar1 from '@/assets/images/avatar/avatar1.png';
import avatar2 from '@/assets/images/avatar/avatar2.png';
import avatar3 from '@/assets/images/avatar/avatar3.png';
import avatar4 from '@/assets/images/avatar/avatar3.png';
import avatar5 from '@/assets/images/avatar/avatar5.png';
import avatar6 from '@/assets/images/avatar/avatar6.png';
import avatar7 from '@/assets/images/avatar/avatar7.png';
import Swal from 'sweetalert2'

// components
import { PageBreadcrumb } from '@/components'
import { API_URL } from '@/config/api'

interface Option {
	value: string
	label: string
	module?: string
	nucleo?: string
}

interface ThemeOption {
	value: string
	label: string
	modules: {
		value: string
		label: string
		titulos: Option[]
	}[]
}

interface ModuleOption {
	value: string;
	label: string;
	titulos: Option[];  // Remova themes e use titulos
}

interface VideoInfo {
	URL: string;
	CREATE_DATE: string;
	titulo: string;
	url: string;
	data_criacao: string;
}

interface DataItem {
	TITULO_NC: string;
	THEME: string;
	MODULO: string;
	ID: string;
	NUCLEO: string;
}

const CreateVideos = () => {
	const [moduleOptions, setModuleOptions] = useState<ModuleOption[]>([])
	const [selectedModule, setSelectedModule] = useState<ModuleOption | null>(null)
	const [themeOptions, setThemeOptions] = useState<ThemeOption[]>([])
	const [selectedTheme, setSelectedTheme] = useState<ThemeOption | null>(null)
	const [loading, setLoading] = useState(true)
	const [selectedOption, setSelectedOption] = useState<Option | null>(null)
	const [buscaImagem, setBuscaImagem] = useState(false)
	const [selectedAvatar, setSelectedAvatar] = useState('')
	const [videos, setVideos] = useState<VideoInfo[]>([])
	const [loadingVideos, setLoadingVideos] = useState(true)

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch(`${API_URL}/get_data`);
				if (!response.ok) throw new Error('Erro ao buscar dados');

				const data = await response.json();
				
				// Filtrar atividades antes de agrupar
				const filteredData = data.filter((item: DataItem) => 
					item && 
					item.TITULO_NC && 
					!item.TITULO_NC.toLowerCase().includes('atividade')
				);
				
				// Agrupar por tema primeiro
				const themeMap = new Map<string, Map<string, Option[]>>();
				
				filteredData.forEach((item: any) => {
					const theme = item.THEME;
					const module = item.MODULO || 'Introdução';

					if (!themeMap.has(theme)) {
						themeMap.set(theme, new Map());
					}
					
					if (!themeMap.get(theme)!.has(module)) {
						themeMap.get(theme)!.set(module, []);
					}

					themeMap.get(theme)!.get(module)!.push({
						value: item.ID,
						label: item.TITULO_NC,
						module: module,
						nucleo: item.NUCLEO
					});
				});

				// Converter para array de ThemeOption
				const themes: ThemeOption[] = Array.from(themeMap.entries()).map(([theme, moduleMap]) => ({
					value: theme,
					label: theme,
					modules: Array.from(moduleMap.entries())
						.sort((a, b) => {
							// Ordenar módulos numericamente (ex: "Módulo 1" vem antes de "Módulo 2")
							const numA = parseInt(a[0].match(/\d+/)?.[0] || '0');
							const numB = parseInt(b[0].match(/\d+/)?.[0] || '0');
							return numA - numB;
						})
						.map(([module, titulos]) => ({
							value: module,
							label: module,
							titulos: titulos.sort((a, b) => {
								const getNCNumber = (nucleo: string = '') => {
									const match = nucleo.match(/nc\s*(\d+)/i);
									return parseInt(match?.[1] || '0');
								};
								
								const numA = getNCNumber(a.nucleo);
								const numB = getNCNumber(b.nucleo);
								return numA - numB;
							})
						}))
				}));

				setThemeOptions(themes);
				setModuleOptions([]);
			} catch (error) {
				console.error('Erro:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	useEffect(() => {
		const fetchVideos = async () => {
			try {
				const response = await fetch(`${API_URL}/video/list`)
				if (!response.ok) throw new Error('Erro ao buscar vídeos')

				const data = await response.json()
				setVideos(data)
			} catch (error) {
				console.error('Erro ao buscar vídeos:', error)
			} finally {
				setLoadingVideos(false)
			}
		}

		fetchVideos()
	}, [])

	const handleChange = (option: Option | null) => {
		setSelectedOption(option)
		// Aqui você pode adicionar lógica adicional quando um título for selecionado
	}

	const handleCreateVideo = async () => {
		if (!selectedTheme || !selectedOption || !selectedAvatar) {
			console.error('Selecione um tema, título e template antes de criar o vídeo.');
			return;
		}

		const data = {
			theme: selectedTheme.value,
			titulo_nc: selectedOption.label,
			id: selectedOption.value,
			avatar_number: selectedAvatar.replace('avatar', ''),
			busca_imagem: buscaImagem,
		}

		try {
			setLoading(true);
			const response = await fetch(`${API_URL}/video/generate_template`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error('Erro ao criar vídeo');
			}

			const result = await response.json();
			console.log('Vídeo criado com sucesso:', result);
			
			// Recarregar a lista de vídeos
			const videosResponse = await fetch(`${API_URL}/video/list`);
			if (videosResponse.ok) {
				const videosData = await videosResponse.json();
				setVideos(videosData);
			}

			// Mostrar mensagem de sucesso
			Swal.fire({
				title: 'Sucesso!',
				text: 'Vídeo gerado com sucesso',
				icon: 'success'
			});
		} catch (error) {
			console.error('Erro ao criar vídeo:', error);
			Swal.fire({
				title: 'Erro!',
				text: 'Falha ao gerar vídeo',
				icon: 'error'
			});
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<PageBreadcrumb title="Create Videos" subName="Pages" />
			<Row>
				<Col>
					<Card>
						<Card.Body translate="no">
							<h4 className="header-title mb-3">Criar Vídeos</h4>

							<Form.Group className="mb-3">
								<Form.Label>Tema</Form.Label>
								<Select
									className="react-select"
									classNamePrefix="react-select"
									options={themeOptions}
									value={selectedTheme}
									onChange={(option) => {
										setSelectedTheme(option as ThemeOption);
										setSelectedModule(null);
										setSelectedOption(null);
										setModuleOptions(option ? option.modules : []);
									}}
									isLoading={loading}
									placeholder="Selecione um tema..."
									isClearable
									isDisabled={loading}
								/>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Label>Módulo</Form.Label>
								<Select
									className="react-select"
									classNamePrefix="react-select"
									options={moduleOptions}
									value={selectedModule}
									onChange={(option) => {
										setSelectedModule(option as ModuleOption);
										setSelectedOption(null);
									}}
									isLoading={loading}
									placeholder="Selecione um módulo..."
									isClearable
									isDisabled={!selectedTheme || loading}
								/>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Label>Título</Form.Label>
								<Select
									className="react-select"
									classNamePrefix="react-select"
									options={selectedModule?.titulos || []}
									value={selectedOption}
									onChange={handleChange}
									isLoading={loading}
									placeholder="Selecione um título..."
									isClearable
									isDisabled={!selectedModule || loading}
								/>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Label>Busca de Imagem</Form.Label>
								<div>
									<Form.Check
										inline
										type="radio"
										id="busca-imagem-sim"
										label="Buscar nova imagem"
										checked={buscaImagem}
										onChange={() => setBuscaImagem(true)}
										disabled={!selectedOption || loading}
									/>
									<Form.Check
										inline
										type="radio"
										id="busca-imagem-nao"
										label="Usar imagem do arquivo"
										checked={!buscaImagem}
										onChange={() => setBuscaImagem(false)}
										disabled={!selectedOption || loading}
									/>
								</div>
							</Form.Group>

							<Form.Group className="mb-3">
								<Form.Label>Selecione o Template</Form.Label>
								<Row className="g-2">
									{[
										{ id: 'avatar1', img: avatar1, scenes: 5 },
										{ id: 'avatar2', img: avatar2, scenes: 6 },
										{ id: 'avatar3', img: avatar3, scenes: 7 },
										{ id: 'avatar4', img: avatar4, scenes: 1 },
										{ id: 'avatar5', img: avatar5, scenes: 5 },
										{ id: 'avatar6', img: avatar6, scenes: 6 },
										{ id: 'avatar7', img: avatar7, scenes: 7 },
									].map((avatar) => (
										<Col key={avatar.id} sm={4}>
											<Card 
												className={`cursor-pointer ${selectedAvatar === avatar.id ? 'border-primary border-2 shadow' : 'border'}`}
												onClick={() => setSelectedAvatar(avatar.id)}
												style={{ 
													transition: 'all 0.2s',
													transform: selectedAvatar === avatar.id ? 'scale(1.02)' : 'none'
												}}
											>
												<Card.Body className="text-center p-2">
													<img 
														src={avatar.img} 
														alt={`Template ${avatar.id}`} 
														className="img-fluid mb-2" 
														style={{ width: '200px', height: '200px', objectFit: 'cover' }}
													/>
													<div className="mt-2">
														<div className="fw-bold">Template {avatar.id.replace('avatar', '')}</div>
														<div className="text-muted">{avatar.scenes} cenas</div>
													</div>
												</Card.Body>
											</Card>
										</Col>
									))}
								</Row>
							</Form.Group>

							<div className="text-end mt-4">
								<Button
									variant="primary"
									onClick={handleCreateVideo}
									disabled={!selectedOption || !selectedAvatar || loading}
								>
									{loading ? (
										<>
											<span className="spinner-border spinner-border-sm me-1" />
											Gerando Vídeo...
										</>
									) : (
										<>
											<i className="ri-video-add-line me-1"></i>
											Gerar Vídeo
										</>
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
						<Card.Body translate="no">
							<h4 className="header-title">Vídeos Gerados</h4>
							<div className="table-responsive">
								<Table className="table-centered mb-0">
									<thead>
										<tr>
											<th>Título NC</th>
											<th>URL do Vídeo</th>
											<th>Data de Criação</th>
											<th>Ações</th>
										</tr>
									</thead>
									<tbody>
										{loadingVideos ? (
											<tr>
												<td colSpan={4} className="text-center">
													Carregando...
												</td>
											</tr>
										) : videos.length === 0 ? (
											<tr>
												<td colSpan={4} className="text-center">
													Nenhum vídeo encontrado
												</td>
											</tr>
										) : (
											videos.map((video) => (
												<tr key={`${video.titulo}-${video.data_criacao}`}>
													<td>{video.titulo}</td>
													<td>
														<a 
															href={video.url} 
															target="_blank" 
															rel="noopener noreferrer"
															className="text-primary"
														>
															{video.url.substring(0, 50)}...
														</a>
													</td>
													<td>
														{video.data_criacao ? new Date(video.data_criacao).toLocaleString() : 'Data não disponível'}
													</td>
													<td>
														<Button
															variant="outline-primary"
															size="sm"
															className="me-1"
															onClick={() => window.open(video.url, '_blank')}
														>
															<i className="ri-eye-line"></i>
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
	)
}

export default CreateVideos
