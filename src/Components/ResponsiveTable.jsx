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
    render: () => (
      <p dir="rtl" className="text-center">
        {toPersianDigits(1000000)} تومان{" "}
      </p>
    ),
  },
  {
    title: "Website Price",
    dataIndex: "productPrice",
    sorter: true,
    width: "10%",
    render: (productPrice) => (
      <p dir="rtl" className="text-center">
        {toPersianDigits(productPrice)} تومان{" "}
      </p>
    ),
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
    render: (productID) => <a>{productID}</a>,
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
      pageSize: 2,
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

  const handlePaginationChange = (current, pageSize) => {
    // Update the pagination object with the new page and page size
    const newPagination = {
      current,
      pageSize,
    };

    // Use a callback function to log the updated value after the state has been updated
    setTableParams((prevTableParams) => {
      console.log(newPagination); // Log the updated value
      return {
        ...prevTableParams,
        pagination: newPagination,
      };
    });

    // Reset data since pagination has changed
    setData([]);

    // Fetch data with the new pagination settings
    fetchData();
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

const handleTableChange = async (pagination, _, sorter) => {
  // Log the current page
  console.log("Current Page:", pagination.current);

  // Update the table with loading state
  setLoading(true);

  try {
    // Fetch comments for all the IDs on the current page
    const currentIds = data
      .slice(
        (pagination.current - 1) * pagination.pageSize,
        pagination.current * pagination.pageSize
      )
      .map((item) => item.productID);

    const updatedStatsArray = [];

    // Loop through the IDs and fetch comments for each one
    for (const id of currentIds) {
      const updatedStats = await fetchComments(id);

      if (updatedStats) {
        updatedStatsArray.push(updatedStats);
      }
    }

    // Send the updatedStatsArray to your server using a POST request
    const response = await fetch("http://localhost:3020/save-stats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedStatsArray),
    });

    if (response.status === 200) {
      console.log("Stats saved successfully!");
    } else {
      console.error("Failed to save stats.");
    }
  } catch (error) {
    console.error("Error saving stats:", error);
  } finally {
    // Reset loading state
    setLoading(false);

    // Reset data since page size or sorting has changed
    setData([]);

    // Update the table parameters
    setTableParams({
      pagination,
      ...sorter,
    });
  }
};


  const fetchComments = async (productID) => {
    try {
      const response = await fetch(
        `http://localhost:3002/api/product/${productID}/comments?page=1`
      );
      const data = await response.json();

      const totalPages = data?.data?.pager?.total_pages || 0;
      const currentPage = data?.data?.pager?.current_page || 1;
      const commentCounts = data?.data?.pager?.total_items || 0;
      const allComments = [];

      for (let page = currentPage; page <= totalPages; page++) {
        if (page >= 100) {
          break;
        }
        const pageResponse = await fetch(
          `http://localhost:3002/api/product/${productID}/comments/?page=${page}`
        );
        const pageData = await pageResponse.json();
        const pageComments = pageData.data.comments;

        for (const comment of pageComments) {
          allComments.push(comment);
        }
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
      let notRecommendedPercentage =
        (notRecommendedCount / commentCounts) * 100;

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
      return updatedStats;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
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
        onPaginationChange={handlePaginationChange} // Add this line
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
