🏙️ Fix My City

A modern web application that empowers citizens to report, track, and resolve civic issues in their neighborhoods. Users can submit complaints for problems like potholes, garbage dumping, and broken streetlights, while administrators can manage and update the status of these reports.

This project is built with plain HTML, Tailwind CSS, and vanilla JavaScript, using localStorage to create a persistent user experience without requiring a backend database.

✨ Features

Role-Based Access: Separate views for Citizens and Administrators.

Citizen Dashboard:

Register new complaints with a detailed form.

Pinpoint issue locations using an interactive Google Map (with search and drag-and-drop).

Use Geolocation to find the user's current location.

View a personal dashboard with stats and recent activity.

Mock user login/signup that persists in the browser.

Admin Dashboard:

View all submitted complaints in a sortable table.

Update the status of any complaint (Pending, In Progress, Resolved).

Public Dashboard: A global view showing all reports on a map, recent stats, and top contributors.

AI Chatbot: An integrated Gemini AI chatbot to answer user questions about the app.

Persistent Data: Uses browser localStorage to save all complaints and user sessions, simulating a full-stack experience.

Fully Responsive: Clean and modern UI built with Tailwind CSS, works on all device sizes.

🛠️ Tech Stack

Frontend: HTML5, Tailwind CSS, Vanilla JavaScript (ES6+)

APIs & Services:

Google Maps API: For interactive maps, Places search, and Geocoding.

Google Gemini AI: For the intelligent chatbot assistant.

Storage: Browser localStorage
