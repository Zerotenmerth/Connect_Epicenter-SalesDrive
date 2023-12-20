export function sendRequest(method, url, body, headers={'Content-type': 'application/json; charset=UTF-8'})
{
	return fetch(url, {
		method: method,
        body: body == null ? null : JSON.stringify(body),
		headers: headers
	})?.then(response=>
	{
		return response.json();
	}).catch(err =>{return err;});
}

import { CronJob } from 'cron';

export function startJob(start, func)
{
    const job= new CronJob(start, func, null, true, 'Europe/Kiev');
	job.start();
}
