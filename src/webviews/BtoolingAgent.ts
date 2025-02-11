import * as vscode from 'vscode';

export function toolingAgentWebview(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'toolingAgent',
        '自動偵錯',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    panel.webview.html = getWebviewContent();

    panel.webview.onDidReceiveMessage(
        message => {
            if (message.command === 'execute') {
                vscode.window.showInformationMessage(`自動偵錯：執行 ${message.action}`);
                // 這裡可以串接 Debug API
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
            <title>自動偵錯</title>
            <script>
                function sendAction() {
                    vscode.postMessage({ command: 'execute', action: 'debug' });
                }
                window.onload = function() {
                    const vscode = acquireVsCodeApi();
                    document.getElementById('runButton').addEventListener('click', sendAction);
                }
            </script>
        </head>
        <body>
            <h1>自動偵錯</h1>
            <button id="runButton">執行自動偵錯</button>
        </body>
        </html>
    `;
}
