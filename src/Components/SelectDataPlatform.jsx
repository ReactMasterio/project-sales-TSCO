import React from 'react'
import {Select} from 'antd'

const SelectDataPlatform = () => {
  return (
    <div>
      <Select
        size="large"
        defaultValue="Digikala.com"
        style={{ width: 200 }}
        onChange=""
        options={[
          { value: "digikala", label: "digikala.com" },
          { value: "torob", label: "torob.com" },
        ]}
      />
    </div>
  );
}

export default SelectDataPlatform