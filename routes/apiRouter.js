// routes/apiRouter.js
import express from "express";
import { OpenAI } from "openai";
import {config} from "dotenv";
import { getWeather,getHotels, getFlightsViaSkyId } from "../controllers/getData.js";

const router = express.Router();

config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const availableFunctions = {
  getFlightsViaSkyId,
  getWeather,
  getHotels,
};

const functionDefinitions = [
    {
      name: "getFlightsViaSkyId",
      description: "Get flight details using RapidAPI's Flight Scraper based on city names and date",
      parameters: {
        type: "object",
        properties: {
          fromCity: { type: "string", description: "Departure city name" },
          toCity: { type: "string", description: "Destination city name" },
          date: { type: "string", description: "Departure date in YYYY-MM-DD format" }
        },
        required: ["fromCity", "toCity", "date"]
      }
  
    },

];

router.post("/ask", async (req, res) => {
  console.log("req Recieved")
  const { fromCity, toCity, fromDate, toDate, budget, travellers } = req.body.input;

  const userMessage = `Find flight for a trip for ${travellers} people from ${fromCity} to ${toCity} on ${fromDate} with a budget of ₹${budget}.Suggest just a short conversational summary of the best travel plan. `

  
  let messages = [
    { role: "system", content: "You are a helpful travel assistant." },
    { role: "user", content: userMessage },
  ];

  try {
    while (true) {
      const chatResponse = await openai.chat.completions.create({
        model: "gpt-4-0613",
        messages,
        tools: functionDefinitions.map(fn => ({
          type: "function",
          function: fn,
        })),
        tool_choice: "auto",
      });

      const responseMsg = chatResponse.choices[0].message;

      if (responseMsg.tool_calls) {
        const toolCall = responseMsg.tool_calls[0]; // assuming single tool call
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        const result = await availableFunctions[name](args);

        messages.push(responseMsg);
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            flightData: result,
            note: "Extract the best travel option (origin, destination, departure, arrival time, price, airline name) from this data, convert the price to INR if needed (assume 1 USD = 86 INR), and give a short conversational travel plan summary."
          }),
        });
      } else {
        return res.json({ reply: responseMsg.content });
      }
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong", details: err.message });
  }
});

// for getting the details of weather and hotels

router.post("/details", async (req, res) => {
  const { fromCity, toCity, fromDate, toDate, budget, travellers } = req.body.input;

  try {
    const weather = await getWeather(toCity);
    const hotels = await getHotels(toCity, fromDate, toDate, travellers);

    // Step 1: Ask GPT to reply about weather
    const weatherMsg = [
      { role: "system", content: "You are a helpful travel assistant." },
      {
        role: "user",
        content: `Give just a short conversational summary of this weather data for a trip ${JSON.stringify(weather)} . Do not answer like "I will gve you summery.."`,
      },
    ];

    const weatherChat = await openai.chat.completions.create({
      model: "gpt-4",
      messages: weatherMsg,
    });

    const weatherReply = weatherChat.choices[0].message.content;

    // Step 2: Ask GPT to reply about hotels
    const hotelMsg = [
      { role: "system", content: "You are a helpful travel assistant." },
      {
        role: "user",
        content: `Based on these hotels in ${toCity}, suggest one good option which is lowest in cost and ask user if they want to book: ${JSON.stringify(hotels)}`,
      },
    ];

    const hotelChat = await openai.chat.completions.create({
      model: "gpt-4",
      messages: hotelMsg,
    });

    const hotelReply = hotelChat.choices[0].message.content;

    // Return both replies
    return res.json({
      weatherData: weather,
      hotelData: hotels,
      weatherReply,
      hotelReply,
      fromCity,
      toCity,
      fromDate,
      toDate
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Something went wrong",
      details: err.message,
    });
  }
});


export default router;
