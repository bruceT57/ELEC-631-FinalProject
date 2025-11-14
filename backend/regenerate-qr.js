const mongoose = require('mongoose');
const QRCode = require('qrcode');
require('dotenv').config();

// Local IP detection
const os = require('os');
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const ifaces = interfaces[name];
    if (ifaces) {
      for (const iface of ifaces) {
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`Found local IP: ${iface.address} (interface: ${name})`);
          return iface.address;
        }
      }
    }
  }
  console.warn('Could not detect local IP, falling back to localhost');
  return 'localhost';
}

const localIp = getLocalIpAddress();
const frontendUrl = `http://${localIp}:3001`;

console.log(`Frontend URL for QR codes: ${frontendUrl}`);

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutoring-tool';

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Load VirtualSpace model
    const VirtualSpaceSchema = new mongoose.Schema({
      tutorId: mongoose.Schema.Types.ObjectId,
      name: String,
      description: String,
      spaceCode: String,
      qrCode: String,
      status: String,
      startTime: Date,
      endTime: Date,
      participants: [mongoose.Schema.Types.ObjectId],
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });
    
    const VirtualSpace = mongoose.model('VirtualSpace', VirtualSpaceSchema, 'virtualspaces');
    
    const spaces = await VirtualSpace.find({});
    console.log(`Found ${spaces.length} spaces`);
    
    let updated = 0;
    for (const space of spaces) {
      const url = `${frontendUrl}/join/${space.spaceCode}`;
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2
      });
      
      space.qrCode = qrCodeDataUrl;
      await space.save();
      console.log(`✓ Regenerated QR code for space: ${space.name} (${space.spaceCode})`);
      updated++;
    }
    
    console.log(`\n✓ Successfully regenerated QR codes for ${updated} spaces`);
    console.log(`All QR codes now point to: ${frontendUrl}`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
