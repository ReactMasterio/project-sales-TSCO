import React, { useState, useEffect } from "react";
import qs from "qs";
import { Table } from "antd";
import axios from "axios";
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
    dataIndex: "companyPrice",
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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchedIds, setFetchedIds] = useState([]);

  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 6,
    },
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProductID, setSelectedProductID] = useState(null);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [commentStats, setCommentStats] = useState({
    commentCounts: 0,
    recommendedCount: 0,
    notRecommendedCount: 0,
    neutralCount: 0,
    totalLikes: 0,
    totalDislikes: 0,
    recommendedPercentage: 0,
    notRecommendedPercentage: 0,
    neutralPercentage: 0,
    mostLikedInfo: {},
    mostDislikedInfo: {},
  });

  const showModal = async (rowData) => {
    setSelectedRowData(rowData);
    setSelectedProductID(rowData.productID);
    setModalVisible(true);
  };

  const hideModal = () => {
    setSelectedProductID(null);
    setModalVisible(false);
  };

  const handlePaginationChange = async (current, pageSize) => {
    setLoading(true);
    try {
      // Use Axios to send a GET request
      const response = await axios.get("http://localhost:3020/get-product-ids");

      if (response.status === 200) {
        const allProductIds = response.data;

        const currentIds = data
          .slice((current - 1) * pageSize, current * pageSize)
          .map((item) => item.productID);

        const nonFetchedIds = currentIds.filter((currentId) => {
          return !allProductIds.includes(currentId);
        });

        if (nonFetchedIds.length > 0) {
          const updatedStatsArray = await Promise.all(
            nonFetchedIds.map((currentId) => fetchCommentsAndStats(currentId))
          );

          setFetchedIds([...nonFetchedIds]);

          for (const updatedStats of updatedStatsArray) {
            console.log(updatedStats);
            // Use Axios to send a POST request
            const postResponse = await axios.post(
              "http://localhost:3020/save-stats",
              JSON.stringify(updatedStats),
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );
            console.log(postResponse);

            if (postResponse.status === 200) {
              console.log("Stats saved successfully!");
            } else {
              console.error("Failed to save stats.");
            }
          }
        }
      } else {
        console.error("Failed to fetch product IDs.");
      }
    } catch (error) {
      console.error("Error saving stats:", error);
    } finally {
      setLoading(false);
    }

    setTableParams({
      pagination: {
        current,
        pageSize,
      },
    });
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
        setData(results); // This line replaces the existing data with new data
        setLoading(false);
        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            total: results.totalCount,
          },
        });
      });
  };

  useEffect(() => {
    fetchData(); // Call handleTableChange with the initial pagination
    handlePaginationChange(
      tableParams.pagination.current,
      tableParams.pagination.pageSize
    );
  }, [JSON.stringify(tableParams)]);

  const fetchCommentsAndStats = async (productID) => {
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

  const handleTableChange = async (pagination, _, sorter) => {
    setLoading(true);
    setTableParams({
      pagination,
      ...sorter,
    });
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
        onPaginationChange={handlePaginationChange}
      />
      <ProductDetail
        visible={modalVisible}
        onClose={hideModal}
        productID={selectedProductID}
        rowData={selectedRowData}
      />
    </div>
  );
};

export default ResponsiveTable;
