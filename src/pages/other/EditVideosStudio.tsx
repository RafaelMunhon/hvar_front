import { useState, useEffect } from 'react';
import {
	Card,
	Col,
	Row,
	Form,
	Button,
	ProgressBar,
	Table,
} from 'react-bootstrap'
import axios from 'axios';
import { PageBreadcrumb } from '@/components'
import Swal from 'sweetalert2';
import { API_URL } from '@/config/api'

// Adicione a interface
interface VideoInfo {
	URL: string;
	CREATE_DATE: string;
}

const EditVideosStudio = () => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [processing, setProcessing] = useState(false);
	const [videos, setVideos] = useState<VideoInfo[]>([]);
	const [loadingVideos, setLoadingVideos] = useState(true);
	const [selectedSite, setSelectedSite] = useState('envato');

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			if (file.type.startsWith('video/')) {
				setSelectedFile(file);
			} else {
				Swal.fire({
					title: 'Erro!',
					text: 'Por favor, selecione apenas arquivos de vídeo',
					icon: 'error'
				});
				event.target.value = '';
			}
		}
	};

	// Adicione a função de buscar vídeos
	const fetchVideos = async () => {
		try {
			const response = await fetch(`${API_URL}/video_studio/list`);
			if (!response.ok) throw new Error('Erro ao buscar vídeos');
			
			const data = await response.json();
			setVideos(data.videos || []);
		} catch (error) {
			console.error('Erro:', error);
			Swal.fire({
				title: 'Erro!',
				text: 'Falha ao carregar lista de vídeos',
				icon: 'error'
			});
		} finally {
			setLoadingVideos(false);
		}
	};

	// Carregar vídeos ao montar o componente
	useEffect(() => {
		fetchVideos();
	}, []);

	const handleUpload = async () => {
		if (!selectedFile) return;

		try {
			setUploading(true);
			setUploadProgress(0);

			console.log('1. Arquivo selecionado:', {
				name: selectedFile.name,
				type: selectedFile.type,
				size: selectedFile.size
			});

			const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
			const fileName = `videos_studio/${timestamp}_${selectedFile.name}`;

			// 1. Obter URL de upload do backend
			const { data: uploadConfig } = await axios.post(`${API_URL}/video_studio/get_signed_url`, {
				fileName,
				contentType: selectedFile.type,
				fileSize: selectedFile.size
			});

			console.log('2. Config de upload recebida:', uploadConfig);

			// 2. Fazer upload usando a URL assinada com retry
			const maxRetries = 3;
			let currentTry = 0;
			let uploadSuccess = false;

			while (currentTry < maxRetries && !uploadSuccess) {
				try {
					currentTry++;
					console.log(`Tentativa de upload ${currentTry} de ${maxRetries}`);

					await new Promise((resolve, reject) => {
						const xhr = new XMLHttpRequest();
						
						xhr.upload.onprogress = (event) => {
							if (event.lengthComputable) {
								const progress = Math.round((event.loaded / event.total) * 100);
								setUploadProgress(progress);
							}
						};

						xhr.open('PUT', uploadConfig.signedUrl);
						xhr.setRequestHeader('Content-Type', selectedFile.type);
						
						xhr.onload = () => {
							if (xhr.status >= 200 && xhr.status < 300) {
								uploadSuccess = true;
								resolve(xhr.response);
							} else {
								console.error(`Upload falhou com status ${xhr.status}`);
								reject(new Error(`Upload failed with status ${xhr.status}`));
							}
						};
						
						xhr.onerror = () => {
							console.error('Erro de rede no upload');
							reject(new Error('Network error during upload'));
						};

						xhr.send(selectedFile);
					});

					if (uploadSuccess) break;
				} catch (error) {
					console.error(`Erro na tentativa ${currentTry}:`, error);
					if (currentTry === maxRetries) throw error;
					// Esperar um pouco antes da próxima tentativa
					await new Promise(resolve => setTimeout(resolve, 2000));
				}
			}

			if (!uploadSuccess) {
				throw new Error('Todas as tentativas de upload falharam');
			}

			setUploading(false);
			setProcessing(true);

			// 3. Notificar o backend
			const processResponse = await axios.post(`${API_URL}/video_studio/process`, {
				videoUrl: uploadConfig.publicUrl,
				site: selectedSite
			});

			console.log('4. Resposta do processamento:', processResponse);

			Swal.fire({
				title: 'Sucesso!',
				text: 'Vídeo enviado com sucesso',
				icon: 'success'
			});

			setSelectedFile(null);
			fetchVideos();

		} catch (error) {
			console.error('Erro completo:', error);
			let errorMessage = 'Falha ao enviar vídeo';
			
			if (error instanceof Error) {
				errorMessage = error.message;
			} else if (axios.isAxiosError(error) && error.response) {
				errorMessage = `Erro ${error.response.status}: ${error.response.data?.message || 'Erro desconhecido'}`;
			}

			Swal.fire({
				title: 'Erro!',
				text: errorMessage,
				icon: 'error'
			});
		} finally {
			setUploading(false);
			setProcessing(false);
			setUploadProgress(0);
		}
	};

	return (
		<>
			<PageBreadcrumb title="Edit Videos Studio" subName="Pages" />
			<Row>
				<Col>
					<Card>
						<Card.Body translate="no">
							<h4 className="header-title">Upload de Vídeo</h4>
							<p className="text-muted">
								Selecione um vídeo para edição
							</p>

							<Form.Group className="mb-3">
								<Form.Label>Arquivo de Vídeo</Form.Label>
								<Form.Control
									type="file"
									accept="video/*"
									onChange={handleFileSelect}
									disabled={uploading}
								/>
								<Form.Text className="text-muted">
									Formatos suportados: MP4, AVI, MOV
								</Form.Text>
							</Form.Group>

							{selectedFile && (
								<div className="mb-3">
									<p className="mb-1">Arquivo selecionado:</p>
									<p className="text-primary mb-0">{selectedFile.name}</p>
									<p className="text-muted small">
										Tamanho: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
									</p>
								</div>
							)}

							{uploading && (
								<div className="mb-3">
									<p className="mb-2">Fazendo upload do vídeo...</p>
									<ProgressBar 
										now={uploadProgress} 
										label={`${uploadProgress}%`}
										className="mb-3"
									/>
								</div>
							)}

							{processing && (
								<div className="mb-3">
									<div className="d-flex align-items-center">
										<div className="spinner-border spinner-border-sm me-2" role="status">
											<span className="visually-hidden">Processando...</span>
										</div>
										<p className="mb-0">Processando o vídeo... Isso pode levar alguns minutos.</p>
									</div>
								</div>
							)}

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
										disabled={uploading}
									/>
									<Form.Check
										inline
										type="radio"
										id="site-pexel"
										label="Pexel"
										checked={selectedSite === 'pexel'}
										onChange={() => setSelectedSite('pexel')}
										disabled={uploading}
									/>
									<Form.Check
										inline
										type="radio"
										id="site-none"
										label="Não utilizar imagens"
										checked={selectedSite === 'none'}
										onChange={() => setSelectedSite('none')}
										disabled={uploading}
									/>
								</div>
							</Form.Group>

							<div className="text-end">
								<Button
									variant="primary"
									onClick={handleUpload}
									disabled={!selectedFile || uploading || processing}
								>
									{uploading ? (
										<>
											<span className="spinner-border spinner-border-sm me-1" />
											Enviando...
										</>
									) : processing ? (
										<>
											<span className="spinner-border spinner-border-sm me-1" />
											Processando...
										</>
									) : (
										'Enviar Vídeo'
									)}
								</Button>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>

			{/* Adicione a tabela após o card de upload */}
			<Row className="mt-3">
				<Col>
					<Card>
						<Card.Body translate="no">
							<h4 className="header-title">Vídeos Enviados</h4>
							<div className="table-responsive">
								<Table className="table-centered mb-0">
									<thead>
										<tr>
											<th>URL do Vídeo</th>
											<th>Data de Envio</th>
											<th>Ações</th>
										</tr>
									</thead>
									<tbody>
										{loadingVideos ? (
											<tr>
												<td colSpan={3} className="text-center">
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
											videos.map((video) => (
												<tr key={`${video.URL}-${video.CREATE_DATE}`}>
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
	)
}

export default EditVideosStudio
