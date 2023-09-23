import React, { useState, useEffect } from "react";
import { Input } from "antd";

const Search = ({ onSearch }) => {
  const [searchValue, setSearchValue] = useState("");

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
  };

  const handleKeyUp = (event) => {
    setSearchValue(event.target.value);
    onSearch(searchValue)
    //console.log(searchValue);
  };
  useEffect(() => {
    // Update the data here
  }, [searchValue]);

  return (
    <div>
      <form>
        <Input
          style={{ width: 500 }}
          size="large"
          placeholder="Search by Name or ID"
          value={searchValue}
          onChange={handleSearchChange}
          onKeyUp={handleKeyUp}
        />
      </form>
    </div>
  );
};

export default Search;
