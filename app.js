const express = require('express');
const bodyParser = require('body-parser');
const webPageController = require('./Controller/webPageController');

const app = express();
const PORT = 3000;

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 

app.use(express.static('View'));

app.post('/summarize', async (req, res) => {
    await webPageController.handleSummarization(req, res);
});

app.get('*', (req, res) => {
    res.status(404).send('404: Page Not Found');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
