import { execSync } from 'child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync, renameSync } from 'fs';
import { join } from 'path';

const gvPrakashDir = join(process.cwd(), 'sana-experience');
const outputDir = join(process.cwd(), 'public', 'gv-prakash');
const nextOutDir = join(gvPrakashDir, 'out');

// Package.json paths - we keep it renamed to prevent Vercel from detecting it
const packageJsonLocal = join(gvPrakashDir, 'package.json.local');
const packageJson = join(gvPrakashDir, 'package.json');

console.log('Building GV Prakash Next.js app...');

try {
  // Rename package.json.local back to package.json for building
  if (existsSync(packageJsonLocal)) {
    console.log('Restoring package.json for build...');
    renameSync(packageJsonLocal, packageJson);
  }

  // Build the Next.js app
  console.log('Running Next.js build...');
  execSync('npm run build', {
    cwd: gvPrakashDir,
    stdio: 'inherit',
  });

  // Remove existing output directory
  if (existsSync(outputDir)) {
    console.log('Removing existing gv-prakash directory...');
    rmSync(outputDir, { recursive: true });
  }

  // Create output directory
  mkdirSync(outputDir, { recursive: true });

  // Copy the built Next.js app to public/gv-prakash
  console.log('Copying built files to public/gv-prakash...');
  if (existsSync(nextOutDir)) {
    cpSync(nextOutDir, outputDir, { recursive: true });
    console.log('✅ GV Prakash app built and copied successfully!');
  } else {
    console.error('❌ Next.js output directory not found:', nextOutDir);
    process.exit(1);
  }

  // Copy frames from Next.js public folder to main app's public folder (shared)
  const framesSource = join(gvPrakashDir, 'public', 'frames');
  const framesDest = join(process.cwd(), 'public', 'frames');

  if (existsSync(framesSource)) {
    console.log('Copying frames to main public folder...');
    if (existsSync(framesDest)) {
      rmSync(framesDest, { recursive: true });
    }
    cpSync(framesSource, framesDest, { recursive: true });
    console.log('✅ Frames copied to public/frames');
  } else {
    console.warn('⚠️  Frames directory not found in Next.js public folder:', framesSource);
  }

  // Copy GV Prakash poster to gv-prakash folder
  const posterSource = join(process.cwd(), 'public', 'gvfrontcard.webp');
  const posterDest = join(outputDir, 'gvfrontcard.webp');

  if (existsSync(posterSource)) {
    console.log('Copying GV Prakash poster...');
    copyFileSync(posterSource, posterDest);
    console.log('✅ Poster copied to gv-prakash folder');
  } else {
    console.warn('⚠️  Poster file not found:', posterSource);
  }
} catch (error) {
  console.error('❌ Error building GV Prakash app:', error.message);
  // Make sure to rename package.json back even on error
  if (existsSync(packageJson)) {
    renameSync(packageJson, packageJsonLocal);
  }
  process.exit(1);
} finally {
  // Rename package.json back to package.json.local to hide from Vercel
  if (existsSync(packageJson)) {
    console.log('Hiding package.json from Vercel detection...');
    renameSync(packageJson, packageJsonLocal);
  }
}
