import express from "express";
import fs from 'fs';

import path from "path";
import {fileURLToPath} from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import tokenEp from "./loginToEp.js";

import CheckNewOrdersEpicenter from './customWebHook.js'

import EpRequests from "./requestFileEp.js";
const epRequests = new EpRequests(tokenEp);

import RequestsSales from "./requestForSales.js";
const salesRequests = new RequestsSales();

import { ComparisonObjects, CreateClientDataObj, createObjWithoutUserData } from "./marketplaceMethods.js";


const PORT = 8080;
const app = express();

app.use(express.json());

app.get('/', (req, res)=>{

    res.send('<h1> All ok!</h1>');
})

app.post('/api/cancel_order', (req, res)=>{ //tested

    if(req.body.data.comment.includes('Ep'))
    {
        epRequests.changeToCancel(req.body.data.utmContent, req.body.data.rejectionReason);
        res.status(200).json('Cancel ok!');
    }
    else
    res.status(200).json('Nah not Ep order!');
})

app.post('/api/cancel_by_customer', (req, res)=>{ //tested

    const obj ={
        id: req.body.data.id,
        data: { salesdrive_manager: '3' }
    }
    salesRequests.editOrder(obj);
    res.status(200).json('Auto Manager select -  ok!');
})

app.post('/api/save_declaration_id', (req, res)=>{

    if(req.body.data.comment.includes('Ep'))
    {
        const epObj = epRequests.getDataFromOrder(req.body.data.utmContent);
        const comprasion = ComparisonObjects(req, epObj);
        if(!comprasion.isSameDelivery)
        {

        }
        if(!comprasion.isSamePhone)
        {
            epRequests.changeClientData(req.body.data.utmContent, {phone: req.body.data.contacts[0].phone[0]}); //tested
        }
        //epRequests.enteringTTN(req.body.data.utmContent, req.body.data.ord_delivery_data[0].trackingNumber); //tested
        res.status(200).json('save_declaration ok!');
    }
    else
    res.status(200).json('Nah not Ep order!');
})

app.post('/api/new_order', (req, res)=>{ //tested

    if(!req.body.data.comment.includes('Ep'))
    {
        const obj ={
            id: req.body.data.id,
            data: { statusId: '11' }
        }
        salesRequests.editOrder(obj);
        res.status(200).json('Change to proccesing -  ok!');
    }
    else
    res.status(200).json('Nah not Ep order!');
})

app.post('/api/processing_order', async (req, res)=>{ //tested

    if(req.body.data.comment.includes('Ep'))
    {
        epRequests.changeToConfirmedByMerchant(req.body.data.utmContent);
        const epObj = await epRequests.getDataFromOrder(req.body.data.utmContent);
        
        const objForSales = CreateClientDataObj(epObj);
        objForSales.id = req.body.data.id;
        salesRequests.editOrder(objForSales);
        res.status(200).json('Confirmed to merchant ok!');
    }
    else
    res.status(200).json('Nah not Ep order!');
})

app.post('/api/confirmed_order', (req, res)=>{

    if(req.body.data.comment.includes('Ep'))
    {
        epRequests.changeToConfirmed(req.body.data.utmContent);
        res.status(200).json('Confirmed ok!');
    }
    else
    res.status(200).json('Nah not Ep order!');
})

app.post('/api/new_order_ep', (req, res)=>{ //tested

    req.forEach(async(order) => {
        const epObj = await epRequests.getDataFromOrder(order);
        const objForSales = createObjWithoutUserData(epObj);
        salesRequests.addOrder(objForSales);
        res.status(200).json('new orders created ok!');
    })    
    
})

app.post('/api/miss_call', (req, res)=>{ //tested

    if(req.body.data.comment.includes('Ep'))
    {
        epRequests.changeCallStatus(req.body.data.utmContent, req.body.data.statusId);
        res.status(200).json('Change call status ok!');
    }
    else
    res.status(200).json('Nah not Ep order!');
})

// async function test(){
//     // const file = JSON.parse(fs.readFileSync('./UkrSalesObj.json', 'utf-8'))
//     // epRequests.getDepartmentInfo(file);
//     CheckNewOrdersEpicenter(tokenEp);
// }
// test();

 app.listen(PORT, ()=>console.log(`Server started! Port: ${PORT}`));
 setInterval(()=>{CheckNewOrdersEpicenter(tokenEp)}, 60000);
