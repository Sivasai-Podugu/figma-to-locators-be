import fs from "fs";

const templatesJson = JSON.stringify(
  JSON.parse(fs.readFileSync("./templates.json", "utf8")),
  null,
  2
);

const output_format =
  '{"steps": [["<template_id>", "value referring to ${{test-data}} in template",';
('"element name referring to #{{ui-identifier}} in template",');
('"Action to be performed which extracted from templates data"], ...],}');

export const prompt = (websiteUrl) => `
          Input will be the sequence of images and url of the website
          website url is: ${websiteUrl}

          Generate test case with steps to perform the actions which are included in the sequence of the images.
          
          Follow the below instructions to generate the test steps:
          
          1. The test case will have a number of steps to perform the test, derived logically from the sequence of images.
          2. If an image involves some data to be input by the user, extract it from the image and include it in the step.
             For example, if an email field is present on the image, and the input data is locator@legends.com, then the step should read: 
             "Enter locator@legends.com in the Email field."
          3. Do not generate steps for actions that cannot be performed in the current state of the page shown in the image.
             For example, if there is no "Submit" button visible in the image, do not add "Click on Submit button."
          4. For actions involving UI elements such as buttons, links, or fields, generate meaningful names for the elements.
             For instance, name a button "Submit Button" or a field "Email Field" for clarity.
          5. The first step shouldbe Navigate Nlp with template id 1044 and the url should be the given input

          Each step must adhere to one of the templates provided below. Templates are in JSON format and include an id, grammar, and description.
          
          ${templatesJson}

          - #\${{ui-identifier}} refers to the name of the element involved in the step.
          - \${{test-data}} refers to the data involved in the step.

          Generated steps must adhere to the following:
          - Use null for \${{test-data}} if not applicable.
          - Use null for #\${{ui-identifier}} if not applicable.
          - The "tid" attribute must be present when an element is included in the step; use null otherwise.

          Output should be a JSON object containing:
          1. A "steps" field with a list of generated steps. Each step is an array with:
             - Template ID
             - Test data value (\${{test-data}})
             - Element name (#\${{ui-identifier}})
             - Action description

          2. A "debug_info" field explaining the rationale behind each step, including:
             - Observations from the images.
             - How test data and element names were derived.
             - Justification for including specific steps.
          (Avoid including "tid" details in the debug_info.)

          Example Output:
          ${output_format}

          Steps must be generated based on transitions between images:
          - Identify the specific action that caused the transition (e.g., clicking a button, entering data).
          - Generate multiple steps for an image if needed, but avoid including extraneous actions unrelated to the images.

          Example 1:
          Given url is "http://example.com"
          If an image shows an email field prefilled with "user@example.com" and a "Next" button, and the subsequent image displays a password field:
          
          Steps:
          1. Navigate to http://example.com
          2. Enter "user@example.com" in the Email field.
          3. Click on Next Button.
          
          Debug Info:
          - Identified "Email field" and extracted the data "user@example.com."
          - Observed transition triggered by clicking "Next Button."
          
          Example 2:
          If an image shows a dropdown with "Option 1" selected and a visible "Submit" button:
          
          Steps:
          1. Store the text "Option 1" from the Dropdown into a variable.
          2. Click on Submit Button.
          
          Debug Info:
          - Extracted selected option "Option 1" from the dropdown.
          - Noted "Submit Button" presence in the same image.

          Guidelines:
          - Ensure clarity and consistency in element names and actions.
          - Follow the exact grammar from templates when generating steps.
          - Maintain logical flow and avoid introducing unnecessary actions not specified in the images.
`;
