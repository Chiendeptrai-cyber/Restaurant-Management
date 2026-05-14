require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/product_db';

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, default: '' },
  stock: { type: Number, default: 0 }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

const defaultProducts = [
  {
    name: 'Pizza Margherita',
    price: 120000,
    description: 'Pizza phô mai, cà chua và húng quế.',
    stock: 12
  },
  {
    name: 'Phở Bò',
    price: 85000,
    description: 'Phở bò tươi ngon với nước dùng đậm đà.',
    stock: 20
  },
  {
    name: 'Bún Thịt Nướng',
    price: 95000,
    description: 'Bún tươi ăn cùng thịt nướng và rau sống.',
    stock: 15
  }
];

async function seedProducts() {
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany(defaultProducts);
    console.log('Seeded default products into product_db');
  }
}

app.get('/', (req, res) => {
  res.json({ service: 'product-service', status: 'running' });
});

app.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch products', details: error.message });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch product', details: error.message });
  }
});

app.post('/products', async (req, res) => {
  try {
    const { name, price, description, stock } = req.body;
    if (!name || typeof price !== 'number') {
      return res.status(400).json({ error: 'Product requires name and numeric price' });
    }
    const product = new Product({ name, price, description, stock });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Unable to create product', details: error.message });
  }
});

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    await seedProducts();
    app.listen(PORT, () => {
      console.log(`Product service listening on http://0.0.0.0:${PORT}`);
    });
  })
  .catch(error => {
    console.error('Product service failed to connect to MongoDB:', error.message);
    process.exit(1);
  });
