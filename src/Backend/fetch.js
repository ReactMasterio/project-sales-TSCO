const fs = require("fs");
const moment = require("moment-jalaali");
const path = require("path");

function removeLastDigit(number) {
  return Math.floor(number / 10);
}

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
      for (let i = pager.current_page; i <= /* pager.total_pages */5; i++) {
        console.log(i);
        const fetchModule = await import("node-fetch");
        const fetch = fetchModule.default;
        const response = await fetch(
          `${this.baseURL}/brands/${brandName}/?no_redirect=1&seo_url=&page=${i}`
        );
        const data = await response.json();
        listOfProducts.push(...data.data.products);
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
      const data = await response.json();
      const ratingValue =
        data?.data?.seo?.markup_schema?.[0]?.aggregateRating?.ratingValue || 0;
      return { productDetails: data, ratingValue };
    } catch (error) {
      return null;
    }
  }

  createCombinedProduct(
    productData,
    ratingValue,
  ) {
    const product = productData.data.product || {};
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
      console.log(startTime);
      const listOfProducts = await this.fetchProductsByBrand(brandName);
      console.log("Total products fetched:", listOfProducts.length);
      const combinedProducts = [];

      for (const product of listOfProducts) {
        const productDetailsWithRating = await this.fetchProductDetails(
          product.id
        );
        if (productDetailsWithRating.productDetails) {
          const ratingValue = productDetailsWithRating.ratingValue;
          const combinedProduct = this.createCombinedProduct(
            productDetailsWithRating.productDetails,
            ratingValue,
          );

          combinedProducts.push(combinedProduct);
        }
      }

      const currentDate = moment().format("jYYYY/jMM/jDD");
      const filePath = path.join(__dirname, `DB/${currentDate}/API_DATA.json`);
      const directoryPath = path.dirname(filePath);
      fs.mkdirSync(directoryPath, { recursive: true });

      const jsonData = JSON.stringify(combinedProducts, null, 2);
      fs.writeFileSync(filePath, jsonData, "utf8");

      const endTime = new Date(); // Record end time
      const elapsedTimeMinutes = (endTime - startTime) / (1000 * 60);
      console.log(`Total time taken: ${elapsedTimeMinutes.toFixed(2)} minutes`);
    } catch (error) {
      console.error(`Error processing data:`, error);
    }
  }
}

const apiService = new ApiService();
apiService.fetchCombinedDataAndSaveToFile("tsco");