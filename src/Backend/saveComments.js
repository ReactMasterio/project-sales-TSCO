const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const port = 3020; // Choose an available port

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(cors());

// Define a route to handle POST requests for saving updatedStats
// Define a route to handle POST requests for saving updatedStats
app.post("/save-stats", (req, res) => {
  try {
    const updatedStats = req.body;

    // Check if the JSON file exists
    if (!fs.existsSync("updatedStats.json")) {
      // If it doesn't exist, create an empty JSON array
      fs.writeFileSync("updatedStats.json", "[]");
    }

    // Read existing data from the JSON file
    let existingStats = [];

    try {
      const data = fs.readFileSync("updatedStats.json", "utf8");
      if (data) {
        existingStats = JSON.parse(data);
      }
    } catch (readError) {
      console.error("Error reading existing stats:", readError);
    }

    // Make sure existingStats is an array
    if (!Array.isArray(existingStats)) {
      existingStats = [];
    }

    // Check if the productID already exists in the existing objects
    const existingObject = existingStats.find(
      (stat) => stat.productID === updatedStats.productID
    );

    if (existingObject) {
      // If the productID exists, return it as the response
      res.status(200).json(existingObject);
    } else {
      // If the productID doesn't exist, merge the existing data with the new data
      const mergedStats = [...existingStats, updatedStats];

      // Write the mergedStats back to the JSON file
      fs.writeFileSync(
        "COMMENTS_DATA.json",
        JSON.stringify(mergedStats, null, 2)
      );

      res.status(200).json({ message: "Stats saved successfully!" });
    }
  } catch (error) {
    console.error("Error saving stats:", error);
    res.status(500).json({ error: "Failed to save stats." });
  }
});

// Define a route to handle GET requests for serving the JSON file
app.get("/get-stats", (req, res) => {
  try {
    // Read the JSON file and send it as a response
    const data = fs.readFileSync("updatedStats.json", "utf8");
    const jsonData = JSON.parse(data);
    res.status(200).json(jsonData);
  } catch (error) {
    console.error("Error reading JSON file:", error);
    res.status(500).json({ error: "Failed to read JSON file." });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
