import fs from 'fs';
import sendRequest from './features.js';
const loginData = JSON.parse(fs.readFileSync('./data/epicenter_private_data.json', 'utf-8'));
const tokenData = await sendRequest('POST', 'https://core-api.epicentrm.cloud/v1/users/login', loginData);
const tokenEp =tokenData.token.auth;
 export default tokenEp;
