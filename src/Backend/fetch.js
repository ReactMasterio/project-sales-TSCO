const fs = require("fs");
const moment = require("moment-jalaali");
const path = require("path");
const momentTimezone = require("moment-timezone"); // Import moment-timezone
const axios = require("axios");
const https = require("https");
// Create an HTTPS agent with specified TLS version
const httpsAgent = new https.Agent();

axios.default.httpsAgent = httpsAgent;



process.env.NODE_TLS_REJECT_UNAUTHORIZED ="0";


function removeLastDigit(number) {
  return Math.floor(number / 10);
}

let isFetchingData = false;
let previousHour = null;
let lastUpdate = null;
console.log("updateMode = false");
let isUpdateMode = false;
let message = "";

const DATA_DIR = "DB"; // Replace with the actual path

class ApiService {
  constructor() {
    this.baseURL = "https://api.digikala.com/v1";
  }

  async productCount(brandName) {
    try {
      const fetchModule = await import("node-fetch");
      const fetch = fetchModule.default;
      const response = await fetch(
        `${this.baseURL}/brands/${brandName}/?no_redirect=1&seo_url=&page=1`
      );
      const data = await response.json();
      return data.data.pager;
    } catch (error) {
      return null;
    }
  }

  async fetchProductsByBrand(brandName) {
    let listOfProducts = [];
    try {
      const pager = await this.productCount(brandName);
      for (let i = pager.current_page; i <= /* pager.total_pages */ 3; i++) {
        console.log(`Fetching products - Page ${i}`);
        console.log(listOfProducts.length);
        const fetchModule = await import("node-fetch");
        const fetch = fetchModule.default;
        const response = await fetch(
          `${this.baseURL}/brands/${brandName}/?no_redirect=1&seo_url=&page=${i}`
        );

        const data = await response.json();
        listOfProducts.push(...data.data.products);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (i >= pager.total_pages && i >= pager.current_page + 1) {
          break;
        }
      }

      return listOfProducts;
    } catch (error) {
      return [];
    }
  }
  async fetchProductDetails(productId) {
    try {
      const fetchModule = await import("node-fetch");
      const response = await fetchModule.default(
        `${this.baseURL}/product/${productId}/`
      );
      console.log(`fetchProductDetails called for ${productId}`);

      // Check the response status code
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      console.log(`response for fetchProductDetails was OK!`);

      const data = await response.json();
      const ratingValue =
        data?.data?.seo?.markup_schema?.[0]?.aggregateRating?.ratingValue || 0;

      // Check if data is missing or not in the expected format
      if (!data || !data.data || !data.data.product) {
        return { success: false, error: "Product data not found" };
      }

      return { success: true, productDetails: data.data.product, ratingValue };
    } catch (error) {
      console.error("Error fetching product details:", error.message);
      return { success: false, error: error.message };
    }
  }

  createCombinedProduct(productData, ratingValue) {
    const product = productData || {};
    const category = product.category || {};
    const baseurl = `https://www.digikala.com`;

    const combinedProduct = {
      productID: product.id || 0,
      productName: product.title_fa || "",
      productLink: `${baseurl}${product.url?.uri || ""}`,
      productCategory: category.title_fa || "",
      imageSource: product.images?.main?.url[0] || "",
      productVotes: product.rating?.count || 0,
      productSatisfaction: product.default_variant?.rate || 0,
      productWarranty: product.default_variant?.warranty?.title_fa || "",
      sellerName: product.default_variant?.seller?.title || "",
      sellerID: product.default_variant?.seller?.id || 0,
      productPrice:
        removeLastDigit(product.default_variant?.price?.selling_price) || "",
      rating: ratingValue,
      productComments: product.comments_count || 0,
      otherSellers: [],
    };

    for (const variant of product.variants || []) {
      combinedProduct.otherSellers.push({
        otherSellerId: variant.seller?.id || 0,
        otherSellerName: variant.seller?.title || "",
        otherSellerWarranty: variant.warranty?.title_fa || "",
        otherSellerPrice: removeLastDigit(variant.price?.selling_price) || "",
      });
    }

    return combinedProduct;
  }

  async fetchCombinedDataAndSaveToFile(brandName) {
  try {
    console.log("Fetching products by brand:", brandName);
    const startTime = new Date(); // Record start time
    console.log("Start Time:", startTime);

    // Use getProductsDataFilePath to get the dynamic file path
    const productsDataFilePath = await getProductsDataFilePath();

    // Ensure the directory path exists
    ensureDirectoryExists(path.dirname(productsDataFilePath));

    let existingData = [];

    // Check if the JSON file already exists
    if (fs.existsSync(productsDataFilePath)) {
      // If it exists, read its content as a string
      const existingDataBuffer = fs.readFileSync(productsDataFilePath);
      const existingDataString = existingDataBuffer.toString();

      // Check if existingDataString is not empty before parsing
      if (existingDataString.trim() !== "") {
        try {
          // Attempt to parse the content as JSON
          existingData = JSON.parse(existingDataString);

          if (!Array.isArray(existingData)) {
            // If it's not an array, clear the content and create an empty array
            existingData = [];
            fs.writeFileSync(productsDataFilePath, "[]");
          }
        } catch (error) {
          // Handle parsing errors, if any
          console.error("Error parsing existing data as JSON:", error);
          existingData = [];
        }
      } else {
        // If it's an empty string, create an empty array
        existingData = [];
        fs.writeFileSync(productsDataFilePath, "[]");
      }
    } else {
      // If it doesn't exist, create an empty array
      existingData = [];
    }

    const listOfProducts = await this.fetchProductsByBrand(brandName);
    console.log("Total products fetched:", listOfProducts.length);

    for (let i = 0; i < listOfProducts.length; i++) {
      const product = listOfProducts[i];
      console.log(`fetchProductDetails Called`);
      const productDetailsWithRating = await this.fetchProductDetails(
        product.id
      );

      if (productDetailsWithRating.success) {
        const ratingValue = productDetailsWithRating.ratingValue;
        const combinedProduct = this.createCombinedProduct(
          productDetailsWithRating.productDetails,
          ratingValue
        );

        // Append the combinedProduct to the existing array
        existingData.push(combinedProduct);
      } else {
        // Handle the error case here, such as logging the error message
        console.error(
          "Error fetching product details:",
          productDetailsWithRating.error
        );
        // You can choose to continue processing or take other actions as needed
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
    }

    // Write the updated array to the JSON file
    fs.writeFileSync(
      productsDataFilePath,
      JSON.stringify(existingData, null, 2)
    );

    const endTime = new Date(); // Record end time
    const elapsedTimeMinutes = (endTime - startTime) / (1000 * 60);
    console.log("Products Data File Path:", productsDataFilePath);
    console.log(`Total time taken: ${elapsedTimeMinutes.toFixed(2)} minutes`);
    return listOfProducts;
  } catch (error) {
    console.error("Error processing data:", error);
  }
}

}

function ensureJsonFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "");
  }
}

function ensureDirectoryExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}
async function getProductsDataFilePath() {
  const { year, month, day, hour } = await getCurrentTimeInTehran();

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
async function getCommentsDataFilePath() {
  const { year, month, day } = await getCurrentTimeInTehran();

  return path.join(
    DATA_DIR,
    String(year),
    "COMMENTS_DATA",
    String(month),
    String(day),
    "COMMENTS_DATA.json"
  );
}

async function getCurrentTimeInTehran() {
  try {
    // Make an HTTP GET request to fetch the current time in Tehran time zone (Asia/Tehran)
    const response = await axios.get(
      "http://worldtimeapi.org/api/timezone/Asia/Tehran"
    );

    // Extract the current time in UTC
    const utcTime = response.data.utc_datetime;

    // Create a moment-timezone object with the UTC time and set the timezone to Tehran (GMT+3:30)
    const tehranTime = momentTimezone.tz(utcTime, "Asia/Tehran");

    // Convert the UTC time to a Jalali (Persian) moment
    const persianTime = moment(tehranTime);

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


const fetchCommentsAndStats = async (productID) => {
  const MAX_PAGES = 100;
  const PAGE_DELAY_MS = 1000;
  try {
    const response = await fetch(
      `https://api.digikala.com/v1/product/${productID}/comments/?page=1`
    );
    console.log(`got total pages for ${productID}`);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();

    const totalPages = data?.data?.pager?.total_pages || 1;
    const currentPage = data?.data?.pager?.current_page || 1;
    const commentCounts = data?.data?.pager?.total_items || 0;
    const allComments = [];

    const pageLimit = Math.min(totalPages, MAX_PAGES);
    console.log(`page limit for ProductID ${productID} is : ${pageLimit}`);

    console.log(`get data for ${productID}`);
    for (let page = currentPage; page <= pageLimit; page++) {
      console.log(`page ${page}`);
      const pageResponse = await fetch(
        `https://api.digikala.com/v1/product/${productID}/comments/?page=${page}`
      );

      const pageData = await pageResponse.json();
      const pageComments = pageData.data.comments;

      for (const comment of pageComments) {
        allComments.push(comment);
      }

      await new Promise((resolve) => setTimeout(resolve, PAGE_DELAY_MS));
    }
    let recommendedCount = 0;
    let notRecommendedCount = 0;
    let totalLikes = 0;
    let totalDislikes = 0;
    let mostLikedComment = null;
    let mostDislikedComment = null;
    for (const comment of allComments) {
      const recommendationStatus = comment.recommendation_status;
      const reactions = comment.reactions;
      if (recommendationStatus === "recommended") {
        recommendedCount++;
      } else if (recommendationStatus === "not_recommended") {
        notRecommendedCount++;
      }

      totalLikes += reactions.likes;
      totalDislikes += reactions.dislikes;

      if (
        mostLikedComment === null ||
        reactions.likes > mostLikedComment.reactions.likes
      ) {
        mostLikedComment = comment;
      }

      if (
        mostDislikedComment === null ||
        reactions.dislikes > mostDislikedComment.reactions.dislikes
      ) {
        mostDislikedComment = comment;
      }
    }
    const neutralCount =
      commentCounts - (recommendedCount + notRecommendedCount);

    let recommendedPercentage = (recommendedCount / commentCounts) * 100;

    recommendedPercentage = parseInt(recommendedPercentage);
    let notRecommendedPercentage = (notRecommendedCount / commentCounts) * 100;

    notRecommendedPercentage = parseInt(notRecommendedPercentage);
    let neutralPercentage =
      100 - (recommendedPercentage + notRecommendedPercentage);
    neutralPercentage = parseInt(neutralPercentage);

    const mostLikedInfo = {
      title: mostLikedComment?.title || "",
      body: mostLikedComment?.body || "",
      likes: mostLikedComment?.reactions?.likes || 0,
      dislikes: mostLikedComment?.reactions?.dislikes || 0,
    };

    const mostDislikedInfo = {
      title: mostDislikedComment?.title || "",
      body: mostDislikedComment?.body || "",
      likes: mostDislikedComment?.reactions?.likes || 0,
      dislikes: mostDislikedComment?.reactions?.dislikes || 0,
    };

    const updatedStats = {
      productID,
      commentCounts,
      recommendedCount,
      notRecommendedCount,
      neutralCount,
      totalLikes,
      totalDislikes,
      recommendedPercentage,
      notRecommendedPercentage,
      neutralPercentage,
      mostLikedInfo,
      mostDislikedInfo,
    };

    console.log(`saving... ${productID}`);

    fetch(`http://localhost:3020/save-stats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedStats),
    });

    return updatedStats;
  } catch (error) {
    console.log("jhh")
  }
};

async function executeFetchCommentsAndStats(productIds) {
  console.log(`executeFetchCommentsAndStats Called`);

  for (const productID of productIds) {
    const updatedStats = await fetchCommentsAndStats(productID);

    if (updatedStats) {
      console.log(`Stats saved for productID ${productID}`);
    } else {
      console.log(`No stats to save for productID ${productID}`);
    }
  }
}

async function handleScriptExit() {
  try {
    if (isUpdateMode) {
      isUpdateMode = false;
      await setWebsiteUpdateStat(isUpdateMode);
      console.log("setWebsiteUpdateStat set to false");
    }
  } catch (error) {
    console.error(error);
  }
}

// Set up the 'SIGINT' event listener to handle Ctrl + C
process.on("SIGINT", async () => {
  console.log("Received SIGINT. Exiting...");
  await handleScriptExit(); // Ensure the cleanup is performed
  process.exit(2); // Exit the script
});

const setWebsiteUpdateStat = async (state, notification) => {
  await axios.post(`http://localhost:3003/api/set-update-mode`, {
    value: state,
    notification: notification, // Pass the notification message
  });
};

let intervalStartTime = Date.now(); // Record the start time

async function sendLastUpdateToServer(lastUpdateValue) {
  try {
    const response = await axios.post(
      `http://localhost:3004/api/set-server-config`,
      {
        lastUpdate: lastUpdateValue,
      }
    );
    console.log("LastUpdate sent to server:", lastUpdateValue);
  } catch (error) {
    console.error("Error sending LastUpdate to server:", error);
  }
}

let isExecuting = false; // Variable to track if the function is already executing

// Function to start the interval
function startInterval() {
  intervalId = setInterval(executeAfterInterval, 1  * 1000);
}

async function executeAfterInterval() {
  // Check if the function is already executing, if so, return immediately
  if (isExecuting) {
    console.log("Function is already executing. Skipping interval.");
    return;
  }

  const currentTimeInTehran = await getCurrentTimeInTehran();

  if (currentTimeInTehran === null) {
    console.error("Failed to fetch current time in Tehran. Skipping interval.");
    return;
  }

  const currentHour = currentTimeInTehran.hour;

  // Check if it's within the desired time range (5 am to 11 pm) and if the current hour is greater than the previous hour
  if (previousHour === null) {
    isExecuting = true; // Set the flag to indicate execution
    const apiService = new ApiService();
    try {
      previousHour === null ? (isUpdateMode = true) : (isUpdateMode = false);
      setWebsiteUpdateStat(isUpdateMode, message);
      const listOfProducts = await apiService.fetchCombinedDataAndSaveToFile(
        "tsco"
      );

      const IDs = listOfProducts.map((product) => product.id);

      // Update the previousHour
      previousHour = currentHour;

      // Update lastUpdate to the current hour
      lastUpdate = currentHour;

      isUpdateMode = false;
      setWebsiteUpdateStat(isUpdateMode, message);

      sendLastUpdateToServer(lastUpdate);

      // After fetching listOfProducts
      await executeFetchCommentsAndStats(IDs);
    } catch (error) {
      console.error("Error while fetching and saving data:", error);
    } finally {
      isExecuting = false; // Reset the flag
      console.log("interval finished");
    }
  } else if (
    currentHour >= 3 &&
    currentHour <= 19 &&
    currentHour > previousHour
  ) {
    isExecuting = true; // Set the flag to indicate execution
    const apiService = new ApiService();
    try {
      const listOfProducts = await apiService.fetchCombinedDataAndSaveToFile(
        "tsco"
      ); // Wait for this to complete

      const IDs = listOfProducts.map((product) => product.id);
      console.log(IDs);

      // Update the previousHour
      previousHour = currentHour;

      // Update lastUpdate to the current hour
      lastUpdate = currentHour;

      // After fetching listOfProducts

      const commentsDataFilePath = await getCommentsDataFilePath();
      if (!fs.existsSync(commentsDataFilePath)) {
        await executeFetchCommentsAndStats(IDs);
      }

      sendLastUpdateToServer(lastUpdate);
    } catch (error) {
      console.error("Error while fetching and saving data:", error);
    } finally {
      isExecuting = false; // Reset the flag
      console.log("interval finished");
    }
  }
}

startInterval();
