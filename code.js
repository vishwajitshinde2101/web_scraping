const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const appId = '9ddb5d3f375a4b74b8c5f06c9e84aee6';
const appCertificate = '904d1036447b40868b136599d5cf51c5';
const channelName = 'bid_bc48663e-135e-485b-9a02-d3faaa4ecbf7';
const uid = 0;
const role = RtcRole.PUBLISHER;
const expireTimeInSeconds = 3600;
const currentTimestamp = Math.floor(Date.now() / 1000);
const privilegeExpiredTs = currentTimestamp + expireTimeInSeconds;

const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs);
console.log('Generated Token:', token);
