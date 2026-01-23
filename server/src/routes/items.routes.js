import express from 'express';
import { authRequired } from '../middleware/auth.js';
import { Item } from '../models/Item.js';
import { generateItemId } from '../services/idService.js';
import { runMatchingForFoundItem } from '../services/matchingService.js';

const router = express.Router();

router.post('/', authRequired, async (req, res, next) => {
  try {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    console.log('User from auth:', req.user?._id);

    const { type, category, title, description, photos, location, radiusKm, petDetails } = req.body;

    const itemData = {
      itemId: generateItemId(category?.toUpperCase() || 'ITEM'),
      type,
      category,
      title,
      description,
      photos: photos || [],
      location,
      postedBy: req.user._id
    };

    // Include petDetails if provided
    if (petDetails) {
      itemData.petDetails = petDetails;
    }

    const item = await Item.create(itemData);

    if (type === 'FOUND') {
      const radiusMeters = (radiusKm || 5) * 1000;
      await runMatchingForFoundItem(item, radiusMeters);
    }

    res.status(201).json({ item });
  } catch (err) {
    console.error('Error creating item:', err.message);
    console.error('Validation errors:', err.errors);
    next(err);
  }
});

router.get('/', authRequired, async (req, res, next) => {
  try {
    const { type, lat, lng, radiusKm } = req.query;
    const query = {};
    if (type && type !== 'ALL') {
      query.type = type;
    }

    const radiusMeters = Number(radiusKm || 5) * 1000;

    if (lat && lng) {
      query.location = {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: radiusMeters
        }
      };
    }

    const items = await Item.find(query).populate('postedBy', 'userId name trustScore');
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authRequired, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate('postedBy', 'userId name trustScore');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', authRequired, async (req, res, next) => {
  try {
    const { status } = req.body;
    const item = await Item.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ item });
  } catch (err) {
    next(err);
  }
});

export default router;
