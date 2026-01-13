import { useState } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import SurgicalScheduling from './pages/SurgicalScheduling';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <div className="App">
      {/* Navigation */}
      <nav style={{ 
        padding: '1rem 2rem', 
        background: 'var(--bg-slate)', 
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <button 
          onClick={() => setCurrentPage('dashboard')}
          style={{
            padding: '0.5rem 1rem',
            background: currentPage === 'dashboard' ? 'var(--primary-blue)' : 'transparent',
            color: currentPage === 'dashboard' ? 'white' : 'var(--text-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontWeight: '600'
          }}
        >
          Dashboard
        </button>
        <button 
          onClick={() => setCurrentPage('scheduling')}
          style={{
            padding: '0.5rem 1rem',
            background: currentPage === 'scheduling' ? 'var(--primary-blue)' : 'transparent',
            color: currentPage === 'scheduling' ? 'white' : 'var(--text-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontWeight: '600'
          }}
        >
          Surgical Scheduling
        </button>
      </nav>

      {/* Page Content */}
      {currentPage === 'dashboard' ? <Dashboard /> : <SurgicalScheduling />}
    </div>
  );
}

export default App;