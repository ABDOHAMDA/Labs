import React from 'react'
import ReactDOM from 'react-dom/client'
import SandboxLabApp from '../SandboxLabApp'
import AcademyLabApp from './AcademyLabApp'
import './index.css'

const labId = new URLSearchParams(window.location.search).get('labId')
const App = labId === '10' ? AcademyLabApp : SandboxLabApp

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
