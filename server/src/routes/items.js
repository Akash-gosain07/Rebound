import express from 'express';
import { Item } from '../models/Item.js';
import { authRequired } from '../middleware/auth.js';
import { upload } from '../config/localStorage.js';
import { generateItemId } from '../services/idService.js';

const router = express.Router();

router.post('/', authRequired, upload.single('photo'), async (req, res) => {
  try {
    const { type, title, category, description, location: locationStr } = req.body;

    // Parse location from JSON string
    let location;
    try {
      location = JSON.parse(locationStr);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid location format' });
    }

    if (!type || !title || !category || !location || !location.coordinates) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const item = await Item.create({
      itemId: generateItemId(category?.toUpperCase() || 'ITEM'),
      type: type.toLowerCase(),
      title,
      category,
      description,
      photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address || 'Bhubaneswar vicinity',
      },
      postedBy: req.user._id,
    });

    return res.status(201).json({ item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to create item' });
  }
});

// Public list items endpoint (used by map, guest users can still view pins)
router.get('/', async (req, res) => {
  try {
    const { type, radius = 5000, lat, lng, category, q } = req.query;
    const query = {};

    // Show items that are not yet recovered (ACTIVE and MATCHED items should be visible)
    query.status = { $ne: 'RECOVERED' };

    if (type) query.type = type;
    if (category && category !== 'all') query.category = category;
    if (q) query.title = { $regex: q, $options: 'i' };

    if (lat && lng) {
      query['location'] = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius, 10),
        },
      };
    }

    const items = await Item.find(query).limit(100).sort({ createdAt: -1 });
    return res.json({ items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch items' });
  }
});

// Allow public read of a single item (frontend route is still protected for logged-in users)
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('createdBy', 'userId fullName isVerified');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    return res.json({ item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch item' });
  }
});

router.patch('/:id', authRequired, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (!item.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { title, category, description } = req.body;
    if (title) item.title = title;
    if (category) item.category = category;
    if (description) item.description = description;
    await item.save();
    return res.json({ item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to update item' });
  }
});

router.delete('/:id', authRequired, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (!item.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await item.deleteOne();
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to delete item' });
  }
});

export default router;
