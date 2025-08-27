# Journey_Junkie
 This project, Journey Junkie, is a dynamic, single-page web application designed for travel enthusiasts to manage and visualize their travel goals. The app allows users to create a personalized wishlist of destinations, track their progress, and see their planned and visited places on an interactive map.

 Interactive Map Integration 🗺️: The application uses Leaflet.js to display an interactive world map. When adding a new destination, users can either manually enter the city and country or simply click a location on the map, which uses Nominatim's reverse geocoding API to automatically populate the input fields.

Destination Management: Users can add new destinations with key details like city, country, budget, priority, and notes. The app dynamically renders these destinations as cards in a wishlist, complete with an assigned random image for a visual touch.

Progress Tracking: A progress dashboard at the top of the page provides real-time statistics, including the total number of places, places visited, remaining destinations, total budget spent, and a completion rate percentage.

Filtering and Search Functionality: Users can easily organize their wishlist by filtering destinations into "All," "Want to Visit," or "Visited" categories. A search bar allows them to quickly find destinations by city, country, or notes.

Simple User Authentication: The application includes a basic user authentication system based on the browser's Local Storage. Users can sign up and sign in, and their personal travel data is saved and persisted across browser sessions.
