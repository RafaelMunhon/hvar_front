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
    name?: string;
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

interface KnowledgeArea {
    nome: string;
}

interface ContextInfo {
    theme_origin: string;
    theme_destiny: string;
    url: string;
    create_date: string;
}

const Contextualizacao: React.FC = () => {
    const [options, setOptions] = useState<Option[]>([]);
    const [loading, setLoading] = useState(true);
    const [contexts, setContexts] = useState<ContextInfo[]>([]);
    const [loadingContexts, setLoadingContexts] = useState(true);
    const [themeOptions, setThemeOptions] = useState<ThemeOption[]>([]);
    const [selectedTheme, setSelectedTheme] = useState<ThemeOption | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [knowledgeAreas, setKnowledgeAreas] = useState<KnowledgeArea[]>([]);
    const [selectedKnowledgeArea, setSelectedKnowledgeArea] = useState<KnowledgeArea | null>(null);
    const [loadingKnowledgeAreas, setLoadingKnowledgeAreas] = useState(true);
    const [contextTypes, setContextTypes] = useState<string>('contextualizacao');

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_URL}/get_data`);
                if (!response.ok) throw new Error(`Erro ao buscar dados: Status ${response.status}`);

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
                        nucleo: item.NUCLEO,
                        name: item.NAME
                    });
                });

                const themes: ThemeOption[] = Array.from(themeMap.entries()).map(([theme, moduleMap]) => ({
                    value: theme,
                    label: theme,
                    modules: Array.from(moduleMap.entries()).map(([module, titulos]) => ({
                        value: module,
                        label: module,
                        titulos: titulos
                    }))
                }));

                setThemeOptions(themes);
            } catch (error: any) {
                console.error('Erro ao buscar dados:', error);
                toast.error(`Erro ao buscar dados: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Fetch contexts
    const fetchContexts = useCallback(async () => {
        setLoadingContexts(true);
        setLoadingKnowledgeAreas(true);
        try {
            const response = await fetch(`${API_URL}/context/list`);
            if (!response.ok) throw new Error(`Erro ao buscar dados: Status ${response.status}`);

            const data = await response.json();
            console.log('API Response:', data);
            
            setContexts(data.contextualizacoes || []);
            setKnowledgeAreas(data.areas_conhecimento || []);

        } catch (error: any) {
            console.error('Erro ao buscar dados:', error);
            toast.error(`Erro ao buscar dados: ${error.message}`);
            setContexts([]);
            setKnowledgeAreas([]);
        } finally {
            setLoadingContexts(false);
            setLoadingKnowledgeAreas(false);
        }
    }, []);

    const handleContextTypeChange = (type: string) => {
        setContextTypes(type);
    };

    useEffect(() => {
        fetchContexts();
    }, [fetchContexts]);

    const handleGenerate = async () => {
        if (!selectedTheme) {
            toast.error('Selecione um tema antes de gerar.');
            return;
        }

        if (!selectedKnowledgeArea && contextTypes !== 'suavizacao') {
            toast.error('Selecione uma área de conhecimento.');
            return;
        }

        if (!contextTypes) {
            toast.error('Selecione um tipo de contextualização.');
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading("Gerando contextualização...");

        try {
            // Busca o primeiro título do tema selecionado
            const selectedThemeData = themeOptions
                .find(theme => theme.value === selectedTheme.value)
                ?.modules
                .flatMap(module => module.titulos)
                .find(titulo => titulo.value);

            if (!selectedThemeData) {
                throw new Error('Dados do tema não encontrados');
            }

            const requestData = {
                id: selectedThemeData.value,
                name: selectedThemeData.name,
                theme: selectedTheme.value,
                knowledge_area: selectedKnowledgeArea.nome,
                context_type: contextTypes
            };

            console.log('Dados enviados para API:', requestData);

            const response = await fetch(`${API_URL}/context/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro ao gerar contextualização: ${errorText}`);
            }

            const data = await response.json();
            
            if (data.status === 'error') {
                throw new Error(data.message || 'Erro ao gerar contextualização');
            }

            Swal.fire({
                title: 'Contextualização Concluída!',
                text: ' Seu pedido está sendo processado e em breve receberá um e-mail.',

                icon: 'success'
            });

            // Reset form
            setSelectedTheme(null);
            setSelectedKnowledgeArea(null);
            setContextTypes('contextualizacao'); // Reset to default
            await fetchContexts();

            toast.update(toastId, {
                render: "Contextualização Concluída!",
                type: "success",
                isLoading: false,
                autoClose: 3000
            });
        } catch (error: any) {
            console.error('Erro:', error);
            
            Swal.fire({
                title: 'Erro!',
                text: error.message || 'Erro ao gerar contextualização',
                icon: 'error'
            });

            toast.update(toastId, {
                render: `Erro: ${error.message}`,
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <PageBreadcrumb title="Contextualização" subName="Pages" />
            <Row>
                <Col>
                    <Card>
                        <Card.Body>
                            <h4 className="header-title">Gerar Contextualização</h4>
                            <p className="text-muted mb-3">
                                Selecione um tema para gerar a contextualização
                            </p>

                            <div className="mb-3">
                                <label className="form-label">Tema</label>
                                <Select
                                    className="react-select"
                                    classNamePrefix="react-select"
                                    options={themeOptions}
                                    isLoading={loading}
                                    value={selectedTheme}
                                    onChange={setSelectedTheme}
                                    placeholder="Selecione um tema..."
                                    isClearable
                                    isSearchable
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label d-block">Tipos de Contextualização:</label>
                                <div className="d-flex flex-wrap gap-3">
                                    <Form.Check
                                        type="radio"
                                        id="type-suavizacao"
                                        label="Suavização"
                                        checked={contextTypes === 'suavizacao'}
                                        onChange={() => handleContextTypeChange('suavizacao')}
                                        className="form-check-inline"
                                    />
                                    <Form.Check
                                        type="radio"
                                        id="type-contextualizacao"
                                        label="Contextualização"
                                        checked={contextTypes === 'contextualizacao'}
                                        onChange={() => handleContextTypeChange('contextualizacao')}
                                        className="form-check-inline"
                                    />
                                    <Form.Check
                                        type="radio"
                                        id="type-suavizacao_contextualizacao"
                                        label="Suavização/Contextualização"
                                        checked={contextTypes === 'suavizacao_contextualizacao'}
                                        onChange={() => handleContextTypeChange('suavizacao_contextualizacao')}
                                        className="form-check-inline"
                                    />
                                </div>
                            </div>

                            {contextTypes !== 'suavizacao' && (
                                <div className="mb-3">
                                    <label className="form-label">Tema Destino Area de Conhecimento</label>
                                    <Select
                                        className="react-select"
                                        classNamePrefix="react-select"
                                        options={knowledgeAreas.map(area => ({ value: area.nome, label: area.nome }))}
                                        isLoading={loadingKnowledgeAreas}
                                        onChange={(option) => setSelectedKnowledgeArea(option ? { nome: option.value } : null)}
                                        value={selectedKnowledgeArea ? { value: selectedKnowledgeArea.nome, label: selectedKnowledgeArea.nome } : null}
                                        placeholder="Selecione uma área de conhecimento..."
                                        isClearable
                                        isSearchable
                                    />
                                </div>
                            )}

                            <div className="text-end">
                                <Button
                                    variant="primary"
                                    onClick={handleGenerate}
                                    disabled={!selectedTheme || isGenerating}
                                >
                                    {isGenerating ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                            Gerando...
                                        </>
                                    ) : (
                                        'Gerar Contextualização'
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
                            <h4 className="header-title">Contextualizações Geradas</h4>
                            <div className="table-responsive">
                                <Table className="table-centered mb-0">
                                    <thead>
                                        <tr>
                                            <th>Tema Origem</th>
                                            <th>Tema Destino</th>
                                            <th>URL</th>
                                            <th>Data de Criação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingContexts ? (
                                            <tr>
                                                <td colSpan={4} className="text-center">
                                                    Carregando...
                                                </td>
                                            </tr>
                                        ) : contexts.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center">
                                                    Nenhuma contextualização encontrada
                                                </td>
                                            </tr>
                                        ) : (
                                            contexts.map((context, index) => (
                                                <tr key={index}>
                                                    <td>{context.theme_origin}</td>
                                                    <td>{context.theme_destiny}</td>
                                                    <td>
                                                        <a
                                                            href={context.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary"
                                                        >
                                                            {context.url.substring(0, 30)}...
                                                        </a>
                                                    </td>
                                                    <td>
                                                        {new Date(context.create_date).toLocaleString()}
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

export default Contextualizacao;