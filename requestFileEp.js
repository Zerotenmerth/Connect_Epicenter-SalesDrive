import {sendRequest} from "./features.js";
import fs from 'fs';

import generateTokenToFile from "./loginToEp.js";
await generateTokenToFile();

export function CreateHeaders()
{
    const tokenEp = fs.readFileSync('./data/epToken.ini', 'utf-8');
    return {
        'Content-type': 'application/json; charset=UTF-8',
        'Authorization': `Bearer ${tokenEp}`
    };
}

export default class EpRequests{
    regenerateToken()
    {
        generateTokenToFile();
    }
    async findOrderID(externalId)
    {
        const result = await sendRequest('GET', `https://core-api.epicentrm.cloud/v2/oms/orders?filter%5Bnumber%5D=${externalId}`, null, CreateHeaders())
        return result.id;
    }
    async getDataFromOrder(orderID)
    {
        const result = await sendRequest('GET', `https://core-api.epicentrm.cloud/v2/oms/orders/${orderID}`, null, CreateHeaders());
        return result;
    }
    async getCityID(city, deliveryName)
    {
        const result = await sendRequest('GET', `https://core-api.epicentrm.cloud/v2/deliveries/${deliveryName}/settlements?title=${city}`, 
                             null, CreateHeaders());
        return result.items.find(item => item.title == city || item.city == city)?.id || result.items[0].id;
    }
    async getDepartmentInfo(obj)
    {
        const {city, deliveryName, departmentCode} = GetInfoAboutDeliverySales(obj);
        const cityID = await this.getCityID(city, deliveryName);

        const result = await sendRequest('GET', 
        `https://core-api.epicentrm.cloud/v2/deliveries/${deliveryName}/settlements/${cityID}/offices`, 
        null , CreateHeaders());

        const ourResult = FindDepartment(result, deliveryName, departmentCode);
        return ourResult;
    }
    async changeClientData(orderID, obj)
    {
        await sendRequest('POST', `https://core-api.epicentrm.cloud/v2/oms/orders/${orderID}/client-data`, obj, CreateHeaders());
    }
    async changeDelivery(orderID, typeMail, obj)
    {
        await sendRequest('POST', `https://core-api.epicentrm.cloud/v2/oms/orders/${orderID}/delivery-data/${typeMail}`, obj, CreateHeaders());
    }
    async enteringTTN(orderID, typeMail, deliveryNumber)
    {
        await sendRequest('POST', `https://core-api.epicentrm.cloud/v2/oms/orders/${orderID}/delivery-number/${typeMail}`,
                    {number: deliveryNumber}, CreateHeaders());
    }
    async changeToCancel(orderID, rejectID)
    {
        const rejObj = GetRejectReason(rejectID);
        await sendRequest('POST', `https://core-api.epicentrm.cloud/v2/oms/orders/${orderID}/change-status/to/canceled`,
        rejObj, CreateHeaders());
    }
    async changeToConfirmed(orderID)
    {
        this.changeCallStatus(orderID);
        await sendRequest('POST', `https://core-api.epicentrm.cloud/v2/oms/orders/${orderID}/change-status/to/confirmed`, null, CreateHeaders());
    }
    async changeToConfirmedByMerchant(orderID)
    {
        await sendRequest('POST', `https://core-api.epicentrm.cloud/v2/oms/orders/${orderID}/change-status/to/confirmed_by_merchant`, null, CreateHeaders());
    }
    async changeCallStatus(orderID, callID)
    {
        const callObj = GetCallStatus(callID);
        await sendRequest('POST', `https://core-api.epicentrm.cloud/v2/oms/orders/${orderID}/call-status`, 
        callObj, CreateHeaders());
    }

}

function GetRejectReason(rejectID)
{
    let reason_code; let comment="Не влаштовує"; let translationKey;
    switch (rejectID) {
        case 35:
            reason_code= "customer_dissatisfied_with_the_shipping_cost";
            translationKey= "order.customer_cancel_reason.customer_dissatisfied_with_the_shipping_cost";
        break;
        case 36:
            reason_code= "customer_delivery_speed_too_slow";
            translationKey= "order.customer_cancel_reason.customer_delivery_speed_too_slow";
        break;
        case 37:
            reason_code= "customer_product_characteristics_are_not_suitable";
            translationKey= "order.customer_cancel_reason.customer_product_characteristics_are_not_suitable";
        break;
        case 38:
            reason_code= "customer_not_timely_confirmation_of_the_availability_of_goods";
            comment= "Нема в наявностi";
            translationKey= "order.customer_cancel_reason.customer_not_timely_confirmation_of_the_availability_of_goods";
        break;
        case 39:
            reason_code= "customer_failed_to_contact";
            comment= "Не вийшло зв`язатись";
            translationKey= "order.customer_cancel_reason.customer_failed_to_contact";
        break;
        case 40:
            reason_code= "customer_other_reason";
            comment= "Клiєнт передумав!";
            translationKey= "order.customer_cancel_reason.customer_other_reason";
        break;
        case 41:
            reason_code= "customer_bought_elsewhere_as_a_gift";
            comment= "Вже придбав";
            translationKey= "order.customer_cancel_reason.customer_bought_elsewhere_as_a_gift";
        break;
        case 42:
            reason_code= "customer_order_duplicate";
            comment= "Дубль замовлення";
            translationKey= "order.customer_cancel_reason.customer_order_duplicate";
        break;
        case 61:
            reason_code= "customer_other_reason";
            comment= "Передплату не було сплачено!";
            translationKey= "order.customer_cancel_reason.customer_other_reason";
        break;
        case 62:
            reason_code= "customer_prepayment_required";
            translationKey= "order.customer_cancel_reason.customer_prepayment_required";
        break;
    }
    return {reason_code, comment, translationKey};
}
function GetCallStatus(callID)
{
    let callStatus;
    switch (callID) {
        case 10:
            callStatus='first_fail';
            break;
        case 12:
            callStatus='second_fail';
            break;
        default:
            callStatus='success';
            break;
    }
    return {callStatus};
}
function GetInfoAboutDeliverySales(obj)
{
        let deliveryName;
        let city = obj.data[`ord_${obj.data.ord_delivery}`].cityName;
        let departmentCode;

        if(obj.data.ord_delivery=='novaposhta')
        {
            deliveryName='nova_poshta';
            city= city.replace('м. ', '').replace('с-ще ', '').replace('с. ', '').replace('смт. ', '');
            if(city.includes(' ('))
                city =city.substring(0, city.indexOf(' ('));

            departmentCode=obj.data.ord_novaposhta.branchNumber;
        }
        else{
            deliveryName = 'ukrposhta';
            departmentCode=obj.data.ord_ukrposhta.branch;
        }
        return {deliveryName, city, departmentCode}
}
function FindDepartment(result, deliveryName, departmentCode)
{
    let department;
    let officeId; let settlementId;
    switch (deliveryName) 
    {
        case 'ukrposhta':
            department = result.items.find(item => item.post_code == departmentCode);
            if(department){
                officeId=department.id; 
                settlementId=department.settlement_id;
            }
            else{
                officeId= result.items[0]?.id || "faa13167-76f4-4ffd-8fab-77c48fc93dee";
                settlementId= result.items[0]?.settlement_id || "01c6bfc3-bcfb-4f46-9cd2-dcb2e49c4ca9";
            }
            break;
    
        case 'nova_poshta':
            department = result.items.find(item => item.title.includes(departmentCode));
            if(department){
                officeId=department.id; 
                settlementId=department.settlementId;
            }
            else{
                officeId= result.items[0]?.id || "511a8c94-1822-402f-9633-7d7659e4f090";
                settlementId= result.items[0]?.settlementId || "0ecaee44-f9c4-4912-bd17-3814e8e3b7d1";
            }
            break;
    }
    
    return {
            officeId,
            settlementId,
            paymentProvider: "pay_on_delivery"
           }
}
