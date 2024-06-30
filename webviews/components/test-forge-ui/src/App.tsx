import React, {useEffect, useState} from 'react';
import logo from './logo.svg';
import './App.css';
import { vscode } from "./vscode";
import SearchBar from "./components/searchBar";
import CustomParams from './components/CustomParams';

function App() {
    const [pushedTestCaseText, setPushedTestCaseText] = useState("");

    const [submitCustomParams, setsubmitCustomParams] = useState(false);

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
            }
      });
    }, [])

    return (
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
                    setsubmitCustomParams(true);
                }}
            >
                Generate tests
            </button>
            <pre>{pushedTestCaseText}</pre>
        </div>
    );
}

export default App;
