import React, { useState } from 'react';
import '../Styles/Home.css';

function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const visitorsData = [
    { name: 'Miah Omalza', contact: 'miah@gmail.com', id: '0119', datetime: '9:00AM 09-25-2025', room: '10' },
    { name: 'Janjan Casi', contact: 'casi@gmail.com', id: '0120', datetime: '8:00AM 09-23-2025', room: '07' },
    { name: 'Jirah Bindol', contact: 'jirah@gmail.com', id: '0101', datetime: '8:00AM 09-02-2025', room: '13' },
    { name: 'Andrea Magayon', contact: 'andrea@gmail.com', id: '0123', datetime: '9:00PM 08-30-2025', room: '15' },
    { name: 'Grace Poe', contact: 'gracepoe@gmail.com', id: '0145', datetime: '11:00AM 08-25-2025', room: '22' }
  ];

  const filteredVisitors = visitorsData.filter(visitor =>
    Object.values(visitor).some(value =>
      value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const statsData = [
    { title: "Total Visitors", value: '45', icon: '👥' },
    { title: 'Discharge Patients', value: '34', icon: '👥' },
    { title: 'Register Visitor', value: '', icon: '✓', isRegister: true }
  ];

  const menuItems = [
    { text: 'HOME', icon: '🏠' },
    { text: 'Dashboard', icon: '📊', active: true },
    { text: 'Visitor Information', icon: '👤' },
    { text: 'Registered Visitor', icon: '✓' },
    { text: 'Visitor History', icon: '📋' },
    { text: 'Attendance', icon: '📅' }
  ];

  const styles = {
    container: {
      display: 'flex',
      height: '100vh',
      width: '100vw',
      fontFamily: 'Arial, sans-serif'
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      background: 'linear-gradient(135deg, #2e8b57, #228b22)',
      color: 'white',
      padding: '20px 40px',
      fontSize: '28px',
      fontWeight: 'bold'
    },
    statsSection: {
      display: 'flex',
      gap: '40px',
      padding: '40px',
      backgroundColor: '#e8e8e8'
    },
    statCard: {
      backgroundColor: '#2e8b57',
      color: 'white',
      padding: '30px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      minWidth: '200px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    },
    statIcon: {
      fontSize: '40px',
      backgroundColor: 'rgba(255,255,255,0.2)',
      padding: '15px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '60px',
      height: '60px'
    },
    statIconRegister: {
      fontSize: '50px',
      backgroundColor: 'rgba(255,255,255,0.2)',
      padding: '15px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '60px',
      height: '60px',
      border: '3px solid white'
    },
    statText: {
      display: 'flex',
      flexDirection: 'column'
    },
    statTitle: {
      fontSize: '16px',
      marginBottom: '10px'
    },
    statValue: {
      fontSize: '32px',
      fontWeight: 'bold'
    },
    tableSection: {
      flex: 1,
      padding: '20px 40px',
      backgroundColor: 'white',
      overflow: 'auto'
    },
    searchDateSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px'
    },
    searchInput: {
      padding: '12px 20px',
      border: '2px solid #ddd',
      borderRadius: '25px',
      width: '300px',
      fontSize: '16px',
      outline: 'none'
    },
    dateButton: {
      backgroundColor: '#2e8b57',
      color: 'white',
      border: 'none',
      padding: '12px 25px',
      borderRadius: '25px',
      fontSize: '16px',
      cursor: 'pointer'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: 'white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    th: {
      padding: '15px',
      textAlign: 'left',
      fontWeight: 'bold',
      fontSize: '16px',
      borderBottom: '2px solid #ddd',
      color: '#333',
      backgroundColor: '#f8f9fa'
    },
    td: {
      padding: '15px',
      borderBottom: '1px solid #eee',
      fontSize: '14px',
      color: '#555'
    },
    sidebar: {
      width: '350px',
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid #ddd'
    },
    aboutHeader: {
      backgroundColor: '#2e8b57',
      color: 'white',
      padding: '20px',
      fontSize: '24px',
      fontWeight: 'bold',
      textAlign: 'right'
    },
    navMenu: {
      padding: '30px 20px'
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      padding: '15px 10px',
      fontSize: '16px',
      color: '#2e8b57',
      cursor: 'pointer',
      borderRadius: '5px',
      transition: 'background-color 0.2s'
    },
    menuItemActive: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      padding: '15px 10px',
      fontSize: '16px',
      color: '#2e8b57',
      cursor: 'pointer',
      borderRadius: '5px',
      backgroundColor: '#f0f8f0',
      fontWeight: 'bold'
    },
    adminSection: {
      marginTop: 'auto',
      backgroundColor: '#2e8b57',
      color: 'white',
      padding: '30px 20px',
      textAlign: 'center'
    },
    profileImg: {
      width: '100px',
      height: '100px',
      backgroundColor: '#ff6b6b',
      borderRadius: '50%',
      margin: '0 auto 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '40px'
    },
    adminName: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '5px'
    },
    adminTitle: {
      fontSize: '16px',
      marginBottom: '20px',
      textDecoration: 'underline'
    },
    contactInfo: {
      textAlign: 'left',
      fontSize: '14px',
      lineHeight: '1.8'
    },
    contactItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '10px'
    }
  };

  return (
    <div style={styles.container}>
      {/* Main Content Area */}
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          DASHBOARD
        </div>

        {/* Stats Section */}
        <div style={styles.statsSection}>
          {statsData.map((stat, index) => (
            <div key={index} style={styles.statCard}>
              <div style={stat.isRegister ? styles.statIconRegister : styles.statIcon}>
                {stat.icon}
              </div>
              <div style={styles.statText}>
                <div style={styles.statTitle}>{stat.title}</div>
                {stat.value && <div style={styles.statValue}>{stat.value}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Table Section */}
        <div style={styles.tableSection}>
          {/* Search and Date */}
          <div style={styles.searchDateSection}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            <button style={styles.dateButton}>
              📅 09-30-2025
            </button>
          </div>

          {/* Table */}
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>G-Mail/Contact No.</th>
                <th style={styles.th}>Visitor ID</th>
                <th style={styles.th}>Time & Date</th>
                <th style={styles.th}>Room No.</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.map((visitor, index) => (
                <tr
                  key={index}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e3f2fd'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : 'white'}
                >
                  <td style={styles.td}>{visitor.name}</td>
                  <td style={styles.td}>{visitor.contact}</td>
                  <td style={styles.td}>{visitor.id}</td>
                  <td style={styles.td}>{visitor.datetime}</td>
                  <td style={styles.td}>{visitor.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Sidebar */}
      <div style={styles.sidebar}>
        {/* About Us Header */}
        <div style={styles.aboutHeader}>
          About Us
        </div>

        {/* Navigation Menu */}
        <div style={styles.navMenu}>
          {menuItems.map((item, index) => (
            <div
              key={index}
              style={item.active ? styles.menuItemActive : styles.menuItem}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f8f0'}
              onMouseLeave={(e) => {
                if (!item.active) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Admin Profile Section */}
        <div style={styles.adminSection}>
          <div style={styles.profileImg}>
            👩
          </div>
          <div style={styles.adminName}>Sarah Dismaya</div>
          <div style={styles.adminTitle}>Admin</div>
          
          <div style={styles.contactInfo}>
            <div style={styles.contactItem}>
              <span>👤</span>
              <span>Admin</span>
            </div>
            <div style={styles.contactItem}>
              <span>📧</span>
              <span>sarahdismaya@gmail.com</span>
            </div>
            <div style={styles.contactItem}>
              <span>📞</span>
              <span>09345676789</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;