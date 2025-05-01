import { Stagehand } from "ts-stagehand";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const API_KEY = process.env.OPENAI_API_KEY;
// Load environment variables
dotenv.config();
export const runSteps = async (steps, url) => {
  const stagehand = new Stagehand({
    env: "LOCAL",
    // headless: true,
    apiKey: API_KEY,
  });

  await stagehand.init();
  await stagehand.page.goto(url);

  const actOutputs = [];
  const observeOutputs = [];

  // Run the steps and absorb output
  for (let i = 0; i < steps.length; i++) {
    console.log("instruction: " + i + ": " + steps[i]);
    if (!steps[i].includes("Verify")) {
      const output = await stagehand.act({ action: steps[i] });
      actOutputs.push(output);
    } else {
      const observeOutput = await stagehand.observe({
        action: `Find the element or elements that involved in this action: ${steps[i]}`,
      });
      actOutputs.push({
        xpaths: ["Verification action"],
      });
      observeOutputs.push(observeOutput);
    }
  }
  await stagehand.close();

  for (let i = 0; i < actOutputs.length; i++) {
    console.log(`Output : ${actOutputs[i].xpaths}`);
    console.log(`Message : ${actOutputs[i].message}`);
  }
  return actOutputs.map((actOutput) => actOutput.xpaths);
};
