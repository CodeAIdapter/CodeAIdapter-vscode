import * as vscode from 'vscode';

export function environmentDeployWebview(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'environmentDeploy',
        '自動部署',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    panel.webview.html = getWebviewContent();

    panel.webview.onDidReceiveMessage(
        message => {
            if (message.command === 'execute') {
                vscode.window.showInformationMessage(`自動部署：執行 ${message.action}`);
                // 這裡可以串接 K8s 部署 API
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
            <title>自動部署</title>
            <script>
                function sendAction() {
                    vscode.postMessage({ command: 'execute', action: 'deployment' });
                }
                window.onload = function() {
                    const vscode = acquireVsCodeApi();
                    document.getElementById('runButton').addEventListener('click', sendAction);
                }
            </script>
        </head>
        <body>
            <h1>自動部署</h1>
            <button id="runButton">執行自動部署</button>
        </body>
        </html>
    `;
}
