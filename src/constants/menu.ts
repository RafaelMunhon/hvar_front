export type MenuItemType = {
	key: string
	label: string
	isTitle?: boolean
	icon?: string
	url?: string
	badge?: {
		variant: string
		text: string
	}
	parentKey?: string
	target?: string
	children?: MenuItemType[]
}

const MENU_ITEMS: MenuItemType[] = [
	// {
	// 	key: 'Main',
	// 	label: 'Main',
	// 	isTitle: true,
	// },
	{
		key: 'dashboard',
		label: 'Painel Principal',
		isTitle: false,
		url: '/',
		icon: 'ri-dashboard-3-line',
	},
	{
		key: 'import-files',
		label: 'Importação de Arquivos',
		isTitle: false,
		url: '/pages/import-files',
		icon: 'ri-file-upload-line',
	},
	{
		key: 'create-audio-book',
		label: 'Criar Áudios',
		isTitle: false,
		url: '/pages/create-audio-book',
		icon: 'ri-book-read-line',
	},
	{
		key: 'create-videos',
		label: 'Criar Vídeos',
		isTitle: false,
		url: '/pages/create-videos',
		icon: 'ri-video-add-line',
	},
	{
		key: 'create-videos-pexel',
		label: 'Criar Vídeos Pexel',
		isTitle: false,
		url: '/pages/create-videos-pexel',
		icon: 'ri-image-add-line',
	},
	{
		key: 'edit-videos-studio',
		label: 'Editar Vídeos Studio',
		isTitle: false,
		url: '/pages/edit-videos-studio',
		
		icon: 'ri-book-read-line',
	},
	{
		key: 'create-contextualizacao',
		label: 'Criar Contextualização',
		isTitle: false,
		url: '/pages/Contextualizacao', // Corrigido para corresponder à rota
		icon: 'ri-book-read-line',
	},
	{
		key: 'mental-map', // Nova chave para o menu
		label: 'Mapa Mental', // Label do menu
		isTitle: false,
		url: '/pages/mental-map', // Rota para a nova página
		icon: 'ri-git-merge-line', // Ícone de exemplo (pode ser alterado)
	},
	// {
	// 	key: 'pages',
	// 	label: 'Pages',
	// 	isTitle: false,
	// 	icon: 'ri-pages-line',
	// 	children: [
	// 		{
	// 			key: 'pages-Starter',
	// 			label: 'Starter Page',
	// 			url: '/pages/starter',
	// 			parentKey: 'pages',
	// 		},
	// 		{
	// 			key: 'pages-ContactList',
	// 			label: 'Contact List',
	// 			url: '/pages/contact-list',
	// 			parentKey: 'pages',
	// 		},
	// 		... resto dos itens comentados
	// 	],
	// },
	// ... resto dos menus comentados
]

const HORIZONTAL_MENU_ITEMS: MenuItemType[] = MENU_ITEMS

export { MENU_ITEMS, HORIZONTAL_MENU_ITEMS }