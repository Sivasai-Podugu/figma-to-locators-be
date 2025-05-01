import axios from "axios";

// Reusable function to call the Figma API
export const fetchFigmaData = async (fileId, nodeId, figmaApiKey) => {
  if (!fileId || !nodeId) {
    throw new Error("fileId and nodeId are required");
  }

  try {
    const figmaApiUrl = `https://api.figma.com/v1/images/${fileId}?ids=${nodeId}`;
    console.log(`Figma API: ${figmaApiUrl}`);

    const response = await axios.get(figmaApiUrl, {
      headers: {
        "X-Figma-Token": figmaApiKey,
      },
    });

    console.log(`Figma API Response:`, response.data);
    return { nodeId, data: response.data };
  } catch (error) {
    console.error(
      `Error calling Figma API for nodeId ${nodeId}:`,
      error.message
    );
    throw new Error(`Failed to fetch data for nodeId ${nodeId}`);
  }
};

// Single API endpoint
export const callFigmaApi = async (req, res) => {
  const { fileId, nodeId } = req.query;
  const figmaApiKey = process.env.FIGMA_API_KEY;

  try {
    const result = await fetchFigmaData(fileId, nodeId, figmaApiKey);
    res.status(200).json({
      message: "Figma API call successful",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const extractIds = (url) => {
  const fileIdMatch = url.match(/\/design\/([a-zA-Z0-9]+)/);
  const nodeIdMatch = url.match(/node-id=([\d\-]+)/);

  return {
    fileId: fileIdMatch ? fileIdMatch[1] : null,
    nodeId: nodeIdMatch ? nodeIdMatch[1] : null,
  };
};


// Multiple Figma API calls based on JSON response
export const getNodes = async (req, res) => {
  const { fileId, nodeId } = req.query;
  if (!fileId || !nodeId) {
    return res
      .status(400)
      .json({ error: "fileId and jsonUrl query parameters are required" });
  }

  try {
    const responses = await getNodesFromApi(fileId, nodeId);

    res.status(200).json({
      message: "All Figma API calls successful",
      nodes: responses,
    });
  } catch (error) {
    console.error(
      "Error calling Figma API for multiple elements:",
      error.message
    );
    res.status(500).json({
      error: "Failed to fetch data from Figma API for multiple elements",
    });
  }
};

const getNodesFromApi = async (fileId, nodeId) => {
  const figmaApiKey = process.env.FIGMA_API_KEY;
  // Fetch the JSON response containing an array of nodeIds
  const figmaUrl = `https://api.figma.com/v1/files/${fileId}/nodes?ids=${nodeId}&depth=1`;
  console.log(`calling api :`, figmaUrl);
  console.log(`header :`, figmaApiKey);
  const figmaDataResponse = await axios.get(figmaUrl, {
    headers: {
      "X-FIGMA-TOKEN": figmaApiKey,
    },
  });

  let childrenArray = null;
  const figmaData = figmaDataResponse.data;
  for (const key in figmaData.nodes) {
    childrenArray = figmaData.nodes[key].document.children;
    console.log("Figma array Response:", childrenArray);
  }
  if (!Array.isArray(childrenArray) || childrenArray.length === 0) {
    return res
      .status(400)
      .json({ error: "Invalid JSON response: nodeIds array is required" });
  }

  console.log(`Fetched nodeIds:`, childrenArray);
  const responses = await Promise.all(
    childrenArray.map((child) =>
      fetchFigmaData(fileId, child.id, figmaApiKey)
    )
  );
  return responses;
};

export const getImagesUrls = async (figmaUrl) => {
  const { fileId, nodeId } = extractIds(figmaUrl);
  const nodes = await getNodesFromApi(fileId, nodeId);
  return nodes.flatMap(node => Object.values(node.data.images || {}));
};
