const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const jalaliMoment = require("jalali-moment");
const axios = require("axios");
const momentTimezone = require("moment-timezone");
const moment = require("moment");
const selfsigned = require("selfsigned");
const https = require("https");

// Generate a self-signed certificate
const attrs = [{ name: "commonName", value: "localhost" }];
const pems = selfsigned.generate(attrs, { days: 365 });

// Save the private key and certificate to files
fs.writeFileSync("key.pem", pems.private);
fs.writeFileSync("cert.pem", pems.cert);

const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};

const port = 3020;
const ip = "localhost"; // Listen on all available network interfaces
const DATA_DIR = path.join(__dirname, "DB");

async function getCurrentTimeInTehran() {
  try {
    // Make an HTTP GET request to fetch the current time in Tehran time zone (Asia/Tehran)
    const response = await axios.get(
      "http://worldtimeapi.org/api/timezone/Asia/Tehran"
    );
    console.log("getCurrentTimeInTehran called");

    // Extract the current time in UTC
    const utcTime = response.data.utc_datetime;

    // Create a moment-timezone object with the UTC time and set the timezone to Tehran (GMT+3:30)
    const tehranTime = momentTimezone.tz(utcTime, "Asia/Tehran");

    // Convert the UTC time to a Jalali (Persian) moment
    const persianTime = jalaliMoment(tehranTime);

    // Get the current year, month, day, and hour in Tehran time
    const currentYear = persianTime.jYear();
    const currentMonth = persianTime.jMonth() + 1; // Jalali months are zero-based
    const currentDay = persianTime.jDate();
    const currentHour = persianTime.format("HH");

    // Format the month and day with leading zeros if they are single-digit
    const formattedMonth =
      currentMonth < 10 ? `0${currentMonth}` : currentMonth;
    const formattedDay = currentDay < 10 ? `0${currentDay}` : currentDay;

    return {
      year: currentYear,
      month: formattedMonth,
      day: formattedDay,
      hour: currentHour,
    };
  } catch (error) {
    console.error("Error fetching current time in Tehran:", error);
    return null;
  }
}

async function getProductsDataFilePath() {
  const { year, month, day, hour } = await getCurrentTimeInTehran();
  console.log("getProductsDataFilePath called");

  return path.join(
    DATA_DIR,
    String(year), // Ensure year is a string
    "PRODUCTS_DATA",
    String(month), // Ensure month is a string
    String(day), // Ensure day is a string
    String(hour), // Ensure hour is a string
    "API_DATA.json"
  );
}

async function getCommentsDataFilePathForCurrentDay() {
  const currentTimeInTehran = await getCurrentTimeInTehran();

  if (currentTimeInTehran === null) {
    console.error("Failed to fetch current time in Tehran.");
    return null;
  }

  // Get the current day, month, and year
  const currentDay = currentTimeInTehran.day;
  const currentMonth = currentTimeInTehran.month;
  const currentYear = currentTimeInTehran.year;

  // Create the file path for the current day's comments data
  const filePath = path.join(
    DATA_DIR,
    String(currentYear),
    "COMMENTS_DATA",
    String(currentMonth),
    String(currentDay),
    "COMMENTS_DATA.json"
  );

  return filePath;
}

async function getCommentsDataFilePathForPrevDay() {
  const currentTimeInTehran = await getCurrentTimeInTehran();

  if (currentTimeInTehran === null) {
    console.error("Failed to fetch current time in Tehran.");
    return null;
  }

  // Get the current day, month, and year
  const currentDay = currentTimeInTehran.day;
  const currentMonth = currentTimeInTehran.month;
  const currentYear = currentTimeInTehran.year;

  // Create the file path for the current day's comments data
  const filePath = path.join(
    DATA_DIR,
    String(currentYear),
    "COMMENTS_DATA",
    String(currentMonth),
    String(currentDay - 1),
    "COMMENTS_DATA.json"
  );

  return filePath;
}

function ensureFileAndDirectoryExists(filePath) {
  const directoryPath = path.dirname(filePath);

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "");
  }
}

app.use(express.static("C:\\inetpub\\wwwroot"));
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

app.get("/get-product-ids", (req, res) => {
  try {
    handleGetProductIds(req, res);
  } catch (error) {
    console.error("Error handling /get-product-ids:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
});

async function handleGetProductIds(req, res) {
  console.log("/get-product-ids called");
  let commentsData = [];

  const PRODUCT_FILE_PATH = await getProductsDataFilePath();

  ensureFileAndDirectoryExists(PRODUCT_FILE_PATH);

  const fileContents = fs.readFileSync(PRODUCT_FILE_PATH, "utf-8");
  if (fileContents.trim() !== "") {
    commentsData = JSON.parse(fileContents);
  }

  const productIds = commentsData.map((comment) => comment.productID);

  res.status(200).json(productIds);
}

app.get("/get-comment-stats/:productID", async (req, res) => {
  try {
    const productID = parseInt(req.params.productID, 10);
    const COMMENTS_DATA_FILE = await getCommentsDataFilePathForCurrentDay(); // Use the current day's file path

    ensureFileAndDirectoryExists(COMMENTS_DATA_FILE);
    console.log(COMMENTS_DATA_FILE);

    let fileContents = "";

    // Check if the current day's file exists and is not empty
    if (fs.existsSync(COMMENTS_DATA_FILE)) {
      const currentFileContents = fs.readFileSync(COMMENTS_DATA_FILE, "utf-8");
      if (
        currentFileContents.trim() !== "" &&
        currentFileContents.trim() !== "[]"
      ) {
        fileContents = currentFileContents;
      }
    } else {
      const COMMENTS_DATA_FILE_PREV_DAY =
        await getCommentsDataFilePathForPrevDay();
      ensureFileAndDirectoryExists(COMMENTS_DATA_FILE_PREV_DAY);
      const prevFileContents = fs.readFileSync(
        COMMENTS_DATA_FILE_PREV_DAY,
        "utf-8"
      );
      if (prevFileContents.trim() !== "" && prevFileContents !== "[]") {
        fileContents = prevFileContents;
      }
    }

    if (fileContents.trim() !== "") {
      const commentsData = JSON.parse(fileContents);
      const comment = commentsData.find(
        (comment) => comment.productID === productID
      );

      if (comment) {
        res.status(200).json(comment);
      } else {
        res.status(404).json({ message: "404 - ID Not Found" });
      }
    } else {
      res.status(500).json({ message: "500 - ID not Found" });
    }
  } catch (error) {
    console.error("Error handling /get-comment-stats:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
});

async function getCommentsDataFilePathForPrevDay() {
  const currentTimeInTehran = await getCurrentTimeInTehran();

  if (currentTimeInTehran === null) {
    console.error("Failed to fetch current time in Tehran.");
    return null;
  }

  // Calculate the previous day
  let prevDay = parseInt(currentTimeInTehran.day) - 1;
  let prevMonth = currentTimeInTehran.month;
  let prevYear = currentTimeInTehran.year;

  // Handle cases where the previous day crosses into the previous month or year
  if (prevDay < 1) {
    prevMonth -= 1;
    if (prevMonth < 1) {
      prevMonth = 12; // Wrap around to December
      prevYear -= 1; // Go to the previous year
    }
    // You may need more complex logic to handle different month lengths.
    // This example assumes a simple case.
    prevDay = 31; // Assuming each month has 31 days
  }

  // Create the file path for the previous day's comments data
  const filePath = path.join(
    DATA_DIR,
    String(prevYear),
    "COMMENTS_DATA",
    String(prevMonth),
    String(prevDay),
    "COMMENTS_DATA.json"
  );

  return filePath;
}

app.post("/save-stats", async (req, res) => {
  try {
    const COMMENTS_DATA_FILE = await getCommentsDataFilePathForCurrentDay(); // Use the current day's file path
    ensureFileAndDirectoryExists(COMMENTS_DATA_FILE);

    // Read existing data from the file if it exists
    let fileContents = [];

    if (fs.existsSync(COMMENTS_DATA_FILE)) {
      try {
        fileContents = JSON.parse(fs.readFileSync(COMMENTS_DATA_FILE, "utf-8"));
      } catch (parseError) {
        // Handle the case where existing data is not valid JSON
        console.error("Error parsing existing data:", parseError);

        // Clear the content of the JSON file and create an empty array
        fs.writeFileSync(COMMENTS_DATA_FILE, "[]");

        // Set fileContents to an empty array
        fileContents = [];
      }
    }

    // Check if the req.body already exists in the comments data
    const existingComment = fileContents.find(
      (comment) => comment.productID === req.body.productID
    );

    if (!existingComment) {
      // Add the req.body data if it doesn't exist
      fileContents.push(req.body);

      // Write the updated data back to the file
      const newDataJSON = JSON.stringify(fileContents, null, 2);
      fs.writeFileSync(COMMENTS_DATA_FILE, newDataJSON);
      console.log(COMMENTS_DATA_FILE);
      res.status(200).json({ message: "Data saved successfully" });
    } else {
      res.status(400).json({ message: "Comment already exists" });
    }
  } catch (error) {
    console.error("Error handling /save-stats:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
});

// Server for fetching products
const productsServer = express();
const productsPort = 3000;

productsServer.use(cors());

async function getProductsDataFilePathForPrevHour() {
  const currentTimeInTehran = await getCurrentTimeInTehran();

  if (currentTimeInTehran === null) {
    console.error("Failed to fetch current time in Tehran.");
    return null;
  }

  // Calculate the previous hour
  const prevHour = parseInt(currentTimeInTehran.hour) - 1;
  const prevYear = currentTimeInTehran.year;
  const prevMonth = currentTimeInTehran.month;
  const prevDay = currentTimeInTehran.day;

  // Ensure the previous hour is within the valid range (0-23)
  if (prevHour < 0) {
    prevHour = 23;
  }

  // Create the file path for the previous hour's data
  const filePath = path.join(
    DATA_DIR,
    String(prevYear),
    "PRODUCTS_DATA",
    String(prevMonth),
    String(prevDay),
    String(prevHour),
    "API_DATA.json"
  );

  return filePath;
}

productsServer.get("/api/products", async (req, res) => {
  try {
    const PRODUCTS_DATA_FILE = await getProductsDataFilePath();
    ensureFileAndDirectoryExists(PRODUCTS_DATA_FILE);

    let fileContents = "";

    // Check if the current hour's file exists and is not empty
    if (fs.existsSync(PRODUCTS_DATA_FILE)) {
      console.log(PRODUCTS_DATA_FILE, "was exist seting Data");
      const currentFileContents = fs.readFileSync(PRODUCTS_DATA_FILE, "utf-8");
      if (currentFileContents.trim() !== "") {
        fileContents = currentFileContents;
      }
    }

    // Check if the current hour's file is empty or doesn't exist, then use the previous hour's data
    if (!fileContents) {
      const prevHourFilePath = await getProductsDataFilePathForPrevHour();
      console.log(prevHourFilePath, "getting prevHour Data");
      if (fs.existsSync(prevHourFilePath)) {
        const prevHourFileContents = fs.readFileSync(prevHourFilePath, "utf-8");
        if (prevHourFileContents.trim() !== "") {
          console.log("setting prevHour data");
          fileContents = prevHourFileContents;
        }
      }
    }

    if (fileContents.trim() !== "") {
      res.json(JSON.parse(fileContents));
    } else {
      res.json(503).json({ error: "No Data" });
    }
  } catch (error) {
    console.log("error 503 No Data");
  }
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

const updateServer = express();
const updateServerPort = 3003;

updateServer.use(bodyParser.json());
updateServer.use(cors());
let isUpdateMode = false;
let message = "";

updateServer.post("/api/set-update-mode", (req, res) => {
  const { value, notification } = req.body;
  isUpdateMode = value;
  message = notification;
  res.json({
    message: `Update successful`,
    isUpdateMode,
    notification,
  });
});

// Toggle the update mode state
updateServer.get("/api/is-update-mode", (req, res) => {
  res.json({ isUpdateMode, message });
});

updateServer.listen(updateServerPort, () => {
  console.log(`Server is listening on port ${updateServerPort}`);
});

const serverConfig = express();
const serverConfigPort = 3004;

serverConfig.use(bodyParser.json());
serverConfig.use(cors());
let lastUpdateValue;

serverConfig.post("/api/set-server-config", (req, res) => {
  const { lastUpdate } = req.body;
  lastUpdateValue = lastUpdate;
  res.json({
    message: `Update successful`,
    lastUpdateValue,
  });
});

// Toggle the update mode state
serverConfig.get("/api/is-server-config", (req, res) => {
  res.json({ lastUpdateValue });
});

serverConfig.listen(serverConfigPort, () => {
  console.log(`Server is listening on port ${updateServerPort}`);
});

const userServer = express();
const userServerPort = 3005;

userServer.use(bodyParser.json());
userServer.use(cors());

userServer.get("/api/is-user-exist/:number", async (req, res) => {
  const number = req.params.number;

  try {
    const USERS_FILE_PATH = `./USERS/USERS.json`; // Call it here in an async context
    ensureFileAndDirectoryExists(USERS_FILE_PATH);

    // Read the user data from the file
    const data = fs.readFileSync(USERS_FILE_PATH, "utf-8");

    if (!data) {
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to read data file.",
      });
      return;
    }

    // Parse the JSON data
    const userData = JSON.parse(data);

    const matchedUser = userData.users.find((user) => user.number === number);

    if (matchedUser) {
      res.json(matchedUser);
    } else {
      res.status(403).json({
        error: "Access Denied",
        message: "User not found or access denied.",
      });
    }
  } catch (error) {
    console.error("Error reading data file:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Error reading data file.",
    });
  }
});
// Create an HTTPS server for userServer
const userServerOptions = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};

const userServerHTTPS = https.createServer(userServerOptions, userServer);

userServerHTTPS.listen(userServerPort, () => {
  console.log(`user server is running on port ${userServerPort} HTTPS...`);
});
