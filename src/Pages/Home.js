import React, { useEffect } from 'react';
import '../Styles/Home.css';

function Home() {
    useEffect(() => {
        // Create the entire dashboard using only JavaScript
        function createDashboard() {
            // Clear body
            document.body.innerHTML = '';
            document.body.style.margin = '0';
            document.body.style.padding = '0';
            document.body.style.fontFamily = 'Arial, sans-serif';
            document.body.style.backgroundColor = '#f5f5f5';

            // Create main container
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.height = '100vh';
            container.style.width = '100vw';

            // Create left main content area
            const mainContent = document.createElement('div');
            mainContent.style.flex = '1';
            mainContent.style.display = 'flex';
            mainContent.style.flexDirection = 'column';

            // Create top header
            const header = document.createElement('div');
            header.style.background = 'linear-gradient(135deg, #2e8b57, #228b22)';
            header.style.color = 'white';
            header.style.padding = '20px 40px';
            header.style.fontSize = '28px';
            header.style.fontWeight = 'bold';
            header.style.textAlign = 'left';
            header.textContent = 'DASHBOARD';

            // Create stats section
            const statsSection = document.createElement('div');
            statsSection.style.display = 'flex';
            statsSection.style.padding = '40px';
            statsSection.style.gap = '40px';
            statsSection.style.backgroundColor = '#e8e8e8';

            // Create stat cards
            const statsData = [
                { title: "Total Visitors", value: '45', icon: '👥' },
                { title: 'Discharge Patients', value: '34', icon: '👥' },
                { title: 'Register Visitor', value: '', icon: '📋' }
            ];

            statsData.forEach((stat, index) => {
                const card = document.createElement('div');
                card.style.backgroundColor = '#2e8b57';
                card.style.color = 'white';
                card.style.padding = '30px';
                card.style.borderRadius = '10px';
                card.style.display = 'flex';
                card.style.alignItems = 'center';
                card.style.gap = '20px';
                card.style.minWidth = '200px';
                card.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';

                const iconDiv = document.createElement('div');
                iconDiv.style.fontSize = '40px';
                iconDiv.style.backgroundColor = 'rgba(255,255,255,0.2)';
                iconDiv.style.padding = '15px';
                iconDiv.style.borderRadius = '8px';
                iconDiv.style.display = 'flex';
                iconDiv.style.alignItems = 'center';
                iconDiv.style.justifyContent = 'center';
                iconDiv.style.width = '60px';
                iconDiv.style.height = '60px';
                
                if (index === 2) {
                    // Register visitor icon
                    iconDiv.innerHTML = '✓';
                    iconDiv.style.fontSize = '50px';
                    iconDiv.style.border = '3px solid white';
                } else {
                    iconDiv.textContent = stat.icon;
                }

                const textDiv = document.createElement('div');
                const title = document.createElement('div');
                title.style.fontSize = '16px';
                title.style.marginBottom = '10px';
                title.textContent = stat.title;

                const value = document.createElement('div');
                value.style.fontSize = '32px';
                value.style.fontWeight = 'bold';
                value.textContent = stat.value;

                textDiv.appendChild(title);
                if (stat.value) textDiv.appendChild(value);

                card.appendChild(iconDiv);
                card.appendChild(textDiv);
                statsSection.appendChild(card);
            });

            // Create table section
            const tableSection = document.createElement('div');
            tableSection.style.flex = '1';
            tableSection.style.padding = '20px 40px';
            tableSection.style.backgroundColor = 'white';

            // Create search and date section
            const searchDateSection = document.createElement('div');
            searchDateSection.style.display = 'flex';
            searchDateSection.style.justifyContent = 'space-between';
            searchDateSection.style.marginBottom = '30px';
            searchDateSection.style.alignItems = 'center';

            // Search input
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Search...';
            searchInput.style.padding = '12px 20px';
            searchInput.style.border = '2px solid #ddd';
            searchInput.style.borderRadius = '25px';
            searchInput.style.width = '300px';
            searchInput.style.fontSize = '16px';
            searchInput.style.outline = 'none';

            // Date button
            const dateButton = document.createElement('button');
            dateButton.style.backgroundColor = '#2e8b57';
            dateButton.style.color = 'white';
            dateButton.style.border = 'none';
            dateButton.style.padding = '12px 25px';
            dateButton.style.borderRadius = '25px';
            dateButton.style.fontSize = '16px';
            dateButton.style.cursor = 'pointer';
            dateButton.textContent = '📅 09-30-2025';

            searchDateSection.appendChild(searchInput);
            searchDateSection.appendChild(dateButton);

            // Create table
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.backgroundColor = 'white';
            table.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';

            // Table headers
            const headers = ['Name', 'G-Mail/Contact No.', 'Visitor ID', 'Time & Date', 'Room No.'];
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            headerRow.style.backgroundColor = '#f8f9fa';

            headers.forEach(header => {
                const th = document.createElement('th');
                th.style.padding = '15px';
                th.style.textAlign = 'left';
                th.style.fontWeight = 'bold';
                th.style.fontSize = '16px';
                th.style.borderBottom = '2px solid #ddd';
                th.style.color = '#333';
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Table data
            const visitorsData = [
                ['Miah Omalza', 'miah@gmail.com', '0119', '9:00AM 09-25-2025', '10'],
                ['Janjan Casi', 'casi@gmail.com', '0120', '8:00AM 09-23-2025', '07'],
                ['Jirah Bindol', 'jirah@gmail.com', '0101', '8:00AM 09-02-2025', '13'],
                ['Andrea Magayon', 'andrea@gmail.com', '0123', '9:00PM 08-30-2025', '15'],
                ['Grace Poe', 'gracepoe@gmail.com', '0145', '11:00AM 08-25-2025', '22']
            ];

            const tbody = document.createElement('tbody');
            visitorsData.forEach((visitor, index) => {
                const row = document.createElement('tr');
                row.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : 'white';
                row.style.transition = 'background-color 0.2s';
                
                row.addEventListener('mouseenter', () => {
                    row.style.backgroundColor = '#e3f2fd';
                });
                
                row.addEventListener('mouseleave', () => {
                    row.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : 'white';
                });

                visitor.forEach(data => {
                    const td = document.createElement('td');
                    td.style.padding = '15px';
                    td.style.borderBottom = '1px solid #eee';
                    td.style.fontSize = '14px';
                    td.style.color = '#555';
                    td.textContent = data;
                    row.appendChild(td);
                });
                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            // Create right sidebar
            const sidebar = document.createElement('div');
            sidebar.style.width = '350px';
            sidebar.style.backgroundColor = 'white';
            sidebar.style.display = 'flex';
            sidebar.style.flexDirection = 'column';
            sidebar.style.borderLeft = '1px solid #ddd';

            // About Us header
            const aboutHeader = document.createElement('div');
            aboutHeader.style.backgroundColor = '#2e8b57';
            aboutHeader.style.color = 'white';
            aboutHeader.style.padding = '20px';
            aboutHeader.style.fontSize = '24px';
            aboutHeader.style.fontWeight = 'bold';
            aboutHeader.style.textAlign = 'right';
            aboutHeader.textContent = 'About Us';

            // Navigation menu
            const navMenu = document.createElement('div');
            navMenu.style.padding = '30px 20px';

            const menuItems = [
                { text: 'HOME', icon: '🏠' },
                { text: 'Dashboard', icon: '📊' },
                { text: 'Visitor Information', icon: '👤' },
                { text: 'Registered Visitor', icon: '✓' },
                { text: 'Visitor History', icon: '📋' },
                { text: 'Attendance', icon: '📅' }
            ];

            menuItems.forEach((item, index) => {
                const menuItem = document.createElement('div');
                menuItem.style.display = 'flex';
                menuItem.style.alignItems = 'center';
                menuItem.style.gap = '15px';
                menuItem.style.padding = '15px 10px';
                menuItem.style.fontSize = '16px';
                menuItem.style.color = '#2e8b57';
                menuItem.style.fontWeight = index === 1 ? 'bold' : 'normal';
                menuItem.style.cursor = 'pointer';
                menuItem.style.borderRadius = '5px';
                menuItem.style.transition = 'background-color 0.2s';

                if (index === 1) {
                    menuItem.style.backgroundColor = '#f0f8f0';
                }

                menuItem.addEventListener('mouseenter', () => {
                    menuItem.style.backgroundColor = '#f0f8f0';
                });
                
                menuItem.addEventListener('mouseleave', () => {
                    menuItem.style.backgroundColor = index === 1 ? '#f0f8f0' : 'transparent';
                });

                const icon = document.createElement('span');
                icon.style.fontSize = '18px';
                icon.textContent = item.icon;

                const text = document.createElement('span');
                text.textContent = item.text;

                menuItem.appendChild(icon);
                menuItem.appendChild(text);
                navMenu.appendChild(menuItem);
            });

            // Admin profile section
            const adminSection = document.createElement('div');
            adminSection.style.marginTop = 'auto';
            adminSection.style.backgroundColor = '#2e8b57';
            adminSection.style.color = 'white';
            adminSection.style.padding = '30px 20px';
            adminSection.style.textAlign = 'center';

            // Profile image
            const profileImg = document.createElement('div');
            profileImg.style.width = '100px';
            profileImg.style.height = '100px';
            profileImg.style.backgroundColor = '#ff6b6b';
            profileImg.style.borderRadius = '50%';
            profileImg.style.margin = '0 auto 20px';
            profileImg.style.display = 'flex';
            profileImg.style.alignItems = 'center';
            profileImg.style.justifyContent = 'center';
            profileImg.style.fontSize = '40px';
            profileImg.textContent = '👩';

            // Admin name
            const adminName = document.createElement('div');
            adminName.style.fontSize = '20px';
            adminName.style.fontWeight = 'bold';
            adminName.style.marginBottom = '5px';
            adminName.textContent = 'Sarah Dismaya';

            const adminTitle = document.createElement('div');
            adminTitle.style.fontSize = '16px';
            adminTitle.style.marginBottom = '20px';
            adminTitle.style.textDecoration = 'underline';
            adminTitle.textContent = 'Admin';

            // Contact info
            const contactInfo = document.createElement('div');
            contactInfo.style.textAlign = 'left';
            contactInfo.style.fontSize = '14px';
            contactInfo.style.lineHeight = '1.8';

            const adminLabel = document.createElement('div');
            adminLabel.style.display = 'flex';
            adminLabel.style.alignItems = 'center';
            adminLabel.style.gap = '10px';
            adminLabel.style.marginBottom = '10px';
            adminLabel.innerHTML = '👤 Admin';

            const emailLabel = document.createElement('div');
            emailLabel.style.display = 'flex';
            emailLabel.style.alignItems = 'center';
            emailLabel.style.gap = '10px';
            emailLabel.style.marginBottom = '10px';
            emailLabel.innerHTML = '📧 sarahdismaya@gmail.com';

            const phoneLabel = document.createElement('div');
            phoneLabel.style.display = 'flex';
            phoneLabel.style.alignItems = 'center';
            phoneLabel.style.gap = '10px';
            phoneLabel.innerHTML = '📞 09345676789';

            contactInfo.appendChild(adminLabel);
            contactInfo.appendChild(emailLabel);
            contactInfo.appendChild(phoneLabel);

            adminSection.appendChild(profileImg);
            adminSection.appendChild(adminName);
            adminSection.appendChild(adminTitle);
            adminSection.appendChild(contactInfo);

            // Assemble everything
            sidebar.appendChild(aboutHeader);
            sidebar.appendChild(navMenu);
            sidebar.appendChild(adminSection);

            tableSection.appendChild(searchDateSection);
            tableSection.appendChild(table);

            mainContent.appendChild(header);
            mainContent.appendChild(statsSection);
            mainContent.appendChild(tableSection);

            container.appendChild(mainContent);
            container.appendChild(sidebar);

            document.body.appendChild(container);

            // Add search functionality
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const rows = tbody.querySelectorAll('tr');
                
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(searchTerm) ? 'table-row' : 'none';
                });
            });
        }
        // Initialize dashboard when page loads
        createDashboard();
    }, []);

    return null;
}

export default Home;