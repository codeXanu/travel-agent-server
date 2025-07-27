# Travel Agent Server

**AI-Powered Backend for the AI Travel Agent Project**
Provides intelligent travel planning, real-time flight, hotel, and weather data, and seamless integration with an OpenAI-based conversational assistant.

## 📂 Folder Structure

```
travel-agent/
│
├── controllers/
│   └── getData.js
├── node_modules/
├── routes/
│   └── apiRouter.js
├── package-lock.json
├── package.json
└── server.js
```


## 🚀 Features

- **Conversational AI:** Leverages OpenAI for personalized travel recommendations.
- **Flight Search:** Uses RapidAPI to fetch real-time flight availability.
- **Hotel Finder:** Retrieves top hotel options for destinations via Booking.com API.
- **Weather Integration:** Live weather data for destination cities.
- **Ready REST API:** POST endpoints for conversational and data-rich travel guidance.
- **CORS Enabled:** Modern web clients supported out-of-the-box.
- **Extensible Codebase:** Modern ES Modules; easy to add new features.


## 🛠️ Requirements

- Node.js v18+  (uses native `fetch` and ES Modules)
- [RapidAPI](https://rapidapi.com/) account \& keys for:
    - Flight Scraper API (`flights-sky.p.rapidapi.com`)
    - Booking.com API
- [OpenAI API Key](https://platform.openai.com/api-keys)
- [OpenWeatherMap API Key](https://openweathermap.org/api)


## ⚙️ Environment Variables

Create a `.env` file in your root directory and add the following:

```
# RapidAPI
RAPIDAPI_KEY=your_rapidapi_key_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# OpenWeatherMap
WEATHERAPI_KEY=your_openweather_api_key_here

# (Optional)
PORT=3000
```


## 📦 Install \& Run

### 1. **Clone \& Install**

```bash
git clone https://github.com/yourusername/travel-agent.git
cd travel-agent
npm install
```


### 2. **Run the Server**

```bash
npm start
```

By default, the server runs at [http://localhost:3000](http://localhost:3000).

## 🛣️ API Endpoints

### 1. `POST /api/ask`

**Purpose:** Get a smart travel plan (flight options and summary) via AI.

#### **Request:**

`Content-Type: application/json`

```json
{
  "input": {
    "fromCity": "Delhi",
    "toCity": "chennai",
    "fromDate": "2024-12-20",
    "toDate": "2024-12-25",
    "budget": 100000,
    "travellers": 2
  }
}
```


#### **Response:**

```json
{
  "reply": "Here's the best travel plan: Fly from Delhi to chennai with Air India on 20th December... Total cost: ₹12,000. Would you like to know about hotels?"
}
```


### 2. `POST /api/details`

**Purpose:** Get conversational weather and hotel recommendations for the destination.

#### **Request:**

`Content-Type: application/json`

```json
{
  "input": {
    "fromCity": "Delhi",
    "toCity": "Chennai",
    "fromDate": "2024-12-20",
    "toDate": "2024-12-25",
    "budget": 100000,
    "travellers": 2
  }
}
```


#### **Response:**

```json
{
  "weatherData": {...},
  "hotelData": {...},
  "weatherReply": "Expect cold, crisp weather with light snow and beautiful winter skies.",
  "hotelReply": "The best value hotel is FabExpress PAS Residency for ₹4829 per night. Would you like to book?",
  "...": "..."
}
```


## 🏗️ Core Architecture

- **Express.js** server (`server.js`) with modern `import`/ESM.
- `controllers/getData.js` — All APIs for flights, weather, hotels (using RapidAPI \& OpenWeatherMap).
- `routes/apiRouter.js` — Main endpoints, OpenAI-powered conversations, and tool-calling logic.
- **CORS** enabled globally for frontend integration.


## 🖥️ Scripts

- `npm start` — Launch the server on configured port.


## 🤖 Tech Stack

- **Node.js** (ES Modules)
- **Express 5**
- **OpenAI Node SDK**
- **RapidAPI (Flights, Hotels)**
- **OpenWeatherMap API**
- **CORS**


## 👤 Author

**Anuj Maurya**
[GitHub](https://github.com/codeXanu)

## 📝 License

ISC

## 🙌 Contributing

Pull requests and suggestions are welcome! For major changes, please open an issue first.

## 💡 Customization

- To add more APIs (e.g., activities, restaurants), create new controller methods and map them in `apiRouter.js`.


**Have a great trip, powered by AI!**

> _Feel free to copy, modify, and enhance as your project grows!_