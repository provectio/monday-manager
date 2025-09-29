import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Configuration de Monday Project Manager\n');

// Vérifier si .env.local existe déjà
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ Le fichier .env.local existe déjà');
  console.log('📝 Vous pouvez le modifier avec vos paramètres\n');
} else {
  // Copier env.example vers .env.local
  const examplePath = path.join(__dirname, 'env.example');
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log('✅ Fichier .env.local créé à partir de env.example');
    console.log('📝 Veuillez maintenant :');
    console.log('   1. Ouvrir le fichier .env.local');
    console.log('   2. Remplacer "your_api_token_here" par votre token API Monday');
    console.log('   3. Redémarrer l\'application avec "npm run dev"\n');
  } else {
    console.log('❌ Fichier env.example non trouvé');
  }
}

console.log('🔧 Variables d\'environnement requises :');
console.log('   VITE_MONDAY_API_TOKEN - Votre token API Monday');
console.log('   VITE_MONDAY_API_ENDPOINT - URL de l\'API (par défaut: https://api.monday.com/v2)');
console.log('   VITE_MONDAY_API_VERSION - Version de l\'API (par défaut: 2025-10)');
console.log('   VITE_MONDAY_WORKSPACE_NAME - Nom de votre workspace (par défaut: Pilotage)\n');

console.log('📚 Pour obtenir votre token API :');
console.log('   1. Connectez-vous à Monday.com');
console.log('   2. Cliquez sur votre avatar → Administration');
console.log('   3. Connexions → Jeton API personnel');
console.log('   4. Copiez votre token\n');
