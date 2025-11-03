
const express = require('express');
const bodyParser = require('body-parser');
const cheerio = require('cheerio'); 
const path = require('path');
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ 
    extended: true,
    limit: '10mb'       
}));
app.use(bodyParser.text({ 
    type: '*/*',
    limit: '10mb'      
}));


app.use(bodyParser.urlencoded({ extended: true })); 



app.get('/', (req, res) => {
    res.send('server is running'); 
});



app.post('/takeInfo/:id', async(req, res) => {
    const inn =  req.params.id;

    const response = await fetch(`https://orginfo.uz/search/all/?q=${inn}`, {
      method: "GET",
      headers: {
        "Cookie": "csrftoken=250sRYXaOpPr7JcLZVrqf3d26uuva9fx; sessionid=ogahatrialghix9x6r7nvydd5vnho65t",
        "User-Agent": "Mozilla/5.0 (Node.js)"
      }
    });

    const htmlContent = await response.text();

    
    if (!htmlContent) {
        return res.render('index', { 
            extractedTexts: [], 
            error: "Iltimos, HTML kodini kiriting." 
        });
    }

    try {
        const $ = cheerio.load(htmlContent);
        const extractedTexts = [];

        $('div[class="py-3"]').each((i, element) => { 
            const text = $(element).text().trim(); 
            extractedTexts.push(text);
        });

        const cleaned = extractedTexts.map(str => str.replace(/\s+/g, ' ').trim());

        res.send(cleaned);


    } catch (error) {
        console.error("Cheerio tahlilida xato:", error);
        res.render('index', { 
            extractedTexts: [], 
            error: "HTML kodingizni tahlil qilishda xato yuz berdi." 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} manzilida ishga tushdi.`);
});