import * as vscode from 'vscode';

export class SidebarViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'codeaidapter.sidebarView';
    private _view?: vscode.WebviewView;

    constructor(private readonly context: vscode.ExtensionContext) {}

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true };

        // 設定 Webview 內容
        webviewView.webview.html = this.getWebviewContent();

        // **讀取當前開啟的檔案**
        this.sendCurrentFileContent();

        // 監聽使用者切換開啟的檔案
        vscode.window.onDidChangeActiveTextEditor(() => {
            this.sendCurrentFileContent();
        });

        // 處理 Webview 傳來的訊息
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'execute') {
                let logMessage = `使用者輸入的文字: ${message.text}`;
                if (message.fileName) {
                    const folderUri = vscode.workspace.workspaceFolders?.[0]?.uri;
                    if (!folderUri) {
                        vscode.window.showErrorMessage("請先開啟一個專案資料夾！");
                        return;
                    }
                    // 轉換 Base64 成 buffer，然後寫入檔案
                    const filePath = vscode.Uri.joinPath(folderUri, message.fileName);
                    await vscode.workspace.fs.writeFile(filePath, Buffer.from(message.fileContent.split(",")[1], 'base64'));
                    logMessage += `\n已上傳檔案: ${message.fileName}`;
                }
                // vscode.window.showInformationMessage(logMessage); // 顯示右下角的提示字元
            }
            // if (message.command === 'upload') {
            //     const folderUri = vscode.workspace.workspaceFolders?.[0]?.uri;
            //     if (!folderUri) {
            //         vscode.window.showErrorMessage("請先開啟一個專案資料夾！");
            //         return;
            //     }
            //     const filePath = vscode.Uri.joinPath(folderUri, message.fileName);
            //     await vscode.workspace.fs.writeFile(filePath, Buffer.from(message.fileContent.split(",")[1], 'base64'));
            //     vscode.window.showInformationMessage(`檔案 ${message.fileName} 已成功上傳！`);
            // }
        });
    }
    private sendCurrentFileContent() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const content = document.getText(); // 取得內容
            const fileName = document.fileName.split(/[/\\]/).pop();
            console.log("傳送檔案內容到 Webview:", content.substring(0, 200)); // 偵錯輸出
            // this._view?.webview.postMessage({ command: 'updateFileContent', content: content.substring(0, 200) }); // 只傳前 200 字
            this._view?.webview.postMessage({
                command: 'updateFileName',
                fileName: fileName
            });
        }
        else {
            //console.log("⚠️ 沒有開啟的檔案");
        }
    }

    private getWebviewContent(): string {
        return `
        <!DOCTYPE html>
        <html lang="zh">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CodeAIdapter</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    background-color: #1e1e1e; /* 深色背景 */
                    color: white;
                }
                /* 聊天歷史容器 */
                .chat-container {
                    flex: 1;
                    padding: 10px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    margin-bottom: 125px;
                }

                /* 訊息泡泡 */
                .message {
                    max-width: 80%;
                    padding: 10px;
                    margin: 5px;
                    border-radius: 10px;
                    word-wrap: break-word;
                }

                /* 使用者訊息（靠右、藍色背景） */
                .user-message {
                    align-self: flex-end;
                    background-color: #007bff;
                    color: white;
                }

                /* AI 訊息（靠左、灰色背景） */
                .ai-message {
                    align-self: flex-start;
                    background-color: #444;
                }

                /* 輸入區域 */
                .input-container {
                    display: flex;
                    padding: 10px;
                    background: #222;
                    align-items: center;
                }
                .input-box {
                    display: flex;
                    flex-wrap: wrap;
                    padding: 10px;
                    background: #252526;
                    border-top: 1px solid #333;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                }
                input[type="text"] {
                    flex: 1;
                    padding: 10px;
                    border: none;
                    border-radius: 4px;
                    font-size: clamp(14px, 2vw, 20px);
                    background: #333;
                    color: white;
                }
                button {
                    flex-shrink: 0; /* 不允許縮小 */
                    min-width: 60px; /* 最小寬度，避免被擠壓 */
                    padding: 10px 15px;
                    margin-top: 10px;
                    margin-left: 10px;
                    /* margin-right: 18px; */
                    border: none;
                    border-radius: 4px;
                    background-color: #5888b8;
                    color: white;
                    cursor: pointer;
                    font-size: clamp(14px, 2vw, 20px);
                }
                button:hover {
                    background-color: #0056b3;
                }
                textarea {
                    width: 88%;
                    min-height: 40px;
                    max-height: 300px; /* 可選，避免變太大 */
                    padding: 10px;
                    border: none;
                    border-radius: 4px;
                    font-size: clamp(14px, 2vw, 18px);
                    background: #333;
                    color: white;
                    resize: vertical; /* 允許使用者上下拖拉調整 */
                    overflow-y: auto; /* 當內容太多時允許滾動 */
                    word-wrap: break-word; /* 確保超出內容換行 */
                }

                .custom-file-upload {
                    flex-shrink: 0; /* 不允許縮小 */
                    min-width: 60px; /* 最小寬度，避免被擠壓 */
                    padding: 10px 15px;
                    margin-top: 10px;
                    margin-left: 10px;
                    border: none;
                    border-radius: 4px;
                    background-color:rgb(67, 145, 147);
                    color: white;
                    cursor: pointer;
                    font-size: clamp(14px, 2vw, 20px);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                    
                .custom-file-upload:hover {
                    background-color: rgb(32, 74, 75);
                }

                .file-icon {
                    flex-shrink: 0; /* 不允許縮小 */
                    min-width: 60px; /* 最小寬度，避免被擠壓 */
                    padding: 10px 15px;
                    margin-left: 10px;
                }

                .upload-section {
                    flex-direction: column; /* 讓 Upload File 和檔案名稱垂直排列 */
                    /* margin-top: 10px; 增加間距 */
                }
                #fileName {
                    margin-top: 20px; /* 調整與上方的距離 */
                    margin-left: 10px;
                }
            </style>
            <script>
                const vscode = acquireVsCodeApi(); // 獲取 VS Code API 以便傳送訊息

                // 監聽 VS Code 傳來的訊息
                window.addEventListener('message', (event) => {
                    const message = event.data;

                    if (message.command === 'updateFileName') {
                        console.log("收到來自 VS Code 的檔名:", message.fileName);
                        document.getElementById('fileContent').innerText = message.fileName || "（沒有開啟的檔案）";
                    }

                    // **AI 訊息顯示在 UI**
                    const chatContainer = document.getElementById('chatContainer');
                    if (message.command === 'response') {
                        // 清除定時器
                        clearInterval(waitingInterval);
                        const aiMessage = document.createElement('div');
                        aiMessage.classList.add('message', 'ai-message');
                        aiMessage.textContent = message.text;
                        chatContainer.appendChild(aiMessage);
                        
                        // 滾動到底部
                        aiMessage.scrollIntoView({ behavior: 'smooth' });
                    }

                });
                let waitingInterval;
                function sendMessage() {
                    const userInput = document.getElementById('userInput');
                    const fileInput = document.getElementById('fileInput');
                    const chatContainer = document.getElementById('chatContainer');
                    const text = userInput.value.trim();
                    const file = fileInput.files?.[0]; // 確保 file 不會是 undefined
                    if (!text) {
                        const inputBox = document.getElementById("userInput");
                        inputBox.style.border = "2px solid red"; 
                        setTimeout(() => inputBox.style.border = "", 1500); // 1.5 秒後恢復
                        return;
                    }
                    if (text.length > 3000) {
                        const errorMessage = document.createElement('div');
                        errorMessage.classList.add('message', 'ai-message');
                        errorMessage.textContent = "⚠️ 輸入的內容文字太多，請輸入小於 3000 字元";
                        chatContainer.appendChild(errorMessage);
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                        return;
                    }

                    const message = { command: 'execute', text };
                    // **新增使用者訊息到 UI**
                    const userMessage = document.createElement('div');
                    userMessage.classList.add('message', 'user-message');
                    userMessage.textContent = text;
                    chatContainer.appendChild(userMessage);
                    userMessage.scrollIntoView({ behavior: 'smooth' });

                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function (event) {
                            const fileContent = event.target.result;
                            // Can't send file content if it's too large(>3000)

                            if (fileContent.length > 3000) {
                                const errorMessage = document.createElement('div');
                                errorMessage.classList.add('message', 'ai-message');
                                errorMessage.textContent = "⚠️ "+ file.name + " 的內容太大，請選擇小於 3000 字元的檔案";
                                chatContainer.appendChild(errorMessage);
                                errorMessage.scrollIntoView({ behavior: 'smooth' }); // 滾動到底部
                                return;
                            }

                            message.fileName = file.name;
                            message.fileType = file.type;
                            message.fileContent = event.target.result;

                            // **顯示檔案名稱在 UI**
                            const fileMessage = document.createElement('div');
                            fileMessage.classList.add('message', 'user-message');
                            fileMessage.textContent = "已上傳檔案: " + file.name;
                            chatContainer.appendChild(fileMessage);
                            fileMessage.scrollIntoView({ behavior: 'smooth' }); // 滾動到底部
                            
                            // **Send data to Flask API**
                            sendDataToAPI(text, event.target.result, file.name);
                            vscode.postMessage(message); // 傳送文字與檔案
                        };
                        reader.readAsText(file);
                        const fileNameDisplay = document.getElementById("fileName");
                        fileNameDisplay.textContent = "未選擇檔案";
                    } else {
                        // **Send data to Flask API**
                        sendDataToAPI(text);
                        vscode.postMessage(message); // 只傳送文字
                    }

                    // 清空輸入框與檔案選擇框
                    userInput.value = "";
                    fileInput.value = "";

                    // 滾動到底部
                    // chatContainer.scrollTop = chatContainer.scrollHeight;

                    // 設置定時器，每三秒顯示一次“請稍等”
                    waitingInterval = setInterval(() => {
                        const waitingMessage = document.createElement('div');
                        waitingMessage.classList.add('message', 'ai-message');
                        waitingMessage.textContent = "請稍等...";
                        chatContainer.appendChild(waitingMessage);
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }, 1000);
                }

                function sendDataToAPI(prompt, fileContent = "", fileName = "") {
                    fetch('http://localhost:8080/api', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            prompt,
                            file: fileContent,  // 如果沒有檔案，就傳空字串
                            filename: fileName
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Success:', data);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
                }


                // function uploadFile() {
                //     const fileInput = document.getElementById('fileInput');
                //     const file = fileInput.files[0]; // 取得使用者選擇的第一個檔案

                //     if (!file) {
                //         alert("請選擇一個檔案！");
                //         return;
                //     }

                //     const reader = new FileReader();
                //     reader.onload = function(event) {
                //         const fileContent = event.target.result; // 讀取檔案內容為 Base64 或純文字
                //         vscode.postMessage({
                //             command: 'upload',
                //             fileName: file.name,
                //             fileType: file.type,
                //             fileContent: fileContent // 這裡會是 Base64 編碼或文字
                //         });
                //     };
                    
                //     reader.readAsDataURL(file); // 以 Base64 格式讀取檔案
                // }

                document.addEventListener("DOMContentLoaded", function() {
                    const fileInput = document.getElementById("fileInput");
                    const fileNameDisplay = document.getElementById("fileName");
                    fileInput.addEventListener("change", function() {
                        if (this.files.length > 0) {
                            fileNameDisplay.textContent = this.files[0].name;
                        } else {
                            fileNameDisplay.textContent = "未選擇檔案";
                        }
                    });
                });

            </script>
        </head>
        <body>
            <h3>目前開啟的檔案：</h3>
            <div class="file-content-box" id="fileContent">正在載入...</div>
            <div class="chat-container" id="chatContainer">
                <!-- 這裡放對話歷史 -->
            </div>
            <div class="input-box">
                <textarea id="userInput" placeholder="輸入訊息..."></textarea>
                <button onclick="sendMessage()">Send</button>
                <label for="fileInput" class="custom-file-upload">
                    Upload File
                </label>
                <input type="file" id="fileInput" hidden />
                <span id="fileName">未選擇檔案</span>  <!-- 顯示檔名 -->
            </div>
        </body>
        </html>`;
    }    
}
