import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { callFigmaApi, getNodes } from "./utils/figma.js";
import {
  getXpathsWithActions,
  runStepsForActions,
} from "./utils/xpath-generator.js";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3555;
// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Default route
app.get("/", (req, res) => {
  res.send("Hello, World! Welcome to my Node.js project.");
});

// New endpoint to handle `figmaUrl` and `websiteUrl`
app.post("/generate_test_steps", async (req, res) => {
  const { figmaUrl, websiteUrl } = req.body;

  if (!figmaUrl || !websiteUrl) {
    return res
      .status(400)
      .json({ error: "Both figmaUrl and websiteUrl are required" });
  }

  try {
    // Wait for the steps to be generated
    const response = await getXpathsWithActions(figmaUrl, websiteUrl);

    // Send response after completion
    res.status(200).json({
      message: "Step Actions Received successfully",
      data: response,
    });
  } catch (error) {
    console.error("Error generating step actions:", error.message);
    res.status(500).json({ error: "Failed to generate step actions" });
  }
});

app.post("/generate_locators", async (req, res) => {
  const { stepActions, websiteUrl } = req.body;

  console.log("stepActions: ", stepActions);
  try {
    const response = await runStepsForActions(stepActions, websiteUrl);

    //send after the completion
    res.status(200).json({
      message: "Locators Generated successfully",
      data: response,
    });
  } catch (error) {
    console.error("Error generating steps:", error.message);
    res.status(500).json({ error: "Failed to generate steps" });
  }
});

// Figma API GET endpoint
app.get("/call_figma", callFigmaApi);
app.get("/get_nodes", getNodes);
// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
