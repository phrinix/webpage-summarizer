const redisModel = require("../Model/redisModel");
const SummarizerFacade = require("../Services/summarizerFacade");
const configparser = require("configparser");

// Load configuration and extract key
const config = new configparser();
config.read("config.txt");

// WebPageController manages the summarization process for a given URL. 
// It orchestrates the workflow of fetching, cleaning, summarizing, caching,
// and extracting links from web pages by coordinating with Redis and the SummarizerFacade.
class WebPageController {

  // Constructor initializes the SummarizerFacade instance.
  constructor() {
    const openAIKey = config.get("api", "openAPI");
    this.summarizerFacade = new SummarizerFacade(openAIKey); // Create a shared SummarizerFacade instance
  }
  // Handles the summarization request from the client. Executes the summarization workflow, and returns the result to the client.
  async handleSummarization(req, res) {
    try {
      const { url, forceRefresh } = req.body;

      const result = await this.executeSummarizationWorkflow(url, forceRefresh);

      return res.status(200).json({
        message: "Data summarized successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error in handleSummarization:", error);
      return res.status(500).send("An error occurred while processing your request.");
    }
  }

  /**
   * Executes the entire summarization workflow:
   * 1. Checks Redis cache for existing summary.
   * 2. Summarizes the content using OpenAI.
   * 3. Extracts internal and external links.
   * 4. Saves the data to Redis for future use.
   */
  async executeSummarizationWorkflow(url, forceRefresh) {

    if (!forceRefresh) {
      const cachedData = await this.getFromCache(url);
      if (cachedData) {
        return cachedData;
      }
    }
    const summaryHtml = await this.summarizerFacade.summarizeContent(url);
    const { internalUrls, externalUrls } = await this.summarizerFacade.extractLinks(url);
    const dataToStore = {
      summary: summaryHtml,
      dateRefreshed: new Date().toISOString(),
      internalUrls,
      externalUrls,
    };
    await this.saveToCache(url, dataToStore);

    return dataToStore;
  }
  // Retrieves cached data for the given URL from Redis.
  async getFromCache(url) {
    try {
      return await redisModel.getSummaryFromRedis(url);
    } catch (error) {
      console.warn(`Redis fetch failed for url ${url}:`, error);
      return null;
    }
  }
  // Saves the summarized data for the given URL to Redis.
  async saveToCache(url, data) {
    try {
      await redisModel.saveSummaryToRedis(url, data);
    } catch (error) {
      console.error(`Error saving data to Redis for url ${url}:`, error);
    }
  }
}

module.exports = new WebPageController();