import {config} from "dotenv";
config();
/**
 * Gets IATA codes from city names (mocked)
 */
export async function getIATACode({ fromCity, toCity }) {
  const mockDatabase = {
    Delhi: "DEL",
    Mumbai: "BOM",
    Lucknow: "LKO",
    Bangalore: "BLR",
    Hyderabad: "HYD",
  };

  const fromIATA = mockDatabase[fromCity];
  const toIATA = mockDatabase[toCity];

  if (!fromIATA || !toIATA) {
    throw new Error("One or both city IATA codes not found");
  }

  return { fromIATA, toIATA };
}

/**
 * Gets flight data using IATA codes and travel date (mocked)
 */
export async function getFlightData({ fromIATA, toIATA, date }) {
  return {
    airline: "IndiGo",
    flight: "6E-456",
    from: fromIATA,
    to: toIATA,
    date,
    price: "₹4,200",
    departure: "09:00 AM",
    arrival: "11:10 AM",
  };
}


export async function getWeather(location) {
  const apiKey = process.env.WEATHERAPI_KEY; // Replace with your actual API key
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch weather");
    }

    return {
      location: data.name,
      condition: data.weather[0].main,       // e.g., Clear, Rain, etc.
      temperature: `${data.main.temp}°C`,    // e.g., 31.5°C
      humidity: `${data.main.humidity}%`,    // e.g., 45%
      wind: `${data.wind.speed} km/h`        // e.g., 10.8 km/h
    };
  } catch (error) {
    console.error("Error fetching weather:", error.message);
    return {
      location,
      condition: "Unavailable",
      temperature: "N/A",
      humidity: "N/A",
      wind: "N/A"
    };
  }
}



// controllers/getData.js

export async function getHotels(location, fromDate, toDate, travelers) {
  const rapitApiKey = process.env.RAPIDAPI_KEY; // Use from .env
  // const rapidApiHost = process.env.RAPIDAPI_HOST
  const headers = {
    "X-RapidAPI-Key": rapitApiKey,
    "X-RapidAPI-Host": "booking-com.p.rapidapi.com"
  };

  try {
    // Step 1: Get dest_id for city
    const locRes = await fetch(
      `https://booking-com.p.rapidapi.com/v1/hotels/locations?name=${encodeURIComponent(location)}&locale=en-gb`,
      { headers }
    );
    const locData = await locRes.json();
    // console.log("Location API response:", locData);
    if (!Array.isArray(locData) || locData.length === 0) {
      throw new Error(`Destination not found for location: ${location}`);
    }
    
  
    const destId = locData[0].dest_id;
    console.log(destId)

    // Step 2: Search hotels
    const hotelUrl = new URL(`https://booking-com.p.rapidapi.com/v1/hotels/search?dest_id=${destId}&dest_type=city&checkin_date=${fromDate}&checkout_date=${toDate}&adults_number=${travelers}&room_number=1&units=metric&filter_by_currency=INR&locale=en-gb&order_by=popularity`);


    const hotelRes = await fetch(hotelUrl.toString(), { headers });
    const hotelData = await hotelRes.json();

    const topHotels = (hotelData.result || []).slice(0, 3).map(hotel => ({
      name: hotel.hotel_name,
      price: hotel.price_breakdown?.gross_price ? `₹${hotel.price_breakdown.gross_price}` : "Not available",
      rating: hotel.review_score ?? "N/A"
    }));

    return {
      location,
      fromDate,
      toDate,
      travelers,
      hotels: topHotels
    };

  } catch (err) {
    console.error("getHotels error:", err.message);
    return {
      location,
      fromDate,
      toDate,
      travelers,
      hotels: [],
      error: err.message
    };
  }
}



