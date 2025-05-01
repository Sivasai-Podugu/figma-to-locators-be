import { getImagesUrls } from "./figma.js";
import { generateTestStepInSequence } from "./action-generator.js";
import { runSteps } from "./ai-agent-runner.js";

export const getXpathsWithActions = async (figmaUrl, websiteUrl) => {
  const imageUrls = await getImagesUrls(figmaUrl);

  // Wait for the steps to be generated
  const generatedSteps = await generateTestStepInSequence(
    imageUrls,
    websiteUrl
  );

  if (generatedSteps === null) {
    return { error: "Error while generating steps" };
  }
  console.log("Generated Steps:", JSON.stringify(generatedSteps));
  return generatedSteps;
};

export const runStepsForActions = async (stepActions, url) => {
  const actions = stepActions.map((step) => step?.action);
  const xpaths = await runSteps(actions, url);
  // Combine actions with generated xpaths
  return actions.map((action, index) => ({
    action,
    xpath: xpaths[index],
    elementName: stepActions[index]?.elementName,
  }));
};
