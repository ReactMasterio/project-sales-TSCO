import React, { useState, useEffect, useRef } from "react";
import qs from "qs";
import { Table } from "antd";
import axios, { CancelToken, isCancel } from "axios";
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

// Create a function to extract unique productCategory values
const extractUniqueCategories = (data) => {
  const uniqueCategories = [
    ...new Set(data.map((item) => item.productCategory)),
  ];
  return uniqueCategories;
};

const ResponsiveTable = ({ searchValue, filters, onCategoryChange }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true); // Add this state
  const [fetchedIds, setFetchedIds] = useState([]);
  const [paginationChanged, setPaginationChanged] = useState(false);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 6,
    },
  });
  let cancelTokenRef = useRef(null);
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
  const [prevPagination, setPrevPagination] = useState({
    current: 1,
    pageSize: 6,
  });
  const [initialData, setInitialData] = useState([]);

  const [changedPagination, setChangedPagination] = useState({
    current: 1,
    pageSize: 6,
  });

  // Create an AbortController and signal for each fetch request
  const [abortControllers, setAbortControllers] = useState([]);
  const [originalData, setOriginalData] = useState([]);

  const showModal = async (rowData) => {
    setSelectedRowData(rowData);
    setSelectedProductID(rowData.productID);
    console.log("OPEN");
    setModalVisible(true);
  };

  const hideModal = () => {
    setSelectedProductID(null);
    setModalVisible(false);
  };

  const cancelSource = axios.CancelToken.source();
  // Create a single AbortController and its associated signal
  const abortController = useRef(new AbortController());
  const { signal } = abortController.current;

  const fetchedStatsMap = new Map();

  const handlePaginationChange = async (current, pageSize) => {
    // Get the previous pagination values before updating
    const prevCurrent = tableParams.pagination.current;
    const prevPageSize = tableParams.pagination.pageSize;

    if (prevCurrent !== current) {
      // If it has changed, cancel any ongoing requests
      abortController.current.abort();
    }

    setLoading(false);
    setPaginationChanged(true);
    // Update the tableParams state with the new pagination
    setTableParams({
      pagination: {
        current,
        pageSize,
      },
    });

    // Store the current pagination values as the previous
    setPrevPagination({
      current: prevCurrent,
      pageSize: prevPageSize,
    });

    console.log("previous : ", prevPagination.current);
    console.log("changed To : ", current);

    // Cancel ongoing requests from the previous pagination
    abortControllers.forEach((controller) => {
      controller.abort();
    });

    // Create a new AbortController for the current request
    const newAbortController = new AbortController();
    const newSignal = newAbortController.signal;

    // Add the new AbortController to the array
    setAbortControllers([...abortControllers, newAbortController]);

    try {
      const response = await fetch(
        "http://localhost:3020/get-product-ids",
        { signal: newSignal } // Pass the signal to the fetch request
      );

      if (response.status === 200) {
        const allProductIds = await response.json();
        console.log("all the IDs from JSON : ", allProductIds);

        const currentIds = data
          .slice((current - 1) * pageSize, current * pageSize)
          .map((item) => item.productID);

        console.log("Table IDs : ", currentIds);

        const nonFetchedIds = currentIds.filter(
          (currentId) => !allProductIds.includes(currentId)
        );

        console.log("Non-Fetched IDs : ", nonFetchedIds);

        if (nonFetchedIds.length === 0) {
          // No non-fetched IDs, so skip the fetching logic
        } else {
          const updatedStatsArray = [];

          for (const currentId of nonFetchedIds) {
            if (!initialLoad || !fetchedStatsMap.has(currentId)) {
              const updatedStats = await fetchCommentsAndStats(
                currentId,
                allProductIds,
                newSignal
              );
              updatedStatsArray.push(updatedStats);
              fetchedStatsMap.set(currentId, updatedStats);
            } else {
              updatedStatsArray.push(fetchedStatsMap.get(currentId));
            }
          }

          setFetchedIds([...nonFetchedIds]);
        }
      } else {
        console.error("Failed to fetch product IDs.");
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request canceled due to new pagination.");
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch the initial data and set it as the original data
    fetchInitialData();
  }, []);

  // Function to fetch initial data and set it as originalData
  const fetchInitialData = () => {
    setLoading(true);
    fetch(
      `http://localhost:3000/api/products?${qs.stringify(
        getRandomuserParams(tableParams)
      )}`
    )
      .then((res) => res.json())
      .then((results) => {
        setData(results);
        setOriginalData(results); // Set the original data here
        // Extract unique productCategory values and pass to parent
        const uniqueCategories = extractUniqueCategories(results);
        onCategoryChange(uniqueCategories);

        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            total: results.totalCount,
          },
        });
        setLoading(false);
      });
  };
  useEffect(() => {
    // Filter the data based on the searchValue
    let filteredData = originalData;

    if (searchValue.toLowerCase() !== "") {
      filteredData = originalData.filter(
        (item) =>
          item.productName.toLowerCase().includes(searchValue.toLowerCase()) ||
          item.productID.toString().includes(searchValue)
      );
    }

    // Apply category filter if it's selected
    if (filters.category) {
      filteredData = filteredData.filter(
        (item) => item.productCategory === filters.category
      );
    }


    // Update the data state with the filtered data
    setData(filteredData);
  }, [searchValue, originalData, filters]);

  useEffect(() => {
    // Fetch the initial data
    fetchInitialData();
  }, [JSON.stringify(tableParams.pagination)]);

  useEffect(() => {
    // Define the function to fetch data and handle pagination
    const fetchDataAndHandlePaginationChange = () => {
      const { current, pageSize } = tableParams.pagination;
      const currentIds = data
        .slice((current - 1) * pageSize, current * pageSize)
        .map((item) => item.productID);

      // Check if data is loaded (non-empty) and currentIds are populated
      if (data.length > 0 && currentIds.length > 0) {
        // Manually call handlePaginationChange with initial values
        handlePaginationChange(current, pageSize);
      }
    };

    // Call fetchDataAndHandlePaginationChange after the initial data is loaded
    if (data.length > 0) {
      fetchDataAndHandlePaginationChange();
    }
  }, [data]);

  const fetchCommentsAndStats = async (
    productID,
    fetchedProductIDs,
    signal
  ) => {
    try {
      if (fetchedProductIDs.includes(productID)) {
        return null;
      }

      let commentCounts;
      const allComments = [];

      let page = 1;

      while (page <= 100) {
        if (signal.aborted) {
          return null;
        }

        const pageResponse = await fetch(
          `http://localhost:3002/api/product/${productID}/comments/?page=${page}`,
          { signal: signal }
        );

        const pageData = await pageResponse.json();
        const pageComments = (await pageData.data.comments) || [];

        commentCounts =
          page === 1
            ? (await pageData?.data?.pager?.total_items) || 0
            : commentCounts;

        for (const comment of pageComments) {
          allComments.push(comment);
        }

        page++;
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

      const postResponse = await axios.post(
        "http://localhost:3020/save-stats",
        JSON.stringify(updatedStats),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (postResponse.status === 200) {
        console.log("Stats saved successfully!");
      } else {
        console.error("Failed to save stats.");
      }

      return updatedStats;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log(`Request for productID ${productID} aborted.`);
      } else {
        console.error("Error fetching data:", error);
      }
      return null;
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
        onChange={
          (pagination) =>
            handlePaginationChange(pagination.current, pagination.pageSize) // Update this line
        }
        onRow={(record) => ({
          onClick: () => showModal(record),
        })}
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
