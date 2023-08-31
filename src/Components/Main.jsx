import React, { useState } from "react";
import SelectDataPlatform from "./SelectDataPlatform";
import Search from "./Search";
import Filters from "./Filters";
import ResponsiveTable from "./ResponsiveTable";

const Main = () => {
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="w-10/12 mx-auto mt-8">
      <div className="flex flex-col items-center space-y-4 ">
        <div className="w-full h-full flex justify-center items-center">
          <SelectDataPlatform />
        </div>
        <div className="w-fullflex justify-center items-center ">
          <div className="">
            <Filters />
          </div>
        </div>
        <div className="w-full flex justify-center items-center">
          <Search onSearch={(value) => setSearchValue(value)} />
        </div>
        <div className="w-full">
          <div className="bg-gray-50 p-4">
            <ResponsiveTable />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;
