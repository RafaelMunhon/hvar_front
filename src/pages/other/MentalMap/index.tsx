import { PageBreadcrumb, Spinner } from '@/components';
import { API_URL } from '@/config/api';
import axios from 'axios';
import { useEffect, useState, useRef } from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';

// Imports para Markmap
import { Transformer } from 'markmap-lib';
import { Markmap, IMarkmapOptions } from 'markmap-view';

// Tipagem para os dados de /api/get_data
interface ApiDataItem {
    ID: string;
    NAME: string;
    THEME: string;
    MODULO: string | null;
    TITULO_NC: string;
    CREATE_DATE: string;
    NUCLEO: string;
}

interface ThemeOption {
    id: string;
    name: string;
}

const MentalMapPage = () => {
    const [allData, setAllData] = useState<ApiDataItem[]>([]);
    const [themes, setThemes] = useState<ThemeOption[]>([]);
    const [modules, setModules] = useState<string[]>([]);
    const [titlesNC, setTitlesNC] = useState<string[]>([]);

    const [selectedThemeId, setSelectedThemeId] = useState<string>('');
    const [selectedModule, setSelectedModule] = useState<string>('');
    const [selectedTitleNC, setSelectedTitleNC] = useState<string>('');

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
    const [markdownResult, setMarkdownResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const markmapContainerRef = useRef<HTMLDivElement>(null);
    const markmapSvgElementRef = useRef<SVGSVGElement | null>(null);
    const markmapInstanceRef = useRef<Markmap | null>(null);

    // Carregar dados iniciais para os selects (sem alterações aqui)
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            setError(null);
            try {
                const response = await axios.get(`${API_URL}/get_data`);
                const data: ApiDataItem[] = response.data;
                setAllData(data);

                const uniqueThemes: ThemeOption[] = [];
                const themeMap = new Map<string, ThemeOption>();
                data.forEach(item => {
                    if (item.ID && item.THEME) {
                        if (!themeMap.has(item.ID)) {
                            themeMap.set(item.ID, { id: item.ID, name: item.THEME });
                        }
                    }
                });
                uniqueThemes.push(...themeMap.values());
                uniqueThemes.sort((a, b) => a.name.localeCompare(b.name));
                setThemes(uniqueThemes);

            } catch (err) {
                console.error("Erro ao buscar dados iniciais:", err);
                setError("Falha ao carregar dados para os filtros. Tente recarregar a página.");
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchData();
    }, []);

    // Atualizar módulos quando o tema mudar (sem alterações aqui)
    useEffect(() => {
        if (selectedThemeId && allData.length > 0) {
            const relatedModules = allData
                .filter(item => item.ID === selectedThemeId && item.MODULO)
                .map(item => item.MODULO as string);
            const uniqueModules = Array.from(new Set(relatedModules)).sort();
            setModules(uniqueModules);
        } else {
            setModules([]);
        }
        setSelectedModule('');
        setTitlesNC([]);
        setSelectedTitleNC('');
        setMarkdownResult(null);
    }, [selectedThemeId, allData]);

    // Atualizar títulos NC quando o módulo mudar (ou tema, se não houver módulo) (sem alterações aqui)
    useEffect(() => {
        if (selectedThemeId && allData.length > 0) {
            let relatedTitlesData: ApiDataItem[];
            if (selectedModule) {
                relatedTitlesData = allData.filter(item => item.ID === selectedThemeId && item.MODULO === selectedModule && item.TITULO_NC);
            } else {
                relatedTitlesData = allData.filter(item =>
                    item.ID === selectedThemeId &&
                    item.TITULO_NC &&
                    (!item.MODULO || (item.NUCLEO && (item.NUCLEO.includes('conteudo_inicial.json') || item.NUCLEO.includes('conteudo-inicial.json'))))
                );
            }
            const uniqueTitles = Array.from(new Set(relatedTitlesData.map(item => item.TITULO_NC))).sort();
            setTitlesNC(uniqueTitles);
        } else {
            setTitlesNC([]);
        }
        setSelectedTitleNC('');
        setMarkdownResult(null);
    }, [selectedThemeId, selectedModule, allData]);


    const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedThemeId(event.target.value);
    };

    const handleModuleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedModule(event.target.value);
    };

    const handleTitleNCChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedTitleNC(event.target.value);
    };

    const handleSubmit = async () => {
        if (!selectedThemeId || !selectedTitleNC) {
            setError("Por favor, selecione um Tema e um Título NC.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setMarkdownResult(null);
        try {
            const response = await axios.post(`${API_URL}/mental_map/generate`, {
                id: selectedThemeId,
                titulo_nc: selectedTitleNC,
            });
            if (response.data && response.data.markdown_content) {
                setMarkdownResult(response.data.markdown_content);
            } else {
                setError("A resposta da API não continha o conteúdo do mapa mental.");
            }
        } catch (err: any) {
            console.error("Erro ao gerar mapa mental:", err);
            if (err.response && err.response.data && err.response.data.error) {
                 setError(`Erro na API: ${err.response.data.error}`);
            } else {
                 setError(`Falha ao gerar o mapa mental: ${err.message || err}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (markdownResult && markmapContainerRef.current) {
            const transformer = new Transformer();
            const { root } = transformer.transform(markdownResult);
            
            if (markmapInstanceRef.current) {
                markmapInstanceRef.current.destroy();
            }

            while (markmapContainerRef.current.firstChild) {
                markmapContainerRef.current.removeChild(markmapContainerRef.current.firstChild);
            }

            const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgEl.style.width = '100%';
            svgEl.style.height = '100%';
            markmapContainerRef.current.appendChild(svgEl);
            markmapSvgElementRef.current = svgEl; 

            const markmapOptions = { 
                autoFit: true,
                duration: 500,
             } as IMarkmapOptions;
            markmapInstanceRef.current = Markmap.create(markmapSvgElementRef.current, markmapOptions, root);
            // Adicionar um fit após a criação inicial pode ajudar
            if (markmapInstanceRef.current) {
                markmapInstanceRef.current.fit().catch(e => console.error("Erro no fit inicial:", e));
            }
        
        } else if (markmapInstanceRef.current) {
            markmapInstanceRef.current.setData(undefined);
            markmapSvgElementRef.current = null;
        }
        
        return () => {
            if (markmapInstanceRef.current) {
                markmapInstanceRef.current.destroy();
                markmapInstanceRef.current = null;
            }
            markmapSvgElementRef.current = null;
        };
    }, [markdownResult]);

    const handleRefitMap = () => {
        if (markmapInstanceRef.current) {
            markmapInstanceRef.current.fit().catch(e => console.error("Erro ao reajustar mapa:", e));
        }
    };

    // Modificado para baixar SVG
    const handleDownloadSvg = () => {
        if (markmapSvgElementRef.current) {
            try {
                const svgData = new XMLSerializer().serializeToString(markmapSvgElementRef.current);
                const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;

                let filename = "mapa-mental.svg";
                if (selectedTitleNC) {
                    filename = `mapa-mental-${selectedTitleNC.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase()}.svg`;
                }
                link.download = filename;
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

            } catch (e) {
                console.error("Erro ao baixar como SVG:", e);
                setError("Falha ao gerar o SVG do mapa mental. Verifique o console para detalhes.");
            }
        } else {
            setError("Mapa mental não está renderizado para download.");
        }
    };


    return (
        <>
            <style type="text/css">{`
                .mental-map-display-area {
                    width: 100%;
                    min-height: 85vh; 
                    background-color: #f8f9fa;
                    background-image: radial-gradient(circle, #e0e0e0 0.8px, transparent 0.8px);
                    background-size: 20px 20px;
                    background-position: 0 0;
                    box-sizing: border-box;
                    margin-top: 1.5rem;
                    overflow: hidden; 
                    position: relative; 
                }
                .mental-map-display-area > svg { 
                    width: 100% !important;
                    height: 100% !important;
                    min-height: inherit !important;
                    display: block;
                }
                .markmap-foreignObject-bg {
                    fill: transparent !important;
                }
                .map-controls {
                    margin-top: 0.5rem;
                    margin-bottom: 1rem;
                    display: flex;
                    gap: 0.5rem;
                }
            `}</style>

            <PageBreadcrumb title="Gerar Mapa Mental" subName="Páginas" />
            <Row>
                <Col xs={12}>
                    <Card>
                        <Card.Body>
                            <h4 className="header-title mb-3">Configurações para Geração do Mapa Mental</h4>
                            {isLoadingData && <div className="text-center"><Spinner size="lg" /> <p>Carregando dados...</p></div>}
                            {!isLoadingData && themes.length === 0 && !error && (
                                <Alert variant="info">Nenhum tema encontrado. Importe arquivos primeiro.</Alert>
                            )}
                            {!isLoadingData && error && !selectedThemeId && <Alert variant="danger" className="mb-3">{error}</Alert>}
                            {!isLoadingData && themes.length > 0 && (
                                <Form>
                                    <Row>
                                        <Col md={4}><Form.Group className="mb-3"><Form.Label htmlFor="themeSelect">Tema</Form.Label><Form.Select id="themeSelect" value={selectedThemeId} onChange={handleThemeChange}><option value="">Selecione um Tema...</option>{themes.map(theme => (<option key={theme.id} value={theme.id}>{theme.name}</option>))}</Form.Select></Form.Group></Col>
                                        <Col md={4}><Form.Group className="mb-3"><Form.Label htmlFor="moduleSelect">Módulo (Opcional)</Form.Label><Form.Select id="moduleSelect" value={selectedModule} onChange={handleModuleChange} disabled={!selectedThemeId || modules.length === 0}><option value="">Selecione um Módulo (se aplicável)...</option>{modules.map(module => (<option key={module} value={module}>{module}</option>))}</Form.Select></Form.Group></Col>
                                        <Col md={4}><Form.Group className="mb-3"><Form.Label htmlFor="titleNCSelect">Título NC</Form.Label><Form.Select id="titleNCSelect" value={selectedTitleNC} onChange={handleTitleNCChange} disabled={!selectedThemeId || titlesNC.length === 0}><option value="">Selecione um Título NC...</option>{titlesNC.map(title => (<option key={title} value={title}>{title}</option>))}</Form.Select></Form.Group></Col>
                                    </Row>
                                    <div className="d-flex align-items-center">
                                        <Button variant="primary" onClick={handleSubmit} disabled={isLoading || !selectedThemeId || !selectedTitleNC} >
                                            {isLoading ? <Spinner size="sm" /> : 'Gerar Mapa Mental'}
                                        </Button>
                                        {markdownResult && !isLoading && (
                                            <div className="map-controls ms-auto">
                                                <Button variant="outline-secondary" size="sm" onClick={handleRefitMap}>
                                                    Reajustar Mapa
                                                </Button>
                                                {/* Alterado para chamar handleDownloadSvg e o texto do botão */}
                                                <Button variant="outline-success" size="sm" onClick={handleDownloadSvg}>
                                                    Baixar SVG
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </Form>
                            )}
                        </Card.Body>
                    </Card>
                    
                    {markdownResult && !isLoading && (
                        <div ref={markmapContainerRef} className="mental-map-display-area">
                            {/* O SVG será criado dinamicamente aqui pelo Markmap */}
                        </div>
                    )}
                    {error && !isLoadingData && !isLoading && markdownResult === null && selectedThemeId && (
                         <Alert variant="danger" className="mt-3">{error}</Alert>
                    )}
                </Col>
            </Row>
        </>
    );
};

export default MentalMapPage;