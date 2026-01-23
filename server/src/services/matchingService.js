import { Item } from '../models/Item.js';
import { Match } from '../models/Match.js';
import { Notification } from '../models/Notification.js';
import { io } from '../index.js';

function scoreMatch(found, lost) {
  let score = 0;
  if (found.category === lost.category) score += 50;

  const tokenize = (text) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

  const foundTokens = new Set(tokenize(`${found.title} ${found.description}`));
  const lostTokens = new Set(tokenize(`${lost.title} ${lost.description}`));

  let overlap = 0;
  for (const token of foundTokens) {
    if (lostTokens.has(token)) overlap += 1;
  }

  if (foundTokens.size > 0) {
    const ratio = overlap / foundTokens.size;
    score += Math.min(50, Math.round(ratio * 50));
  }

  return score;
}

export async function runMatchingForFoundItem(foundItem, radiusMeters = 5000) {
  const candidates = await Item.find({
    type: 'LOST',
    status: 'ACTIVE',
    location: {
      $nearSphere: {
        $geometry: foundItem.location,
        $maxDistance: radiusMeters
      }
    }
  });

  for (const lostItem of candidates) {
    const matchScore = scoreMatch(foundItem, lostItem);
    if (matchScore < 30) continue;

    const owner = lostItem.postedBy;
    const finder = foundItem.postedBy;

    const match = await Match.create({
      owner,
      finder,
      lostItem: lostItem._id,
      foundItem: foundItem._id,
      radiusMeters,
      matchScore
    });

    const notifications = await Notification.insertMany([
      {
        user: owner,
        type: 'MATCH_FOUND',
        title: 'Possible match found',
        body: `We found a potential match for your ${lostItem.category.toLowerCase()}.`,
        data: { matchId: match._id, itemId: lostItem._id }
      },
      {
        user: finder,
        type: 'MATCH_FOUND',
        title: 'Your found item might belong to someone nearby',
        body: `Someone nearby reported a lost ${lostItem.category.toLowerCase()}.`,
        data: { matchId: match._id, itemId: foundItem._id }
      }
    ]);

    // emit Socket.io events to both users
    io.to(`user:${owner}`).emit('match:new', { matchId: match._id, matchScore });
    io.to(`user:${finder}`).emit('match:new', { matchId: match._id, matchScore });
  }
}
