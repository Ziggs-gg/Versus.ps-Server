const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

const server = app.listen(3000, () => {
    console.log('Start Server : localhost:3000'); // 서버시작 메시지
});

app.use(cors());  //cors 설정 모두 개방
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const routes = require('./routes');
app.use('/', routes);



