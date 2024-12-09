# comis README

This is a VSCode extension built for use with our CLI tool found here: [https://github.com/edwardyeung04/commitment-issues](https://github.com/edwardyeung04/commitment-issues)  
Comis currently features the primary functionality of generating commit messages based on your changes using generative AI!  

## Setup
**1. Commitment Issues Setup**  

First, you will need to setup Commitment Issues in your repository. Detailed instructions can be found in the repository linked above!  
For a quick start, you can simply download Commitment Issues using PIP install
```
pip install ComIss
```  

**2. Clone the repository**  

From here, clone this (the comis VSCode extension) repository and open it.  

**3. Run the extension**  

Once the repository is open, you can run the extension locally (simply press F5 if you are using VSCode).  
When the extension is open, you will be able to open any files/folders of your choosing in the new VSCode window. The extension will have its own tab on the VSCode sidebar, where all extension features will be housed.

**4. Set Up OpenAI API Key**  

Upon launching, you will likely need to set up an .env file with your OpenAI API key. To quickly set this up, navigate to the comis extension tab.
When the tab is opened, a webview will be displayed with a page to set up your OpenAI API key. Click the "create .env file" button.
This will create a .env file for you as well as add .env to your .gitignore to ensure that you do not accidentally push your API key to your remote repository.
Open the .env file and paste your API key into the designated area.  
(It will look something like this):
```
OPENAI_API_KEY=[YOUR API KEY HERE]
```  

**5. Use the extension!**  

**Notes:**  
You must have TypeScript installed. To install TypeScript globally, you can run:
``` 
npm install -g typescript
```


If you run the extension and the buttons do not seem to be appearing, trying running this install in the repository:
```
npm install --save-dev @types/vscode
```

## Usage
### Generate Commit Messages
Once the extension has been set up, all you will need to do is navigate to the comis extension tab on your VSCode sidebar.  
When you are ready to commit your changes, simply press the "Commit Changes" button on the extension sidebar, and the extension will stage your changes, generate a commit message for you, and push it to your remote repository!


