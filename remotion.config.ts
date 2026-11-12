import {existsSync} from 'node:fs';
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// Vertical reels export, good quality/size balance.
Config.setCodec('h264');
Config.setCrf(18);

// Browser used for rendering. Remotion's bundled Chromium crashes on some
// recent macOS versions, so prefer a system Chrome when one is available:
//   1. CHROME_PATH env var (any OS), else
//   2. the default macOS Google Chrome location, if it exists, else
//   3. Remotion's own bundled browser.
const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chrome = process.env.CHROME_PATH || (existsSync(MAC_CHROME) ? MAC_CHROME : null);
if (chrome) {
  Config.setBrowserExecutable(chrome);
}
