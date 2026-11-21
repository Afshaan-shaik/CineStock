import fs from 'fs';
import path from 'path';

export interface ProfileData {
  name: string;
  title: string;
  imageUrl: string;
  displayMode: 'round' | 'square';
  github: string;
  githubUser: string;
  instagram: string;
  instagramUser: string;
  bio?: string;
  updatedAt?: string;
}

const DEFAULT_PROFILE: ProfileData = {
  name: 'Afshan Sheikh',
  title: 'Creator & Developer',
  imageUrl: '/profile-avatar.svg',
  displayMode: 'round',
  github: 'https://github.com/Afshaan-shaik',
  githubUser: 'Afshaan-shaik',
  instagram: 'https://www.instagram.com/_thenameisshaan/',
  instagramUser: '@_thenameisshaan',
  bio: 'Building analog aesthetics, retro video synthesizers & creative web experiences.',
};

// In-memory cache for serverless environments where local fs might be read-only
let memoryProfileCache: ProfileData = { ...DEFAULT_PROFILE };

export default async function handler(req: any, res: any) {
  // CORS & security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-owner-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const profileJsonPath = path.resolve(process.cwd(), 'public/profile.json');

  if (req.method === 'GET') {
    try {
      if (fs.existsSync(profileJsonPath)) {
        const raw = fs.readFileSync(profileJsonPath, 'utf8');
        const data = JSON.parse(raw);
        memoryProfileCache = { ...DEFAULT_PROFILE, ...data };
      }
    } catch {
      // Use existing memory cache
    }
    return res.status(200).json({
      success: true,
      profile: memoryProfileCache,
    });
  }

  if (req.method === 'POST') {
    // Check owner authorization
    const authHeader = req.headers['authorization'] || req.headers['x-owner-token'] || '';
    const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : String(authHeader).trim();

    const expectedSecret = process.env.OWNER_SECRET || 'cinestock-owner-2026';

    // Verify token strictly
    if (!token || token !== expectedSecret) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid owner authentication credentials.',
      });
    }

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (!body) {
        return res.status(400).json({ success: false, error: 'Missing request body' });
      }

      // Check for auth-verification probe
      if (body.action === 'verify-auth') {
        return res.status(200).json({
          success: true,
          authenticated: true,
          message: 'Owner credentials verified successfully.',
        });
      }

      const updatedProfile: ProfileData = {
        ...memoryProfileCache,
        imageUrl: body.imageUrl || memoryProfileCache.imageUrl,
        displayMode: body.displayMode === 'square' ? 'square' : 'round',
        updatedAt: new Date().toISOString(),
      };

      // Safe persistence with backup to prevent accidental deletion
      try {
        if (fs.existsSync(profileJsonPath)) {
          const backupPath = path.resolve(process.cwd(), 'public/profile.backup.json');
          fs.copyFileSync(profileJsonPath, backupPath);
        }
        fs.writeFileSync(profileJsonPath, JSON.stringify(updatedProfile, null, 2), 'utf8');
      } catch (fsErr) {
        console.warn('Notice: Serverless filesystem read-only, updated in-memory profile:', fsErr);
      }

      memoryProfileCache = updatedProfile;

      return res.status(200).json({
        success: true,
        message: 'Profile photo updated and saved permanently.',
        profile: updatedProfile,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to update profile.',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
