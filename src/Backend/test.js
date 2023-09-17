const fs = require("fs");
const moment = require("moment-jalaali");
const path = require("path");
const momentTimezone = require("moment-timezone"); // Import moment-timezone
const axios = require("axios");

let isFetchingData = false;
let previousHour = null;
let lastUpdate = null;
let isUpdateMode = false;

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

async function executeAfterInterval() {
  const currentTimeInTehran = await getCurrentTimeInTehran();

  if (currentTimeInTehran === null) {
    console.error("Failed to fetch current time in Tehran. Skipping interval.");
    return;
  }
  if (!isFetchingData) {
    if (currentTimeInTehran.hour > 5 && currentTimeInTehran.hour < 23) {
      if (
        currentTimeInTehran.hour > previousHour ||
        currentTimeInTehran.hour === null
      ) {
        previousHour === null ? (isUpdateMode = true) : (isUpdateMode = false);

        const listOfProducts = await apiService.fetchCombinedDataAndSaveToFile(
          "tsco"
        );

        const IDs = listOfProducts.map((product) => product.id);

        await executeFetchCommentsAndStats(IDs);

        isUpdateMode = false;

        previousHour = currentTimeInTehran.hour;
        lastUpdate = currentTimeInTehran.hour;
        

      } else {
        currentTimeInTehran.hour > previousHour
          ? console.log(`current hour is not passed`)
          : console.log(`it is not the initial run of the server`);
      }
    } else {
      console.log(`is not passed 5am and it is not before 23 pm`);
    }
  } else {
    console.log(`is fetchin var is true`);
  }
}

function startInterval() {
  intervalId = setInterval(executeAfterInterval, 1 * 1000);
}

// Function to stop the interval
function stopInterval() {
  clearInterval(intervalId);
  intervalId = null;
}

startInterval(); // Start the interval initially
