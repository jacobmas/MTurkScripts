var parseAddress=require('parse-address');
const c=require('./global/Address.js');

var ax=new c.Address('W6170 County Road EE\nBay City, WI 54723 -8511 ',0);

console.log("ax="+JSON.stringify(ax));