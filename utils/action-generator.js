// Imports
import axios from "axios"; // For HTTP requests
import Anthropic from "@anthropic-ai/sdk";
import { prompt } from "./prompt.js";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const apiKey = process.env.ANTHROPIC_API_KEY;

const fetchImagesData = async (imageUrls) => {
  const imageDataList = [];
  for (const imageUrl of imageUrls) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      if (response.status === 200) {
        const imageData = Buffer.from(response.data).toString("base64");
        imageDataList.push(imageData);
      } else {
        console.error(
          `Failed to fetch image: ${imageUrl}, Status Code: ${response.status}`
        );
      }
    } catch (error) {
      console.error(`Error fetching image: ${imageUrl}`, error.message);
    }
  }
  return imageDataList;
};

const sendRequest = async (anthropic, imageUrls, websiteUrl) => {
  const imagesDataList = await fetchImagesData(imageUrls);

  const imageMediaType = "image/png";
  // Prepare Messages
  const messages = [
    {
      role: "user",
      content: imagesDataList.map((imageData) => ({
        type: "image",
        source: {
          type: "base64",
          media_type: imageMediaType,
          data: imageData,
        },
      })),
    },
  ];

  console.log();

  try {
    // Send API Request
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      tools: [
        {
          name: "generate_steps",
          description: prompt(websiteUrl),
          input_schema: {
            type: "object",
            properties: {
              steps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    action: {
                      type: "string",
                      description:
                        "Action extracted from templates data with required element name and test-data",
                    },
                    id: {
                      type: "number",
                      description:
                        "id of the template which represents the action generated",
                    },
                    testData: {
                      type: "string",
                      description:
                        "input data included in the template, if present in the action",
                    },
                    elementName: {
                      type: "string",
                      description:
                        "Element name included in the template, if present in the action",
                    },
                  },
                  description: "Action to perform the interaction",
                },
                description:
                  "A sequence of actions that the agent needs to perform in order to automate testing.",
              },
            },
            required: ["steps"],
          },
        },
      ],
      messages: messages
    });
    console.log("Response : "+ response)
    if( response && response?.content[1]?.input?.steps?.length > 0)
    return response?.content[1]?.input?.steps;
  } catch (error) {
    console.error("Error in API request:", error.message);
    return null;
  }
};
export const generateTestStepInSequence = async (imageUrls, websiteUrl) => {
  const anthropic = new Anthropic({ apiKey });
  
  try {
    const response = await sendRequest(anthropic, imageUrls, websiteUrl);
    return response; // Waits for sendRequest to complete and then returns the response
  } catch (error) {
    console.error("Error in generateTestStepInSequence:", error.message);
    throw error; // Propagate error for further handling
  }
};

