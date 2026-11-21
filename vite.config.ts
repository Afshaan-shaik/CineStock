import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Local dev handler for /api/profile
      {
        name: 'dev-api-profile',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/profile')) {
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-owner-token');

              if (req.method === 'OPTIONS') {
                res.statusCode = 200;
                res.end();
                return;
              }

              const profileJsonPath = path.resolve(process.cwd(), 'public/profile.json');

              if (req.method === 'GET') {
                try {
                  if (fs.existsSync(profileJsonPath)) {
                    const content = fs.readFileSync(profileJsonPath, 'utf8');
                    res.statusCode = 200;
                    res.end(JSON.stringify({ success: true, profile: JSON.parse(content) }));
                    return;
                  }
                } catch (e) {
                  // Fallback
                }
                res.statusCode = 200;
                res.end(
                  JSON.stringify({
                    success: true,
                    profile: {
                      name: 'Afshan Sheikh',
                      title: 'Creator & Developer',
                      imageUrl: '/profile-avatar.svg',
                      displayMode: 'round',
                      github: 'https://github.com/Afshaan-shaik',
                      githubUser: 'Afshaan-shaik',
                      instagram: 'https://www.instagram.com/_thenameisshaan/',
                      instagramUser: '@_thenameisshaan',
                      bio: 'Building analog aesthetics, retro video synthesizers & creative web experiences.',
                    },
                  })
                );
                return;
              }

              if (req.method === 'POST') {
                const authHeader = req.headers['authorization'] || req.headers['x-owner-token'] || '';
                const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
                  ? authHeader.slice(7).trim()
                  : String(authHeader).trim();

                const expectedSecret = process.env.OWNER_SECRET || 'cinestock-owner-2026';

                if (!token || token !== expectedSecret) {
                  res.statusCode = 401;
                  res.end(JSON.stringify({ success: false, error: 'Unauthorized: Invalid owner passcode' }));
                  return;
                }

                let bodyStr = '';
                req.on('data', (chunk) => {
                  bodyStr += chunk;
                });
                req.on('end', () => {
                  try {
                    const body = JSON.parse(bodyStr || '{}');

                    if (body.action === 'verify-auth') {
                      res.statusCode = 200;
                      res.end(JSON.stringify({ success: true, authenticated: true }));
                      return;
                    }

                    let currentProfile: any = {};
                    if (fs.existsSync(profileJsonPath)) {
                      currentProfile = JSON.parse(fs.readFileSync(profileJsonPath, 'utf8'));
                      const backupPath = path.resolve(process.cwd(), 'public/profile.backup.json');
                      fs.copyFileSync(profileJsonPath, backupPath);
                    }

                    const updated = {
                      ...currentProfile,
                      imageUrl: body.imageUrl || currentProfile.imageUrl,
                      displayMode: body.displayMode === 'square' ? 'square' : 'round',
                      updatedAt: new Date().toISOString(),
                    };

                    fs.writeFileSync(profileJsonPath, JSON.stringify(updated, null, 2), 'utf8');

                    res.statusCode = 200;
                    res.end(JSON.stringify({ success: true, profile: updated }));
                  } catch (err: any) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ success: false, error: err.message }));
                  }
                });
                return;
              }
            }
            next();
          });
        },
      },
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(process.cwd(), 'dist');
          const srcAssets = path.resolve(process.cwd(), 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, { recursive: true, force: true });
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
