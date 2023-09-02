import React, { useEffect, useState } from "react";
import { Modal, Spin, Typography, Tabs, notification } from "antd";
import {
  CaretUpOutlined,
  CaretDownOutlined,
  MinusOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
const { Title, Link, Text } = Typography;
const { TabPane } = Tabs;

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

const ProductDetail = ({ visible, onClose, productID, rowData }) => {
  const [commentData, setCommentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState({});
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

  useEffect(() => {
    if (visible) {
      try {
        fetchComments();

        const newComment = {
          productID:123456879,
        };

        fetch("/save-stats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newComment),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to add comment");
            }
            return response.json();
          })
          .then((data) => {
            console.log(data.message); // This will log "Comment added successfully"
          })
          .catch((error) => {
            console.error("Error adding comment:", error);
          });

          
      } catch (error) {
        notification.error({
          message: "Error",
          description: "An error occurred while fetching comments.",
        });
      }
    }


  }, [visible]);

  const fetchComments = async () => {
    setLoading(true);

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
      setCommentStats(updatedStats);
      setCommentData(allComments);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading ? (
        <Modal
          visible={true}
          footer={null}
          centered
          closable={false}
          width={150}
          className="flex justify-center align-middle items-center"
        >
          <div>
            <LoadingOutlined className="mr-2" />
            Loading...
          </div>
        </Modal>
      ) : (
        <Modal
          visible={visible}
          onCancel={onClose}
          footer={null}
          title="Product Details"
          width="95vw"
          centered
          bodyStyle={{ maxHeight: "80vh", overflow: "auto" }}
        >
          <section className="flex">
            <div
              className="flex flex-col items-center justify-between w-[40%] p-4"
              style={{
                flexShrink: 0,
                height: "100%",
                position: "sticky",
                top: 0,
              }}
            >
              {rowData && <img src={rowData.imageSource} alt="Product" />}
            </div>

            <div className="flex flex-col items-end w-[60%] p-4 border rounded-lg">
              <div dir="rtl">
                {(rowData && <Title level={2}>{rowData.productName}</Title>) ||
                  ""}
                {(rowData && (
                  <Link
                    type="secondary"
                    href={rowData.productLink}
                    target="_blank"
                  >
                    View Product
                  </Link>
                )) ||
                  ""}
              </div>
              <div className="flex align-middle justify-center items-center gap-24 w-full my-8">
                {rowData && (
                  <div className="text-center" dir="rtl">
                    <Title type="secondary" level={3}>
                      {toPersianDigits(rowData.productPrice)} تومان
                    </Title>
                  </div>
                )}
                {rowData && (
                  <div className="text-center" dir="rtl">
                    <Title type="secondary" level={3}>
                      {toPersianDigits(rowData.productPrice)} تومان
                    </Title>
                  </div>
                )}
              </div>

              <div className="flex gap-8 w-full justify-center align-middle my-4">
                <div className="text-center inline-flex">
                  <Title level={4}>
                    Total Comments: {commentStats.commentCounts}
                  </Title>
                </div>
                <div className="text-center inline-flex">
                  <Title level={4}>
                    Recommended Count: {commentStats.recommendedCount}
                  </Title>
                </div>
                <div className="text-center inline-flex">
                  <Title level={4}>
                    Not Recommended Count: {commentStats.notRecommendedCount}
                  </Title>
                </div>
                <div className="text-center inline-flex">
                  <Title level={4}>
                    Neutral Count: {commentStats.neutralCount}
                  </Title>
                </div>
              </div>
              <div className="flex gap-8 w-full justify-center align-middle my-4">
                <div className="text-center inline-flex">
                  <Title level={4}>
                    Recommended :{" "}
                    {commentStats.recommendedPercentage.toFixed(0)}%
                  </Title>
                </div>
                <div className="text-center inline-flex">
                  <Title level={4}>
                    Not Recommended:{" "}
                    {commentStats.notRecommendedPercentage.toFixed(0)}%
                  </Title>
                  <p className="mx-2"></p>
                </div>
                <div className="text-center inline-flex">
                  <Title level={4}>
                    Neutral: {commentStats.neutralPercentage.toFixed(0)}%
                  </Title>
                </div>
              </div>

              <div className="w-full">
                <Tabs defaultActiveKey="1" centered>
                  <TabPane tab="OtherSellers" key="1">
                    <div className="p-4 max-h-[480px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {rowData &&
                        rowData.otherSellers.map((seller, index) => (
                          <div
                            key={index}
                            className="border p-4 rounded-md text-center shadow-md bg-white hover:bg-gray-100 transition-colors duration-300 m-2"
                            dir="rtl"
                          >
                            <Title level={4} className="mb-2">
                              کد: {seller.otherSellerId}
                            </Title>
                            <Title level={5} className="mb-2">
                              نام فروشنده: {seller.otherSellerName}
                            </Title>
                            <Title level={5}>
                              گارانتی: {seller.otherSellerWarranty}
                            </Title>
                            <Title level={3} dir="rtl">
                              {toPersianDigits(seller.otherSellerPrice)} تومان{" "}
                              {seller.otherSellerPrice >
                              rowData.productPrice ? (
                                <CaretUpOutlined style={{ color: "green" }} />
                              ) : seller.otherSellerPrice <
                                rowData.productPrice ? (
                                <CaretDownOutlined style={{ color: "red" }} />
                              ) : (
                                <MinusOutlined className="text-gray-400" />
                              )}
                            </Title>
                          </div>
                        ))}
                    </div>
                  </TabPane>
                  <TabPane tab="Comments" key="2">
                    <div className="p-4">
                      <div
                        className="border p-4 rounded-md shadow-md bg-white"
                        dir="rtl"
                      >
                        <Title level={2}>کامنت با بیشترین موافق</Title>
                        <Title level={4}>
                          <strong>عنوان :</strong>{" "}
                          {commentStats.mostLikedInfo.title}
                        </Title>
                        <Title level={4}>
                          <strong>نظر :</strong>{" "}
                          {commentStats.mostLikedInfo.body}
                        </Title>
                        <Title level={4}>
                          <strong>موافق:</strong>{" "}
                          {commentStats.mostLikedInfo.likes}
                        </Title>
                        <Title level={4}>
                          <strong>مخالف:</strong>{" "}
                          {commentStats.mostLikedInfo.dislikes}
                        </Title>
                      </div>
                      <div
                        className="border p-4 rounded-md shadow-md bg-white my-4"
                        dir="rtl"
                      >
                        <Title level={2}>کامنت با بیشترین مخالف</Title>
                        <Title level={5}>
                          <strong>عنوان :</strong>{" "}
                          {commentStats.mostDislikedInfo.title}
                        </Title>
                        <Title level={5}>
                          <strong>نظر :</strong>{" "}
                          {commentStats.mostDislikedInfo.body}
                        </Title>
                        <Title level={5}>
                          <strong>موافق:</strong>{" "}
                          {commentStats.mostDislikedInfo.likes}
                        </Title>
                        <Title level={5}>
                          <strong>مخالف:</strong>{" "}
                          {commentStats.mostDislikedInfo.dislikes}
                        </Title>
                      </div>
                    </div>
                  </TabPane>
                </Tabs>
              </div>
            </div>
          </section>
        </Modal>
      )}
    </>
  );
};

export default ProductDetail;
