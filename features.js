export default function sendRequest(method, url, body, headers={'Content-type': 'application/json; charset=UTF-8'})
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