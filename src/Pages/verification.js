import React from 'react';
import '../Styles/verified.css';

function DotRows({ count, direction }) {
    // direction: 'left' or 'right'
    const rows = [];
    for (let row = 0; row < 8; row++) {
        let dotsInRow;
        if (direction === 'right') {
            dotsInRow = row < 4 ? 8 : 8 - (row - 3);
        } else {
            dotsInRow = row + 1;
        }
        const dots = [];
        for (let col = 0; col < dotsInRow; col++) {
            dots.push(
                <div
                    key={col}
                    className="dot"
                    style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#9ca3af',
                        marginRight: '6px',
                        marginBottom: '6px',
                    }}
                />
            );
        }
        rows.push(
            <div
                key={row}
                className={direction === 'right' ? 'dot-row-right' : 'dot-row-left'}
                style={{
                    display: 'flex',
                    marginBottom: '8px',
                    justifyContent: direction === 'right' ? 'flex-end' : 'flex-start',
                }}
            >
                {dots}
            </div>
        );
    }
    return (
        <div
            id={direction === 'right' ? 'right-dots' : 'left-dots'}
            style={{
                position: 'absolute',
                right: direction === 'right' ? '20px' : undefined,
                top: direction === 'right' ? '20px' : undefined,
                left: direction === 'left' ? '20px' : undefined,
                bottom: direction === 'left' ? '20px' : undefined,
            }}
        >
            {rows}
        </div>
    );
}

export default function Verification() {
    return (
        <div
            style={{
                margin: 0,
                padding: '20px',
                backgroundColor: '#e5e7eb',
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
                    width: '500px',
                    height: '300px',
                    backgroundColor: '#f3f4f6',
                    border: '12px solid #000',
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '30px',
                    boxSizing: 'border-box',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <div
                    id="hospital-name"
                    style={{
                        fontSize: '24px',
                        fontWeight: 'normal',
                        color: '#333',
                        lineHeight: '1.2',
                        marginBottom: '30px',
                    }}
                >
                    <div>Ignacio Lacson Arroyo</div>
                    <div>Memorial District Hospital</div>
                </div>
                <div
                    id="checkmark-container"
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: '30px',
                        flex: 1,
                    }}
                >
                    <div
                        id="checkmark-box"
                        style={{
                            width: '120px',
                            height: '120px',
                            backgroundColor: 'white',
                            border: '6px solid #10b981',
                            borderRadius: '15px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <div
                            id="checkmark"
                            style={{
                                fontSize: '60px',
                                color: '#065f46',
                                fontWeight: 'bold',
                                transform: 'rotate(15deg)',
                            }}
                        >
                            ✓
                        </div>
                    </div>
                </div>
                <div
                    id="registered-text"
                    style={{
                        fontSize: '32px',
                        fontWeight: 'normal',
                        color: '#10b981',
                        textAlign: 'center',
                        marginTop: 'auto',
                    }}
                >
                    Registered Visitor
                </div>
                <DotRows direction="right" />
                <DotRows direction="left" />
            </div>
        </div>
    );
}