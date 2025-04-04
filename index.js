const express = require('express');
const dns = require('dns');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

// In-memory store for URLs
const urlStore = new Map();
let idCounter = 0;

// Serve HTML
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// POST endpoint to create short URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;
  
  // Basic URL validation
  if (!originalUrl.match(/^https?:\/\//)) {
    return res.json({ error: 'invalid url' });
  }

  // Extract hostname for DNS lookup
  let hostname;
  try {
    hostname = new URL(originalUrl).hostname;
  } catch (e) {
    return res.json({ error: 'invalid url' });
  }

  // Verify URL exists
  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Generate short URL
    idCounter++;
    urlStore.set(idCounter, originalUrl);
    
    res.json({
      original_url: originalUrl,
      short_url: idCounter
    });
  });
});

// GET endpoint to redirect short URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);
  const originalUrl = urlStore.get(shortUrl);

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.json({ error: 'No short URL found' });
  }
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});