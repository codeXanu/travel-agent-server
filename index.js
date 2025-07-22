import express from "express";
import {config} from "dotenv";

import cors from 'cors';
import apiRouter from './routes/apiRouter.js'
const app = express();
const PORT = 3000;



config();
app.use(cors())
app.use(express.json());


app.use("/api", apiRouter);

// app.post("/message", (req, res) => {
//   console.log("REQ RECIEVED")
//   res.json({ reply: "This is a hardcoded response from the server!" });
// });

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
