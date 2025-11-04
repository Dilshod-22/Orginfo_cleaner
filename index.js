const express = require('express');
const bodyParser = require('body-parser');
const cheerio = require('cheerio'); 

const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
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
    res.json('server is running'); 
});

app.get('/test', (req, res) => {
    res.json('server is running Test'); 
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
        return res.json({ 
            extractedTexts: [], 
            error: "HTML topilmadi." 
        });
    }

    try {
        const $ = cheerio.load(htmlContent);
        const extractedTexts = [];
        
        $('div[class*="py-"]').each((i, element) => { 
            const textX = $(element).text().trim();         
            const str = textX.replace(/\s+/g, ' ').trim();
            const firstSpaceIndex = str.indexOf(" ");

            const textZ = str.slice(firstSpaceIndex + 1).trim();
            const regex = /^.*?\s"/;
            const textY = '"' + textZ.replace(regex, '').trim(); 

            // mb- ichidagi a tegi role="button" bo'lgan
            const link = $(element).find('div[class*="mb-"] a[role="button"]').attr('href') || null;
            const fullLink = link ? `${link}` : null;

            let info = {
                title: str.slice(0, firstSpaceIndex),     
                name: str.slice(firstSpaceIndex + 1).trim(),
                original: textY,
                link: fullLink
            }
            extractedTexts.push(info);    
        });
        
        const cleaned = extractedTexts;
        res.send(cleaned);
    } catch (error) {
        console.error("Cheerio tahlilida xato:", error);
        res.json({ 
            extractedTexts: [], 
            error: "HTML kodingizni tahlil qilishda xato yuz berdi." 
        });
    }
});

app.post('/detailed/', async(req, res) => {
    const linkDetail = await req.body.link_detail;
   
    const response = await fetch(`https://orginfo.uz${linkDetail}`, {
      method: "GET",
      headers: {
        "Cookie": "csrftoken=250sRYXaOpPr7JcLZVrqf3d26uuva9fx; sessionid=ogahatrialghix9x6r7nvydd5vnho65t",
        "User-Agent": "Mozilla/5.0 (Node.js)"
      }
    });

    const htmlContent = await response.text(); 
    
    if (!htmlContent) {
        return res.json({ 
            error: "HTML content topilmadi." 
        });
    }

    try {
        const $ = cheerio.load(htmlContent);
        const result = [];
        
        $('div.py-3').each((index, element) => {
            const spans = $(element).find('span');
            const dataObject = {};
            for (let i = 0; i < spans.length; i += 2) {
                if (i + 1 < spans.length) {
                    const key = $(spans[i]).text().trim().replace(/\s+/g, ' ');
                    let value = $(spans[i + 1]).text().trim();
                    value = value.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
                    if (key) {
                        dataObject[key] = value;
                    }
                }
            }
            
            if (Object.keys(dataObject).length > 0) {
                result.push(dataObject);
            }
        });
        result.splice(0, 1);
        res.json(result);
    } catch (error) {
        console.error("Cheerio tahlilida xato:", error);
        res.json({ 
            error: "HTML kodingizni tahlil qilishda xato yuz berdi.",
            details: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} manzilida ishga tushdi.`);
});