const axios = require('axios');
axios.get('http://webcode.me').then(resp => {
    console.log(resp.data);
});
/*


import express from 'express';
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
*/ 
//# sourceMappingURL=app.js.map