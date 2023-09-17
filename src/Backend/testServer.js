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

const port = 3020;
const ip = "localhost"; // Listen on all available network interfaces
const DATA_DIR = path.join(__dirname, "DB");

async function getCommentsDataFilePath() {
  const { year, month, day, hour } = await getCurrentTimeInTehran();
  console.log("getCommentsDataFilePath called");

  return path.join(
    DATA_DIR,
    String(year), // Ensure year is a string
    "COMMENTS_DATA",
    String(month), // Ensure month is a string
    String(day), // Ensure day is a string
    String(hour), // Ensure hour is a string
    "COMMENTS_DATA.json"
  );
}

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

function ensureFileAndDirectoryExists(filePath) {
  const directoryPath = path.dirname(filePath);

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]");
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
    const COMMENTS_DATA_FILE = await getCommentsDataFilePath();
    const prevHourFilePath = await getCommentsDataFilePathForPrevHour();

    let commentsData = [];

    ensureFileAndDirectoryExists(COMMENTS_DATA_FILE);
    console.log(COMMENTS_DATA_FILE);

    let fileContents = "";

    // Check if the current hour's file exists and is not empty
    if (fs.existsSync(COMMENTS_DATA_FILE)) {
      const currentFileContents = fs.readFileSync(COMMENTS_DATA_FILE, "utf-8");
      if (
        currentFileContents.trim() !== "" &&
        currentFileContents.trim() !== "[]"
      ) {
        fileContents = currentFileContents;
      }
    }

    // Check if the current hour's file is empty or doesn't exist, then use the previous hour's data
    if (!fileContents && fs.existsSync(prevHourFilePath)) {
      const prevHourFileContents = fs.readFileSync(prevHourFilePath, "utf-8");
      if (prevHourFileContents.trim() !== "") {
        fileContents = prevHourFileContents;
      }
    }

    if (fileContents.trim() !== "") {
      commentsData = JSON.parse(fileContents);
    }

    if (commentsData) {
      const comment = commentsData.find(
        (comment) => comment.productID === productID
      );

      if (comment) {
        res.status(200).json(comment);
      }
    }
  } catch (error) {
    console.error("Error handling /get-comment-stats:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
});



async function getCommentsDataFilePathForPrevHour() {
  const currentTimeInTehran = await getCurrentTimeInTehran();

  if (currentTimeInTehran === null) {
    console.error("Failed to fetch current time in Tehran.");
    return null;
  }

  // Calculate the previous hour
  let prevHour = parseInt(currentTimeInTehran.hour) - 1;
  const prevYear = currentTimeInTehran.year;
  const prevMonth = currentTimeInTehran.month;
  const prevDay = currentTimeInTehran.day;

  // Ensure the previous hour is within the valid range (0-23)
  if (prevHour < 0) {
    prevHour = 23; // Wrap around to the previous day's last hour
    // Adjust other date components accordingly
    // You may need to handle cases where the date changes to the previous day
    // when the current hour is 0.
    // For simplicity, this example assumes the same day.
  }

  // Create the file path for the previous hour's comments data
  const filePath = path.join(
    DATA_DIR,
    String(prevYear),
    "COMMENTS_DATA",
    String(prevMonth),
    String(prevDay),
    String(prevHour),
    "COMMENTS_DATA.json"
  );

  return filePath;
}


app.get("/get-all-comment-stats", async (req, res) => {
  try {
    const COMMENTS_DATA_FILE = await getCommentsDataFilePath();
    const PREV_HOUR_COMMENTS_DATA_FILE =
      await getCommentsDataFilePathForPrevHour();

    let commentsData = [];

    ensureFileAndDirectoryExists(COMMENTS_DATA_FILE);
    console.log(COMMENTS_DATA_FILE);

    // Check if the current data file exists
    const currentFileContents = fs.readFileSync(COMMENTS_DATA_FILE, "utf-8");
    if (currentFileContents.trim() !== "") {
      commentsData = JSON.parse(currentFileContents);
    } else {
      // If the current data file doesn't exist, try the previous hour's data
      if (PREV_HOUR_COMMENTS_DATA_FILE !== null) {
        const prevHourFileContents = fs.readFileSync(
          PREV_HOUR_COMMENTS_DATA_FILE,
          "utf-8"
        );
        if (prevHourFileContents.trim() !== "") {
          commentsData = JSON.parse(prevHourFileContents);
        }
      }
    }

    const fetchedComments = commentsData.map((item) => item.productID);

    if (fetchedComments.length > 0) {
      res.status(200).json(fetchedComments);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    console.error("Error handling /get-all-comment-stats:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
});


app.post("/save-stats", async (req, res) => {
  try {
    const COMMENTS_DATA_FILE = await getCommentsDataFilePath();
    ensureFileAndDirectoryExists(COMMENTS_DATA_FILE);

    let fileContents = [];

    // Read existing data from the file if it exists
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

    // Push the data from the request body into the existing data array
    fileContents.push(req.body);

    // Write the updated data back to the file
    const newDataJSON = JSON.stringify(fileContents, null, 2);
    fs.writeFileSync(COMMENTS_DATA_FILE, newDataJSON);

    res.status(200).json({ message: "Data saved successfully" });
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
      res.json([]); // If no data is available, return an empty array
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
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

updateServer.post("/api/set-update-mode", (req, res) => {
  const { value } = req.body;
  isUpdateMode = value;
  res.json({ message: "Update successful", isUpdateMode });
});

// Toggle the update mode state
updateServer.get("/api/is-update-mode", (req, res) => {
  res.json({ isUpdateMode });
});

updateServer.listen(updateServerPort, () => {
  console.log(`Server is listening on port ${updateServerPort}`);
});
