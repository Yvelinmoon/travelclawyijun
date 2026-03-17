const { updateNickname, updateAvatar, searchCharacterImage } = require('./discord-profile.js');

const GUILD_ID = process.env.DISCORD_GUILD_ID || '1480912787814350868';
const CHARACTER_NAME = 'Artoria Pendragon';
const FROM = '《Fate/stay night》';

async function main() {
  console.log('Starting Discord profile update...');

  try {
    // 1. Update nickname
    console.log('Updating nickname...');
    await updateNickname(GUILD_ID, CHARACTER_NAME);
    console.log('✅ Nickname updated to: ' + CHARACTER_NAME);
  } catch (err) {
    console.error('❌ Nickname update failed:', err.message);
  }

  try {
    // 2. Search for avatar
    console.log('Searching for character avatar...');
    const imageUrl = await searchCharacterImage(CHARACTER_NAME, FROM);

    if (imageUrl) {
      console.log('Found avatar URL:', imageUrl);

      // 3. Update avatar
      console.log('Updating avatar...');
      await updateAvatar(imageUrl);
      console.log('✅ Avatar updated');

      // Output URL for subsequent use
      console.log('IMAGE_URL:' + imageUrl);
    } else {
      console.log('❌ Character avatar not found');
      console.log('IMAGE_URL:null');
    }
  } catch (err) {
    console.error('❌ Avatar update failed:', err.message);
    console.log('IMAGE_URL:error:' + err.message);
  }
}

main().catch(console.error);
