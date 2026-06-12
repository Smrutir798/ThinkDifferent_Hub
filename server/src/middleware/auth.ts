import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'thinkdifferent_os_secret_key_2026_super_secure_99';
    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: string;
      name: string;
    };
    
    (req as AuthRequest).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid or expired' });
  }
};
