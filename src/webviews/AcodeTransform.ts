import * as vscode from 'vscode';

export function codeTransformWebview(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'codeTransform',
        'AI 代碼轉換',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    panel.webview.html = getWebviewContent();

    panel.webview.onDidReceiveMessage(
        message => {
            if (message.command === 'execute') {
                vscode.window.showInformationMessage(`AI 代碼轉換：執行 ${message.action}`);
                // 這裡可以串接 AI 轉換 API
            }
        },
        undefined,
        context.subscriptions
    );
}

function getWebviewContent(): string {
    return `
        <!DOCTYPE html>
        <html lang="zh">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI 代碼轉換</title>
            <script>
                function sendAction() {
                    vscode.postMessage({ command: 'execute', action: 'codeTransform' });
                }
                window.onload = function() {
                    const vscode = acquireVsCodeApi();
                    document.getElementById('runButton').addEventListener('click', sendAction);
                }
            </script>
        </head>
        <body>
            <h1>AI 代碼轉換</h1>
            <button id="runButton">執行代碼轉換</button>
        </body>
        </html>
    `;
}
