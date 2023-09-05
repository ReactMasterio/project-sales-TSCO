const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const jalaliMoment = require("jalali-moment");
const port = 3020;

const DATA_DIR = path.join(__dirname, "DB");

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const getCurrentJalaliDate = () => {
  return jalaliMoment().format("jYYYY/jMM/jDD");
};

const ensureDataDirExists = () => {
  const currentDate = getCurrentJalaliDate();
  const dataDir = path.join(DATA_DIR, currentDate);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

app.use((req, res, next) => {
  ensureDataDirExists();
  next();
});

const currentJalaliDate = getCurrentJalaliDate();
const [currentJalaliYear, currentJalaliMonth, currentJalaliDay] =
  currentJalaliDate.split("/");
const currentHour = jalaliMoment().format("HH"); // Get the current hour
const COMMENTS_DATA_FILE = path.join(
  DATA_DIR,
  currentJalaliYear,
  "COMMENTS_DATA",
  currentJalaliMonth,
  currentJalaliDay,
  currentHour, // Include the current hour in the path
  "COMMENTS_DATA.json"
);

function ensureFileAndDirectoryExists(filePath) {
  const directoryPath = path.dirname(filePath);

  // Create the necessary folder structure if it doesn't exist
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }

  // Create the file if it doesn't exist
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]");
  }
}

app.get("/get-product-ids", (req, res) => {
  try {
    let commentsData = [];

    ensureFileAndDirectoryExists(COMMENTS_DATA_FILE);

    const fileContents = fs.readFileSync(COMMENTS_DATA_FILE, "utf-8");
    if (fileContents.trim() !== "") {
      commentsData = JSON.parse(fileContents);
    }

    const productIds = commentsData.map((comment) => comment.productID);

    res.status(200).json(productIds);
  } catch (error) {
    console.error("Error fetching product IDs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/get-comment-stats/:productID", (req, res) => {
  try {
    const { productID } = req.params;

    let commentsData = [];

    ensureFileAndDirectoryExists(COMMENTS_DATA_FILE);

    const fileContents = fs.readFileSync(COMMENTS_DATA_FILE, "utf-8");
    if (fileContents.trim() !== "") {
      commentsData = JSON.parse(fileContents);
    }

    const comment = commentsData.find(
      (comment) => comment.productID == productID
    );

    if (comment) {
      res.status(200).json(comment);
    } else {
      res.status(404).json({ error: "Comment not found" });
    }
  } catch (error) {
    console.error("Error fetching product IDs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/save-stats", (req, res) => {
  try {
    const updatedStats = req.body;

    let existingData = [];

    if (fs.existsSync(COMMENTS_DATA_FILE)) {
      try {
        existingData = JSON.parse(fs.readFileSync(COMMENTS_DATA_FILE, "utf-8"));
      } catch (parseError) {
        console.error("Failed to parse existing data:", parseError);
      }
    }

    if (!Array.isArray(existingData)) {
      existingData = [];
    }

    existingData.push(updatedStats);
    // Create the necessary folder structure
    const folderPath = path.join(
      DATA_DIR,
      currentJalaliYear,
      "COMMENTS_DATA",
      currentJalaliMonth,
      currentHour,
      currentJalaliDay
    );

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    fs.writeFileSync(COMMENTS_DATA_FILE, JSON.stringify(existingData, null, 2));

    console.log("Stats saved successfully!");

    res.sendStatus(200);
  } catch (error) {
    console.error("Failed to save stats:", error);
    res.status(500).send("Failed to save stats.");
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
