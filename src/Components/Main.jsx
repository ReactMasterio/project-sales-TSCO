import React, { useEffect, useState } from "react";
import SelectDataPlatform from "./SelectDataPlatform";
import Search from "./Search";
import Filters from "./Filters";
import ResponsiveTable from "./ResponsiveTable";
import { Button } from "antd";
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

  const [isWebsiteUpdating, setIsWebsiteUpdating] = useState(false);

  const handleUpdateState = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3003/api/is-update-mode"
      );
      const isUpdateModeValue = response.data.isUpdateMode;

      setIsWebsiteUpdating(isUpdateModeValue); // Set the value in state
    } catch (error) {
      // Handle any errors that occur during the GET request
      console.error("Error while getting update mode:", error);
    }
  };

  useEffect(() => {
    handleUpdateState();

    // Use setInterval to periodically fetch the update mode status (every minute)
    const updateInterval = setInterval(() => {
      handleUpdateState();
    }, 1 * 60 * 1000); // 60000 milliseconds = 1 minute

    // Clean up the interval when the component unmounts
    return () => {
      clearInterval(updateInterval);
    };
  }, []);


  console.log(categories);
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
    setResetFilters(true); // Set resetFilters to true
    setResetSellers(true); // Set resetSellers to true
    setResetCategories(true); // Set resetCategories to true
    setSelectedFilters({}); // Clear selectedFilters
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
          <div className="bg-gray-50 p-4">
            {!isWebsiteUpdating ? (
              <ResponsiveTable
              searchValue={searchValue}
              filters={selectedFilters}
              onCategoryChange={handleCategoryChange}
              onSellersChange={handleSellersChange}
            />
            ) : (
              <Updating message={"وبسایت درحال دریافت اطلاعات است"}/>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;
