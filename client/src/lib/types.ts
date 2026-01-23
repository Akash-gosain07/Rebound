export type ItemType = 'LOST' | 'FOUND';

export interface User {
  _id: string;
  userId: string;
  name: string;
  email: string;
  isAdmin?: boolean;
  trustScore: number;
  isVerified: boolean;
  stats?: {
    itemsPosted: number;
    matchesFound: number;
    recovered: number;
  };
}

export interface Item {
  _id: string;
  itemId: string;
  type: ItemType;
  category: string;
  title: string;
  description: string;
  photos: string[];
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  status: 'ACTIVE' | 'MATCHED' | 'RECOVERED';
  postedBy: Pick<User, '_id' | 'userId' | 'name' | 'trustScore'>;
  verified: boolean;
}

export interface Match {
  _id: string;
  owner: User;
  finder: User;
  lostItem: Item;
  foundItem: Item;
  radiusMeters: number;
  matchScore: number;
  status: 'PENDING' | 'OTP_SENT' | 'CONFIRMED' | 'REJECTED';
}

export interface Notification {
  _id: string;
  type: 'MATCH_FOUND' | 'MESSAGE' | 'ITEM_VERIFIED' | 'STATUS_UPDATE';
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: string;
}
