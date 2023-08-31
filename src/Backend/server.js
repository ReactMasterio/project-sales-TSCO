const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cors = require("cors");
const jalaliMoment = require("jalali-moment");


const app = express();
const port = 3000;

app.use(cors());

// Route to fetch products
app.get("/api/products", (req, res) => {
  const currentDate = jalaliMoment().format("jYYYY/jMM/jDD");

  const filePath = path.join(
    __dirname,
    "DB",
    ...currentDate.split("/"), // Split the formatted date and use its parts in the path
    "API_DATA.json"
  );

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("An error occurred");
    } else {
      res.json(JSON.parse(data));
    }
  });
});


app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
