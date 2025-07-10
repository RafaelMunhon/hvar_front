import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

// All layouts containers
// import DefaultLayout from '../Layouts/Default'
import VerticalLayout from '../Layouts/Vertical'
import HorizontalLayout from '../Layouts/Horizontal'

import {
	authProtectedFlattenRoutes,
	// publicProtectedFlattenRoutes,
} from './index'
import {
	ThemeSettings,
	// useAuthContext,
	useThemeContext,
} from '../common/context'
interface IRoutesProps {}

const AllRoutes = (props: IRoutesProps) => {
	const { settings } = useThemeContext()

	const Layout =
		settings.layout.type === ThemeSettings.layout.type.vertical
			? VerticalLayout
			: HorizontalLayout
	
	return (
		<React.Fragment>
			<Routes>
				{/* Adicionar redirecionamento da rota raiz para o dashboard */}
				<Route path="/" element={<Navigate to="/dashboard" replace />} />

				{/* Comentado as rotas públicas pois não serão necessárias
				<Route>
					{publicProtectedFlattenRoutes.map((route, idx) => (
						<Route
							path={route.path}
							element={
								<DefaultLayout {...props}>{route.element}</DefaultLayout>
							}
							key={idx}
						/>
					))}
				</Route>
				*/}

				<Route>
					{authProtectedFlattenRoutes.map((route, idx) => (
						<Route
							path={route.path}
							element={<Layout {...props}>{route.element}</Layout>}
							/* Comentado a verificação de autenticação
							element={
								isAuthenticated === false ? (
									<Navigate
										to={{
											pathname: '/auth/login',
											search: 'next=' + route.path,
										}}
									/>
								) : (
									<Layout {...props}>{route.element}</Layout>
								)
							}
							*/
							key={idx}
						/>
					))}
				</Route>
			</Routes>
		</React.Fragment>
	)
}

export default AllRoutes
