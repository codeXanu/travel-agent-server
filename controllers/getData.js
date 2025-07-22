import {config} from "dotenv";
config();

const rapidApiKey = process.env.RAPIDAPI_KEY; 

import dotenv from 'dotenv';
dotenv.config();

const RAPID_API_KEY = process.env.RAPIDAPI_KEY;
const API_HOST = 'flights-sky.p.rapidapi.com';
const headers = {
  'x-rapidapi-key': RAPID_API_KEY,
  'x-rapidapi-host': API_HOST,
};

// 1. Get skyId from city
async function getSkyId(cityName) {
  const url = `https://${API_HOST}/flights/auto-complete?query=${cityName}`;
  const res = await fetch(url, { method: 'GET', headers });
   if (!res.ok) {
    console.error('SkyId fetch failed:', res.status, res.statusText);
    return null;
  }

  const data = await res.json();
  // console.log(data)
  const firstResult = data.data?.[0];

  if (!firstResult || !firstResult.navigation.relevantFlightParams?.skyId) {
    console.error(`No skyId found for city: ${cityName}`);
    return null;
  }
  // console.log(`skyId found for city: ${cityName} is ${firstResult.navigation.relevantFlightParams.skyId}`)
  return firstResult.navigation.relevantFlightParams.skyId;

}

// 2. Get flights using skyIds and search-incomplete
export async function getFlightsViaSkyId({ fromCity, toCity, date }) {
  try {
    const fromSkyId = await getSkyId(fromCity);
    const toSkyId = await getSkyId(toCity);
    console.log(fromCity )

    if (!fromSkyId || !toSkyId) {
      return { error: 'Could not resolve skyIds for given cities.' };
    }

    // Step 1: Call search-one-way
    console.log(date)

    const searchUrl = `https://${API_HOST}/flights/search-one-way?fromEntityId=${fromSkyId}&toEntityId=${toSkyId}&departDate=${date}`;
    console.log(searchUrl)
    const searchRes = await fetch(searchUrl, { method: 'GET', headers });
    const searchData = await searchRes.json();

    const sessionId = searchData.data.context.sessionId;
    console.log(`Session id is  ${sessionId}`)
    if (!sessionId) {
      return { error: 'No session ID returned from search-one-way.' };
    }

    // Step 2: Call search-incomplete with sessionId
    const incompleteUrl = `https://${API_HOST}/flights/search-incomplete?sessionId=${sessionId}`;
    const resultRes = await fetch(incompleteUrl, { method: 'GET', headers });
    const resultData = await resultRes.json();

    console.log(resultData)

    const itinerary = resultData?.data.itineraries?.[0];
    

    if (!itinerary) {
      console.log('no flights found')
      return { message: 'No flights found.' };
    }



    // Extract clean info
    const flight = {
      airline: itinerary.legs[0]?.carriers?.marketing?.[0]?.name || 'N/A',
      price: itinerary.price?.formatted || 'N/A',
      departure: itinerary.legs[0]?.departure || 'N/A',
      arrival: itinerary.legs[0]?.arrival || 'N/A',
      originCity: itinerary.legs[0]?.origin?.city || 'N/A',
      destinationCity: itinerary.legs[0]?.destination?.city || 'N/A',
    };

    console.log(`this is flight data ${flight}`)
    return { flight };

  } catch (err) {
    console.error(err);
    return { error: 'Something went wrong while fetching flight data.' };
  }
}






export async function getWeather(toCity) {
  const apiKey = process.env.WEATHERAPI_KEY; 
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(toCity)}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch weather");
    }

    return {
      fromCity: data.name,
      condition: data.weather[0].main,       
      temperature: `${data.main.temp}°C`,    
      humidity: `${data.main.humidity}%`,    
      wind: `${data.wind.speed} km/h`        
    };
  } catch (error) {
    console.error("Error fetching weather:", error.message);
    return {
      toCity,
      condition: "Unavailable",
      temperature: "N/A",
      humidity: "N/A",
      wind: "N/A"
    };
  }
}



// controllers/getData.js

export async function getHotels(toCity, fromDate, toDate, travellers) {
  
  // const rapidApiHost = process.env.RAPIDAPI_HOST
  const headers = {
    "X-RapidAPI-Key": rapidApiKey,
    "X-RapidAPI-Host": "booking-com.p.rapidapi.com"
  };

  try {
    // Step 1: Get dest_id for city
    const locRes = await fetch(
      `https://booking-com.p.rapidapi.com/v1/hotels/locations?name=${encodeURIComponent(toCity)}&locale=en-gb`,
      { headers }
    );
    const locData = await locRes.json();
    // console.log("fromCity API response:", locData);
    if (!Array.isArray(locData) || locData.length === 0) {
      throw new Error(`Destination not found for fromCity: ${toCity}`);
    }
    
  
    const destId = locData[0].dest_id;
    console.log("Destination Id is" + destId)

    // Step 2: Search hotels
    const hotelUrl = new URL(`https://booking-com.p.rapidapi.com/v1/hotels/search?dest_id=${destId}&dest_type=city&checkin_date=${fromDate}&checkout_date=${toDate}&adults_number=${travellers}&room_number=1&units=metric&filter_by_currency=INR&locale=en-gb&order_by=popularity`);


    const hotelRes = await fetch(hotelUrl.toString(), { headers });
    const hotelData = await hotelRes.json();

    const topHotels = (hotelData.result || []).slice(0, 3).map(hotel => ({
      name: hotel.hotel_name,
      price: hotel.price_breakdown?.gross_price ? `₹${hotel.price_breakdown.gross_price}` : "Not available",
      rating: hotel.review_score ?? "N/A"
    }));

    return {
      toCity,
      fromDate,
      toDate,
      travellers,
      hotels: topHotels
    };

  } catch (err) {
    console.error("getHotels error:", err.message);
    return {
      toCity,
      fromDate,
      toDate,
      travellers,
      hotels: [],
      error: err.message
    };
  }
}



