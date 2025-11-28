import mongoose from 'mongoose';
import User from './src/models/User';
import config from './src/config/config';

const resetPassword = async (username: string, newPassword: string) => {
  try {
    console.log(`Connecting to MongoDB at ${config.mongoUri}...`);
    await mongoose.connect(config.mongoUri);
    
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`User '${username}' not found.`);
      return;
    }

    // The pre-save hook in User.ts will automatically hash this password
    user.password = newPassword;
    await user.save();
    
    console.log(`✅ Password for user '${username}' has been successfully reset to: '${newPassword}'`);

  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await mongoose.disconnect();
  }
};

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: npx ts-node reset-password.ts <username> <newPassword>");
  process.exit(1);
}

resetPassword(args[0], args[1]);
