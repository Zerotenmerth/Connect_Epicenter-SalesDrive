import {sendRequest} from "./features.js";
import fs from 'fs';
const salesToken = fs.readFileSync('./data/sales_private_data.ini', 'utf-8');

export default class RequestsSales{
    #salesToken;
    constructor()
    {
        this.#salesToken = salesToken;
    }
    async addOrder(obj)
    {
        await sendRequest('POST', 'https://inbasket.salesdrive.me/handler/', this.#addNewAtributeToObj(obj));
    }
    async editOrder(obj)
    {
       await sendRequest('POST', 'https://inbasket.salesdrive.me/api/order/update/', this.#addNewAtributeToObj(obj));
    }
    #addNewAtributeToObj(obj)
    {
        const newObj=obj;
        newObj.form= this.#salesToken;
        return newObj;
    }
}