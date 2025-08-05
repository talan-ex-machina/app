const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const cors = require('cors');


app.use(cors());
app.use(express.json({ limit: '20mb' })); 

const chartsDir = path.join(__dirname, 'charts');
if (!fs.existsSync(chartsDir)) {
  fs.mkdirSync(chartsDir);
}


app.post('/upload', async (req, res) => {
  try {
    const { chartName, imageData } = req.body;

    if (!chartName || !imageData) {
      return res.status(400).json({ error: 'Missing chartName or imageData' });
    }

    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');

    const filePath = path.join(chartsDir, `${chartName}.png`);
    
    fs.writeFile(filePath, base64Data, 'base64', (err) => {
      if (err) {
        console.error('Error saving image:', err);
        return res.status(500).json({ error: 'Failed to save image' });
      }

      console.log(`Image saved: ${filePath}`);
      res.json({ status: 'success', file: `${chartName}.png` });
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
