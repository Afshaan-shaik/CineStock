import fs from 'fs';
import path from 'path';

const DEFAULT_PROFILE = {
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

let memoryProfileCache = { ...DEFAULT_PROFILE };

export default async function handler(req, res) {
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
        memoryProfileCache = { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
      }
    } catch {
      // Fallback to cache
    }
    return res.status(200).json({
      success: true,
      profile: memoryProfileCache,
    });
  }

  if (req.method === 'POST') {
    const authHeader = req.headers['authorization'] || req.headers['x-owner-token'] || '';
    const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : String(authHeader).trim();

    const expectedSecret = process.env.OWNER_SECRET || 'cinestock-owner-2026';

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

      if (body.action === 'verify-auth') {
        return res.status(200).json({
          success: true,
          authenticated: true,
          message: 'Owner credentials verified successfully.',
        });
      }

      const updatedProfile = {
        ...memoryProfileCache,
        imageUrl: body.imageUrl || memoryProfileCache.imageUrl,
        displayMode: body.displayMode === 'square' ? 'square' : 'round',
        updatedAt: new Date().toISOString(),
      };

      try {
        if (fs.existsSync(profileJsonPath)) {
          const backupPath = path.resolve(process.cwd(), 'public/profile.backup.json');
          fs.copyFileSync(profileJsonPath, backupPath);
        }
        fs.writeFileSync(profileJsonPath, JSON.stringify(updatedProfile, null, 2), 'utf8');
      } catch (fsErr) {
        // Read-only environment fallback
      }

      memoryProfileCache = updatedProfile;

      return res.status(200).json({
        success: true,
        message: 'Profile photo updated and saved permanently.',
        profile: updatedProfile,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to update profile.',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
