import React from 'react';
import '../Styles/Verified.css';

const VerifiedBadge = () => {
  return (
    <div
      style={{
        margin: 0,
        padding: '20px',
        backgroundColor: '#22c55e',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        id="visitor-badge"
        style={{
          width: '400px',
          height: '250px',
          backgroundColor: '#f0f0f0',
          border: '8px solid #000',
          borderRadius: '15px',
          display: 'flex',
          flexDirection: 'column',
          padding: '15px',
          boxSizing: 'border-box',
        }}
      >
        <div id="hospital-header" style={{ textAlign: 'center', marginBottom: '10px' }}>
          <div id="hospital-icon">
            <div
              style={{
                width: '40px',
                height: '30px',
                border: '2px solid #333',
                position: 'relative',
                margin: '0 auto',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '15px',
                  width: '10px',
                  height: '8px',
                  border: '2px solid #333',
                  borderBottom: 'none',
                }}
              ></div>
              <div
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: '6px',
                  width: '4px',
                  height: '4px',
                  border: '1px solid #333',
                }}
              ></div>
              <div
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '6px',
                  width: '4px',
                  height: '4px',
                  border: '1px solid #333',
                }}
              ></div>
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '6px',
                  width: '4px',
                  height: '4px',
                  border: '1px solid #333',
                }}
              ></div>
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '6px',
                  width: '4px',
                  height: '4px',
                  border: '1px solid #333',
                }}
              ></div>
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '8px',
                  height: '10px',
                  border: '1px solid #333',
                  borderTop: 'none',
                }}
              ></div>
            </div>
          </div>
          <div
            id="hospital-name"
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginTop: '8px',
              color: '#333',
            }}
          >
            Ignacio Lacson Arroyo Memorial District Hospital
          </div>
        </div>
        <div
          id="name-section"
          style={{
            backgroundColor: '#d0d0d0',
            padding: '8px',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '15px',
            color: '#333',
          }}
        >
          MAC STEVEN PERFAS
        </div>
        <div
          id="profile-icon"
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '15px',
          }}
        >
          <div
            id="profile-circle"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'white',
              border: '4px solid #000',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              id="profile-head"
              style={{
                width: '25px',
                height: '25px',
                borderRadius: '50%',
                backgroundColor: '#000',
                position: 'absolute',
                top: '15px',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            ></div>
            <div
              id="profile-body"
              style={{
                width: '45px',
                height: '30px',
                borderRadius: '50% 50% 0 0',
                backgroundColor: '#000',
                position: 'absolute',
                bottom: '-5px',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            ></div>
          </div>
        </div>
        <div
          id="room-instruction"
          style={{
            textAlign: 'center',
            fontSize: '16px',
            marginBottom: '10px',
            color: '#333',
          }}
        >
          Please Proceed to Room 677
        </div>
        <div
          id="visitor-label"
          style={{
            backgroundColor: '#d0d0d0',
            padding: '8px',
            textAlign: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#333',
            marginTop: 'auto',
          }}
        >
                  VISITOR
                </div>
              </div>
            </div>
          );
        };
        
        export default VerifiedBadge;
