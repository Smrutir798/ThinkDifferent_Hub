import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Configuration
const FALLBACK_DIR = path.resolve('data');
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'db_fallback.json');

export let isMockMode = false;

// Interface definitions
export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  product?: string | null;
  createdAt: Date | string;
}

export interface IActivity {
  _id: string;
  text: string;
  type: string;
  createdAt: Date | string;
}

export interface IProduct {
  _id: string;
  name: string;
  key: string;
  status: string;
  description: string;
  createdAt: Date | string;
}

// In-memory/JSON fallback structure
interface IDatabaseSchema {
  users: IUser[];
  activities: IActivity[];
  products: IProduct[];
}

let mockDB: IDatabaseSchema = {
  users: [],
  activities: [],
  products: []
};

// Default seed data
const getSeedData = async (): Promise<IDatabaseSchema> => {
  const hashedPassword = await bcrypt.hash('password123', 10);
  return {
    users: [
      {
        _id: 'user_1',
        name: 'Steve Jobs',
        email: 'owner@thinkdifferent.com',
        password: hashedPassword,
        role: 'Owner',
        createdAt: new Date().toISOString()
      }
    ],
    products: [
      {
        _id: 'prod_1',
        name: 'Ahhar.AI',
        key: 'ahhar',
        status: 'Active',
        description: 'Restaurant Operating System and automation network.',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'prod_2',
        name: 'ThinkDifferent Hub',
        key: 'hub',
        status: 'Active',
        description: 'Subnet manager and developer metrics aggregator.',
        createdAt: new Date().toISOString()
      }
    ],
    activities: [
      {
        _id: 'act_1',
        text: 'ThinkDifferent  iHub initialized in strict high-contrast B&W mode.',
        type: 'system',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: 'act_2',
        text: 'Cluster validation completed: active backend sandboxes status OK.',
        type: 'system',
        createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
      }
    ]
  };
};

// Load / Save JSON fallbacks
const loadMockDB = async () => {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    if (fs.existsSync(FALLBACK_FILE)) {
      const raw = fs.readFileSync(FALLBACK_FILE, 'utf-8');
      mockDB = JSON.parse(raw);
    } else {
      mockDB = await getSeedData();
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify(mockDB, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Failed to load JSON mock database, using in-memory store', err);
    mockDB = await getSeedData();
  }
};

const saveMockDB = () => {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(mockDB, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save JSON mock database to disk', err);
  }
};

// Connect DB
export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.log('No MONGODB_URI environment variable detected. Activating JSON file fallback mode.');
    isMockMode = true;
    await loadMockDB();
    return;
  }

  try {
    // Attempt Mongoose connection with a 3-second timeout
    mongoose.set('strictQuery', true);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('Successfully connected to MongoDB Atlas.');

    // Seed database if empty
    const { UserModel } = await import('../models/User.js');
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log('Database is empty. Seeding initial development records to MongoDB...');
      const seed = await getSeedData();

      const { ProductModel } = await import('../models/Product.js');
      const { ActivityModel } = await import('../models/Activity.js');

      await UserModel.insertMany(seed.users);
      await ProductModel.insertMany(seed.products);
      await ActivityModel.insertMany(seed.activities);
      console.log('Seeding completed successfully.');
    }
  } catch (err) {
    console.error('MongoDB Atlas connection failed. Fallback to local JSON database activated.', err);
    isMockMode = true;
    await loadMockDB();
  }
};

// Database Services Layer (handles routing between Mongo and fallback)
export const dbService = {
  // USER SERVICES
  users: {
    find: async (filter: { search?: string; product?: string } = {}): Promise<IUser[]> => {
      if (isMockMode) {
        let results = [...mockDB.users];
        if (filter.search) {
          const q = filter.search.toLowerCase();
          results = results.filter(u =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q)
          );
        }
        if (filter.product) {
          results = results.filter(u => u.product === filter.product);
        }
        return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      const { UserModel } = await import('../models/User.js');
      const query: any = {};
      if (filter.search) {
        query.$or = [
          { name: { $regex: filter.search, $options: 'i' } },
          { email: { $regex: filter.search, $options: 'i' } },
          { role: { $regex: filter.search, $options: 'i' } }
        ];
      }
      if (filter.product) {
        query.product = filter.product;
      }
      return UserModel.find(query).sort({ createdAt: -1 });
    },
    findByEmail: async (email: string): Promise<IUser | null> => {
      if (isMockMode) {
        return mockDB.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
      }
      const { UserModel } = await import('../models/User.js');
      return UserModel.findOne({ email });
    },
    create: async (data: Partial<IUser>): Promise<IUser> => {
      if (isMockMode) {
        const newUser: IUser = {
          _id: `user_${Date.now()}`,
          name: data.name || '',
          email: data.email || '',
          password: data.password || '',
          role: data.role || 'Owner',
          product: data.product || null,
          createdAt: new Date().toISOString()
        };
        mockDB.users.push(newUser);
        saveMockDB();
        return newUser;
      }
      const { UserModel } = await import('../models/User.js');
      const user = new UserModel(data);
      await user.save();
      return user;
    },
    findById: async (id: string): Promise<IUser | null> => {
      if (isMockMode) {
        return mockDB.users.find(u => u._id === id) || null;
      }
      const { UserModel } = await import('../models/User.js');
      return UserModel.findById(id);
    },
    update: async (id: string, data: Partial<IUser>): Promise<IUser | null> => {
      if (isMockMode) {
        const index = mockDB.users.findIndex(u => u._id === id);
        if (index === -1) return null;
        mockDB.users[index] = {
          ...mockDB.users[index],
          ...data
        };
        saveMockDB();
        return mockDB.users[index];
      }
      const { UserModel } = await import('../models/User.js');
      return UserModel.findByIdAndUpdate(id, data, { new: true });
    },
    delete: async (id: string): Promise<boolean> => {
      if (isMockMode) {
        const index = mockDB.users.findIndex(u => u._id === id);
        if (index === -1) return false;
        mockDB.users.splice(index, 1);
        saveMockDB();
        return true;
      }
      const { UserModel } = await import('../models/User.js');
      const result = await UserModel.findByIdAndDelete(id);
      return !!result;
    }
  },



  // ACTIVITY LOGS SERVICES
  activities: {
    find: async (limit = 10): Promise<IActivity[]> => {
      if (isMockMode) {
        return [...mockDB.activities]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      }
      const { ActivityModel } = await import('../models/Activity.js');
      return ActivityModel.find().sort({ createdAt: -1 }).limit(limit);
    },
    create: async (text: string, type = 'system'): Promise<IActivity> => {
      if (isMockMode) {
        const newAct: IActivity = {
          _id: `act_${Date.now()}`,
          text,
          type,
          createdAt: new Date().toISOString()
        };
        mockDB.activities.push(newAct);
        saveMockDB();
        return newAct;
      }
      const { ActivityModel } = await import('../models/Activity.js');
      const act = new ActivityModel({ text, type });
      await act.save();
      return act;
    }
  },

  // METRICS SERVICES
  metrics: {
    get: async () => {
      let allUsers: IUser[] = [];
      if (isMockMode) {
        allUsers = mockDB.users;
      } else {
        const { UserModel } = await import('../models/User.js');
        allUsers = await UserModel.find({});
      }

      // Calculate statistics
      const totalMerchants = allUsers.length;
      const activeNodes = allUsers.length;

      // MRR: licensing rate is $1,200 per active administrator node
      const mrr = allUsers.length * 1200;

      // Dynamic monthly progression (last 6 months, for charts)
      const monthlyData = calculateMonthlyProgression(allUsers);

      // Orders: mock transactions handled by user nodes
      const totalOrders = allUsers.length * 150;

      // Growth percentage compared to previous month
      const activeLastMonth = allUsers.filter(u => {
        const date = new Date(u.createdAt);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return date < oneMonthAgo;
      }).length;

      const growth = activeLastMonth > 0
        ? Math.round(((totalMerchants - activeLastMonth) / activeLastMonth) * 100)
        : 20;

      return {
        mrr,
        totalMerchants,
        activeNodes,
        growth,
        totalOrders,
        monthlyData
      };
    }
  }
};

// Helper for generating chart progression points based on user collection
function calculateMonthlyProgression(users: IUser[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const curDate = new Date();

  // Get last 6 months list
  const last6Months: { name: string; mrr: number; active: number; monthIdx: number; year: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(curDate.getFullYear(), curDate.getMonth() - i, 1);
    last6Months.push({
      name: months[d.getMonth()],
      mrr: 0,
      active: 0,
      monthIdx: d.getMonth(),
      year: d.getFullYear()
    });
  }

  // Aggregate historical records
  last6Months.forEach(m => {
    const monthEndTime = new Date(m.year, m.monthIdx + 1, 0).getTime();

    const activeInMonth = users.filter(u => {
      const createdTime = new Date(u.createdAt).getTime();
      return createdTime <= monthEndTime;
    });

    m.active = activeInMonth.length;
    m.mrr = activeInMonth.length * 1200;
  });

  return last6Months.map(({ name, mrr, active }) => ({
    month: name,
    revenue: mrr,
    subscriptions: active,
    growth: Math.round(active * 1.5)
  }));
}
