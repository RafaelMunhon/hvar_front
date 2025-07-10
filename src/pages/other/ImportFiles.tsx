import { useState, useEffect } from 'react'
import {
	Card,
	Col,
	Row,
	Form,
	Button,
	Table,
	Modal,
	Toast,
	ToastContainer
} from 'react-bootstrap'
import Swal from 'sweetalert2'

// components
import { PageBreadcrumb } from '@/components'
import { API_URL } from '@/config/api'

interface LogItem {
	id: string
	name: string
	theme: string
	tituloNc: string
	modulo: string
	createDate: string
}

interface FilterParams {
	id?: string
	tituloNc?: string
	name?: string
}

interface DuplicateFileInfo {
    fileName: string;
    id: string;
    theme: string;
    file: File;
}

const ImportFiles = () => {
	const [file, setFile] = useState<File[] | null>(null)
	const [logs, setLogs] = useState<LogItem[]>([])
	const [loading, setLoading] = useState(true)
	const [filters, setFilters] = useState<FilterParams>({
		id: '',
		tituloNc: '',
		name: ''
	})
	
	// Estados para o modal de confirmação
	const [showDuplicateModal, setShowDuplicateModal] = useState(false);
	const [duplicateFile, setDuplicateFile] = useState<DuplicateFileInfo | null>(null);
	const [uploadQueue, setUploadQueue] = useState<File[]>([]);
	const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
	const [uploadInProgress, setUploadInProgress] = useState(false);
	const [updateLoading, setUpdateLoading] = useState(false);

	// Adicionar estados para o toast
	const [showToast, setShowToast] = useState(false);
	const [toastMessage, setToastMessage] = useState('');
	const [toastType, setToastType] = useState<'success' | 'danger'>('success');

	const fetchLogs = async (params?: FilterParams) => {
		try {
			const queryParams = new URLSearchParams()
			if (params?.id) queryParams.append('id', params.id)
			if (params?.tituloNc) queryParams.append('titulo_nc', params.tituloNc)
			if (params?.name) queryParams.append('name', params.name)

			const url = `${API_URL}/get_data?${queryParams.toString()}`
			const response = await fetch(url)
			if (!response.ok) throw new Error('Erro ao buscar dados')

			const data = await response.json()
 
			const formattedLogs: LogItem[] = data.map((item: any) => ({
				id: item.ID,
				name: item.NAME,
				theme: item.THEME,
				tituloNc: item.TITULO_NC,
				modulo: item.MODULO,
				createDate: new Date(item.CREATE_DATE).toLocaleString()
			}))

			setLogs(formattedLogs)
		} catch (error) {
			console.error('Erro ao buscar logs:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchLogs()
	}, [])

	// Efeito para processar a fila de upload
	useEffect(() => {
		if (uploadInProgress && uploadQueue.length > 0 && currentUploadIndex < uploadQueue.length) {
			processNextUpload();
		} else if (uploadInProgress && currentUploadIndex >= uploadQueue.length) {
			// Finaliza o processo de upload quando todos os arquivos foram processados
			setUploadInProgress(false);
			setUploadQueue([]);
			setCurrentUploadIndex(0);
			fetchLogs(); // Atualiza a lista
            setFile(null);
            
            // Limpar input
            const fileInput = document.getElementById('fileInput') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
		}
	}, [uploadInProgress, uploadQueue, currentUploadIndex]);

	const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setFilters(prev => ({
			...prev,
			[name]: value
		}))
	}

	const handleFilter = (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		fetchLogs(filters)
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(Array.from(e.target.files));
        }
    }

	// Verifica se o arquivo já existe no banco de dados
	const checkFileExists = async (fileName: string) => {
		try {
			// MODIFICAÇÃO AQUI: Corrigido o caminho da API para incluir "/import"
			const response = await fetch(`${API_URL}/import/check_file_exists?name=${encodeURIComponent(fileName)}`);
			
			console.log(`Verificando arquivo: ${fileName}`);
			console.log(`Status da resposta: ${response.status}`);
			
			if (!response.ok) {
				console.error(`Erro ao verificar arquivo: Status ${response.status}`);
				return { exists: false };
			}
			
			const data = await response.json();
			console.log(`Resposta da verificação:`, data);
			return data;
		} catch (error) {
			console.error('Erro ao verificar arquivo:', error);
			return { exists: false };
		}
	};

	// Inicia o processo de upload
	const handleUpload = async () => {
        if (!file || file.length === 0) return;

        setUploadQueue(file);
        setCurrentUploadIndex(0);
        setUploadInProgress(true);
    };

	// Função para mostrar notificação
	const showNotification = (message: string, type: 'success' | 'danger') => {
		setToastMessage(message);
		setToastType(type);
		setShowToast(true);
	};

	// Processa o próximo arquivo na fila
	const processNextUpload = async () => {
		if (currentUploadIndex >= uploadQueue.length) return;
		
		const currentFile = uploadQueue[currentUploadIndex];
		
		try {
			const existsResponse = await checkFileExists(currentFile.name);
			
			if (existsResponse.exists) {
				setDuplicateFile({
					fileName: currentFile.name,
					id: existsResponse.id,
					theme: existsResponse.theme,
					file: currentFile
				});
				setShowDuplicateModal(true);
				setUploadInProgress(false);
			} else {
				const result = await uploadFile(currentFile, false);
				if (result.status === 200) {
					Swal.fire({
						title: 'Sucesso!',
						text: `Arquivo ${currentFile.name} importado com sucesso!`,
						icon: 'success'
					});
				}
				setCurrentUploadIndex(prev => prev + 1);
			}
		} catch (error) {
			console.error('Erro ao processar arquivo:', error);
			Swal.fire({
				title: 'Erro!',
				text: `Erro ao importar ${currentFile.name}: ${error.message}`,
				icon: 'error'
			});
			setCurrentUploadIndex(prev => prev + 1);
		}
	};

	// Função para fazer o upload de um arquivo
	const uploadFile = async (file: File, isUpdate: boolean = false, fileId?: string) => {
		const formData = new FormData();
		formData.append('file', file);
		
		if (isUpdate && fileId) {
			formData.append('update', 'true');
			formData.append('file_id', fileId);
		}
		
		const response = await fetch(`${API_URL}/import`, {
			method: 'POST',
			body: formData,
		});

		const data = await response.json();
		
		if (!response.ok) {
			throw new Error(data.message || `Erro ao importar arquivo: ${file.name}`);
		}
		
		return { status: response.status, data };
	};

	// Lidar com a confirmação do usuário para atualizar
	const handleUpdateConfirm = async () => {
		if (!duplicateFile) return;
		
		setUpdateLoading(true);
		
		try {
			const result = await uploadFile(duplicateFile.file, true, duplicateFile.id);
			if (result.status === 200) {
				Swal.fire({
					title: 'Sucesso!',
					text: `Arquivo ${duplicateFile.fileName} atualizado com sucesso!`,
					icon: 'success'
				});
			}
			
			setShowDuplicateModal(false);
			setDuplicateFile(null);
			setCurrentUploadIndex(prev => prev + 1);
			setUploadInProgress(true);
		} catch (error) {
			console.error('Erro ao atualizar arquivo:', error);
			Swal.fire({
				title: 'Erro!',
				text: `Erro ao atualizar ${duplicateFile.fileName}: ${error.message}`,
				icon: 'error'
			});
			setShowDuplicateModal(false);
			setDuplicateFile(null);
			setCurrentUploadIndex(prev => prev + 1);
			setUploadInProgress(true);
		} finally {
			setUpdateLoading(false);
		}
	};

	// Lidar com a recusa do usuário para atualizar
	const handleUpdateCancel = () => {
		setShowDuplicateModal(false);
		setDuplicateFile(null);
		setCurrentUploadIndex(prev => prev + 1);
		setUploadInProgress(true); // Continua para o próximo arquivo
	};

	const handleDownload = async (id: string, tituloNc: string) => {
		try {
			const response = await fetch(`${API_URL}/download/${encodeURIComponent(tituloNc)}`)
			if (!response.ok) throw new Error('Erro ao baixar arquivo')

			const blob = await response.blob()
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `${tituloNc}.json`
			document.body.appendChild(a)
			a.click()
			window.URL.revokeObjectURL(url)
			document.body.removeChild(a)
		} catch (error) {
			console.error('Erro ao fazer download:', error)
		}
	}

	return (
		<>
			<PageBreadcrumb title="Import Files" subName="Pages" />

			<Row>
				<Col>
					<Card>
						<Card.Body>
							<h4 className="header-title">Import Files</h4>
							<p className="text-muted">
								Página de importação de arquivos
							</p>
							<Form.Group className="mb-3">
								<Form.Label>Selecione um arquivo (JSON ou ZIP)</Form.Label>
								<Form.Control
									id="fileInput"
									type="file"
									accept=".json,.zip,.txt"
									onChange={handleFileChange}
									multiple
								/>
							</Form.Group>
							<Button 
								variant="primary"
								onClick={handleUpload}
								disabled={!file || uploadInProgress}
							>
								{uploadInProgress ? 'Importando...' : 'Importar'}
							</Button>
						</Card.Body>
					</Card>
				</Col>
			</Row>

			{/* Filtros */}
			<Row className="mb-3">
				<Col>
					<Card>
						<Card.Body>
							<h4 className="header-title mb-3">Filtros</h4>
							<Form onSubmit={handleFilter}>
								<Row>
									<Col md={4}>
										<Form.Group className="mb-3">
											<Form.Label>Nome</Form.Label>
											<Form.Control
												type="text"
												name="name"
												value={filters.name}
												onChange={handleFilterChange}
												placeholder="Digite o Nome do Arquivo"
											/>
										</Form.Group>
									</Col>
									<Col md={4}>
										<Form.Group className="mb-3">
											<Form.Label>Título NC</Form.Label>
											<Form.Control
												type="text"
												name="tituloNc"
												value={filters.tituloNc}
												onChange={handleFilterChange}
												placeholder="Digite o título NC"
											/>
										</Form.Group>
									</Col>
									<Col md={4}>
										<Form.Group className="mb-3">
											<Form.Label>ID</Form.Label>
											<Form.Control
												type="text"
												name="id"
												value={filters.id}
												onChange={handleFilterChange}
												placeholder="Digite o ID"
											/>
										</Form.Group>
									</Col>
								</Row>
								<div className="text-end">
									<Button type="submit" variant="primary">
										Filtrar
									</Button>
								</div>
							</Form>
						</Card.Body>
					</Card>
				</Col>
			</Row>

			<Row>
				<Col>
					<Card>
						<Card.Body>
							<h4 className="header-title mb-3">Histórico de Importações</h4>
							<Table responsive className="table-centered">
								<thead>
									<tr>
										<th>Nome do Arquivo</th>
										<th>Tema</th>
										<th>Título NC</th>
										<th>Módulo</th>
										<th>Data de Criação</th>
										<th>Ações</th>
									</tr>
								</thead>
								<tbody>
									{loading ? (
										<tr>
											<td colSpan={6} className="text-center">
												Carregando...
											</td>
										</tr>
									) : logs.length === 0 ? (
										<tr>
											<td colSpan={6} className="text-center">
												Nenhum registro encontrado
											</td>
										</tr>
									) : (
										logs.map((log) => (
											<tr key={log.id}>
												<td>{log.name}</td>
												<td>{log.theme}</td>
												<td>{log.tituloNc}</td>
												<td>{log.modulo}</td>
												<td>{log.createDate}</td>
												<td>
													<Button
														variant="outline-primary"
														size="sm"
														onClick={() => handleDownload(log.id, log.tituloNc)}
														title="Download JSON"
													>
														<i className="ri-download-2-line"></i>
													</Button>
												</td>
											</tr>
										))
									)}
								</tbody>
							</Table>
						</Card.Body>
					</Card>
				</Col>
			</Row>
            
            {/* Modal de confirmação para arquivos duplicados */}
            <Modal show={showDuplicateModal} onHide={handleUpdateCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>Arquivo Duplicado</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>O arquivo <strong>{duplicateFile?.fileName}</strong> já existe na base de dados.</p>
                    <p>Tema: <strong>{duplicateFile?.theme}</strong></p>
                    <p>Deseja atualizar o arquivo existente?</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="secondary" 
                        onClick={handleUpdateCancel}
                        disabled={updateLoading}
                    >
                        Não
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleUpdateConfirm}
                        disabled={updateLoading}
                    >
                        {updateLoading ? 'Atualizando...' : 'Sim, Atualizar'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Adicionar o ToastContainer no final do componente */}
            <ToastContainer 
                position="top-end" 
                className="p-3" 
                style={{ zIndex: 9999 }}
            >
                <Toast 
                    show={showToast} 
                    onClose={() => setShowToast(false)} 
                    delay={3000} 
                    autohide 
                    bg={toastType}
                >
                    <Toast.Header>
                        <strong className="me-auto">
                            {toastType === 'success' ? 'Sucesso!' : 'Erro!'}
                        </strong>
                    </Toast.Header>
                    <Toast.Body className={toastType === 'success' ? '' : 'text-white'}>
                        {toastMessage}
                    </Toast.Body>
                </Toast>
            </ToastContainer>
		</>
	)
}

export default ImportFiles