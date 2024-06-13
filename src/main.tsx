import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import '../src/assets/styles/index.css'
import Home from './pages/Home.tsx'

const router = createBrowserRouter([
  {
    path:'/',
    element:<Home/>,
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>

      <RouterProvider router={router}/>

  </React.StrictMode>,
)
