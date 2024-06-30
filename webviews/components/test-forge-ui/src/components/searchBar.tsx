import * as React from 'react';
import { useState, useEffect } from 'react';
import Select from "react-dropdown-select";
import { vscode } from '../vscode';

function SearchBar() {
    
    //files will of type {value: number, label: string} declare useState in typescript
    const [files, setFiles] = useState<{value: number, label: string}[]>([]);

    const [values, setValues] = useState<{value: number, label: string}[]>([]);
    

    useEffect(() => {
        window.addEventListener("message", (event) => {
            // console.log("Recieved files");
            // console.log(event);
            const message = event.data;
            switch (message.type) {
                case "FilesInFolders": {
                    console.log("Recieved files");
                    console.log(message.value);
                    setFiles([]);
                    console.log(files);
                    message.value.forEach((file: string, idx: number) => {
                        setFiles(prevState => [...prevState, {value: idx, label: file}]);
                    });
                    console.log("Files: ", files);
                    break;
                }
                case "sendContextFileData": {
                    // select the button with id sendFilesForContext and click it
                    document.getElementById('sendFilesForContext').click();
                    break;
                }
            }
        });
    }, []);

    return (
        <>
        <h3>
            Search and input files for context
        </h3>
        <hr />
        <Select
            options={files}
            onChange={(values) => {console.log(values);
                setValues(values);
            }}
            searchable={true}
            multi={true}
            dropdownHeight="150px"
            clearable={true}
            style={{
                width: "300px",
                margin: "1rem auto",
            }}
        />
        <button
            id='sendFilesForContext'
            onClick={() => {
                vscode.postMessage({
                    type: "gotContextFileData",
                    value: values,
                });
            }}
        >
            Send files for context
        </button>
        <hr />
        </>
    );
}

export default SearchBar;
