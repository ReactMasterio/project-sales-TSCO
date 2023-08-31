import React, { useState, useEffect } from "react";
import qs from "qs";
import { Table } from "antd";
import ProductDetail from "./ProductDetail";

const toPersianDigits = (input) => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const inputString = String(input);
  let formattedString = "";
  let groupCounter = 0;

  for (let i = inputString.length - 1; i >= 0; i--) {
    if (groupCounter === 3) {
      formattedString = "," + formattedString;
      groupCounter = 0;
    }
    formattedString = persianDigits[inputString[i]] + formattedString;
    groupCounter++;
  }

  return formattedString;
};

const columns = [
  {
    title: "image",
    dataIndex: "imageSource",
    key: "imageSource",
    render: (imageSource) => (
      <img src={imageSource} alt="product Image" sizes="100%" />
    ),
    width: "6%",
  },
  {
    title: "Product Name",
    dataIndex: "productName",
    sorter: true,
    width: "25%",
  },
  {
    title: "Company Price",
    dataIndex: "",
    sorter: true,
    width: "10%",
    render: () => <p dir="rtl" className="text-center">{toPersianDigits(1000000)} تومان </p>,
  },
  {
    title: "Website Price",
    dataIndex: "productPrice",
    sorter: true,
    width: "10%",
    render: (productPrice) => <p dir="rtl" className="text-center">{toPersianDigits(productPrice)} تومان </p>,
  },
  {
    title: "Rating",
    dataIndex: "rating",
    sorter: true,
    width: "5%",
  },
  {
    title: "Votes",
    dataIndex: "productVotes",
    sorter: true,
    width: "5%",
  },
  {
    title: "Comments",
    dataIndex: "productComments",
    sorter: true,
    width: "5%",
  },
  {
    title: "Product Link",
    dataIndex: "productLink",
    render: (productLink) => (
      <a href={productLink} target="_blank" rel="noopener noreferrer">
        View Product
      </a>
    ),
    width: "10%",
  },
  {
    title: "Product ID",
    dataIndex: "productID",
    render: (productID) => <a>{`DKP-${productID}`}</a>,
    width: "10%",
  },
  {
    title: "Seller Warranty",
    dataIndex: "productWarranty",
    width: "15%",
  },
  {
    title: "Seller Name",
    dataIndex: "sellerName",
    width: "15%",
  },
];

const getRandomuserParams = (params) => ({
  results: params.pagination?.pageSize,
  page: params.pagination?.current,
  ...params,
});

const ResponsiveTable = () => {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 6,
    },
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProductID, setSelectedProductID] = useState(null);
  const [selectedRowData, setSelectedRowData] = useState(null); 

  const showModal = (rowData) => {
    setSelectedRowData(rowData); // Store the selected row data
    setSelectedProductID(rowData.productID); // Also store the selected product ID
    setModalVisible(true);
  };

  const hideModal = () => {
    setSelectedProductID(null);
    setModalVisible(false);
  };

  const fetchData = () => {
    setLoading(true);
    fetch(
      `http://localhost:3000/api/products?${qs.stringify(
        getRandomuserParams(tableParams)
      )}`
    )
      .then((res) => res.json())
      .then((results) => {
        setData(results);
        setLoading(false);
        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            total: results.totalCount, // Update with the actual total count from your data
          },
        });
      });
  };

  useEffect(() => {
    fetchData();
  }, [JSON.stringify(tableParams)]);

  const handleTableChange = (pagination, _, sorter) => {
    setTableParams({
      pagination,
      ...sorter,
    });

    // Reset data since page size or sorting has changed
    setData([]);
  };

  return (
    <div className="w-full">
      <Table
        columns={columns}
        rowKey={(record) => record.productID}
        dataSource={data}
        pagination={tableParams.pagination}
        loading={loading}
        onChange={handleTableChange}
        onRow={(record) => ({
          onClick: () => showModal(record),
        })}
      />
      <ProductDetail
        visible={modalVisible}
        onClose={hideModal}
        productID={selectedProductID}
        rowData={selectedRowData} // Pass the selected row data to the modal
      />
    </div>
  );
};

export default ResponsiveTable;
