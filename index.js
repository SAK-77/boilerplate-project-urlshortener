require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
// Basic Configuration
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

// Serve the homepage
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

// In-memory store for URLs
const urlStore = new Map();
let urlCounter = 1;

// API endpoint to shorten URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;
  
  // Basic URL validation
  if (!originalUrl || !originalUrl.match(/^https?:\/\//)) {
    return res.json({ error: 'invalid url' });
  }

  // Extract hostname for DNS lookup
  let hostname;
  try {
    hostname = new URL(originalUrl).hostname;
  } catch (e) {
    return res.json({ error: 'invalid url' });
  }

  // Verify URL exists using DNS lookup
  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Check if URL already exists
    let shortUrl;
    for (let [key, value] of urlStore) {
      if (value === originalUrl) {
        shortUrl = key;
        break;
      }
    }

    // If not found, create new short URL
    if (!shortUrl) {
      shortUrl = urlCounter++;
      urlStore.set(shortUrl, originalUrl);
    }

    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

// Redirect from short URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);
  const originalUrl = urlStore.get(shortUrl);

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.json({ error: 'No short URL found for given input' });
  }
});
