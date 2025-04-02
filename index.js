const express = require('express');
const dns = require('dns');
const app = express();
const port = process.env.PORT || 3000;

// Built-in middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// In-memory store for URLs
const urlStore = new Map();
let urlCounter = 1;

// Serve homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Shorten URL endpoint
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;
  
  // Validate URL format (must start with http:// or https:// and have proper structure)
  const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  if (!originalUrl || !urlRegex.test(originalUrl)) {
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

    // Check if URL already exists
    let shortUrl;
    for (let [key, value] of urlStore) {
      if (value === originalUrl) {
        shortUrl = key;
        break;
      }
    }

    // Create new short URL if not found
    if (!shortUrl) {
      shortUrl = urlCounter++;
      urlStore.set(shortUrl, originalUrl);
    }

    // Return JSON response with specified properties
    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

// Redirect endpoint
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);
  const originalUrl = urlStore.get(shortUrl);

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.json({ error: 'invalid url' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});