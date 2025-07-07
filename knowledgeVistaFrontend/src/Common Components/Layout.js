import React, {  useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import ErrorBoundary from "../ErrorBoundary.js";
import Chatpanel from '../Chatbot/Chatpanel';

const Layout = ({ searchQuery, handleSearchChange, setSearchQuery,filter,handleFilterChange }) => {
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Floating AI button style
  const aiBtnStyle = {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    zIndex: 1000,
    display: isChatOpen ? 'none' : 'flex',
    alignItems: 'center',
    background: 'linear-gradient(90deg, #4f8cff 0%, #6f6fff 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '50px',
    boxShadow: '0 4px 16px rgba(79,140,255,0.18)',
    padding: '10px 18px 10px 12px',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background 0.2s',
    gap: '10px',
  };

  return (
    <div >
      <ErrorBoundary >  
    <Sidebar
    filter={filter}
    handleFilterChange={handleFilterChange}
  />
  </ErrorBoundary>
  <ErrorBoundary>  
  <Header 
        searchQuery={searchQuery}
        handleSearchChange={handleSearchChange}
        setSearchQuery={setSearchQuery}
    />
    </ErrorBoundary>
  <div className="pcoded-main-container">
    <div className="pcoded-content">
    <ErrorBoundary>  
<Outlet key={location.pathname}/>
</ErrorBoundary>
    </div>
    </div>
    {/* Floating AI Button */}
    <button
      style={aiBtnStyle}
      onClick={() => setIsChatOpen(true)}
      title="Ask AI"
      className="ai-float-btn"
    >
      <i className="fa fa-robot" style={{ fontSize: 22, marginRight: 8 }}></i>
      Ask AI
    </button>
    {/* Chatpanel */}
    {isChatOpen && (
      <Chatpanel onClose={() => setIsChatOpen(false)} />
    )}
  </div>
  );
};

export default Layout;
