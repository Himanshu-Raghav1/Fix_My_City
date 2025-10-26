import { GoogleGenAI, Chat } from "@google/genai";

// Fix: Add declarations for google maps and custom window properties to resolve TypeScript errors.
declare const google: any;
declare global {
  interface Window {
    initMap: () => void;
    mapsApiLoaded: boolean;
    domContentLoaded: boolean;
  }
}

// --- App Database ---
interface Complaint {
    id: number;
    username: string;
    category: string;
    city: string;
    title: string;
    details: string;
    location: {
        address: string;
        lat: number;
        lng: number;
    };
    date: string;
    status: 'Pending' | 'In Progress' | 'Resolved';
    photo?: string;
}

let nextComplaintId = 205;
let complaintsDB: Complaint[] = [
    { id: 1, username: 'Priya S.', category: 'Streetlight Failure', city: 'Mumbai', title: 'Streetlight out near Shivaji Park area', details: 'The main streetlight on the corner has been out for 3 days.', location: { address: 'Shivaji Park, Mumbai', lat: 19.02, lng: 72.84 }, date: '2025-10-15', status: 'Resolved' },
    { id: 2, username: 'Rohan M.', category: 'Garbage & Dumping', city: 'Delhi', title: 'Overflowing bin at Jawaharlal Nehru Park', details: 'The garbage bin near the main gate is overflowing and attracting stray animals.', location: { address: 'Jawaharlal Nehru Park, Delhi', lat: 28.55, lng: 77.20 }, date: '2025-10-20', status: 'In Progress' },
    { id: 3, username: 'Priya S.', category: 'Pothole', city: 'Delhi', title: 'Pothole on Sardar Patel Road', details: 'A large and dangerous pothole has formed on the main road, causing traffic issues.', location: { address: 'Sardar Patel Road, New Delhi', lat: 28.60, lng: 77.18 }, date: '2025-10-24', status: 'Pending' },
    { id: 4, username: 'Anjali K.', category: 'Broken Sidewalk', city: 'Bangalore', title: 'Cracked pavement on pedestrian path', details: 'The sidewalk is cracked and uneven, making it difficult for pedestrians.', location: { address: 'MG Road, Bangalore', lat: 12.97, lng: 77.59 }, date: '2025-10-22', status: 'Resolved' },
    // --- START: 200 Additional Complaints ---
    { id: 5, username: "Aarav Sharma", category: "Pothole", city: "Mumbai", title: "Dangerous pothole on Linking Road", details: "This large pothole is a hazard for vehicles, especially at night. It needs immediate repair.", location: { address: "Linking Road, near the post office, Mumbai", lat: 19.06, lng: 72.83 }, date: "2024-03-15", status: "Resolved" },
    { id: 6, username: "Saanvi Mishra", category: "Garbage & Dumping", city: "Delhi", title: "Garbage pile-up near Connaught Place", details: "The garbage bin is overflowing and waste is scattered on the road, causing a health hazard.", location: { address: "Connaught Place, opposite the big temple, Delhi", lat: 28.63, lng: 77.22 }, date: "2024-05-20", status: "In Progress" },
    { id: 7, username: "Vihaan Gupta", category: "Streetlight Failure", city: "Bangalore", title: "Streetlight not working at MG Road", details: "The streetlight has been out for several days, making the area unsafe after dark.", location: { address: "MG Road, behind the shopping mall, Bangalore", lat: 12.97, lng: 77.60 }, date: "2024-07-01", status: "Pending" },
    ...Array.from({ length: 197 }, (_, i) => {
        const id = 8 + i;
        const names = ['Aarav Sharma', 'Vivaan Singh', 'Aditya Kumar', 'Vihaan Gupta', 'Arjun Patel', 'Sai Reddy', 'Reyansh Jain', 'Ayaan Khan', 'Krishna Verma', 'Ishaan Agarwal', 'Saanvi Mishra', 'Aanya Shah', 'Aadhya Tiwari', 'Aaradhya Choudhury', 'Ananya Joshi', 'Pari Mehta', 'Anika Menon', 'Navya Nair', 'Diya Iyer', 'Myra Rao'];
        const categories = ['Pothole', 'Garbage & Dumping', 'Streetlight Failure', 'Broken Sidewalk', 'Graffiti', 'Water Logging', 'Stray Animals', 'Illegal Parking', 'Damaged Public Property'];
        const cities = [
            { name: 'Mumbai', lat: 19.0760, lng: 72.8777 }, { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
            { name: 'Bangalore', lat: 12.9716, lng: 77.5946 }, { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
            { name: 'Kolkata', lat: 22.5726, lng: 88.3639 }, { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
            { name: 'Pune', lat: 18.5204, lng: 73.8567 }, { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
            { name: 'Jaipur', lat: 26.9124, lng: 75.7873 }, { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
            { name: 'Surat', lat: 21.1702, lng: 72.8311 }, { name: 'Kanpur', lat: 26.4499, lng: 80.3319 },
            { name: 'Nagpur', lat: 21.1458, lng: 79.0882 }, { name: 'Indore', lat: 22.7196, lng: 75.8577 },
            { name: 'Thane', lat: 19.2183, lng: 72.9781 }, { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
            { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 }, { name: 'Patna', lat: 25.5941, lng: 85.1376 },
            { name: 'Vadodara', lat: 22.3072, lng: 73.1812 }, { name: 'Ludhiana', lat: 30.9010, lng: 75.8573 }
        ];
        // Fix: Added 'as const' to ensure the 'status' property is correctly typed as 'Pending' | 'In Progress' | 'Resolved', resolving the type mismatch with the 'Complaint' interface.
        const statuses = ['Pending', 'In Progress', 'Resolved'] as const;
        const streetSuffixes = ['Road', 'Marg', 'Street', 'Nagar', 'Colony', 'Chowk', 'Park', 'Extension'];
        const landmarks = ['near the post office', 'opposite the big temple', 'behind the shopping mall', 'at the main intersection', 'next to the public park', 'in front of the school', 'at the bus stop'];
        const titleTemplates = { 'Pothole': 'Dangerous pothole on', 'Garbage & Dumping': 'Garbage pile-up near', 'Streetlight Failure': 'Streetlight not working at', 'Broken Sidewalk': 'Sidewalk broken on', 'Graffiti': 'Graffiti vandalism on wall of', 'Water Logging': 'Severe water logging issue at', 'Stray Animals': 'Stray animal menace in', 'Illegal Parking': 'Illegal parking blocking', 'Damaged Public Property': 'Public bench damaged at' };
        const detailTemplates = { 'Pothole': 'This large pothole is a hazard for vehicles, especially at night. It needs immediate repair.', 'Garbage & Dumping': 'The garbage bin is overflowing and waste is scattered on the road, causing a health hazard.', 'Streetlight Failure': 'The streetlight has been out for several days, making the area unsafe after dark.', 'Broken Sidewalk': 'The pavement is cracked and uneven, making it difficult for elderly people and children to walk.', 'Graffiti': 'Someone has spray-painted the wall of the public building, it looks very unsightly.', 'Water Logging': 'After a short rain, the entire road is flooded, causing major traffic and inconvenience.', 'Stray Animals': 'A group of stray dogs has become aggressive and is a threat to the residents of the area.', 'Illegal Parking': 'Cars are parked on both sides of this narrow road, making it impossible for traffic to pass.', 'Damaged Public Property': 'A bench in the park has been broken and is unusable.' };
        
        const city = cities[Math.floor(Math.random() * cities.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const streetName = `${names[Math.floor(Math.random() * names.length)].split(' ')[0]} ${streetSuffixes[Math.floor(Math.random() * streetSuffixes.length)]}`;
        const landmark = landmarks[Math.floor(Math.random() * landmarks.length)];
        const lat = city.lat + (Math.random() - 0.5) * 0.1;
        const lng = city.lng + (Math.random() - 0.5) * 0.1;
        const startDate = new Date(2023, 0, 1);
        const endDate = new Date();
        const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));

        return {
            id: id,
            username: names[Math.floor(Math.random() * names.length)],
            category: category,
            city: city.name,
            title: `${titleTemplates[category]} ${streetName}`,
            details: detailTemplates[category],
            location: { address: `${streetName}, ${landmark}, ${city.name}`, lat: parseFloat(lat.toFixed(4)), lng: parseFloat(lng.toFixed(4)) },
            date: randomDate.toISOString().split('T')[0],
            status: statuses[Math.floor(Math.random() * statuses.length)],
        };
    })
    // --- END: 200 Additional Complaints ---
];


// --- Map Variables ---
let mapReport, mapDashboard, reportMarker, geocoder;
let mapsInitialized = false;

// This function is called by the Google Maps script tag
function initMap() {
    window.mapsApiLoaded = true;
    if (window.domContentLoaded) {
        initializeMaps();
    }
}
// Make it globally accessible
window.initMap = initMap;

function initializeMaps() {
    if (mapsInitialized || typeof google === 'undefined') return;
    mapsInitialized = true;
    
    const initialPosition = { lat: 20.5937, lng: 78.9629 }; // India
    geocoder = new google.maps.Geocoder();

    // --- Initialize Report Map ---
    const mapReportDiv = document.getElementById('map-report');
    if(mapReportDiv) {
        mapReport = new google.maps.Map(mapReportDiv, {
            center: initialPosition,
            zoom: 5,
            mapTypeControl: false,
            streetViewControl: false,
        });

        reportMarker = new google.maps.Marker({
            position: initialPosition,
            map: mapReport,
            draggable: true,
            title: "Drag me to the issue location!"
        });

        reportMarker.addListener('dragend', () => {
            updateLocationInput(reportMarker.getPosition());
        });

        // --- Autocomplete ---
        const locationInput = document.getElementById('location') as HTMLInputElement;
        const autocomplete = new google.maps.places.Autocomplete(locationInput);
        autocomplete.bindTo('bounds', mapReport);
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                mapReport.setCenter(place.geometry.location);
                mapReport.setZoom(17);
                reportMarker.setPosition(place.geometry.location);
                 // Also update the input field with the formatted address
                if (place.formatted_address) {
                    locationInput.value = place.formatted_address;
                }
            }
        });
    }
    
    // --- Initialize Dashboard Map ---
    const mapDashboardDiv = document.getElementById('map-dashboard');
    if(mapDashboardDiv) {
         mapDashboard = new google.maps.Map(mapDashboardDiv, {
            center: initialPosition,
            zoom: 5,
            mapTypeControl: false,
        });
        // Markers will be added dynamically by renderPublicDashboard
    }
}

function updateLocationInput(latLng) {
    geocoder.geocode({ 'location': latLng }, (results, status) => {
        if (status === 'OK') {
            if (results[0]) {
                (document.getElementById('location') as HTMLInputElement).value = results[0].formatted_address;
            } else {
                console.log('No results found');
            }
        } else {
            console.log('Geocoder failed due to: ' + status);
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    window.domContentLoaded = true;
    if (window.mapsApiLoaded) {
        initializeMaps();
    }
    // --- State ---
    let isUserLoggedIn = false;
    // For simplicity, we'll hardcode the current user. In a real app, this would come from the login process.
    const currentUser = "Priya S.";

    // --- Element Selectors ---
    const pages = document.querySelectorAll('.page');
    const mainHeader = document.getElementById('main-header');
    const mainContent = document.getElementById('main-content');
    const mainFooter = document.getElementById('main-footer');
    const chatbotContainer = document.getElementById('chatbot-container');
    const navLinks = document.querySelectorAll('.nav-link');
    const ctaButtons = document.querySelectorAll('.cta-button');
    
    // Forms
    const reportForm = document.getElementById('report-form');
    const successMessage = document.getElementById('form-success-message');
    const adminLoginForm = document.getElementById('admin-login-form');
    const loginError = document.getElementById('login-error');
    const citizenLoginForm = document.getElementById('citizen-login-form');
    const citizenSignupForm = document.getElementById('citizen-signup-form');

    // Reports & Dashboard
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const adminIssuesTbody = document.getElementById('admin-issues-tbody');
    const myReportsListContainer = document.getElementById('my-reports-list-container');
    const recentlyResolvedContainer = document.getElementById('recently-resolved-container');
    const citizenDashboardReportsContainer = document.getElementById('citizen-dashboard-reports-container');


    // Chatbot
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotWindow = document.getElementById('chatbot-window');
    const closeChatbot = document.getElementById('close-chatbot');
    
    // Mobile Menu
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    // Role Selection
    const selectCitizen = document.getElementById('select-citizen');
    const selectAdmin = document.getElementById('select-admin');

    // Login/Signup Page
    const showLoginTab = document.getElementById('show-login-tab');
    const showSignupTab = document.getElementById('show-signup-tab');

    // Location button
    const useLocationBtn = document.getElementById('use-location-btn');

    // Dynamic Nav Links
    const nav = {
        myReports: [document.getElementById('my-reports-link-d'), document.getElementById('my-reports-link-m')],
        loginSignup: [document.getElementById('login-signup-link-d'), document.getElementById('login-signup-link-m')],
        logout: [document.getElementById('logout-link-d'), document.getElementById('logout-link-m')],
    };

    // --- Data Rendering Functions ---

    function renderAdminTable() {
        if (!adminIssuesTbody) return;
        adminIssuesTbody.innerHTML = ''; // Clear existing rows
        complaintsDB.forEach(c => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-50';
            row.innerHTML = `
                <td class="p-4">${c.title}</td>
                <td class="p-4">${c.category}</td>
                <td class="p-4">${c.date}</td>
                <td class="p-4">${c.username}</td>
                <td class="p-4">${c.city}</td>
                <td class="p-4">
                    <select class="status-select font-medium p-2 rounded-md border border-gray-300 bg-gray-50" data-id="${c.id}">
                        <option ${c.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option ${c.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option ${c.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                </td>
            `;
            adminIssuesTbody.appendChild(row);
        });

        // Add event listeners to the new select elements
        adminIssuesTbody.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', handleStatusUpdate);
        });
    }

    function renderMyReports() {
        if (!myReportsListContainer) return;
        myReportsListContainer.innerHTML = '';
        const userReports = complaintsDB.filter(c => c.username === currentUser);

        if (userReports.length === 0) {
            myReportsListContainer.innerHTML = `<div class="bg-white p-5 rounded-lg shadow-md text-center text-gray-500">You have not registered any complainants yet.</div>`;
            return;
        }

        userReports.forEach(c => {
            const statusConfig = {
                'Pending': { icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`, color: 'text-red-600' },
                'In Progress': { icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0115.357-2m0 0H15"></path></svg>`, color: 'text-amber-600' },
                'Resolved': { icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`, color: 'text-green-600' }
            };
            const card = document.createElement('div');
            card.className = 'report-card bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow';
            card.innerHTML = `
                <div class="p-5 flex items-center justify-between">
                    <div>
                        <p class="font-semibold">${c.title}</p>
                        <p class="text-sm text-gray-500">${c.category}</p>
                    </div>
                    <div class="flex items-center gap-2 ${statusConfig[c.status].color} font-medium">
                        ${statusConfig[c.status].icon}
                        ${c.status}
                    </div>
                </div>
                <div class="report-details hidden p-5 border-t border-gray-200 bg-gray-50">
                    <p><strong class="text-gray-600">Submitted:</strong> ${c.date}</p>
                    <p><strong class="text-gray-600">Location:</strong> ${c.location.address}</p>
                    <p class="mt-2"><strong class="text-gray-600">Details:</strong> "${c.details}"</p>
                </div>
            `;
            myReportsListContainer.appendChild(card);
        });
        
         // Re-add event listeners for expand/collapse
        myReportsListContainer.querySelectorAll('.report-card').forEach(card => {
            card.addEventListener('click', () => {
                card.querySelector('.report-details').classList.toggle('hidden');
            });
        });
    }

    function renderPublicDashboard() {
        if (!recentlyResolvedContainer || !mapDashboard) return;

        // Stats
        const total = complaintsDB.length;
        const resolved = complaintsDB.filter(c => c.status === 'Resolved').length;
        const inProgress = complaintsDB.filter(c => c.status === 'In Progress').length;
        document.getElementById('total-complaints-stat').textContent = total.toString();
        document.getElementById('resolved-complaints-stat').textContent = resolved.toString();
        document.getElementById('inprogress-complaints-stat').textContent = inProgress.toString();
        
        // Recently Resolved
        recentlyResolvedContainer.innerHTML = '';
        const recentlyResolved = complaintsDB.filter(c => c.status === 'Resolved').slice(0, 3); // Get latest 3
         if (recentlyResolved.length === 0) {
            recentlyResolvedContainer.innerHTML = `<div class="bg-white p-5 rounded-lg shadow-md text-center text-gray-500">No issues have been resolved recently.</div>`;
        } else {
            recentlyResolved.forEach(c => {
                const item = document.createElement('div');
                item.className = 'bg-white p-5 rounded-lg shadow-md flex items-center justify-between';
                item.innerHTML = `
                    <div>
                        <p class="font-semibold">${c.title}</p>
                        <p class="text-sm text-gray-500">${c.category}</p>
                    </div>
                    <div class="flex items-center gap-2 text-green-600">
                         <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm font-medium">Resolved on ${c.date}</span>
                    </div>
                `;
                recentlyResolvedContainer.appendChild(item);
            });
        }

        // Map markers
        const infoWindow = new google.maps.InfoWindow();
        complaintsDB.forEach(issue => {
            const marker = new google.maps.Marker({
                position: { lat: issue.location.lat, lng: issue.location.lng },
                map: mapDashboard,
                title: issue.title,
            });
            marker.addListener('click', () => {
                infoWindow.setContent(`
                    <div class="p-2">
                        <h4 class="font-bold">${issue.title}</h4>
                        <p class="text-gray-600">${issue.category}</p>
                         <p class="text-sm text-gray-500">Status: ${issue.status}</p>
                    </div>
                `);
                infoWindow.open(mapDashboard, marker);
            });
        });
    }
    
    function renderCitizenDashboard() {
        if (!citizenDashboardReportsContainer) return;
        
        const userReports = complaintsDB.filter(c => c.username === currentUser);
        
        // Stats
        document.getElementById('citizen-total-stat').textContent = userReports.length.toString();
        document.getElementById('citizen-resolved-stat').textContent = userReports.filter(c => c.status === 'Resolved').length.toString();
        
        // Recent Activity
        citizenDashboardReportsContainer.innerHTML = '';
        const recentUserReports = userReports.slice(0, 3);
        
        if(recentUserReports.length === 0) {
             citizenDashboardReportsContainer.innerHTML = `<div class="bg-white/80 p-4 rounded-lg text-center text-gray-500">No recent activity.</div>`;
             return;
        }

        recentUserReports.forEach(c => {
            const statusConfig = {
                'Pending': { text: 'PENDING', bg: 'bg-red-100', color: 'text-red-700' },
                'In Progress': { text: 'IN PROGRESS', bg: 'bg-amber-100', color: 'text-amber-700' },
                'Resolved': { text: 'RESOLVED', bg: 'bg-green-100', color: 'text-green-700' },
            };
            const item = document.createElement('div');
            item.className = 'bg-white/80 p-4 rounded-lg flex items-center justify-between';
            item.innerHTML = `
                <div>
                    <p class="font-semibold text-gray-800">${c.title}</p>
                    <p class="text-sm text-gray-500">Submitted: ${c.date}</p>
                </div>
                <span class="text-xs font-bold ${statusConfig[c.status].color} ${statusConfig[c.status].bg} py-1 px-3 rounded-full">${statusConfig[c.status].text}</span>
            `;
             citizenDashboardReportsContainer.appendChild(item);
        });
    }
    
    function updateAllDashboards() {
        renderAdminTable();
        renderMyReports();
        renderPublicDashboard();
        renderCitizenDashboard();
    }
    
    // --- Functions ---
    function showPage(pageId) {
         if (!mapsInitialized && (pageId === 'reportPage' || pageId === 'dashboardPage')) {
            initializeMaps();
        }
        
        // Re-render data if navigating to a dashboard page
        if (pageId.toLowerCase().includes('dashboard') || pageId === 'myReportsListPage') {
            updateAllDashboards();
        }

        // Special handling for the citizen dashboard layout
        if (pageId === 'citizenDashboardPage') {
            mainHeader.classList.add('hidden');
            mainContent.classList.remove('container', 'mx-auto', 'px-6', 'py-8', 'md:py-16');
            mainContent.classList.add('w-full', 'p-0');
            mainFooter.classList.add('hidden');
            chatbotContainer.classList.add('hidden'); // Hide floating chatbot on dashboard
        } else {
            mainHeader.classList.remove('hidden');
            mainContent.classList.add('container', 'mx-auto', 'px-6', 'py-8', 'md:py-16');
            mainContent.classList.remove('w-full', 'p-0');
            mainFooter.classList.remove('hidden');
            chatbotContainer.classList.remove('hidden');
        }
        
        pages.forEach(page => {
            page.id === pageId ? page.classList.remove('hidden') : page.classList.add('hidden');
        });

        // Update active link styles
        navLinks.forEach(link => {
            link.classList.remove('nav-link-active', 'font-semibold');
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('nav-link-active', 'font-semibold');
            }
        });

        sidebarLinks.forEach(link => {
            link.classList.remove('sidebar-link-active');
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('sidebar-link-active');
            }
        });

        if (pageId === 'citizenDashboardPage') {
            // This is a bit of a hack to make sure the main container is not constrained
            document.getElementById(pageId).parentElement.classList.remove('container', 'mx-auto', 'px-6', 'py-8', 'md:py-16');
        } else {
             document.getElementById('citizenDashboardPage').parentElement.classList.add('container', 'mx-auto', 'px-6', 'py-8', 'md:py-16');
        }

        window.scrollTo(0, 0);
        mobileMenu.classList.add('hidden'); // Close mobile menu on navigation
    }
    
    function setupNav(elements) {
         elements.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = (e.currentTarget as HTMLElement).getAttribute('data-page');
                if (pageId) showPage(pageId);
            });
        });
    }

    function updateNavUI() {
        if (isUserLoggedIn) {
            nav.myReports.forEach(el => el.classList.remove('hidden'));
            nav.logout.forEach(el => el.classList.remove('hidden'));
            nav.loginSignup.forEach(el => el.classList.add('hidden'));
        } else {
            nav.myReports.forEach(el => el.classList.add('hidden'));
            nav.logout.forEach(el => el.classList.add('hidden'));
            nav.loginSignup.forEach(el => el.classList.remove('hidden'));
        }
    }

    function handleCitizenLogin(e) {
        e.preventDefault();
        isUserLoggedIn = true;
        updateNavUI();
        showPage('citizenDashboardPage');
    }
    
    function handleLogout(e) {
        e.preventDefault();
        isUserLoggedIn = false;
        updateNavUI();
        showPage('homePage');
    }

    function handleStatusUpdate(e) {
        const selectElement = e.target as HTMLSelectElement;
        const complaintId = parseInt(selectElement.dataset.id, 10);
        const newStatus = selectElement.value as 'Pending' | 'In Progress' | 'Resolved';

        const complaint = complaintsDB.find(c => c.id === complaintId);
        if (complaint) {
            complaint.status = newStatus;
            console.log(`Updated complaint #${complaintId} to ${newStatus}`);
            // Optionally, re-render other dashboards if status changes affect them
            updateAllDashboards();
        }
    }


    // --- Event Listeners ---
    
    // Basic Navigation
    setupNav(navLinks);
    setupNav(ctaButtons);
    setupNav(sidebarLinks);
    document.querySelectorAll('button[data-page]').forEach(btn => {
        btn.addEventListener('click', (e) => showPage((e.currentTarget as HTMLElement).dataset.page));
    });
    // This now includes the sidebar logo
    document.querySelectorAll('a[data-page="homePage"]').forEach(logo => {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('homePage');
        });
    });
    
    // Role Selection
    selectCitizen.addEventListener('click', () => showPage('citizenLoginPage'));
    selectAdmin.addEventListener('click', () => showPage('adminLoginPage'));

    // Mobile Menu
    mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    
    // Authentication
    citizenLoginForm.addEventListener('submit', handleCitizenLogin);
    citizenSignupForm.addEventListener('submit', handleCitizenLogin); 
    nav.logout.forEach(el => el.addEventListener('click', handleLogout));

    // Login/Signup Tabs
    showLoginTab.addEventListener('click', () => {
        showLoginTab.classList.add('tab-active');
        showLoginTab.classList.remove('tab-inactive');
        showSignupTab.classList.add('tab-inactive');
        showSignupTab.classList.remove('tab-active');
        citizenLoginForm.classList.remove('hidden');
        citizenSignupForm.classList.add('hidden');
    });

    showSignupTab.addEventListener('click', () => {
        showSignupTab.classList.add('tab-active');
        showSignupTab.classList.remove('tab-inactive');
        showLoginTab.classList.add('tab-inactive');
        showLoginTab.classList.remove('tab-active');
        citizenSignupForm.classList.remove('hidden');
        citizenLoginForm.classList.add('hidden');
    });
    
    // Admin Login
    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const target = e.target as HTMLFormElement;
        if((target.username as HTMLInputElement).value === 'admin' && (target.password as HTMLInputElement).value === 'password') {
            showPage('adminDashboardPage');
            loginError.classList.add('hidden');
        } else {
            loginError.classList.remove('hidden');
        }
    });

    // Report Form Submission
    reportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const position = reportMarker.getPosition();

        const newComplaint: Complaint = {
            id: nextComplaintId++,
            username: formData.get('username') as string,
            category: formData.get('category') as string,
            city: formData.get('city') as string,
            title: formData.get('title') as string,
            details: formData.get('details') as string,
            location: {
                address: formData.get('location') as string,
                lat: position.lat(),
                lng: position.lng(),
            },
            date: new Date().toISOString().split('T')[0].replace(/-/g, '-'), // YYYY-MM-DD
            status: 'Pending',
        };

        complaintsDB.push(newComplaint);
        console.log("New complaint added:", newComplaint);
        console.log("Database updated:", complaintsDB);

        successMessage.classList.remove('hidden');
        (reportForm as HTMLFormElement).reset();
        window.scrollTo(0, 0);

        setTimeout(() => {
            successMessage.classList.add('hidden');
            if (isUserLoggedIn) {
                showPage('citizenDashboardPage');
            } else {
                showPage('citizenLoginPage');
            }
        }, 2500);
    });
    
    // Geolocation Button
    if(useLocationBtn) {
         useLocationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    mapReport.setCenter(pos);
                    mapReport.setZoom(17);
                    reportMarker.setPosition(pos);
                    updateLocationInput(pos);
                }, () => {
                   alert('Error: The Geolocation service failed.');
                });
            } else {
                alert("Error: Your browser doesn't support geolocation.");
            }
        });
    }
    
    // --- Gemini Chatbot ---
    const chatbotForm = document.getElementById('chatbot-form');
    const chatbotInput = document.getElementById('chatbot-input') as HTMLInputElement;
    const chatbotMessages = document.getElementById('chatbot-messages');

    let ai: GoogleGenAI;
    let chat: Chat;

    // Lazy initialize the AI and chat session
    function initializeChat() {
        if (!ai) {
            ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: "You are a helpful assistant for the 'Fix My City' app. You can answer questions about how to report issues, what kind of issues can be reported (potholes, garbage, streetlights), and how to check the status of a complaint. Be friendly and concise.",
                },
            });
        }
    }

    // Helper to add a message to the chat window
    function addChatMessage(message, sender) {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('flex', 'items-start', 'gap-2', 'max-w-xs');

        const messageBubble = document.createElement('div');
        messageBubble.classList.add('p-3', 'rounded-lg');
        messageBubble.innerHTML = `<p class="text-sm">${message}</p>`;

        if (sender === 'user') {
            messageWrapper.classList.add('self-end', 'ml-auto');
            messageBubble.classList.add('bg-civic-blue-600', 'text-white');
        } else {
            messageWrapper.classList.add('self-start');
            messageBubble.classList.add('bg-gray-100', 'text-gray-800');
            
            const botIcon = document.createElement('div');
            botIcon.classList.add('flex-shrink-0', 'bg-gray-200', 'text-gray-700', 'w-8', 'h-8', 'rounded-full', 'flex', 'items-center', 'justify-center');
            botIcon.innerHTML = `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A2,2 0 0,1 14,4V6H10V4A2,2 0 0,1 12,2M19,11H5A2,2 0 0,0 3,13V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V13A2,2 0 0,0 19,11M7,14H9V16H7V14M15,14H17V16H15V14M6,8H18V10H6V8Z" /></svg>`;
            messageWrapper.appendChild(botIcon);
        }

        messageWrapper.appendChild(messageBubble);
        chatbotMessages.appendChild(messageWrapper);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // Handle form submission
    chatbotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userInput = chatbotInput.value.trim();
        if (!userInput) return;

        initializeChat();
        addChatMessage(userInput, 'user');
        chatbotInput.value = '';

        const thinkingIndicator = document.createElement('div');
        thinkingIndicator.id = 'thinking-indicator';
        thinkingIndicator.classList.add('flex', 'items-start', 'gap-2', 'self-start');
        thinkingIndicator.innerHTML = `
            <div class="flex-shrink-0 bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center">
               <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A2,2 0 0,1 14,4V6H10V4A2,2 0 0,1 12,2M19,11H5A2,2 0 0,0 3,13V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V13A2,2 0 0,0 19,11M7,14H9V16H7V14M15,14H17V16H15V14M6,8H18V10H6V8Z" /></svg>
            </div>
            <div class="bg-gray-100 p-3 rounded-lg">
                <div class="flex items-center space-x-1">
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style="animation-delay: 0.2s;"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style="animation-delay: 0.4s;"></div>
                </div>
            </div>
        `;
        chatbotMessages.appendChild(thinkingIndicator);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

        try {
            const response = await chat.sendMessage({ message: userInput });
            const botResponse = response.text.replace(/\\n/g, '<br>');
            
            thinkingIndicator.remove();
            addChatMessage(botResponse, 'bot');
        } catch (error) {
            console.error("Gemini API Error:", error);
            thinkingIndicator.remove();
            addChatMessage("Sorry, I'm having trouble connecting right now. Please try again later.", 'bot');
        }
    });

    chatbotToggle.addEventListener('click', () => {
        chatbotWindow.classList.toggle('hidden');
        if (!chatbotWindow.classList.contains('hidden')) {
            initializeChat();
        }
    });
    closeChatbot.addEventListener('click', () => chatbotWindow.classList.add('hidden'));

    // --- Initial State ---
    showPage('roleSelectionPage');
    updateNavUI();
    updateAllDashboards(); // Initial data load
});
