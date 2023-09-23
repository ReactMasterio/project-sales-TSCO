import React, { useState, useEffect } from "react";
import { Select, Space, Button } from "antd";
import { ClearOutlined } from "@ant-design/icons";

const { Option } = Select;

const Filters = ({
  onFilterChange,
  categories,
  sellers,
  resetFilters,
  resetSellers, // Add resetSellers prop
  resetCategories, // Add resetCategories prop
  onClearFilters,
}) => {
  const [category, setCategory] = useState(null);
  const [sale, setSale] = useState(null);
  const [price, setPrice] = useState(null);
  const [rate, setRate] = useState(null);
  const [comments, setComments] = useState(null);
  const [seller, setSeller] = useState(null);
  const [categoryValue, setCategoryValue] = useState("all");
  const [saleValue, setSaleValue] = useState("all");
  const [priceValue, setPriceValue] = useState("all");
  const [rateValue, setRateValue] = useState("all");
  const [commentsValue, setCommentsValue] = useState("all");
  const [sellerValue, setSellerValue] = useState("all");

  useEffect(() => {
    if (resetFilters) {
      setCategory("all");
      setSale("all");
      setPrice("all");
      setRate("all");
      setComments("all");
      setSeller("all");
    }
    // Add logic to reset other filters when needed
    if (resetSellers) {
      setSeller("all");
    }
    if (resetCategories) {
      setCategory("all");
    }
  }, [resetFilters, resetSellers, resetCategories]);

  // Function to extract unique seller names from the data
  const getUniqueSellers = () => {
    const uniqueSellers = new Set();
    for (const item of sellers) {
      uniqueSellers.add(item.sellerName);
    }
    return Array.from(uniqueSellers);
  };

  const uniqueSellers = getUniqueSellers(); // Get unique sellers

  // Create functions to handle filter changes
  const handleCategoryChange = (value) => {
    setCategory(value);
    onFilterChange({ category: value });
  };

  const handleSellersChange = (value) => {
    setSeller(value);
    onFilterChange({ seller: value });
  };

  const handleSaleChange = (value) => {
    setSale(value);
    onFilterChange({ sale: value });
  };

  const handlePriceChange = (value) => {
    setPrice(value);
    onFilterChange({ price: value });
  };

  const handleRateChange = (value) => {
    setRate(value);
    onFilterChange({ rate: value });
  };

  const handleCommentsChange = (value) => {
    setComments(value);
    onFilterChange({ comments: value });
  };

  // Use the categories prop to populate the options for the category Select
  const categoryOptions = [
    <Option key="all" value="all">
      دسته بندی ها
    </Option>,
    ...categories.map((category) => (
      <Option key={category} value={category}>
        {category}
      </Option>
    )),
  ];

  const sellersOptions = [
    <Option key="all" value="all">
      فروشنده ها
    </Option>,
    ...sellers.map((seller) => (
      <Option key={seller} value={seller}>
        {seller}
      </Option>
    )),
  ];

  const clearCategory = () => {
    setCategory("all");
  };

  const clearSale = () => {
    setSale("all");
  };

  const clearPrice = () => {
    setPrice("all");
  };

  const clearRate = () => {
    setRate("all");
  };

  const clearComments = () => {
    setComments("all");
  };

  const clearSeller = () => {
    setSeller("all");
  };

  const handleClearFilters = () => {
    clearCategory();
    clearRate();
    clearPrice();
    clearSale();
    clearSeller();
    clearComments();

    if (typeof onClearFilters === "function") {
      onClearFilters();
    }
  };
  const rtlStyle = {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
  };

  return (
    <div>
      <Space direction="horizontal" style={{ direction: "rtl" }}>
        <Select
          style={{ width: 200 }}
          className="mx-2 my-4"
          size="large"
          showSearch
          placeholder="Select Category"
          optionFilterProp="children"
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          value={category || "all"}
          onChange={handleCategoryChange}
        >
          {categoryOptions}
        </Select>
        <Select
          placeholder="Select Sale"
          className="mx-2 my-4"
          size="large"
          style={{ width: 200 }}
          onChange={handleSaleChange}
          value={sale || "all"} // Use defaultValue instead of value
        >
          <Option value="all">وضعیت فروش</Option>
          <Option value="underselling">زیر فروشی</Option>
          <Option value="overselling">گران فروشی</Option>
        </Select>
        <Select
          placeholder="Select Price"
          className="mx-2 my-4"
          size="large"
          style={{ width: 200 }}
          onChange={handlePriceChange}
          value={price || "all"} // Use defaultValue instead of value
        >
          <Option value="all">قیمت وبسایت</Option>
          <Option value="az">صعودی</Option>
          <Option value="za">نزولی</Option>
        </Select>
        <Select
          placeholder="Select Rate"
          className="mx-2 my-4"
          size="large"
          style={{ width: 200 }}
          onChange={handleRateChange}
          value={rate || "all"} // Set "all" as the default value
        >
          <Option value="all">رتبه کالا</Option> {/* Default option */}
          <Option value="az">صعودی</Option>
          <Option value="za">نزولی</Option>
        </Select>
        <Select
          placeholder="Select Comments"
          className="mx-2 my-4"
          size="large"
          style={{ width: 200 }}
          onChange={handleCommentsChange}
          value={comments || "all"} // Set "all" as the default value
        >
          <Option value="all">نظرات کالا</Option> {/* Default option */}
          <Option value="az">صعودی</Option>
          <Option value="za">نزولی</Option>
        </Select>
        <Select
          style={{ width: 200 }}
          className="mx-2 my-4"
          size="large"
          showSearch
          placeholder="Select Seller's Name"
          optionFilterProp="children"
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          value={seller || "all"} // Use 'seller' state here
          onChange={handleSellersChange}
        >
          {sellersOptions}
        </Select>
      </Space>
    </div>
  );
};

export default Filters;
