import React, { useState, useEffect, useRef } from "react";
import { Table, FloatButton } from "antd";
import ProductDetail from "./ProductDetail";
import axios from "axios";
import ErrorCode503 from "./ErrorCode503";
import * as XLSX from "xlsx"; // Import the xlsx library
import { FileExcelOutlined } from "@ant-design/icons";

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
    title: "عکس",
    dataIndex: "imageSource",
    key: "imageSource",
    render: (imageSource) => (
      <img src={imageSource} alt="product Image" sizes="100%" />
    ),
    width: "6%",
  },
  {
    title: "نام کالا",
    dataIndex: "productName",
    width: "15%",
  },
  {
    title: "قیمت شرکت",
    dataIndex: "companyPrice",
    width: "10%",
    render: () => (
      <p dir="rtl" className="text-center">
        {toPersianDigits(1000000)} تومان{" "}
      </p>
    ),
  },
  {
    title: "قیمت وبسایت",
    dataIndex: "productPrice",
    width: "10%",
    render: (productPrice) => (
      <p dir="rtl" className="text-center">
        {toPersianDigits(productPrice)} تومان{" "}
      </p>
    ),
  },
  {
    title: "امتیاز دیجی کالا",
    dataIndex: "rating",
    width: "5%",
  },
  {
    title: "تعداد آرا",
    dataIndex: "productVotes",
    width: "5%",
  },
  {
    title: "نظرات",
    dataIndex: "productComments",
    width: "5%",
  },
  {
    title: "صفحه کالا",
    dataIndex: "productLink",
    render: (productLink) => (
      <a href={productLink} target="_blank" rel="noopener noreferrer">
        View Product
      </a>
    ),
    width: "10%",
  },
  {
    title: "آیدی کالا",
    dataIndex: "productID",
    render: (productID) => <p>{productID}</p>,
    width: "10%",
  },
  {
    title: "گارانتی فروشنده",
    dataIndex: "productWarranty",
    width: "15%",
  },
  {
    title: "نام فروشنده",
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
const extractUniqueSellers = (data) => {
  const uniqueSellers = [...new Set(data.map((item) => item.sellerName))];
  return uniqueSellers;
};

const ResponsiveTable = ({
  searchValue,
  filters,
  onCategoryChange,
  onSellersChange,
  lastUpdate,
}) => {
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

  const exportToExcel = () => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    // Convert your table data to an array of arrays
    const dataForExcel = data.map((item) => [
      item.imageSource, // Add image source column
      item.productName,
      toPersianDigits(item.companyPrice), // Convert and add companyPrice
      toPersianDigits(item.productPrice), // Convert and add productPrice
      item.rating,
      item.productVotes,
      item.productComments,
      item.productLink,
      item.productID,
      item.productWarranty,
      item.sellerName,
    ]);

    const headers = columns.map((column) => column.title);
    // Create a worksheet with your data
    const ws = XLSX.utils.aoa_to_sheet([
      headers, // Include column headers
      ...dataForExcel,
    ]);
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    // Save the workbook as an Excel file
    XLSX.writeFile(wb, "table_data.xlsx");
  };

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

    // Cancel ongoing requests from the previous pagination
    abortControllers.forEach((controller) => {
      controller.abort();
    });

  };

  // Function to fetch initial data and set it as originalData
  const fetchInitialData = () => {
    fetch(`http://localhost:3000/api/products`)
      .then((res) => res.json())
      .then((results) => {
        if (!results || results.length === 0) {
          setInitialLoad(false); // Update initialLoad state
        } else {
          setData(results);
          setOriginalData(results);
          const uniqueCategories = extractUniqueCategories(results);
          onCategoryChange(uniqueCategories);
          const uniqueSellers = extractUniqueSellers(results);
          onSellersChange(uniqueSellers);
          //setLoading(true);
        }
      })
      .catch((error) => {
        setInitialLoad(false); // Update initialLoad state
        setLoading(false);
        console.error("Error fetching initial data:", error);
      });
  };
  useEffect(() => {
    let filteredData = originalData;

    if (searchValue.toLowerCase() !== "") {
      filteredData = originalData.filter(
        (item) =>
          item.productName.toLowerCase().includes(searchValue.toLowerCase()) ||
          item.productID.toString().includes(searchValue)
      );
    }

    if (filters.category && filters.category !== "all") {
      filteredData = filteredData.filter(
        (item) => item.productCategory === filters.category
      );
    }

    if (filters.price === "az" && filters.price !== "all") {
      const sortedData = [...filteredData].sort(
        (a, b) => a.productPrice - b.productPrice
      );
      filteredData = sortedData;
    } else if (filters.price === "za" && filters.price !== "all") {
      const sortedData = [...filteredData].sort(
        (a, b) => b.productPrice - a.productPrice
      );
      filteredData = sortedData;
    }

    if (filters.rate === "az" && filters.rate !== "all") {
      const sortedData = [...filteredData].sort((a, b) => a.rating - b.rating);
      filteredData = sortedData;
    } else if (filters.rate === "za" && filters.rate !== "all") {
      const sortedData = [...filteredData].sort((a, b) => b.rating - a.rating);
      filteredData = sortedData;
    }

    if (filters.comments === "az" && filters.comments !== "all") {
      const sortedData = [...filteredData].sort(
        (a, b) => a.productComments - b.productComments
      );
      filteredData = sortedData;
    } else if (filters.comments === "za" && filters.comments !== "all") {
      const sortedData = [...filteredData].sort(
        (a, b) => b.productComments - a.productComments
      );
      filteredData = sortedData;
    }

    if (filters.seller && filters.seller !== "all") {
      filteredData = filteredData.filter(
        (item) => item.sellerName === filters.seller
      );
    }

    setData(filteredData);
  }, [searchValue, originalData, filters]);

  useEffect(() => {
    // Fetch the initial data
    //setLoading(true);
    fetchInitialData();
  }, [JSON.stringify(tableParams.pagination), lastUpdate]);

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
        `http://localhost:3020/save-stats`,
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
      {initialLoad ? (
        <>
          <Table
            columns={columns}
            rowKey={(record) => record.productID}
            dataSource={data}
            pagination={tableParams.pagination}
            loading={loading}
            onChange={(pagination) =>
              handlePaginationChange(pagination.current, pagination.pageSize)
            }
            onRow={(record) => ({
              onClick: () => showModal(record),
            })}
          />
          <FloatButton
            type="primary"
            onClick={exportToExcel}
            tooltip={<div>دریافت اطلاعات در اکسل</div>}
          />
          <ProductDetail
            visible={modalVisible}
            onClose={hideModal}
            productID={selectedProductID}
            rowData={selectedRowData}
          />
        </>
      ) : (
        <ErrorCode503 message={"داده ای برای نمایش وجود ندارد"} />
      )}
    </div>
  );
};

export default ResponsiveTable;
