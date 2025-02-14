// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// import { codeTransformWebview } from './webviews/AcodeTransform';
// import { toolingAgentWebview } from './webviews/BtoolingAgent';
// import { environmentDeployWebview } from './webviews/CenvironmentDeploy';
import { SidebarViewProvider } from './webviews/SidebarView';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "codeaidapter" is now active!');

    // // Hello World Command
    // const helloWorldCommand = vscode.commands.registerCommand('codeaidapter.helloWorld', () => {
    //     vscode.window.showInformationMessage('Hello World from CodeAIdapter!');
    // });

    // 註冊 Webview View Provider（側邊欄）
    const sidebarViewProvider = new SidebarViewProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(SidebarViewProvider.viewType, sidebarViewProvider)
    );
    // 自動顯示 Webview View
    setTimeout(() => {
        vscode.commands.executeCommand('workbench.view.extension.codeaidapterSidebar');
    }, 1000);

    // // 註冊 Webview Commands
    // const openCodeTransformCommand = vscode.commands.registerCommand('codeaidapter.openCodeTransform', () => {
    //     codeTransformWebview(context);
    // });

    // const openToolingAgentCommand = vscode.commands.registerCommand('codeaidapter.openToolingAgent', () => {
    //     toolingAgentWebview(context);
    // });

    // const openEnvironmentDeployCommand = vscode.commands.registerCommand('codeaidapter.openEnvironmentDeploy', () => {
    //     environmentDeployWebview(context);
    // });

    // // 註冊所有 Command
    // context.subscriptions.push(
    //     helloWorldCommand,
    //     openCodeTransformCommand,
    //     openToolingAgentCommand,
    //     openEnvironmentDeployCommand
    // );
}

// This method is called when your extension is deactivated
export function deactivate() {}