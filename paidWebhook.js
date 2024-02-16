import {sendRequest} from "./features.js";
import fs from 'fs';

const ourIp = fs.readFileSync('./data/currentIp.ini', 'utf-8');

const tokenForRead =  fs.readFileSync('./data/salesReadToken.ini', 'utf-8');

export default async function SendPaidHook()
{
    
    let result = await sendRequest('GET', 'https://inbasket.salesdrive.me/api/order/list/?filter[payment_method]=79', null,
    {'Content-type': 'application/json; charset=UTF-8', 'Form-Api-Key': tokenForRead});

    const arrEncryptedID = result.data.filter(x=>[10, 11, 12, 27].includes(x.statusId/1))?.map(x=>x.id) || [];

    if(arrEncryptedID.length!=0)
    await sendRequest('POST', `${ourIp}:8080/api/paid_order_sales`, arrEncryptedID); 
}
