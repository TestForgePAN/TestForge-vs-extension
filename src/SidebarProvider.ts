import * as vscode from "vscode";
import axios, { all } from "axios";
import * as fs from "fs";
import * as path from "path";

export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;
    fileList: string[] = [];

    constructor(private readonly _extensionUri: vscode.Uri) { }
    public getFilesInDirectory(dir: string) {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                if(file === ".git") { return; }
                this.getFilesInDirectory(filePath);
            } else {
                this.fileList.push(filePath);
            }
        });
    }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        console.log("Workspace folders: ", vscode.workspace.workspaceFolders);
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showInformationMessage(
                "No folder or workspace is currently opened."
            );
            return;
        }

        let allFiles: string[] = [];

        const generateTestReq = {
            customParams: [],
            files: [],
        };

        for (const folder of workspaceFolders) {
            const folderPath = folder.uri.fsPath;
            this.getFilesInDirectory(folderPath);
            allFiles = allFiles.concat(this.fileList);
        }

        if (allFiles.length === 0) {
            vscode.window.showInformationMessage(
                "No files found in the opened folders."
            );
        } else {
            vscode.window.showInformationMessage(
                "Files in opened folders:\n" + allFiles.join("\n")
            );
            //for each element in allFiles split by '/' and add the last element to fileNames array
            const fileNames = allFiles.map((path) => path.split("/").pop());
            console.log("Files in opened folders:", fileNames);

            //send fileNames to webview
            webviewView.webview.postMessage({
                type: "FilesInFolders",
                value: fileNames,
            });
        }

        // Listen for messages from the Sidebar component and execute action
        webviewView.webview.onDidReceiveMessage(async (data) => {
            console.log("Recieved message: ", data);
            
            switch (data.type) {
                case "onFetchText": {
                    let editor = vscode.window.activeTextEditor;

                    if (editor === undefined) {
                        vscode.window.showErrorMessage("No active text editor");
                        return;
                    }

                    let text = editor.document.getText(editor.selection);
                    // console.log("Editor doc", editor.document.getText());
                    await axios({
                        url: "http://localhost:3000/generate-tests",
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json;charset=UTF-8",
                        },
                        data: {
                            text: editor.document.getText(),
                        },
                    }).then((response) => {
                        console.log("response", response.data);
                        this._view?.webview.postMessage({
                            type: "pushedTestCaseText",
                            value: response.data,
                        });
                    });
                    // send message back to the sidebar component
                    this._view?.webview.postMessage({
                        type: "onSelectedText",
                        value: text,
                    });
                    console.log("Sent the message");
                    break;
                }
                case "sendFilesForContext": {
                    console.log("All files", allFiles);
                    console.log("Sending files for context");
                    const fileContentData: string[] = [];
                    for (const file of data.value) {
                        console.log("File: ", file);
                        console.log("File path: ", allFiles[file.value]);
                        // Read the file at the specified path
                        const filePath = allFiles[file.value];
                        const fileContent = fs.readFileSync(filePath, "utf8");
                        console.log("File content: ", fileContent);
                        // Add the file content to the array
                        fileContentData.push(fileContent);
                        // Send the file content to the webview
                    }
                    await axios({
                        url: "http://localhost:3000/sendContextFiles",
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json;charset=UTF-8",
                        },
                        data: {
                            files: fileContentData,
                        },
                    }).then((response) => {
                        console.log("response", response.data);
                        this._view?.webview.postMessage({
                            type: "pushedTestCaseText",
                            value: response.data,
                        });
                    });
                    break;
                }
                case "fetchCustomParams": {
                    let editor = vscode.window.activeTextEditor;

                    if (editor === undefined) {
                        vscode.window.showErrorMessage("No active text editor");
                        return;
                    }
                    const openedFileName = editor.document.fileName;
                    const openedFileContent = editor.document.getText();
                    axios({
                        url: "http://localhost:3000/getParams",
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json;charset=UTF-8",
                        },
                        data: {
                            name: openedFileName,
                            fileContent: openedFileContent,
                        },
                    })
                        .then((response) => {
                            console.log("response", response.data);
                            this._view?.webview.postMessage({
                                type: "customParamsUpdated",
                                value: response.data,
                            });
                        })
                        .catch((error) => {
                            console.error(error);
                        });

                    break;
                }
                case "pushCustomParams": {
                    const customParams = data.value;
                    generateTestReq.customParams = customParams;
                    console.log("customParams", customParams);
                    this._view?.webview.postMessage({
                        type: "sendContextFileData",
                        value: "",
                    });
                    break;
                }
                case "gotContextFileData": {
                    const files = [];
                    for (const file of data.value) {
                        console.log("File: ", file);
                        console.log("File path: ", allFiles[file.value]);
                        // Read the file at the specified path
                        const filePath = allFiles[file.value];
                        const fileName = file.label;
                        const fileContent = fs.readFileSync(filePath, "utf8");
                        console.log("File content: ", fileContent);
                        // Add the file content to the array
                        files.push({
                            fileName: fileName,
                            content: fileContent,
                            contextFile: "true",
                        });
                        // Send the file content to the webview
                    }
                    let editor = vscode.window.activeTextEditor;

                    if (editor === undefined) {
                        vscode.window.showErrorMessage("No active text editor");
                        return;
                    }

                    const fileName = editor.document.fileName.split("/").pop();
                    const fileContent = editor.document.getText();
                    files.push({
                        fileName: fileName,
                        content: fileContent,
                        contextFile: "false",
                    });
                    generateTestReq.files = files;
                    console.log("Sending axios request generateTestReq", generateTestReq);
                    axios({
                        url: "http://localhost:3000/generate-tests",
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json;charset=UTF-8",
                        },
                        data: generateTestReq,
                    }).then((response) => {
                        console.log("response", response.data);
                        this._view?.webview.postMessage({
                            type: "pushedTestCaseText",
                            value: response.data,
                        });
                    });
                    break;
                }
                case "onInfo": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showInformationMessage(data.value);
                    break;
                }
                case "onError": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showErrorMessage(data.value);
                    break;
                }
            }
        });

    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
        );
        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
        );
        // const scriptUri = webview.asWebviewUri(
        //     vscode.Uri.joinPath(this._extensionUri, "out/compiled/sidebar.js")
        let scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this._extensionUri,
                "webviews",
                "components",
                "test-forge-ui",
                "dist",
                "index.js"
            )
        );
        // const scriptUri = webview.asWebviewUri(
        //     vscode.Uri.joinPath(this._extensionUri, "frontend/dist/App.js")
        // );
        const styleMainUri = "";
        // const styleMainUri = webview.asWebviewUri(
        //     Uri.joinPath(this._extensionUri, "media", "sidebar.css")
        // );

        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce();

        return `<!DOCTYPE html>
			<html lang="en">
          <head>
				<meta charset="UTF-8" />
                <!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
          <body>
            <noscript>You need to enable JavaScript to run this app.</noscript>
            <div id="root"></div>
            <script nonce="${nonce}"  src="${scriptUri}"></script>
          </body>
        </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}