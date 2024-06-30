import React, {useEffect, useState, useContext} from 'react';
import logo from './logo.svg';
import './App.css';
import { vscode } from "./vscode";
import SearchBar from "./components/searchBar";
import CustomParams from './components/CustomParams';
import State from './state.mjs';

function App() {
    const [pushedTestCaseText, setPushedTestCaseText] = useState("");

    const [submitCustomParams, setsubmitCustomParams] = useState(false);
    const [gState, setGState] = useState();

    useEffect(() => {
      window.addEventListener("message", (event) => {
        // console.log("Got message");
        // console.log(event);
            const message = event.data;
            switch (message.type) {
                case "pushedTestCaseText": {
                    setPushedTestCaseText(message.value);
                    break;
                }
                default:
                    break;
            }
      });
    }, [])

    return (
        <State.Provider value={{gState, setGState}}>
        <div className="bg-gradient-to-r from-blue-600 to-purple-500 p-10">
            <h1>TestForge</h1>
            <CustomParams
                submitCustomParams={submitCustomParams}
                setsubmitCustomParams={setsubmitCustomParams}
            />
            <SearchBar />
            <button
                onClick={() => {
                    // vscode.postMessage({
                    //     type: "onFetchText",
                    //     value: "",
                    // });
                    // vscode.postMessage({
                    //     type: "addCustomParams",
                    //     value: "",
                    // });
                    console.log("gstate", gState);
                    vscode.postMessage({
                        type: "generateTests",
                        value: gState,
                    })
                    // setsubmitCustomParams(true);
                }}
            >
                Generate tests
            </button>
            <pre>{pushedTestCaseText}</pre>
        </div>
        </State.Provider>
    );
}

export default App;
