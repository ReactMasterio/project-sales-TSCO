import React, { useEffect, useState } from "react";
import SelectDataPlatform from "./SelectDataPlatform";
import Search from "./Search";
import Filters from "./Filters";
import ResponsiveTable from "./ResponsiveTable";
import { Button, notification } from "antd";
import axios from "axios";
import Updating from "./Updating";

const Main = () => {
  const [searchValue, setSearchValue] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({}); // State to store selected filters
  const [categories, setCategories] = useState([]); // State to store unique categories
  const [sellers, setSellers] = useState([]); // State to store unique categories
  const [resetFilters, setResetFilters] = useState(false);
  const [resetSellers, setResetSellers] = useState(false); // Add this state variable
  const [resetCategories, setResetCategories] = useState(false); // Add this state variable

  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [updateMessage, setUpdateMessage] = useState(""); // State to store the update message
  const [lastUpdate, setLastUpdate] = useState(null);
  const [notificationShown, setNotificationShown] = useState(false);

  const showUpdateNotification = (lastUpdateValue) => {
    notification.info({
      message: "اطلاعات بروزرسانی شده اند.",
      description: `اطلاعات این صفحه بروز شده است. آخرین آپدیت ${lastUpdateValue}`,
      duration: 5, // Duration in seconds for the notification to be visible
    });
  };

  useEffect(() => {
    const fetchIsUpdateMode = async () => {
      try {
        const response = await axios.get(
          `http://${process.env.REACT_APP_SERVER_ADDRESS}:3003/api/is-update-mode`
        );
        const isUpdateModeValue = response.data.isUpdateMode;
        setIsUpdateMode(isUpdateModeValue);

        const lastUpdateResponse = await axios.get(
          `http://${process.env.REACT_APP_SERVER_ADDRESS}:3004/api/is-server-config`
        );
        const lastUpdateValue = lastUpdateResponse.data.lastUpdateValue;

        if (lastUpdateValue !== null && lastUpdateValue !== lastUpdate) {
          // If lastUpdateValue has changed, show the notification
          console.log(
            "lastUpdateValue : ",
            lastUpdateValue,
            "lastValue : ",
            lastUpdate
          );
          showUpdateNotification(lastUpdateValue);
        } else {
          console.log("lastUpdateValue : ", lastUpdateValue);
        }

        setLastUpdate(lastUpdateValue);
      } catch (error) {
        console.error("Error while getting update mode:", error);
      }
    };

    const pollingInterval = 10000;
    const intervalId = setInterval(fetchIsUpdateMode, pollingInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [lastUpdate]);

  useEffect(() => {
    const fetchInitialLastUpdate = async () => {
      try {
        const lastUpdateResponse = await axios.get(
          `http://${process.env.REACT_APP_SERVER_ADDRESS}:3004/api/is-server-config`
        );
        const lastUpdateValue = lastUpdateResponse.data.lastUpdateValue;
        setLastUpdate(lastUpdateValue);
      } catch (error) {
        console.error("Error while fetching initial lastUpdate:", error);
      }
    };

    fetchInitialLastUpdate(); // Fetch initial lastUpdate when the component mounts
  }, []); // Empty dependency array ensures this runs only once


  const handleCategoryChange = (uniqueCategories) => {
    setCategories(uniqueCategories);
  };

  const handleSellersChange = (uniqueSellers) => {
    setSellers(uniqueSellers);
  };
  // Function to handle filter changes
  const handleFilterChange = (filters) => {
    setSelectedFilters({ ...selectedFilters, ...filters });
  };

  const handleClearFilters = () => {
    setResetFilters(true);
    setResetSellers(true);
    setResetCategories(true);
    setSelectedFilters({});
  };

  return (
    <div className="w-full mx-auto mt-8">
      <div className="flex flex-col items-center space-y-4 ">
        <div className="w-full h-full flex justify-center items-center">
          <SelectDataPlatform />
        </div>
        <div className="w-fullflex justify-center items-center ">
          <div className="">
            <Filters
              categories={categories}
              onFilterChange={handleFilterChange}
              sellers={sellers}
              resetFilters={resetFilters} // Pass resetFilters prop
              resetSellers={resetSellers} // Pass resetSellers prop
              resetCategories={resetCategories} // Pass resetCategories prop
              onClearFilters={handleClearFilters} //
            />
          </div>
        </div>
        <div className="w-full flex justify-center items-center">
          <Search onSearch={(value) => setSearchValue(value)} />
          <Button
            className="mx-6"
            size="large"
            type="dashed"
            onClick={handleClearFilters}
          >
            برداشتن فیلتر
          </Button>
        </div>
        <div className="w-full">
          {lastUpdate && (
            <p className="mx-4 text-gray-400">آخرین آپدیت ساعت {lastUpdate}</p>
          )}
          <div className="bg-gray-50 p-4">
            {!isUpdateMode ? (
              <ResponsiveTable
                searchValue={searchValue}
                filters={selectedFilters}
                onCategoryChange={handleCategoryChange}
                onSellersChange={handleSellersChange}
                lastUpdate={lastUpdate}
              />
            ) : (
              <Updating message={"وبسایت درحال دریافت اطلاعات است"} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;
