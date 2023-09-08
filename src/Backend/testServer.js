const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const jalaliMoment = require("jalali-moment");
const axios = require("axios");

const port = 3020;
const ip = "0.0.0.0"; // Listen on all available network interfaces
const DATA_DIR = path.join(__dirname, "DB");
const COMMENTS_DATA_FILE = getCommentsDataFilePath();

app.use(express.static("C:\\inetpub\\wwwroot"));
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

function getCurrentJalaliDate() {
  return jalaliMoment().format("jYYYY/jMM/jDD");
}

function ensureDataDirExists() {
  const currentDate = getCurrentJalaliDate();
  const dataDir = path.join(DATA_DIR, currentDate);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function getCommentsDataFilePath() {
  const currentJalaliDate = getCurrentJalaliDate();
  const [currentJalaliYear, currentJalaliMonth, currentJalaliDay] =
    currentJalaliDate.split("/");
  const currentHour = jalaliMoment().format("HH");

  return path.join(
    DATA_DIR,
    currentJalaliYear,
    "COMMENTS_DATA",
    currentJalaliMonth,
    currentJalaliDay,
    currentHour,
    "COMMENTS_DATA.json"
  );
}

function ensureFileAndDirectoryExists(filePath) {
  const directoryPath = path.dirname(filePath);

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]");
  }
}

app.use((req, res, next) => {
  ensureDataDirExists();
  next();
});

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

    ensureFileAndDirectoryExists(COMMENTS_DATA_FILE);

    fs.writeFileSync(COMMENTS_DATA_FILE, JSON.stringify(existingData, null, 2));

    console.log("Stats saved successfully!");

    res.sendStatus(200);
  } catch (error) {
    console.error("Failed to save stats:", error);
    res.status(500).send("Failed to save stats.");
  }
});

// Server for fetching products
const productsServer = express();
const productsPort = 3000;

productsServer.use(cors());

productsServer.get("/api/products", (req, res) => {
  const currentDate = jalaliMoment().format("jYYYY/jMM/jDD");
  const [currentYear, currentMonth, currentDay] = currentDate.split("/");
  const filePath = path.join(
    __dirname,
    "DB",
    currentYear,
    "products",
    currentMonth,
    currentDay,
    "API_DATA.json"
  );
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]");
  }

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("An error occurred");
    } else {
      res.json(JSON.parse(data));
    }
  });
});

productsServer.listen(productsPort, ip, () => {
  console.log(`products Server is listening on ${ip}:${port}`);
});

// Server for fetching product comments
const commentsServer = express();
const commentsPort = 3002;

commentsServer.use(express.json());
commentsServer.use(cors());

commentsServer.get("/api/product/:productID/comments", async (req, res) => {
  const productID = req.params.productID;
  const page = req.query.page || 1;

  try {
    const response = await axios.get(
      `https://api.digikala.com/v1/product/${productID}/comments/?page=${page}`
    );

    const commentData = response.data;
    res.json(commentData);
  } catch (error) {
    res.status(500).json({ error: "Error fetching data from API" });
  }
});

commentsServer.listen(commentsPort, ip, () => {
  console.log(`Comments Server is running on port ${commentsPort}`);
});

app.listen(port, ip, () => {
  console.log(`Main Server is listening on port ${port}`);
});
