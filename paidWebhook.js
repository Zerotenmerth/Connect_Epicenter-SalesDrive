import {sendRequest} from "./features.js";
import fs from 'fs';

const ourIp = fs.readFileSync('./data/currentIp.ini', 'utf-8');

const tokensFile=  JSON.parse(fs.readFileSync('./data/secureFile.json', 'utf-8'));


export default function SendPaidHook()
{
    ScanFilterStatus('79', 'paid_order_sales');
    ScanFilterStatus('22', 'check_paid_prom');
}

async function ScanFilterStatus(status,  postID)
{
    const result = await sendRequest('GET', `https://inbasket.salesdrive.me/api/order/list/?filter[payment_method]=${status}`, null,
    {'Content-type': 'application/json; charset=UTF-8', 'Form-Api-Key': tokensFile.salesDriveRead});

    const arrEncryptedID = result.data?.filter(x=>[10, 11, 12, 27].includes(x.statusId/1)).map(x=>{return {id:x.id, externalId: x.externalId}}) || [];
    if(arrEncryptedID.length!=0)
    await sendRequest('POST', `${ourIp}:8080/api/${postID}`, arrEncryptedID); 
}



