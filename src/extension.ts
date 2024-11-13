// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

class CommitSidebarProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (!element) {
            // Root elements (e.g., buttons or options)
            return Promise.resolve(this.getCommitActions());
        }
        return Promise.resolve([]);
    }

    private getCommitActions(): vscode.TreeItem[] {
        const commitItem = new vscode.TreeItem('Commit Changes', vscode.TreeItemCollapsibleState.None);
        commitItem.command = {
            command: 'extension.commitChanges',
            title: 'Commit Changes',
        };

        const filterItem = new vscode.TreeItem('Filter Commits', vscode.TreeItemCollapsibleState.None);
        filterItem.command = {
            command: 'extension.filterCommits',
            title: 'Filter Commits',
        };

        return [commitItem, filterItem];
    }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "comis" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('comis.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from commitment-issues!');
	});

	vscode.window.registerTreeDataProvider('commitSidebarView', new CommitSidebarProvider());

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.commitChanges', () => {
            vscode.window.showInformationMessage('Commit action triggered');
            // Add your commit logic here
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.filterCommits', () => {
            vscode.window.showInformationMessage('Filter action triggered');
            // Add your filter logic here
        })
    );

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}