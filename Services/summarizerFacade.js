const axios = require("axios");
const fs = require('fs');
const path = require('path');
const cheerio = require("cheerio");

// Commonly used tags for text extraction
const TEXT_TAGS = 'title, h1, h2, h3, h4, h5, h6, p, a, table, ul, ol, li, section, article, aside, th, tr, td, figcaption, blockquote, q';


// SummarizerFacade is responsible for managing the workflow of fetching, cleaning, summarizing, and extracting links from web pages. 
// It integrates with OpenAI's API for generating summaries. 
class SummarizerFacade {

  // Constructor to initialize the SummarizerFacade instance with the OpenAI API key.
  constructor(openAIKey) {
    if (!openAIKey) {
      throw new Error("OpenAI API key is required");
    }
    this.openAIKey = openAIKey;
    try {
      const filePath = path.join(__dirname, 'contentForChatGPT.txt');
      this.contentForChatGPT = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.error('Error loading contentForChatGPT.txt:', error);
      throw error;
    }
  }

  // Fetches raw HTML content from the given URL.
  async fetchRawHtml(url) {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching HTML content from ${url}:`, error);
      throw error;
    }
  }

  // Fetches and cleans HTML content from the given URL by extracting meaningful text.
  async fetchCleanHtml(url) {
    try {
      const rawHtml = await this.fetchRawHtml(url);
      const $ = cheerio.load(rawHtml);
      const cleanedTextSet = new Set();

      $(TEXT_TAGS).each((_, element) => {
        cleanedTextSet.add($(element).text().trim());
      });
      return Array.from(cleanedTextSet).join("\n").trim();

    } catch (error) {
      console.error('Error in fetchCleanHtml:', error);
      throw error;
    }
  }

  // Summarizes the content of a webpage using the OpenAI API.
  async summarizeContent(url) {
    try {
      const content = await this.fetchCleanHtml(url);
      const apiUrl = "https://api.openai.com/v1/chat/completions";
      const systemMessage = { role: "system", content: this.contentForChatGPT };
      const userMessage = { role: "user", content: `Here is the extracted text from the webpage ${url}:\n${content}` };
      const response = await axios.post(
        apiUrl,
        { model: "gpt-3.5-turbo-16k", messages: [systemMessage, userMessage], temperature: 0.7 },
        { headers: { Authorization: `Bearer ${this.openAIKey}`, "Content-Type": "application/json" } }
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("Error summarizing content with ChatGPT:", error.message);
      throw error;
    }
  }

  // Extracts internal and external links from the given webpage.
  async extractLinks(baseUrl) {
    try {
      const rawHtml = await this.fetchRawHtml(baseUrl);
      const $ = cheerio.load(rawHtml);
      const internalUrls = [];
      const externalUrls = [];

      const baseDomain = new URL(baseUrl).hostname;

      $('a').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          try {
            const url = new URL(href, baseUrl);
            if (url.hostname === baseDomain) {
              internalUrls.push(url.href);
            } else {
              externalUrls.push(url.href);
            }
          } catch (e) {
          }
        }
      });
      return {
        internalUrls: Array.from(internalUrls),
        externalUrls: Array.from(externalUrls),
      };
    } catch (error) {
      console.error('Error extracting links:', error);
      throw error;
    }
  }
}

module.exports = SummarizerFacade;
