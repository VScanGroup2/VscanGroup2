import React, { useState } from 'react';
import '../Styles/Verified.css';

function Verified() {
    const [isChecked, setIsChecked] = useState(true);

    const handleCheckClick = () => {
        setIsChecked((prev) => !prev);
    };

    return (
        <div>
            <div className="header">
                <h1>Ignacio Lacson Arroyo Memorial Hospital</h1>
            </div>

            <div className="main-container">
                <div className="card">
                    <div
                        className="check-container"
                        onClick={handleCheckClick}
                    >
                        <div className={`check-circle${isChecked ? ' checked' : ''}`}>
                            <div className={`checkmark${isChecked ? ' show' : ''}`}></div>
                        </div>
                    </div>
                    <div className="text-content">
                        <h2 className="name">Steven Perfas</h2>
                        <h2 className="room">Room 102</h2>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Verified;