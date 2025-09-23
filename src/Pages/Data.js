import React from 'react';
import '../Styles/Data.css';

const fieldData = [
    ['Name:', 'Time Out:'],
    ['Address:', 'Date:'],
    ['Time In:', 'Room no. :']
];

function DotRows({ type }) {
    const rows = [];
    for (let row = 0; row < 10; row++) {
        let dotsInRow = type === 'right' ? 10 - row : row + 1;
        const dots = [];
        for (let col = 0; col < dotsInRow; col++) {
            dots.push(<div key={col} className="dot" />);
        }
        rows.push(
            <div key={row} className={type === 'right' ? 'dot-row-right' : 'dot-row-left'}>
                {dots}
            </div>
        );
    }
    return <div id={type === 'right' ? 'right-dots' : 'left-dots'}>{rows}</div>;
}

export default function Data() {
    return (
        <div style={{
            margin: 0,
            padding: '20px',
            backgroundColor: '#e5e7eb',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            fontFamily: 'Arial, sans-serif'
        }}>
            <div id="visitor-form" style={{
                width: '700px',
                height: '500px',
                backgroundColor: '#f3f4f6',
                padding: '40px',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div id="profile-section" style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    marginBottom: '20px'
                }}>
                    <div id="profile-box" style={{
                        width: '120px',
                        height: '120px',
                        backgroundColor: 'white',
                        border: '3px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <div id="profile-icon" style={{
                            width: '80px',
                            height: '80px',
                            position: 'relative'
                        }}>
                            <div id="profile-head" style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                backgroundColor: '#000',
                                position: 'absolute',
                                top: '15px',
                                left: '50%',
                                transform: 'translateX(-50%)'
                            }} />
                            <div id="profile-body" style={{
                                width: '55px',
                                height: '35px',
                                borderRadius: '50% 50% 0 0',
                                backgroundColor: '#000',
                                position: 'absolute',
                                bottom: 0,
                                left: '50%',
                                transform: 'translateX(-50%)'
                            }} />
                        </div>
                    </div>
                </div>
                <div id="form-title" style={{
                    fontSize: '36px',
                    fontWeight: 'normal',
                    color: '#333',
                    textAlign: 'center',
                    marginBottom: '40px'
                }}>
                    Visitor Information
                </div>
                <div id="fields-container" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '25px'
                }}>
                    {fieldData.map((rowData, rowIndex) => (
                        <div key={rowIndex} className="field-row" style={{
                            display: 'flex',
                            gap: '25px',
                            justifyContent: 'space-between'
                        }}>
                            {rowData.map((fieldText, colIndex) => (
                                <div key={colIndex} className="field" style={{
                                    backgroundColor: '#6b9080',
                                    color: 'white',
                                    padding: '15px 25px',
                                    borderRadius: '25px',
                                    fontSize: '18px',
                                    fontWeight: 'normal',
                                    flex: 1,
                                    textAlign: 'left',
                                    minWidth: '200px'
                                }}>
                                    {fieldText}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <DotRows type="right" />
                <DotRows type="left" />
            </div>
        </div>
    );
}
