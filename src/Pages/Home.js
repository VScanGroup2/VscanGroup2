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

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg flex flex-col">
        <div className="p-6 flex items-center justify-center border-b">
          <Home className="w-12 h-12 text-gray-700" strokeWidth={1.5} />
        </div>
        
        <nav className="flex-1 py-4">
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => setActiveMenu(item)}
              className={`w-full px-8 py-4 text-left text-lg font-semibold transition-colors ${
                activeMenu === item
                  ? 'bg-gray-200 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="p-8 flex justify-center">
          <button className="bg-teal-700 hover:bg-teal-800 text-white font-bold py-4 px-12 rounded-full text-xl shadow-lg transition-colors">
            REGISTER
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="bg-teal-700 text-white px-12 py-8">
          <h1 className="text-5xl font-bold tracking-wide" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
            IGNACIO LACSON ARROYO MEMORIAL HOSPITAL
          </h1>
        </div>

        {/* Dashboard Title */}
        <div className="bg-white px-12 py-6 shadow-sm border-b-4 border-black">
          <h2 className="text-4xl font-bold text-gray-900">DASHBOARD</h2>
        </div>

        {/* Content Area */}
        <div className="p-12">
          <div className="bg-white rounded-lg shadow-xl p-8">
            {/* Stats Bar */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b-4 border-gray-300">
              <div className="flex items-center gap-4">
                <User className="w-16 h-16 text-gray-800" strokeWidth={2} />
                <div>
                  <div className="text-2xl font-bold text-gray-900">TOTAL VISITOR'S</div>
                  <div className="text-5xl font-bold text-gray-900">{visitors.length}</div>
                </div>
              </div>
              
              <div className="bg-teal-600 text-white px-8 py-3 rounded font-bold text-2xl shadow-md" style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0% 100%)' }}>
                DATE: 12-12-25
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-4 px-4 text-2xl font-bold text-gray-900">Name</th>
                    <th className="text-left py-4 px-4 text-2xl font-bold text-gray-900">Patient Name</th>
                    <th className="text-left py-4 px-4 text-2xl font-bold text-gray-900">Room no.</th>
                    <th className="text-left py-4 px-4 text-2xl font-bold text-gray-900">Time In/Out</th>
                    <th className="text-left py-4 px-4 text-2xl font-bold text-gray-900">Contact No.</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.map((visitor, index) => (
                    <tr 
                      key={visitor.id} 
                      className={`border-b border-gray-200 ${index % 2 === 1 ? 'bg-gray-50' : ''}`}
                    >
                      <td className="py-4 px-4 text-xl text-gray-900">{visitor.name}</td>
                      <td className="py-4 px-4 text-xl text-gray-900">{visitor.patientName}</td>
                      <td className="py-4 px-4 text-xl text-gray-900">{visitor.roomNo}</td>
                      <td className="py-4 px-4 text-xl text-gray-900">{visitor.timeIn}</td>
                      <td className="py-4 px-4 text-xl text-gray-900">{visitor.contactNo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}