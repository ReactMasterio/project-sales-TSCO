import React from 'react'
import {Select} from 'antd'

const SelectDataPlatform = () => {
  return (
    <div>
      <Select
        size="large"
        defaultValue="دیجیکالا"
        style={{ width: 200 }}
        onChange=""
        options={[
          { value: "digikala", label: "دیجیکالا" },
          { value: "torob", label: "ترب" },
        ]}
      />
    </div>
  );
}

export default SelectDataPlatform