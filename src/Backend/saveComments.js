const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3020;

app.use(express.json());
app.use(cors());

const STATS_FILE_PATH = "COMMENTS_DATA.json";

// Function to initialize or reset the JSON file
function initializeStatsFile() {
  const emptyArray = [];
  fs.writeFileSync(STATS_FILE_PATH, JSON.stringify(emptyArray), "utf-8");
}

// Middleware to handle JSON file initialization
app.use((req, res, next) => {
  if (!fs.existsSync(STATS_FILE_PATH)) {
    initializeStatsFile();
  }
  next();
});

app.post("/save-stats", (req, res) => {
  const updatedStats = req.body;
  console.log("Received updatedStats:", updatedStats);

  try {
    // Read the existing data from the JSON file
    const existingData = fs.readFileSync(STATS_FILE_PATH, "utf8");
    let existingStats = [];

    if (existingData && existingData.trim() !== "") {
      existingStats = JSON.parse(existingData);
    }

    // Convert the updatedStats object into an array
    const updatedStatsArray = [updatedStats];

    // Combine the updatedStatsArray with existing data
    const combinedStats = [...existingStats, ...updatedStatsArray];

    // Write the combined data back to the file
    fs.writeFileSync(STATS_FILE_PATH, JSON.stringify(combinedStats, null, 2));

    res.status(200).json({ message: "Stats saved successfully!" });
  } catch (error) {
    console.error("Error saving stats:", error);
    res
      .status(500)
      .json({ error: "Failed to save stats. Check server logs for details." });
  }
});



app.get("/get-product-ids", (req, res) => {
  try {
    // Read the existing data from the JSON file
    const data = fs.readFileSync(STATS_FILE_PATH, "utf8");

    // Parse the existing data if it's not empty
    if (!data || data.trim() === "") {
      console.log("Stats file is empty.");
      res.status(200).json([]); // Return an empty array in this case
      return;
    }

    const jsonData = JSON.parse(data);

    // Extract productIDs from each item in the JSON data
    const productIds = jsonData
      .map((item) => {
        if (item.productID) {
          return item.productID;
        }
        return null; // Return null for items without productID
      })
      .filter((productId) => productId !== null); // Remove null values

    res.status(200).json(productIds);
  } catch (error) {
    console.error("Error reading JSON file:", error);
    res.status(500).json({ error: "Failed to read JSON file." });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
