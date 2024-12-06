const redis = require('redis');
const configparser = require('configparser');

// Load Redis configuration from config.txt
const config = new configparser();
config.read('config.txt');

// RedisModel acts as a singleton to manage Redis database operations. 
// It handles connection establishment and provides methods to interact with Redis for storing, retrieving, and deleting data. \
// This ensures a single Redis client instance is shared across the application.
class RedisModel {

    // Initializes the RedisModel class by creating a singleton instance of the Redis client. If an instance already exists, it reuses the existing instance.
    constructor() {
        if (!RedisModel.instance) {
            this.redisClient = redis.createClient({
                url: `redis://${config.get('redis', 'host')}:${config.get('redis', 'port')}`,
                password: `${config.get('redis', 'password')}`,
            });

            this.redisClient.on('error', (err) => {
                console.error('Redis Client Error:', err);
            });

            this.redisClient.connect().catch((err) => {
                console.error('Redis connection error:', err);
            });

            RedisModel.instance = this;
        }
        return RedisModel.instance;
    }
    // Retrieves summarized data for a specific URL from Redis.
    async getSummaryFromRedis(url) {
        try {
            const data = await this.redisClient.hGetAll(`summary:${url}`);
            if (Object.keys(data).length === 0) {
                return null;
            }
            return {
                summary: data.summary,
                dateRefreshed: data.dateRefreshed,
                internalUrls: JSON.parse(data.internalUrls || '[]'), 
                externalUrls: JSON.parse(data.externalUrls || '[]'), 
            };
        } catch (error) {
            console.error(`Error fetching data from Redis for key summary:${url}:`, error);
            throw error;
        }
    }
    // Saves summarized data for a specific URL to Redis.
    async saveSummaryToRedis(url, data) {
        try {
            
            const redisData = {
                summary: data.summary || '', 
                dateRefreshed: data.dateRefreshed || '', 
                internalUrls: JSON.stringify(data.internalUrls || []), 
                externalUrls: JSON.stringify(data.externalUrls || []), 
            };
            await this.redisClient.hSet(`summary:${url}`, redisData);
            const ttl = parseInt(config.get('redis', 'ttl'), 10) || 86400; 
            await this.redisClient.expire(`summary:${url}`, ttl);
        } catch (error) {
            console.error(`Error saving data to Redis for key summary:${url}:`, error);
            throw error;
        }
    }
    // Deletes summarized data for a specific URL from Redis.
    async deleteFromRedis(url) {
        try {
            await this.redisClient.del(`summary:${url}`);
            console.log(`Deleted key summary:${url} from Redis.`);
        } catch (error) {
            console.error(`Error deleting summary:${url} from Redis:`, error);
            throw error;
        }
    }
}

module.exports = new RedisModel();
