import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { vscode } from "../vscode";
import State from "../state.mjs";

const CustomParams = ({ submitCustomParams, setsubmitCustomParams }) => {
    const [showForm, setShowForm] = useState(true);
    const [loading, setLoading] = useState(false);
    const [methods, setMethods] = useState([]);
    const [schema, setschema] = useState([]);
    const [formValues, setFormValues] = useState([]);
    const {gState, setGState} = useContext(State)

    function convertArrayToObject(arr) {
        const result = {};

        arr.forEach((item) => {
            result[item.name] = item.value;
        });

        return result;
    }

    useEffect(() => {
        window.addEventListener("message", (event) => {
            const message = event.data;
            switch (message.type) {
                case "customParamsUpdated": {
                    console.log("custom params updated");
                    console.log(message.value);
                    for (let i = 0; i < message.value.length; i++) {
                        console.log(message.value[i].methodName);
                        setMethods((prevState) => [
                            ...prevState,
                            message.value[i].methodName,
                        ]);
                        setschema((prevState) => [
                            ...prevState,
                            {
                                parameters: message.value[i].parameters,
                                returnType: message.value[i].returnType,
                            },
                        ]);
                    }
                    console.log("methods: ", methods);
                    console.log("schema: ", schema);
                    break;
                }
                default: {
                    break;
                }
            }
        });
    }, []);

    useEffect(() => {
        const customPropsRequest = [];
        for (let i = 0; i < methods.length; i++) {
            const methodName = methods[i];
            for (let j = 0; j < formValues[i].testCases.length; j++) {
                customPropsRequest.push({
                    functionName: methodName,
                    params: convertArrayToObject(
                        formValues[i].testCases[j].parameters
                    ),
                    returns: formValues[i].testCases[j].returnType.value,
                });
            }
        }
        setGState(p => ({...p, customPropsRequest: customPropsRequest}));
    }, [formValues]);

    useEffect(() => {
        console.log("Methods values: ", methods);
        //set form values to the size of methods array with empty testcases
        const size = methods.length;
        console.log("size: ", size);
        setFormValues((prevState) => [
            ...prevState,
            ...Array(size - prevState.length).fill({ testCases: [] }),
        ]);
    }, [methods]);

    const getCustomParams = () => {
        setLoading(true);
        setShowForm(true);
        // create a get request from axios to localhost:3000
        vscode.postMessage({ type: "fetchCustomParams" });
        setLoading(false);
    };

    const renderInputFields = () => {
        return formValues.map((testCases, idx) => {
            return (
                <div>
                    <h3>Function Name: {methods[idx]}</h3>
                    <h4>Test Cases: </h4>
                    {testCases.testCases.map((testCase, testCaseIdx) => {
                        return (
                            <div>
                                <p> Test Case: {testCaseIdx + 1}</p>
                                <p> Parameters: </p>
                                {testCase.parameters.map((parameter) => {
                                    return (
                                        <div>
                                            <p> {parameter.name}: </p>
                                            <input
                                                value={parameter.value}
                                                onChange={(e) => {
                                                    setFormValues(
                                                        formValues.map(
                                                            (testCases, id) => {
                                                                if (
                                                                    idx === id
                                                                ) {
                                                                    return {
                                                                        testCases:
                                                                            testCases.testCases.map(
                                                                                (
                                                                                    tempTestCase,
                                                                                    tempTestCaseIdx
                                                                                ) => {
                                                                                    if (
                                                                                        testCaseIdx ===
                                                                                        tempTestCaseIdx
                                                                                    ) {
                                                                                        return {
                                                                                            ...tempTestCase,
                                                                                            parameters:
                                                                                                tempTestCase.parameters.map(
                                                                                                    (
                                                                                                        tempParameter
                                                                                                    ) => {
                                                                                                        if (
                                                                                                            parameter.name ===
                                                                                                            tempParameter.name
                                                                                                        ) {
                                                                                                            return {
                                                                                                                ...tempParameter,
                                                                                                                value: e
                                                                                                                    .target
                                                                                                                    .value,
                                                                                                            };
                                                                                                        }
                                                                                                        return tempParameter;
                                                                                                    }
                                                                                                ),
                                                                                        };
                                                                                    }
                                                                                    return tempTestCase;
                                                                                }
                                                                            ),
                                                                    };
                                                                }
                                                                return testCases;
                                                            }
                                                        )
                                                    );
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                                <p> Return Type: {testCase.returnType.type}</p>
                                <input
                                    value={testCase.returnType.value}
                                    onChange={(e) => {
                                        setFormValues(
                                            formValues.map((testCases, id) => {
                                                if (idx === id) {
                                                    return {
                                                        ...testCases,
                                                        testCases:
                                                            testCases.testCases.map(
                                                                (
                                                                    tempTestCase,
                                                                    tempTestCaseIdx
                                                                ) => {
                                                                    if (
                                                                        testCaseIdx ===
                                                                        tempTestCaseIdx
                                                                    ) {
                                                                        return {
                                                                            ...tempTestCase,
                                                                            returnType:
                                                                                {
                                                                                    ...tempTestCase.returnType,
                                                                                    value: e
                                                                                        .target
                                                                                        .value,
                                                                                },
                                                                        };
                                                                    }
                                                                    return tempTestCase;
                                                                }
                                                            ),
                                                    };
                                                }
                                                return testCases;
                                            })
                                        );
                                    }}
                                />
                                <br />
                                <button
                                    onClick={() => {
                                        // delete a test case
                                        setFormValues(
                                            formValues.map((testCases, id) => {
                                                if (idx === id) {
                                                    return {
                                                        ...testCases,
                                                        testCases: [
                                                            ...testCases.testCases.slice(
                                                                0,
                                                                testCaseIdx
                                                            ),
                                                            ...testCases.testCases.slice(
                                                                testCaseIdx + 1
                                                            ),
                                                        ],
                                                    };
                                                }
                                                return testCases;
                                            })
                                        );
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        );
                    })}
                    <div>
                        <hr />
                        <p
                            onClick={() => {
                                // add a new test case
                                setFormValues(
                                    formValues.map((testCases, id) => {
                                        if (idx === id) {
                                            return {
                                                ...testCases,
                                                testCases: [
                                                    ...testCases.testCases,
                                                    schema[idx],
                                                ],
                                            };
                                        }
                                        return testCases;
                                    })
                                );
                            }}
                        >
                            +
                        </p>
                    </div>
                </div>
            );
        });
    };

    return (
        <>
            {showForm ? (
                loading ? (
                    <p>Loading...</p>
                ) : (
                    <div>
                        <button
                            onClick={() => {
                                getCustomParams();
                            }}
                        >
                            Show Custom Params
                        </button>
                        <h3>Input custom parameters</h3>
                        <hr />
                        {renderInputFields()}
                        <hr />
                    </div>
                )
            ) : (
                <button
                    onClick={() => {
                        getCustomParams();
                    }}
                >
                    Show Custom Params
                </button>
            )}
        </>
    );
};

export default CustomParams;
