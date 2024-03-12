import {sendRequest} from "./features.js";
import fs from 'fs';
const promToken = JSON.parse(fs.readFileSync('./data/secureFile.json', 'utf-8')).prom;

export default class RequestsProm{
    #headers;
    constructor()
    {
        this.#headers = {'Content-type': 'application/json; charset=UTF-8',  'Authorization': `Bearer ${promToken}`}
    }
    async getDataFromOrder(externalId)
    {
        const result = await sendRequest('GET', `https://my.prom.ua/api/v1/orders/${externalId}`, null, this.#headers);
        return result;
    }
}