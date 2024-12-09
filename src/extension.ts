import * as vscode from 'vscode';

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

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.runComIss', () => {
            runComIssCommand();
        })
    );

	context.subscriptions.push(disposable);
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