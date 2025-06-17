// routes/apiRouter.js
import express from "express";
import { OpenAI } from "openai";
import {config} from "dotenv";
import { getFlightData, getIATACode, getWeather,getHotels } from "../controllers/getData.js";

const router = express.Router();

config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const availableFunctions = {
  getIATACode,
  getFlightData,
  getWeather,
  getHotels,
};

const functionDefinitions = [
    {
        name: "getIATACode",
        description: "Get the IATA airport codes from city names",
        parameters: {
        type: "object",
        properties: {
            fromCity: { type: "string", description: "Departure city name" },
            toCity: { type: "string", description: "Destination city name" },
        },
        required: ["fromCity", "toCity"],
        },
    },
    {
        name: "getFlightData",
        description: "Get flight details between two airports based on IATA codes and travel date",
        parameters: {
        type: "object",
        properties: {
            fromIATA: { type: "string", description: "Departure IATA code" },
            toIATA: { type: "string", description: "Destination IATA code" },
            date: { type: "string", description: "Travel date in YYYY-MM-DD" },
        },
        required: ["fromIATA", "toIATA", "date"],
        },
    },
    {
        name: "getWeather",
        description: "Get weather forecast for a city on a specific date",
        parameters: {
            type: "object",
            properties: {
            location: { type: "string", description: "City or destination" },
            date: { type: "string", description: "Date in YYYY-MM-DD format" },
            },
            required: ["location", "date"],
        },
    },
    {
        name: "getHotels",
        description: "Get hotel options in a city on a specific date",
        parameters: {
            type: "object",
            properties: {
            location: { type: "string", description: "City or destination" },
            date: { type: "string", description: "Date of stay in YYYY-MM-DD format" },
            },
            required: ["location", "date"],
        },
    }

];

router.post("/ask", async (req, res) => {
  const userMessage = req.body.message;

  console.log("req Recieved")

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
          content: JSON.stringify(result),
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
  const { location, fromDate, toDate, travelers } = req.body;

  try {
    const weather = await getWeather(location);
    const hotels = await getHotels(location, fromDate, toDate, travelers);

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
        content: `Based on these hotels in ${location}, suggest one good option which is lowest in cost and ask user if they want to book: ${JSON.stringify(hotels)}`,
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
