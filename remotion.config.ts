import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// Vertical reels export, good quality/size balance.
Config.setCodec('h264');
Config.setCrf(18);
