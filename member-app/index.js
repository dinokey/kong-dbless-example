const express = require('express');
const bodyParser = require('body-parser');

var members = [
    {
        name: "dino",
        place: "jakarta"
    }, {
        name: "doni",
        place: "bandung"
    }];

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    console.log('root path', req.body);
    console.log('headers', req.headers);
    res.status(200).send({
        message: 'hello! this is root path',
    })
});

app.get('/api/v1/members', (req, res) => {
    console.log('get members', req.body);
    console.log('headers', req.headers);
    res.status(200).send({
        members,
    })
}); 

app.post('/api/v1/members', (req, res) => {
    console.log('post member', req.body);
    console.log('headers', req.headers);
    return res.status(201).send({
        data: req.body,
    })
})

app.delete('/api/v1/members', (req, res) => {
    console.log('delete member', req.body);
    console.log('headers', req.headers);
    return res.status(204).send({
        success: 'true',
        count: 1,
    })
})

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`)
});
