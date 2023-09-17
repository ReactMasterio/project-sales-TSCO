const fs = require("fs");
const path = require("path");
const axios = require("axios");

const DATA_DIR = "DB"; // Replace with the actual path to your data directory

async function downloadImagesToLocal(products) {
  try {
    const imagesDir = path.join(DATA_DIR, "1402", "PRODUCTS_IMG");

    ensureDirectoryExists(imagesDir);

    for (const product of products) {
      const imageUrl = product.imageSource;
      const productID = product.productID; // Get the product ID

      if (imageUrl) {
        const imageFileName = `${productID}.jpg`; // Use product ID as the filename
        const imagePath = path.join(imagesDir, imageFileName);

        // Download the image
        const response = await axios.get(imageUrl, {
          responseType: "stream",
        });

        // Create a promise to wait for the image to be saved
        const saveImagePromise = new Promise((resolve, reject) => {
          const imageStream = response.data.pipe(
            fs.createWriteStream(imagePath)
          );

          imageStream.on("finish", () => {
            console.log(`Image downloaded: ${imagePath}`);
            resolve();
          });

          imageStream.on("error", (error) => {
            console.error("Error downloading image:", error);
            reject(error);
          });
        });

        // Wait for the image to be saved before proceeding to the next one
        await saveImagePromise;
      }
    }
  } catch (error) {
    console.error("Error downloading images:", error);
  }
}

async function main() {
  try {
    const filePath = path.join(
      DATA_DIR,
      "1402",
      "PRODUCTS_DATA",
      "06",
      "20",
      "09",
      "API_DATA.json"
    );

    // Read the JSON file containing the list of products
    const rawData = fs.readFileSync(filePath, "utf8");
    const listOfProducts = JSON.parse(rawData);

    // Call downloadImagesToLocal for the products you just fetched
    await downloadImagesToLocal(listOfProducts);

    console.log("Image download completed.");
  } catch (error) {
    console.error("Error:", error);
  }
}

function ensureDirectoryExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

main();
