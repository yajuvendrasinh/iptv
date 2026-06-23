const fs = require('fs');
const path = require('path');

// Mappings for popular country codes
const countryNameMap = {
  'ad': 'Andorra', 'ae': 'United Arab Emirates', 'af': 'Afghanistan', 'ag': 'Antigua and Barbuda',
  'al': 'Albania', 'am': 'Armenia', 'ao': 'Angola', 'ar': 'Argentina', 'at': 'Austria',
  'au': 'Australia', 'aw': 'Aruba', 'az': 'Azerbaijan', 'ba': 'Bosnia and Herzegovina',
  'bb': 'Barbados', 'bd': 'Bangladesh', 'be': 'Belgium', 'bf': 'Burkina Faso', 'bg': 'Bulgaria',
  'bh': 'Bahrain', 'bi': 'Burundi', 'bj': 'Benin', 'bm': 'Bermuda', 'bn': 'Brunei', 'bo': 'Bolivia',
  'bq': 'Bonaire', 'br': 'Brazil', 'bs': 'Bahamas', 'bw': 'Botswana', 'by': 'Belarus', 'bz': 'Belize',
  'ca': 'Canada', 'cd': 'Congo (DRC)', 'cf': 'Central African Republic', 'cg': 'Congo (Republic)',
  'ch': 'Switzerland', 'ci': 'Ivory Coast', 'cl': 'Chile', 'cm': 'Cameroon', 'cn': 'China',
  'co': 'Colombia', 'cr': 'Costa Rica', 'cu': 'Cuba', 'cv': 'Cape Verde', 'cw': 'Curaçao',
  'cy': 'Cyprus', 'cz': 'Czech Republic', 'de': 'Germany', 'dj': 'Djibouti', 'dk': 'Denmark',
  'dm': 'Dominica', 'do': 'Dominican Republic', 'dz': 'Algeria', 'ec': 'Ecuador', 'ee': 'Estonia',
  'eg': 'Egypt', 'eh': 'Western Sahara', 'er': 'Eritrea', 'es': 'Spain', 'et': 'Ethiopia',
  'fi': 'Finland', 'fj': 'Fiji', 'fm': 'Micronesia', 'fo': 'Faroe Islands', 'fr': 'France',
  'ga': 'Gabon', 'ge': 'Georgia', 'gf': 'French Guiana', 'gh': 'Ghana', 'gl': 'Greenland',
  'gm': 'Gambia', 'gn': 'Guinea', 'gp': 'Guadeloupe', 'gq': 'Equatorial Guinea', 'gr': 'Greece',
  'gt': 'Guatemala', 'gu': 'Guam', 'gy': 'Guyana', 'hk': 'Hong Kong', 'hn': 'Honduras',
  'hr': 'Croatia', 'ht': 'Haiti', 'hu': 'Hungary', 'id': 'Indonesia', 'ie': 'Ireland',
  'il': 'Israel', 'in': 'India', 'iq': 'Iraq', 'ir': 'Iran', 'is': 'Iceland', 'it': 'Italy',
  'jm': 'Jamaica', 'jo': 'Jordan', 'jp': 'Japan', 'ke': 'Kenya', 'kg': 'Kyrgyzstan', 'kh': 'Cambodia',
  'km': 'Comoros', 'kn': 'Saint Kitts and Nevis', 'kp': 'North Korea', 'kr': 'South Korea',
  'kw': 'Kuwait', 'kz': 'Kazakhstan', 'la': 'Laos', 'lb': 'Lebanon', 'lc': 'Saint Lucia',
  'li': 'Liechtenstein', 'lk': 'Sri Lanka', 'lr': 'Liberia', 'lt': 'Lithuania', 'lu': 'Luxembourg',
  'lv': 'Latvia', 'ly': 'Libya', 'ma': 'Morocco', 'mc': 'Monaco', 'md': 'Moldova', 'me': 'Montenegro',
  'mg': 'Madagascar', 'mk': 'North Macedonia', 'ml': 'Mali', 'mm': 'Myanmar', 'mn': 'Mongolia',
  'mo': 'Macau', 'mq': 'Martinique', 'mr': 'Mauritania', 'mt': 'Malta', 'mu': 'Mauritius',
  'mv': 'Maldives', 'mw': 'Malawi', 'mx': 'Mexico', 'my': 'Malaysia', 'mz': 'Mozambique',
  'na': 'Namibia', 'ne': 'Niger', 'ng': 'Nigeria', 'ni': 'Nicaragua', 'nl': 'Netherlands',
  'no': 'Norway', 'np': 'Nepal', 'nz': 'New Zealand', 'om': 'Oman', 'pa': 'Panama', 'pe': 'Peru',
  'pf': 'French Polynesia', 'pg': 'Papua New Guinea', 'ph': 'Philippines', 'pk': 'Pakistan',
  'pl': 'Poland', 'pr': 'Puerto Rico', 'ps': 'Palestine', 'pt': 'Portugal', 'py': 'Paraguay',
  'qa': 'Qatar', 'ro': 'Romania', 'rs': 'Serbia', 'ru': 'Russia', 'rw': 'Rwanda', 'sa': 'Saudi Arabia',
  'sd': 'Sudan', 'se': 'Sweden', 'sg': 'Singapore', 'si': 'Slovenia', 'sk': 'Slovakia',
  'sl': 'Sierra Leone', 'sm': 'San Marino', 'sn': 'Senegal', 'so': 'Somalia', 'sr': 'Surinam',
  'st': 'São Tomé and Príncipe', 'sv': 'El Salvador', 'sx': 'Sint Maarten', 'sy': 'Syria',
  'td': 'Chad', 'tg': 'Togo', 'th': 'Thailand', 'tj': 'Tajikistan', 'tl': 'East Timor',
  'tm': 'Turkmenistan', 'tn': 'Tunisia', 'tr': 'Turkey', 'tt': 'Trinidad and Tobago',
  'tw': 'Taiwan', 'tz': 'Tanzania', 'ua': 'Ukraine', 'ug': 'Uganda', 'uk': 'United Kingdom',
  'us': 'United States', 'uy': 'Uruguay', 'uz': 'Uzbekistan', 'va': 'Vatican City', 've': 'Venezuela',
  'vg': 'British Virgin Islands', 'vi': 'U.S. Virgin Islands', 'vn': 'Vietnam', 'ws': 'Samoa',
  'xk': 'Kosovo', 'ye': 'Yemen', 'yt': 'Mayotte', 'za': 'South Africa', 'zm': 'Zambia', 'zw': 'Zimbabwe'
};

const STREAMS_DIR = path.join(__dirname, '../../streams');
const OUTPUT_DIR = path.join(__dirname, '../src/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'channels-db.json');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Scanning directory:', STREAMS_DIR);

const m3uFiles = fs.readdirSync(STREAMS_DIR).filter(file => file.endsWith('.m3u'));
console.log(`Found ${m3uFiles.length} .m3u files.`);

const allChannels = [];
let uniqueIdCounter = 0;

for (const filename of m3uFiles) {
  // Extract country code from filename (e.g., 'ae.m3u' -> 'ae')
  const countryCode = filename.split('.')[0].split('_')[0]; // Handle cases like us_pluto.m3u
  const countryName = countryNameMap[countryCode] || countryCode.toUpperCase();
  
  const filePath = path.join(STREAMS_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let currentChannel = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    if (line.startsWith('#EXTINF:')) {
      // Parse info
      // Format: #EXTINF:-1 tvg-id="AjmanTV.ae@SD" tvg-logo="url" group-title="News",Ajman TV (1080p)
      const commaIndex = line.lastIndexOf(',');
      const infoPart = line.substring(0, commaIndex);
      const channelName = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Unknown Channel';
      
      // Match attributes using regex
      const idMatch = infoPart.match(/tvg-id="([^"]+)"/);
      const logoMatch = infoPart.match(/tvg-logo="([^"]+)"/);
      const groupMatch = infoPart.match(/group-title="([^"]+)"/);
      
      const channelId = idMatch ? idMatch[1] : `ch-${uniqueIdCounter++}`;
      const logo = logoMatch ? logoMatch[1] : null;
      const category = groupMatch ? groupMatch[1] : 'General';
      
      currentChannel = {
        id: channelId,
        name: channelName,
        logo,
        category,
        countryCode,
        countryName,
        url: ''
      };
    } else if (line.startsWith('#')) {
      // Skip comments or VLC options like #EXTVLCOPT
      continue;
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      // It's a stream URL
      if (currentChannel) {
        currentChannel.url = line;
        
        // Skip duplicate streams for the same channel to keep size small
        const isDuplicate = allChannels.some(ch => ch.id === currentChannel.id && ch.countryCode === currentChannel.countryCode);
        if (!isDuplicate) {
          allChannels.push(currentChannel);
        }
        currentChannel = null;
      }
    }
  }
}

console.log(`Parsed ${allChannels.length} channels in total.`);

// Save to disk
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allChannels, null, 2), 'utf-8');
console.log(`Successfully wrote ${allChannels.length} channels to ${OUTPUT_FILE}`);
