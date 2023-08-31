const express = require("express");
const axios = require("axios");

const app = express();
const cors = require("cors");
const PORT = 3002; // You can choose any available port

app.use(express.json());
app.use(cors());


app.get("/api/product/:productID/comments", async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
