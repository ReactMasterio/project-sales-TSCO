const fs = require("fs"); // Node.js File System module
const filePath = "DB/1402/PRODUCTS_DATA/06/20/09/API_DATA.json"; // Replace with the path to your JSON file
const propertyName = "productID"; // Replace with the name of the property you want to extract
const outputFilePath = 'output.json'; // Replace with the desired path for the output JSON file


// Read the JSON file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  try {
    const jsonArray = JSON.parse(data); // Parse the JSON data into an array of objects
    const propertyValues = jsonArray.map((item) => item[propertyName]); // Extract the specified property from each object and create an array of property values

    // Create a new JSON object with the extracted property values
    const outputData = {
      propertyValues: propertyValues
    };

    // Write the JSON object to a new file
    fs.writeFile(outputFilePath, JSON.stringify(outputData, null, 2), (err) => {
      if (err) {
        console.error('Error writing to the output file:', err);
      } else {
        console.log('Property values saved to', outputFilePath);
      }
    });
  } catch (error) {
    console.error('Error parsing JSON:', error);
  }
});
