import express from "express";

import EpRequests from "./requestFileEp.js";
const epRequests = new EpRequests();

import RequestsSales from "./requestForSales.js";
const salesRequests = new RequestsSales();

import RequestsProm from "./requestForProm.js";
const promRequests = new RequestsProm();

import CheckNewOrdersEpicenter from './customWebHook.js';
import CheckPaidOrdersSales from './paidWebhook.js'
import {MarketplaceMethods, GetOurDateTime} from "./marketplaceMethods.js";
const marketMethods = new MarketplaceMethods();

import { startJob } from "./features.js";



const PORT = 8080;
const app = express();

app.use(express.json());

app.get('/', (_, res)=>{

    res.send('<h1> All ok!</h1>');
})

app.post('/api/cancel_order', async (req, res)=>{

    if(req.body.data.comment.includes('Ep'))
    {
        res.status(200).json('Cancel ok!');
        await epRequests.changeToCancel(req.body.data.utmContent, req.body.data.rejectionReason/1);
    }
    else
    res.status(200).json('Nah not Ep order!');
})

app.post('/api/cancel_by_customer', async(req, res)=>{

    res.status(200).json('Auto Manager select -  ok!');
    const obj ={
        id: req.body.data.id,
        data: { salesdrive_manager: '3' }
    }
    await salesRequests.editOrder(obj);
})

app.post('/api/save_declaration_id', async (req, res)=>{

    if(req.body.data.comment.includes('Ep'))
    {
        res.status(200).json('save_declaration ok!');

        const epObj = await epRequests.getDataFromOrder(req.body.data.utmContent);
        const comprasion = marketMethods.comparisonObjects(req.body, epObj);
        const typeMail = req.body.data.ord_delivery == 'ukrposhta' ? 'ukrposhta' : 'nova_poshta';
        const TTN = req.body.data[`ord_${req.body.data.ord_delivery}`]?.EN || 
                    req.body.data[`ord_${req.body.data.ord_delivery}`]?.barcode;
        if(!comprasion.isSameDelivery)
        {
            const DeliveryObj = await epRequests.getDepartmentInfo(req.body);
            console.log(DeliveryObj);
            await epRequests.changeDelivery(req.body.data.utmContent, typeMail, DeliveryObj);
        }
        if(!comprasion.isSamePhone)
        {
            const phone = req.body.data.contacts[0].phone[0];
            const {firstName, lastName, email} =epObj.address;
            await epRequests.changeClientData(req.body.data.utmContent, {firstName, lastName, email, phone}); 
        }
        
        epRequests.enteringTTN(req.body.data.utmContent, typeMail, TTN); 
    }
    else
    res.status(200).json('Nah not Ep order!');
})

app.post('/api/new_order', (req, res)=>{

    if(!req.body.data.comment.includes('Ep'))
    {
        const obj ={
            id: req.body.data.id,
            data: { statusId: '11' }
        }
        setTimeout(()=>{
            salesRequests.editOrder(obj);
            res.status(200).json('Change to proccesing -  ok!');
        }, 3000);
    }
    else
    res.status(200).json('Nah not Ep order!');
})

app.post('/api/processing_order', async (req, res)=>{

    if(req.body.data.comment.includes('Ep'))
    {
        res.status(200).json('Confirmed to merchant ok!');
        
        await epRequests.changeToConfirmedByMerchant(req.body.data.utmContent);
        const epObj = await epRequests.getDataFromOrder(req.body.data.utmContent);
        
        const objForSales = marketMethods.createClientDataObj(epObj);
        objForSales.id = req.body.data.id;
        await salesRequests.editOrder(objForSales);
    }
    else
    res.status(200).json('Nah not Ep order!');
})

app.post('/api/confirmed_order', async(req, res)=>{

    if(req.body.data.comment.includes('Ep'))
    {
        res.status(200).json('Confirmed ok!');
        if(req.body.data.comment.includes('easypay'))
        {
            const difference = marketMethods.differenceBTWCreateTime(req.body.data.orderTime);
            const realTime = new Date(GetOurDateTime());
            console.log(realTime);
            console.log(new Date(realTime.getTime() + difference));
            startJob(new Date(realTime.getTime() + difference), async()=>{
                const epObj = await epRequests.getDataFromOrder(req.body.data.utmContent);
                let comment = req.body.data.comment.replace('easypay', '');
                let obj ={
                    id: req.body.data.id,
                    data: { payment_method:'id_14', comment }
                }
                if(epObj.address.shipment.paymentStatus=='hold_set')
                {
                    obj.data.comment+='\n$Кабинет эпицентра!';
                    obj.data.statusId = '2';
                }
                else{
                    obj.data.comment= `НЕ ОПЛАЧЕН! ${obj.data.comment}`;
                    const deliveryObj = {
                        officeId: epObj.address.shipment.officeId, 
                        paymentProvider: "pay_on_delivery",
                        settlementId: epObj.address.shipment.settlementId
                    }
                    await epRequests.changeDelivery(req.body.data.utmContent, epObj.address.shipment.provider, deliveryObj);
                }
                await salesRequests.editOrder(obj);
                await epRequests.changeToConfirmed(req.body.data.utmContent);
            });
        }
        else
        await epRequests.changeToConfirmed(req.body.data.utmContent);
    }
    else
    res.status(200).json('Nah not Ep order!');
})

app.post('/api/new_order_ep', (req, res)=>{

    res.status(200).json('new orders created ok!');
    req.body.forEach(async(order) => {
        const epObj = await epRequests.getDataFromOrder(order);
        const objForSales = marketMethods.createObjWithoutUserData(epObj);
        salesRequests.addOrder(objForSales);
    })    

})

app.post('/api/paid_order_sales', (req, res)=>{
    req.body.forEach(async(order) => {
        const obj ={
            id: order.id,
            data: { statusId: '2' }
        }
        await salesRequests.editOrder(obj);
    })    
})

app.post('/api/check_paid_prom', (req, res)=>{
    req.body.forEach(async (order)=> {
        const resultOfPromOrder = await promRequests.getDataFromOrder(order.externalId);
        const resOfPaid = resultOfPromOrder?.order.payment_data.status || 'unpaid';
        if(resOfPaid =='paid')
        {
            const obj ={
                id: order.id,
                data: { statusId: '2' }
            }
            await salesRequests.editOrder(obj); 
        }  
    })
})

app.post('/api/miss_call', async (req, res)=>{

    if(req.body.data.comment.includes('Ep'))
    {
        res.status(200).json('Change call status ok!');
        await epRequests.changeCallStatus(req.body.data.utmContent, req.body.data.statusId/1);
    }
    else
    res.status(200).json('Nah not Ep order!');
})

     app.listen(PORT, ()=>console.log(`Server started! Port: ${PORT}`));
     startJob('0 */1 * * * *', CheckNewOrdersEpicenter);
     startJob('0 */15 * * * *', CheckPaidOrdersSales);

startJob('0 0 */3 * * *', epRequests.regenerateToken);