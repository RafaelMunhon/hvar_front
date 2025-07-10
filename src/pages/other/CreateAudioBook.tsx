import React, { useState, useEffect, useCallback } from 'react';
import { Card, Col, Row, Button, Table, Form } from 'react-bootstrap';
import { PageBreadcrumb } from '@/components';
import Select from 'react-select';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { API_URL } from '@/config/api'

interface Option {
    value: string;
    label: string;
    module?: string;
    nucleo?: string;
}

interface ThemeOption {
    value: string;
    label: string;
    modules: {
        value: string;
        label: string;
        titulos: Option[];
    }[];
}

interface ModuleOption {
    value: string;
    label: string;
    titulos: Option[];
}

interface AudioInfo {
    id: string;
    url: string;
    tipo_audio: string;
    create_date: string;
    theme: string;
    titulo_nc: string;
}

const CreateAudioBook: React.FC = () => {
    const [options, setOptions] = useState<Option[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState<Option | null>(null);
    const [audios, setAudios] = useState<AudioInfo[]>([]);
    const [loadingAudios, setLoadingAudios] = useState(true);
    const [mode, setMode] = useState<'titulo' | 'tema'>('titulo');

    
    const [themeOptions, setThemeOptions] = useState<ThemeOption[]>([]);
    const [selectedTheme, setSelectedTheme] = useState<ThemeOption | null>(null);
    const [moduleOptions, setModuleOptions] = useState<ModuleOption[]>([]);
    const [selectedModule, setSelectedModule] = useState<ModuleOption | null>(null);

    const [audioTypes, setAudioTypes] = useState<string[]>(['audiobook']);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedAudioIds, setSelectedAudioIds] = useState<Set<string>>(new Set()); 

    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_URL}/get_data`);
                if (!response.ok) {
                    console.error(`Erro ao buscar dados: Status ${response.status}`);
                    toast.error(`Erro ao buscar dados: Status ${response.status}`);
                    throw new Error(`Erro ao buscar dados: Status ${response.status}`);
                }

                const data = await response.json();
                console.log("Dados recebidos da API (get_data):", data); 

                
                const themeMap = new Map<string, Map<string, Option[]>>();

                data.forEach((item: any) => {
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

                
                const themes: ThemeOption[] = Array.from(themeMap.entries()).map(([theme, moduleMap]) => ({
                    value: theme,
                    label: theme,
                    modules: Array.from(moduleMap.entries()).map(([module, titulos]) => ({
                        value: module,
                        label: module,
                        titulos: titulos.sort((a, b) => {
                            
                            return 0;
                        })
                    }))
                }));

                setThemeOptions(themes);
                setOptions([]); 
            } catch (error: any) {
                console.error('Erro ao buscar dados:', error);
                toast.error(`Erro ao buscar dados: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    
    const fetchAudios = useCallback(async () => {
        setLoadingAudios(true);
        try {
            const response = await fetch(`${API_URL}/audio/list`);
            if (!response.ok) {
                console.error(`Erro ao buscar áudios: Status ${response.status}`);
                toast.error(`Erro ao buscar áudios: Status ${response.status}`);
                throw new Error(`Erro ao buscar áudios: Status ${response.status}`);
            }

            const data = await response.json();
            const audioFiles = data.files || [];
            setAudios(audioFiles);

            console.log('Dados recebidos da API (audio/list):', audioFiles);
        } catch (error: any) {
            console.error('Erro ao buscar áudios:', error);
            toast.error(`Erro ao buscar áudios: ${error.message}`);
            setAudios([]);
        } finally {
            setLoadingAudios(false);
        }
    }, []);

    
    useEffect(() => {
        fetchAudios();
    }, [fetchAudios]);

    const handleChange = (option: Option | null) => {
        setSelectedOption(option);
    };

    const handleAudioTypeChange = (type: string) => {
        setAudioTypes(prev => {
            if (prev.includes(type)) {
                return prev.filter(t => t !== type);
            } else {
                return [...prev, type];
            }
        });
    };

    const handleCreateAudio = async () => {
        if (mode === 'titulo' && !selectedOption) {
            toast.error('Selecione um título antes de criar o áudio.');
            return;
        }

        if (mode === 'tema' && !selectedTheme) {
            toast.error('Selecione um tema antes de criar o áudio.');
            return;
        }

        if (audioTypes.length === 0) {
            toast.error('Selecione pelo menos um tipo de áudio.');
            return;
        }

        setIsCreating(true);
        const toastId = toast.loading("Gerando áudios...");

        let selectedData;

        if (mode === 'titulo') {
            if (!selectedTheme || !selectedModule || !selectedOption) {
                toast.error('Selecione tema, módulo e título.');
                setIsCreating(false);
                toast.update(toastId, { render: "Seleção incompleta.", type: "error", isLoading: false, autoClose: 3000 });
                return;
            }

            
            const modulo = selectedOption?.module === "Introdução" ? null : selectedOption?.module;

            selectedData = {
                mode: mode,
                titulo_nc: selectedOption?.label,
                id: selectedOption?.value,
                nucleo: selectedOption?.nucleo,
                modulo: modulo,
            };
        } else {
            selectedData = {
                mode: mode,
                theme: selectedTheme?.value,
                id: selectedTheme?.modules[0].titulos[0]?.value,
                module: selectedTheme?.modules[0].value,
                nucleo: selectedTheme?.modules[0].titulos[0]?.nucleo,
            };
        }

        console.log("Dados enviados para a API (audio/generate):", selectedData);

        try {
            
            const createAudio = async (audioType: string) => {
                let apiEndpoint = '';
                switch (audioType) {
                    case 'audioqa':
                        apiEndpoint = `${API_URL}/audioqa/generate`;
                        break;
                    case 'audiobook':
                        apiEndpoint = `${API_URL}/audio/generate`;
                        break;
                    case 'podcast':
                        apiEndpoint = `${API_URL}/podcast/generate`;
                        break;
                    case 'microlearning':
                        apiEndpoint = `${API_URL}/microlearning/generate`;
                        break;
                    default:
                        throw new Error(`Tipo de áudio inválido: ${audioType}`);
                }
                console.log(`Chamando API ${apiEndpoint} com dados:`, selectedData);

                const response = await fetch(apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(selectedData),
                });
                console.log(`Resposta da API ${apiEndpoint}:`, response);

                if (!response.ok) {
                    console.error(`Erro ao criar ${audioType}: Status ${response.status}`);
                    const errorText = await response.text(); 
                    console.error(`Erro ao criar ${audioType}: Body ${errorText}`);
                    toast.error(`Erro ao criar ${audioType}: Status ${response.status} - ${errorText}`);
                    throw new Error(`Erro ao criar ${audioType}: Status ${response.status} - ${errorText}`);
                }

                const data = await response.json(); 
                console.log(`Dados da resposta da API ${audioType}:`, data);

                if (data && data.success === false) {
                    console.error(`Falha ao gerar ${audioType}: ${data.error}`);
                    
                    Swal.fire({
                        title: 'Erro!',
                        text: `Falha ao gerar ${audioType}: ${data.error}`,
                        icon: 'error',
                        confirmButtonText: 'Ok'
                    });
                    
                    throw new Error(`Falha ao gerar ${audioType}: ${data.error}`);
                } else if (data && data.results && Array.isArray(data.results)) {
                    for (const result of data.results) {
                        if (result && !result.success) {
                            console.error(`Falha ao gerar ${audioType}: ${result.message}`);
                            
                            Swal.fire({
                                title: 'Erro!',
                                text: `Falha ao gerar ${audioType}: ${result.message}`,
                                icon: 'error',
                                confirmButtonText: 'Ok'
                            });
                            
                            throw new Error(`Falha ao gerar ${audioType}: ${result.message}`);
                        }
                    }
                } else if (!data) {
                    console.error("Resposta da API inválida");
                    
                    Swal.fire({
                        title: 'Erro!',
                        text: "Resposta da API inválida",
                        icon: 'error',
                        confirmButtonText: 'Ok'
                    });
                    
                    throw new Error("Resposta da API inválida");
                }
            };

            
            await Promise.all(audioTypes.map(createAudio));
            console.log("Todos os audios criados com sucesso!");

            Swal.fire({
                title: 'Sucesso!',
                text: 'Áudios gerados com sucesso',
                icon: 'success',
                confirmButtonText: 'Ok'
            });
            
            setSelectedOption(null);
            setSelectedTheme(null);
            setAudioTypes(['audiobook']);

            
            await fetchAudios();

            
            toast.update(toastId, {
                render: "Áudios gerados com sucesso!",
                type: "success",
                isLoading: false,
                autoClose: 3000
            });
        } catch (error: any) {
            console.error('Erro ao criar áudio:', error);
            toast.error(`Erro ao gerar áudios: ${error.message}`);
            
            toast.update(toastId, {
                render: `Erro ao gerar áudios: ${error.message}. Tente novamente.`,
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteAudios = async () => {
        if (selectedAudioIds.size === 0) {
            Swal.fire({
                title: 'Atenção!',
                text: 'Selecione pelo menos um áudio para excluir.',
                icon: 'warning',
                confirmButtonText: 'Ok'
            });
            return;
        }

        Swal.fire({
            title: 'Tem certeza?',
            text: "Você não poderá reverter isso!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`${API_URL}/audio/delete`, { 
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(Array.from(selectedAudioIds)),  
                    });

                    if (!response.ok) {
                        console.error(`Erro ao excluir audios: Status ${response.status}`);
                        const errorText = await response.text(); 
                        console.error(`Erro ao excluir audios: Body ${errorText}`);
                        toast.error(`Erro ao excluir audios: Status ${response.status} - ${errorText}`);
                        throw new Error(`Erro ao excluir áudios: Status ${response.status} - ${errorText}`);
                    }

                    
                    setAudios(prevAudios => prevAudios.filter(audio => !selectedAudioIds.has(audio.id)));
                    setSelectedAudioIds(new Set()); 

                    
                    Swal.fire(
                        'Excluído!',
                        'Os áudios foram excluídos com sucesso.',
                        'success'
                    );

                    
                    await fetchAudios();
                } catch (error: any) {
                    console.error('Erro ao excluir áudios:', error);
                    toast.error(`Erro ao excluir áudios: ${error.message}`);
                    Swal.fire(
                        'Erro!',
                        `Houve um problema ao excluir os áudios: ${error.message}`,
                        'error'
                    );
                }
            }
        });
    };

    const handleSelectAudio = (audioId: string) => {
        setSelectedAudioIds(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(audioId)) {
                newSelected.delete(audioId);
            } else {
                newSelected.add(audioId);
            }
            return newSelected;
        });
    };

    
    const handleThemeChange = (option: ThemeOption | null) => {
        setSelectedTheme(option);
        setSelectedModule(null);
        setSelectedOption(null);
        setModuleOptions(option ? option.modules : []);
    };

    const handleModuleChange = (option: ModuleOption | null) => {
        setSelectedModule(option);
        setSelectedOption(null);
    };

    return (
        <>
            <PageBreadcrumb title="Create Audio Book" subName="Pages" />
            <Row>
                <Col>
                    <Card>
                        <Card.Body translate="no">
                            <h4 className="header-title">Create Audio Book</h4>
                            <p className="text-muted mb-3">
                                Selecione o modo de criação do áudio
                            </p>

                            <div className="mb-4">
                                <label className="form-label d-block mb-3">Selecione o modo de criação:</label>
                                <div className="d-flex justify-content-center gap-4">
                                    <div className="border rounded p-3 radio-container" style={{ minWidth: '250px' }}>
                                        <Form.Check
                                            type="radio"
                                            id="modeTitulo"
                                            name="mode"
                                            label="Por Título NC"
                                            checked={mode === 'titulo'}
                                            onChange={() => {
                                                setMode('titulo');
                                                setSelectedTheme(null);
                                                setSelectedModule(null);
                                                setSelectedOption(null);
                                                setModuleOptions([]);
                                            }}
                                            className="form-check-inline custom-radio m-0"
                                        />
                                    </div>
                                    <div className="border rounded p-3 radio-container" style={{ minWidth: '250px' }}>
                                        <Form.Check
                                            type="radio"
                                            id="modeTema"
                                            name="mode"
                                            label="Por Tema"
                                            checked={mode === 'tema'}
                                            onChange={() => {
                                                setMode('tema');
                                                setSelectedTheme(null);
                                                setSelectedModule(null);
                                                setSelectedOption(null);
                                                setModuleOptions([]);
                                            }}
                                            className="form-check-inline custom-radio m-0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {mode === 'titulo' ? (
                                <>
                                    <div className="mb-3">
                                        <label className="form-label">Tema</label>
                                        <Select
                                            className="react-select"
                                            classNamePrefix="react-select"
                                            options={themeOptions}
                                            isLoading={loading}
                                            value={selectedTheme}
                                            onChange={handleThemeChange}
                                            placeholder="Selecione um tema..."
                                            isClearable
                                            isSearchable
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Módulo</label>
                                        <Select
                                            className="react-select"
                                            classNamePrefix="react-select"
                                            options={moduleOptions}
                                            isLoading={loading}
                                            value={selectedModule}
                                            onChange={handleModuleChange}
                                            placeholder="Selecione um módulo..."
                                            isClearable
                                            isSearchable
                                            isDisabled={!selectedTheme}
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Título NC</label>
                                        <Select
                                            className="react-select"
                                            classNamePrefix="react-select"
                                            options={selectedModule?.titulos || []}
                                            isLoading={loading}
                                            value={selectedOption}
                                            onChange={handleChange}
                                            placeholder="Selecione um título..."
                                            isClearable
                                            isSearchable
                                            isDisabled={!selectedModule}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="mb-3">
                                    <label className="form-label">Tema</label>
                                    <Select
                                        className="react-select"
                                        classNamePrefix="react-select"
                                        options={themeOptions}
                                        isLoading={loading}
                                        value={selectedTheme}
                                        onChange={(option) => setSelectedTheme(option)}
                                        placeholder="Selecione um tema..."
                                        isClearable
                                        isSearchable
                                    />
                                </div>
                            )}

                            <div className="mb-3">
                                <label className="form-label d-block">Tipos de Áudio:</label>
                                <div className="d-flex flex-wrap gap-3">
                                    <Form.Check
                                        type="checkbox"
                                        id="type-audioqa"
                                        label="Audio QA"
                                        checked={audioTypes.includes('audioqa')}
                                        onChange={() => handleAudioTypeChange('audioqa')}
                                        className="form-check-inline"
                                    />
                                    <Form.Check
                                        type="checkbox"
                                        id="type-audiobook"
                                        label="Audiobook"
                                        checked={audioTypes.includes('audiobook')}
                                        onChange={() => handleAudioTypeChange('audiobook')}
                                        className="form-check-inline"
                                    />
                                    <Form.Check
                                        type="checkbox"
                                        id="type-podcast"
                                        label="Podcast"
                                        checked={audioTypes.includes('podcast')}
                                        onChange={() => handleAudioTypeChange('podcast')}
                                        className="form-check-inline"
                                    />
                                    <Form.Check
                                        type="checkbox"
                                        id="type-microlearning"
                                        label="Microlearning"
                                        checked={audioTypes.includes('microlearning')}
                                        onChange={() => handleAudioTypeChange('microlearning')}
                                        className="form-check-inline"
                                    />
                                </div>
                            </div>

                            <div className="text-end">
                                <Button
                                    variant="primary"
                                    onClick={handleCreateAudio}
                                    disabled={
                                        (mode === 'titulo' && (!selectedTheme || !selectedModule || !selectedOption)) ||
                                        (mode === 'tema' && !selectedTheme) ||
                                        audioTypes.length === 0 ||
                                        isCreating
                                    }
                                >
                                    {isCreating ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                            Criando...
                                        </>
                                    ) : (
                                        'Criar Áudio'
                                    )}
                                </Button>
                            </div>

                            {mode === 'titulo' && selectedOption && (
                                <div className="mt-3">
                                    <p className="text-muted">
                                        Título selecionado: <strong>{selectedOption.label}</strong>
                                    </p>
                                </div>
                            )}
                            {mode === 'tema' && selectedTheme && (
                                <div className="mt-3">
                                    <p className="text-muted">
                                        Tema selecionado: <strong>{selectedTheme.label}</strong>
                                    </p>
                                    <p className="text-muted">
                                        Quantidade de títulos: <strong>{selectedTheme.modules.reduce((acc, module) => acc + module.titulos.length, 0)}</strong>
                                    </p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="mt-3">
                <Col>
                    <Card>
                        <Card.Body translate="no">
                            <h4 className="header-title">Áudios Gerados</h4>
                            <div className="table-responsive">
                                <Table className="table-centered mb-0">
                                    <thead>
                                        <tr>
                                            <th> </th>  {/* Checkbox */}
                                            <th>Título NC</th>
                                            <th>Tema</th>
                                            <th>Tipo de Áudio</th>
                                            <th>URL</th>
                                            <th>Data de Criação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingAudios ? (
                                            <tr>
                                                <td colSpan={6} className="text-center">
                                                    Carregando...
                                                </td>
                                            </tr>
                                        ) : audios.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center">
                                                    Nenhum áudio encontrado
                                                </td>
                                            </tr>
                                        ) : (
                                            audios.map((audio) => (
                                                <tr key={`${audio.id}-${audio.tipo_audio}-${audio.create_date}`}>
                                                    <td>
                                                        <Form.Check
                                                            type="checkbox"
                                                            id={`select-${audio.id}`}
                                                            checked={selectedAudioIds.has(audio.id)}
                                                            onChange={() => handleSelectAudio(audio.id)}
                                                        />
                                                    </td>
                                                    <td>{audio.titulo_nc}</td>
                                                    <td>{audio.theme}</td>
                                                    <td>
                                                        <span className="badge bg-primary">
                                                            {audio.tipo_audio}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <a
                                                            href={audio.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary"
                                                        >
                                                            {audio.url.substring(0, 30)}...
                                                        </a>
                                                    </td>
                                                    <td>
                                                        {new Date(audio.create_date).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                            <div className="text-end mt-2">
                                <Button
                                    variant="danger"
                                    onClick={handleDeleteAudios}
                                    disabled={selectedAudioIds.size === 0}
                                >
                                    Excluir Selecionados
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default CreateAudioBook;