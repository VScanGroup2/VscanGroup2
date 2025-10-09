import React, { useState } from 'react';
import '../Styles/Home.css';

export default function VisitorDashboard() {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  
  const visitors = [
    { id: 1, name: 'Steven Perfas', roomNo: '102', patientName: 'John Doe', timeIn: '9:00AM', contactNo: '09326789902' },
    { id: 2, name: 'Rino Villar', roomNo: '121', patientName: 'Jane Smith', timeIn: '3:00PM', contactNo: '09326789989' },
    { id: 3, name: 'Rey Javier', roomNo: '105', patientName: 'Mike Johnson', timeIn: '10:00AM', contactNo: '09326789889' },
    { id: 4, name: 'Carlos Casi', roomNo: '109', patientName: 'Sarah Williams', timeIn: '7:00PM', contactNo: '0930675989' },
    { id: 5, name: 'John Boni', roomNo: '119', patientName: 'Robert Brown', timeIn: '5:00PM', contactNo: '09986759989' },
    { id: 6, name: 'Jireh Bindol', roomNo: '114', patientName: 'Emily Davis', timeIn: '9:00PM', contactNo: '09323459989' }
  ];

  const menuItems = ['Dashboard', "Visitor's Information", 'Registered Visitor', "Visitor's History", 'Attendance'];

  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    },
    header: {
      backgroundColor: '#0d7a5f',
      color: 'white',
      padding: '25px 40px',
      fontSize: '48px',
      fontWeight: 'bold',
      letterSpacing: '3px',
      textTransform: 'uppercase',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
    },
    mainContainer: {
      display: 'flex',
      minHeight: 'calc(100vh - 98px)',
      backgroundColor: '#f5f5f5'
    },
    content: {
      flex: 1,
      padding: '40px 50px',
      backgroundColor: '#f5f5f5'
    },
    title: {
      fontSize: '36px',
      fontWeight: 'bold',
      marginBottom: '30px',
      color: '#000',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      backgroundColor: 'white',
      padding: '20px 30px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      borderLeft: '5px solid #000'
    },
    statsWrapper: {
      position: 'relative',
      marginBottom: '35px'
    },
    statsContainer: {
      display: 'flex',
      gap: '50px',
      flexWrap: 'wrap',
      backgroundColor: '#e0e0e0',
      padding: '35px 40px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
      marginBottom: '0'
    },
    statBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '25px'
    },
    statIcon: {
      fontSize: '80px',
      color: '#000'
    },
    statInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px'
    },
    statLabel: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#000',
      textTransform: 'uppercase'
    },
    statValue: {
      fontSize: '56px',
      fontWeight: 'bold',
      color: '#000',
      lineHeight: '1'
    },
    dateBox: {
      backgroundColor: '#0d7a5f',
      color: 'white',
      padding: '12px 50px 12px 35px',
      fontSize: '28px',
      fontWeight: 'bold',
      width: 'fit-content',
      marginLeft: 'auto',
      marginTop: '-80px',
      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2)',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%)',
      position: 'relative',
      zIndex: 10
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: 'white',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
    },
    th: {
      padding: '20px 25px',
      textAlign: 'left',
      fontSize: '26px',
      fontWeight: 'bold',
      borderBottom: '3px solid #000',
      backgroundColor: 'white',
      color: '#000'
    },
    td: {
      padding: '20px 25px',
      fontSize: '24px',
      borderBottom: '1px solid #ddd',
      color: '#000'
    },
    sidebar: {
      width: '380px',
      backgroundColor: '#e8e8e8',
      padding: '30px 25px',
      borderLeft: '3px solid #000',
      display: 'flex',
      flexDirection: 'column'
    },
    homeIcon: {
      fontSize: '80px',
      textAlign: 'center',
      marginBottom: '30px',
      cursor: 'pointer',
      color: '#000'
    },
    menuItem: {
      padding: '20px 25px',
      fontSize: '28px',
      fontWeight: 'bold',
      cursor: 'pointer',
      textAlign: 'left',
      borderBottom: '2px solid #fff',
      transition: 'all 0.2s ease'
    },
    menuItemActive: {
      backgroundColor: '#b8b8b8',
      color: '#000'
    },
    menuItemInactive: {
      backgroundColor: '#d9d9d9',
      color: '#000'
    },
    registerBtn: {
      backgroundColor: '#0d7a5f',
      color: 'white',
      padding: '25px 30px',
      marginTop: '60px',
      fontSize: '32px',
      fontWeight: 'bold',
      textAlign: 'center',
      borderRadius: '50px',
      cursor: 'pointer',
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
      textTransform: 'uppercase',
      border: 'none'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        IGNACIO LACSON ARROYO MEMORIAL HOSPITAL
      </div>

      {/* Main Container */}
      <div style={styles.mainContainer}>
        {/* Content Area */}
        <div style={styles.content}>
          {/* Dashboard Title */}
          <div style={styles.title}>DASHBOARD</div>

          {/* Stats Container with Date */}
          <div style={styles.statsWrapper}>
            <div style={styles.statsContainer}>
              <div style={styles.statBox}>
                <div style={styles.statIcon}>👥</div>
                <div style={styles.statInfo}>
                  <div style={styles.statLabel}>Total Visitor's</div>
                  <div style={styles.statValue}>43</div>
                </div>
              </div>
            </div>
            
            <div style={styles.dateBox}>
              DATE: 12-12-25
            </div>
          </div>

          {/* Table */}
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Room no.</th>
                <th style={styles.th}>Patient Name</th>
                <th style={styles.th}>Time In/Out</th>
                <th style={styles.th}>Contact No.</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((visitor, index) => (
                <tr key={visitor.id} style={{
                  backgroundColor: index % 2 === 1 ? '#f0f0f0' : 'white'
                }}>
                  <td style={styles.td}>{visitor.name}</td>
                  <td style={styles.td}>{visitor.roomNo}</td>
                  <td style={styles.td}>{visitor.patientName}</td>
                  <td style={styles.td}>{visitor.timeIn}</td>
                  <td style={styles.td}>{visitor.contactNo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.homeIcon}>🏠</div>
          
          {menuItems.map((item) => (
            <div
              key={item}
              onClick={() => setActiveMenu(item)}
              style={{
                ...styles.menuItem,
                ...(activeMenu === item ? styles.menuItemActive : styles.menuItemInactive)
              }}
            >
              {item}
            </div>
          ))}

          <button style={styles.registerBtn}>
            REGISTER
          </button>
        </div>
      </div>
    </div>
  );
}