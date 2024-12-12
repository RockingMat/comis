import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let comIssTerminal: vscode.Terminal | undefined;

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
            command: 'extension.runComIss',
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

// This function holds the logic for creating a .env file and adding it to .gitignore
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
                        fs.writeFileSync(envPath, 'OPENAI_API_KEY=\n');
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


// Creates webview content for setting up OpenAI API Key
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

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.runComIss', () => {
            runComIssCommand();
        })
    );
}

async function runComIssCommand() {
    const outputChannel = vscode.window.createOutputChannel('ComIss Output');
    outputChannel.show();

    const shellExecution = new vscode.ShellExecution('git add . && ComIss commit', { cwd: vscode.workspace.rootPath });
    const task = new vscode.Task(
        { type: 'shell' },
        vscode.TaskScope.Workspace,
        'ComIss',
        'ComIss',
        shellExecution
    );

    outputChannel.appendLine('Executing task...');
    try {
        await vscode.tasks.executeTask(task);
        outputChannel.appendLine('Task execution started');
    } catch (error) {
        if (error instanceof Error) {
            outputChannel.appendLine(`Error executing task: ${error.message}`);
        } else {
            outputChannel.appendLine('Error executing task: unknown error');
        }
    }

    vscode.tasks.onDidStartTask((e) => {
        if (e.execution.task === task) {
            outputChannel.appendLine('Task started');
        }
    });

    vscode.tasks.onDidEndTask((e) => {
        if (e.execution.task === task) {
            outputChannel.appendLine('Task ended');
        }
    });

    vscode.tasks.onDidEndTaskProcess((e) => {
        if (e.execution.task === task) {
            outputChannel.appendLine(`Task process ended with exit code ${e.exitCode}`);
        }
    });
}

class CustomTaskTerminal implements vscode.Pseudoterminal {
    private writeEmitter = new vscode.EventEmitter<string>();
    onDidWrite: vscode.Event<string> = this.writeEmitter.event;
    private closeEmitter = new vscode.EventEmitter<void>();
    onDidClose?: vscode.Event<void> = this.closeEmitter.event;

    private taskOutput = '';

    constructor(private shellExecution: vscode.ShellExecution, private outputChannel: vscode.OutputChannel) {}

    open(initialDimensions: vscode.TerminalDimensions | undefined): void {
        this.outputChannel.appendLine('Terminal opened');
        this.doExecution();
    }

    close(): void {
        this.outputChannel.appendLine('Terminal closed');
    }

    private async doExecution() {
        this.outputChannel.appendLine('Starting task execution...');
        const process = require('child_process').exec(this.shellExecution.commandLine, { cwd: this.shellExecution.options?.cwd });

        process.stdout.on('data', (data: string) => {
            this.taskOutput += data;
            this.writeEmitter.fire(data);
            this.outputChannel.appendLine(`stdout: ${data}`);
        });

        process.stderr.on('data', (data: string) => {
            this.outputChannel.appendLine(`stderr: ${data}`);
        });

        process.on('close', (code: number) => {
            this.outputChannel.appendLine(`Process exited with code ${code}`);
            this.closeEmitter.fire();

            if (this.taskOutput.trim() === '') {
                vscode.window.showErrorMessage('Task output is empty.');
                return;
            }

            const commitMessage = extractCommitMessage(this.taskOutput);
            if (commitMessage) {
                showCommitMessageInputBox(commitMessage);
            } else {
                vscode.window.showErrorMessage('Failed to extract commit message.');
            }
        });
    }

    handleInput(data: string): void {
        this.taskOutput += data;
        this.writeEmitter.fire(data);
        this.outputChannel.appendLine(`Received input: ${data}`);
    }
}

function extractCommitMessage(output: string): string | null {
    // Implement your logic to extract the commit message from the output
    return output; // Placeholder
}

function showCommitMessageInputBox(commitMessage: string): void {
    vscode.window.showInputBox({ value: commitMessage }).then((input) => {
        if (input) {
            vscode.window.showInformationMessage(`Commit message: ${input}`);
        }
    });
}

// This method is called when your extension is deactivated
export function deactivate() {}