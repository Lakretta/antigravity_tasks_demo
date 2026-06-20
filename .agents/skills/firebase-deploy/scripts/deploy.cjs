const { execSync } = require('child_process');

console.log('=== STARTING AUTOMATED DEPLOYMENT ===');

try {
  console.log('1. Compiling production bundle (npm run build)...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✔ Build successful!\n');
} catch (error) {
  console.error('✘ Build compilation failed. Please correct compilation errors before deploying.');
  process.exit(1);
}

try {
  console.log('2. Deploying static assets to Firebase Hosting...');
  execSync('npx firebase-tools deploy --only hosting', { stdio: 'inherit' });
  console.log('✔ Firebase Hosting deployment completed successfully!');
} catch (error) {
  console.error('✘ Firebase deployment failed. Make sure you are logged in via "npx firebase-tools login".');
  process.exit(1);
}
