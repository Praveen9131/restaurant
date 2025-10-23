#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🍰 SeaSide Bake Logo Setup');
console.log('============================');
console.log('');
console.log('To add your logo from the WhatsApp image:');
console.log('');
console.log('1. Save your logo image as "logo.png"');
console.log('2. Place it in the "public" folder');
console.log('3. The logo will automatically appear in the navbar');
console.log('');
console.log('📁 Current public folder contents:');
console.log('');

const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  const files = fs.readdirSync(publicDir);
  files.forEach(file => {
    console.log(`   📄 ${file}`);
  });
  
  if (files.includes('logo.png') || files.includes('logo.jpg')) {
    console.log('');
    console.log('✅ Logo file found! Your SeaSide Bake logo should be visible in the navbar.');
    if (files.includes('logo.jpg')) {
      console.log('   📸 Using logo.jpg from your WhatsApp image');
    }
  } else {
    console.log('');
    console.log('❌ logo.png or logo.jpg not found. Please add your logo to the public folder.');
  }
} else {
  console.log('   📁 public folder not found');
}

console.log('');
console.log('🚀 Start the development server:');
console.log('   npm run dev');
console.log('');
console.log('🌐 View your site at: http://localhost:5173');
