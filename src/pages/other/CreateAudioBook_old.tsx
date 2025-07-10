import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Form, Button, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import { PageBreadcrumb } from '@/components';
import JSZip from 'jszip';

interface JsonFile {
    filename: string;
    content: any;
}

interface GCSFile {
    name: string;
    url: string;
}

interface GCSTreeNode {
    name: string;
    type: 'folder' | 'file';
    path: string;
    url?: string; // Apenas para arquivos
    children?: GCSTreeNode[]; // Apenas para pastas
    isExpanded?: boolean; // Novo estado para controlar a expansão
}

const CreateAudioBook: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [jsonFiles, setJsonFiles] = useState<JsonFile[]>([]);
    const [selectedJsonFiles, setSelectedJsonFiles] = useState<string[]>([]);
    const [gcsFiles, setGcsFiles] = useState<GCSFile[]>([]);
    const [loadingGcs, setLoadingGcs] = useState<boolean>(true);
    const [errorGcs, setErrorGcs] = useState<string | null>(null);
    const [gcsTree, setGcsTree] = useState<GCSTreeNode | null>(null); // Novo estado para a árvore
    const [selectAll, setSelectAll] = useState(false); // Novo estado para "Selecionar Todos"

    useEffect(() => {
        const fetchGcsFiles = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/audiobook/list_files');
                console.log("Response API:", response);

                setGcsFiles(response?.data?.files || []);
                setLoadingGcs(false);

            } catch (error: any) {
                console.error('Erro ao obter lista de arquivos do GCS:', error);
                setErrorGcs(`Erro ao obter lista de arquivos: ${error.message}`);
                setLoadingGcs(false);
            }
        };

        fetchGcsFiles();
    }, []);

    useEffect(() => {
        // Construir a árvore quando os arquivos do GCS forem carregados
        if (gcsFiles.length > 0) {
            const tree = buildGCSTree(gcsFiles);
            setGcsTree(tree);
        }
    }, [gcsFiles]);

    // Função para construir a árvore a partir da lista flat de arquivos
    const buildGCSTree = (files: GCSFile[]): GCSTreeNode => {
        const root: GCSTreeNode = { name: 'root', type: 'folder', path: '', children: [], isExpanded: true };
        files.forEach(file => {
            const pathParts = file.name.split('/');
            let current = root;
            let currentPath = '';

            pathParts.forEach((part, index) => {
                currentPath += part + '/';
                currentPath = currentPath.slice(0, -1); // Remover a última barra

                const existingNode = current.children?.find(child => child.name === part);

                if (existingNode) {
                    current = existingNode;
                } else {
                    const newNode: GCSTreeNode = {
                        name: part,
                        path: currentPath,
                        type: index === pathParts.length - 1 ? 'file' : 'folder', // Último é um arquivo
                        ...(index === pathParts.length - 1 ? { url: `https://storage.googleapis.com/yduqs-audio-web/${encodeURIComponent(file.name)}` } : {}), // Adicionar URL para arquivos
                        children: index === pathParts.length - 1 ? undefined : [], // Não adicionar children para arquivos
                        isExpanded: false // Inicialmente, as pastas não estão expandidas
                    };
                    if (current.children) {
                        current.children.push(newNode);
                    }
                    current = newNode;
                }
                currentPath += '/';
            });
        });
        return root;
    };

    const handleToggleExpand = (node: GCSTreeNode) => {
        if (node.type === 'folder' && gcsTree) {
            // Função auxiliar para atualizar o nó na árvore
            const updateNode = (tree: GCSTreeNode): GCSTreeNode => {
                if (tree === node) {
                    return { ...tree, isExpanded: !tree.isExpanded };
                }

                if (tree.children) {
                    const updatedChildren = tree.children.map(child => updateNode(child));
                    return { ...tree, children: updatedChildren };
                }

                return tree;
            };

            const updatedTree = updateNode(gcsTree);
            setGcsTree({ ...updatedTree });
        }
    };


    const renderGCSTree = (node: GCSTreeNode, isRoot: boolean = true): React.ReactNode => {
        if (isRoot && node.name === 'root') {
            // Se for o nó raiz, renderiza apenas os filhos
            return (
                <>
                    {node.children?.map(child => (
                        renderGCSTree(child, false)
                    ))}
                </>
            );
        }

        if (node.type === 'folder') {
            return (
                <li style={{ marginBottom: '5px', listStyleType: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <strong
                            style={{ cursor: 'pointer', marginRight: '5px' }}
                            onClick={() => handleToggleExpand(node)}
                        >
                            {node.isExpanded ? '\u25BE' : '\u25B8'} {/* Ícones Unicode: V para baixo (expandido) e seta para a direita (contraído) */}
                        </strong>
                        <strong>{node.name}</strong>
                    </div>
                    {(node.isExpanded && node.children && node.children.length > 0) && (
                        <ul style={{ marginLeft: '20px' }}>
                            {node.children.map(child => (
                                renderGCSTree(child, false)
                            ))}
                        </ul>
                    )}
                </li>
            );
        } else {
            return (
                <li style={{ listStyleType: 'none', marginBottom: '5px', marginLeft: '20px' }}>
                    <a href={node.url} target="_blank" rel="noopener noreferrer">{node.name}</a>
                </li>
            );
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setSelectedFile(file);
        setJsonFiles([]);
        setSelectedJsonFiles([]);
        setSelectAll(false); // Resetar "Selecionar Todos" ao trocar de arquivo

        if (file && file.name.endsWith('.zip')) {
            try {
                setUploadStatus('Descompactando arquivo ZIP...');
                const zip = await JSZip.loadAsync(file);
                const jsonFilesFromZip: JsonFile[] = [];

                for (const filename in zip.files) {
                    if (filename.endsWith('.json')) {
                        const jsonContent = await zip.files[filename].async('string');
                        try {
                            const jsonData = JSON.parse(jsonContent);
                            jsonFilesFromZip.push({ filename, content: jsonData });
                        } catch (error: any) {
                            console.error(`Erro ao analisar JSON de $:`, error);
                            setUploadStatus(`Erro ao analisar JSON de $`);
                            return;
                        }
                    }
                }

                setJsonFiles(jsonFilesFromZip);
                setUploadStatus(`Arquivo ZIP descompactado. Selecione os arquivos JSON para processar.`);

            } catch (error: any) {
                console.error('Erro ao descompactar arquivo ZIP:', error);
                setUploadStatus(`Erro ao descompactar arquivo ZIP: ${error.message}`);
            }
        } else if (file) {
            setUploadStatus('Por favor, selecione um arquivo ZIP.');
        }
    }

    const handleJsonFileSelect = (filename: string) => {
        setSelectedJsonFiles((prevSelected) => {
            if (prevSelected.includes(filename)) {
                return prevSelected.filter((f) => f !== filename);
            } else {
                return [...prevSelected, filename];
            }
        });
        setSelectAll(false); // Desmarcar "Selecionar Todos" se um arquivo for desmarcado individualmente
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedJsonFiles([]);
        } else {
            setSelectedJsonFiles(jsonFiles.map(file => file.filename));
        }
        setSelectAll(!selectAll);
    };

    const createZipFromSelected = async () => {
        const zip = new JSZip();

        selectedJsonFiles.forEach(filename => {
            const file = jsonFiles.find(f => f.filename === filename);
            if (file) {
                zip.file(file.filename, JSON.stringify(file.content));
            }
        });

        const newZipFile = await zip.generateAsync({ type: "blob" });

        return newZipFile;
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadStatus('Por favor, selecione um arquivo ZIP.');
            return;
        }

        if (jsonFiles.length === 0) {
            setUploadStatus('Nenhum arquivo JSON encontrado no ZIP.');
            return;
        }

        if (selectedJsonFiles.length === 0) {
            setUploadStatus('Por favor, selecione pelo menos um arquivo JSON para processar.');
            return;
        }

        try {
            setUploadStatus('Criando ZIP com arquivos selecionados...');
            const newZipFile = await createZipFromSelected();

            setUploadStatus('Enviando arquivo ZIP...');

            const formData = new FormData();
            formData.append('File', newZipFile, 'selected_files.zip');

            const response = await axios.post('http://localhost:5000/api/audiobook/generate', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setUploadStatus(`Arquivo ZIP enviado com sucesso! ${response.data.message}`);
            console.log(response.data);
        } catch (error: any) {
            console.error('Erro ao enviar o arquivo ZIP:', error);
            setUploadStatus(`Erro ao enviar o arquivo ZIP: ${error.message}`);
        }
    };

    return (
        <>
            <PageBreadcrumb title="Import Files" subName="Pages" />
            <Row>
                <Col>
                    <Card>
                        <Card.Body>
                            <h4 className="header-title">Import Files</h4>
                            <p className="text-muted">
                                Selecione um arquivo ZIP para descompactar e escolha os arquivos JSON para gerar o audiobook.
                            </p>

                            <Form>
                                <Form.Group>
                                    <Form.Label>Selecione o arquivo ZIP:</Form.Label>
                                    <Form.Control type="file" onChange={handleFileChange} />
                                </Form.Group>

                                {jsonFiles.length > 0 && (
                                    <>
                                        <Form.Label>Selecione os arquivos JSON para processar:</Form.Label>
                                        <ListGroup>
                                            <ListGroup.Item>
                                                <Form.Check
                                                    type="checkbox"
                                                    id="checkbox-select-all"
                                                    label={selectAll ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                                    checked={selectAll}
                                                    onChange={handleSelectAll}
                                                />
                                            </ListGroup.Item>
                                            {jsonFiles.map((file) => (
                                                <ListGroup.Item key={file.filename}>
                                                    <Form.Check
                                                        type="checkbox"
                                                        id={`checkbox-${file.filename}`}
                                                        label={file.filename}
                                                        checked={selectedJsonFiles.includes(file.filename)}
                                                        onChange={() => handleJsonFileSelect(file.filename)}
                                                    />
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    </>
                                )}

                                <Button variant="primary" onClick={handleUpload} disabled={jsonFiles.length === 0 || selectedJsonFiles.length === 0} style={{ marginTop: '10px' }}>
                                    Gerar Audiobook
                                </Button>

                                {uploadStatus && <p>{uploadStatus}</p>}
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
                <Col>
                    <Card>
                        <Card.Body>
                            <h4>Arquivos Gerados no GCS</h4>
                            {loadingGcs && <p>Carregando lista de arquivos...</p>}
                            {errorGcs && <p>Erro: {errorGcs}</p>}
                            {!loadingGcs && !errorGcs && gcsTree && (  // Renderizar a árvore aqui
                                <ul style={{ paddingLeft: 0 }}>
                                    {renderGCSTree(gcsTree)}
                                </ul>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default CreateAudioBook;