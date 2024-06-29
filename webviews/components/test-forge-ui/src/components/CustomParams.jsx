import React, { useState } from 'react';

const testParams = {
  func1: {
    numberOfItems: "int",
    username: "String",
  },
  func2: {
    username: "String",
    password: "String",
  },
};

const CustomParams = () => {
  const [formValues, setFormValues] = useState({});

  const handleInputChange = (func, param, value) => {
    setFormValues((prevValues) => ({
      ...prevValues,
      [func]: {
        ...prevValues[func],
        [param]: value,
      },
    }));
  };

  const renderInputFields = () => {
    return Object.entries(testParams).map(([func, params]) => (
      <div key={func}>
        <h4>{func}</h4>
        {Object.entries(params).map(([param, type]) => (
          <div key={param}
          style={{marginTop: '5px'}}
          >
            <label
            style={{
              display: "flex"
            }}
            >
              {param} ({type}):
              <input
                type={type === "int" ? "number" : "text"}
                value={formValues[func]?.[param] || ""}
                onChange={(e) => handleInputChange(func, param, e.target.value)}
                style={{ marginLeft: 'auto', outline: 'none', border: 'none', padding: '2px'}}
                placeholder={param}
              />
            </label>
          </div>
        ))}
      </div>
    ));
  };

  return (
    <div>
      <h3>Input custom parameters</h3>
      <hr />
      {renderInputFields()}
      <hr />
    </div>
  );
};

export default CustomParams;
