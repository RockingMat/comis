// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

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

function createEnvFile(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'createEnvFile',
        'OpenAI Key Setup',
        vscode.ViewColumn.One,
        {
            enableScripts: true, // Ensure the webview can execute scripts
        }
    );

    panel.webview.html = getWebviewContent();

    panel.webview.onDidReceiveMessage(async (message) => {
        if (message.command === 'createEnv') {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                const workspacePath = workspaceFolders[0].uri.fsPath;
                const envPath = path.join(workspacePath, '.env');
                const gitignorePath = path.join(workspacePath, '.gitignore');

                try {
                    // Create the .env file if it doesn't exist
                    if (!fs.existsSync(envPath)) {
                        fs.writeFileSync(envPath, 'OPENAI_KEY=\n');
                        vscode.window.showInformationMessage('.env file created successfully.');
                    } else {
                        vscode.window.showWarningMessage('.env file already exists.');
                    }

                    // Ensure .gitignore includes .env
                    if (!fs.existsSync(gitignorePath)) {
                        fs.writeFileSync(gitignorePath, '.env\n');
                        vscode.window.showInformationMessage('.gitignore file created and .env added.');
                    } else {
                        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
                        if (!gitignoreContent.includes('.env')) {
                            fs.appendFileSync(gitignorePath, '\n.env\n');
                            vscode.window.showInformationMessage('.env added to .gitignore.');
                        } else {
                            vscode.window.showInformationMessage('.gitignore already includes .env.');
                        }
                    }

                    // Dispose of the panel and show the commit sidebar
                    panel.dispose();
                    vscode.window.registerTreeDataProvider(
                        'commitSidebarView',
                        new CommitSidebarProvider()
                    );
                } catch (err) {
                    vscode.window.showErrorMessage(`Error creating .env or .gitignore: ${err instanceof Error ? err.message : err}`);
                }
            } else {
                vscode.window.showErrorMessage('No workspace folder found. Please open a folder to proceed.');
            }
        }
    });
}


function getWebviewContent(): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OpenAI Key Setup</title>
        </head>
        <body>
            <h1>Setup OpenAI Key</h1>
            <p>To use this extension, create a <code>.env</code> file and add your OpenAI API key.</p>
            <button id="createEnv">Create .env File</button>

            <script>
                const vscode = acquireVsCodeApi();
                document.getElementById('createEnv').addEventListener('click', () => {
                    vscode.postMessage({ command: 'createEnv' });
                });
            </script>
        </body>
        </html>
    `;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "comis" is now active!');

    // Launch the OpenAI setup page
    createEnvFile(context);

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.commitChanges', () => {
            vscode.window.showInformationMessage('Commit action triggered');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.filterCommits', () => {
            vscode.window.showInformationMessage('Filter action triggered');
        })
    );
}

// This method is called when your extension is deactivated
export function deactivate() {}