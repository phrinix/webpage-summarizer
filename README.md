-----------Functionalities-----------

The Web Page Summarizer allows users to enter a URL and receive a summarized version of the web page’s content using an AI-powered API. Additionally, it extracts and categorizes all links on the page as internal (within the same domain) or external (to other domains). Summaries and link data are cached (stored) in a Redis database, enabling fast retrieval for previously processed URLs, so users can quickly access prior summaries without reprocessing. Users can refresh the cached summary and link data for a URL to ensure it reflects the latest version of the web page.

-----------Pre-Requsit-----------

You will require
- Redis Host and Password
- OpenAPI seceret Key

-----------Instruction to Run-----------

1. Run following commands in terminal to install dependencies: 
npm install
2. Run following commands in terminal to start application: 
node app.js
3. Open your browser and navigate to localhost:3000
