function createFullEpObjFromOrder(obj)
{
    let commentary = `!auto! Ep ${obj.comment}`;
    const statusOfPayment = obj.address.shipment.paymentStatus;

    if(statusOfPayment=='hold_set')
        commentary+='$Кабинет эпицентра!';

    const shipmentMethod = obj.address.shipment.provider;
    const direction= obj.office.title;
    let typeMail;
    let ukrMail={WarehouseNumber: ''}; 
    let novaMail={WarehouseNumber: '', city: ''};

    if(shipmentMethod=='nova_poshta')
    {
        typeMail='id_9';
        novaMail.WarehouseNumber = direction.substring(direction.indexOf('№')+2, direction.indexOf(','));
        novaMail.city= obj.settlement.title;
    }else{
        typeMail='id_17';
        ukrMail.WarehouseNumber=direction.substring(direction.indexOf('№')+2, direction.indexOf(','));
    }
    
    const products =[];
    obj.items.forEach(item=>{
        products.push({id: item.sku, costPerItem: item.price, amount: item.quantity})
    });

   return {
        getResultData: '1',
        products: products,
        comment: commentary,
        externalId: obj.number,
        fName: obj.address.firstName,
        lName: obj.address.lastName,
        mName: obj.address?.patronymic || '',
        phone: obj.address.phone,
        email: obj.address?.email || '',
        shipping_address: direction,
        shipping_method: typeMail,
        payment_method: "id_14",
        novaposhta: novaMail,
        ukrposhta: ukrMail,
        sajt: "inbasket.com.ua",
        salesdrive_manager: '3'
    };
}

export default class MarketplaceMethods{

    createObjWithoutUserData(obj)
    {
        let commentary = `*auto* Ep ${obj.comment}`;
        const shipmentMethod = obj.address.shipment.provider;
        const direction= obj.office.title;
        let typeMail;
        let ukrMail={WarehouseNumber: ''}; 
        let novaMail={WarehouseNumber: '', city: ''};

        if(shipmentMethod=='nova_poshta')
        {
            typeMail='id_9';
            novaMail.WarehouseNumber = direction.substring(direction.indexOf('№')+2, direction.indexOf(','));
            novaMail.city= obj.settlement.title;
        }else{
            typeMail='id_17';
            ukrMail.WarehouseNumber=direction.substring(direction.indexOf('№')+2, direction.indexOf(','));
        }
        
        const products =[];
        obj.items.forEach(item=>{
            products.push({id: item.sku, costPerItem: item.price, amount: item.quantity})
        });

        return {
            getResultData: '1',
            products: products,
            comment: commentary,
            externalId: obj.number,
            shipping_address: direction,
            shipping_method: typeMail,
            payment_method: "id_14",
            novaposhta: novaMail,
            ukrposhta: ukrMail,
            sajt: "inbasket.com.ua",
            prodex24content: obj.id
        }
    }

    createClientDataObj(obj)
    {
        let commentary = `*Ep* ${obj.comment}`;
        const statusOfPayment = obj.address.shipment.paymentStatus;

        switch (statusOfPayment) {
            case 'hold_set':
                commentary+='\n$Кабинет эпицентра!'
                break;
            case 'payment_waiting':
                commentary=`easypay ${commentary}`;
                break;
        }
        
        return {
            getResultData: '1',
            data:{
                fName: obj.address.firstName,
                lName: obj.address.lastName,
                mName: obj.address?.patronymic || '',
                phone: obj.address.phone,
                email: obj.address?.email || '',
                comment: commentary
            }
        };
    }

    comparisonObjects(salesObj, epObj)
    {
        const comprasion ={isSamePhone:true, isSameDelivery: true}
        if(salesObj.data.contacts[0].phone[0] !== epObj.address.phone)
        comprasion.isSamePhone=false;

        const typeMail = salesObj.data.ord_delivery == 'novaposhta' ? 'nova_poshta' : salesObj.data.ord_delivery;
        if(typeMail !== epObj.address.shipment.provider)
        comprasion.isSameDelivery=false;

        return comprasion;
    }

    differenceBTWCreateTime(crTime)
    {
        const realTime = GetOurDateTime()
        const difference = 11100000 - (realTime-new Date(crTime));
        if(difference>0)
            return difference;
         else
        return 5000;
    }
}

function GetOurDateTime()
{
    const date = new Date();
    const UATime = date.toLocaleString("ru-RU", {timeZone: "Europe/Kyiv"});
    const arrs = UATime.split(',');
    let result=arrs[1];
    result=`${arrs[0].split('.').reverse().join('-')}${result}`;
    return result;
}