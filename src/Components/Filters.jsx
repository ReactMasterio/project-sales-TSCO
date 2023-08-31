import React from "react";
import { Select } from "antd";

const { Option } = Select;

const Filters = () => {
  return (
    <div>
      <Select
        style={{ width: 200 }}
        className="mx-4 my-4"
        size="large"
        showSearch
        placeholder="Select Category"
        optionFilterProp="children"
        filterOption={(input, option) =>
          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }
      >
        <Option value="category1">Category 1</Option>
        <Option value="category2">Category 2</Option>
        {/* Add more category options */}
      </Select>
      <Select
        placeholder="Select Sale"
        className="mx-4 my-4"
        size="large"
        style={{ width: 200 }}
      >
        <Option value="underselling">Under Selling</Option>
        <Option value="overselling">Over Selling</Option>
      </Select>
      <Select
        placeholder="Select Price"
        className="mx-4 my-4"
        size="large"
        style={{ width: 200 }}
      >
        <Option value="az">Price: Low to High</Option>
        <Option value="za">Price: High to Low</Option>
      </Select>
      <Select
        placeholder="Select Rate"
        className="mx-4 my-4"
        size="large"
        style={{ width: 200 }}
      >
        <Option value="az">Rate: Low to High</Option>
        <Option value="za">Rate: High to Low</Option>
      </Select>
      <Select
        placeholder="Select Comments"
        className="mx-4 my-4"
        size="large"
        style={{ width: 200 }}
      >
        <Option value="az">Comments: Low to High</Option>
        <Option value="za">Comments: High to Low</Option>
      </Select>
      
      <Select
        style={{ width: 200 }}
        className="mx-4 my-4"
        size="large"
        showSearch
        placeholder="Select Seller's Name"
        optionFilterProp="children"
        filterOption={(input, option) =>
          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }
      >
        <Option value="seller1">Seller 1</Option>
        <Option value="seller2">Seller 2</Option>
        {/* Add more seller options */}
      </Select>
    </div>
  );
};

export default Filters;
