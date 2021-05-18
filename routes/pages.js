const express = require('express');
const Blockchain = require('../blockchain')
const router = express.Router();
const crypto = require("crypto");
const got = require('got');
const request = require('request');
var forge = require("node-forge");
const pem = require('pem-file');
var fs = require("fs");
var bodyParser = require('body-parser');
var qrcode = require('qrcode');

var mutTransactions = []

class Transaction {
  constructor(sender, reciever, amount, date = new Date()){
    this.sender = sender;
    this.reciever = reciever;
    this.amount = amount;
    this.date = date
    this.sig = ""
  }
  setSignature(sig) {
    this.sig = sig
  }
}


var transactionTestingArray = [new Transaction("10", "10", 10)];
var temp = "";
var balance = 0;

const routing_server_address = "http://localhost:3000/urls"
var urls = []


// Uncomment these variables and functions if you need to generate keys
/* var { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
}); */

/* fs.writeFile('./privateKey.pem', privateKey, function (err) {
  if (err) throw err;
  console.log('key written');
}); */

/*fs.writeFile('./publicKey.pem', publicKey, function(err) {
  if(err) throw err;
  console.log('public key written')
}) */

//Read private key from the pem file
privateKey = fs.readFileSync('./privateKey.pem', 'utf8')
publicKey = fs.readFileSync('./publicKey.pem', 'utf8')

//generateQR input : key , output : qrcode as image
const generateQR = async key => {
  try {
    await qrcode.toFile('./public/harshpatel.png', key);
  } catch (err) {
    console.error(err)
  }
}

const generateQRpub = async key => {
  try {
    await qrcode.toFile('./public/publicKey.png', key);
  } catch (err) {
    console.error(err)
  }
}

const reqTransaction = (publicKey) => {
  console.log(urls)
  urls.forEach((url, i) => {
    const options = {
      url: urls[i] + 'transactionRequest',
      json: true,
      body: {
          pub : publicKey
      }
    };

    request.post(options, (err, res, body) => {
        if (err) {
            return console.log(err);
        }
        console.log(`Status: ${res.statusCode}`);
        if(body.length > mutTransactions.length){mutTransactions = body}
    });
  });

}

const updateUrls = async () => {
  try {
    const resp = await got(routing_server_address);
    let listAsString = resp.body;
    listAsString = listAsString.replace(/]/g, "");
    listAsString = listAsString.replace(/\[/g, "");
    listAsString = listAsString.replace(/"/g, "");
    urls = listAsString.split(',')
  } catch (e) {console.log(e)}
}

const grabBalance = () => {
  let bal = 0;
  let pk = publicKey.toString("base64")

  transactionTestingArray.forEach((item) => {
    if(item.reciever == pk){bal += item.amount}
    if(item.sender == pk){bal -= item.amount}
  });
  return bal
}

//Helper function that takes a transaction as input sends to the network
const sendTransaction = transaction => {

  urls.forEach((url, i) => {
    const options = {
      url: urls[i] + 'addTransaction',
      json: true,
      body: {
          sender : transaction.sender,
          reciever : transaction.reciever,
          amount : transaction.amount,
          date : JSON.stringify(transaction.date),
          sig : transaction.sig
      }
    };

    request.post(options, (err, res, body) => {
        if (err) {
            return console.log(err);
        }
        console.log(`Status: ${res.statusCode}`);
    });
  });
}



generateQR(privateKey);
var bc = new Blockchain();
//create helper to get res.body of the chain into a useable form

router.get('/', (req, res) => {
  balance = grabBalance();
  if(mutTransactions.length > 0){transactionTestingArray = mutTransactions}
  let data = [privateKey, publicKey, balance, transactionTestingArray];
  res.render('wallet', {data : data});
});

router.post('/urls', (req, resp) => {
  updateUrls();
  resp.redirect('/');
});


//Fix tomorrow currently not tested
router.post('/updateTransaction', (req, resp) => {
  reqTransaction(publicKey.toString('base64'))
  resp.redirect('/')
});

router.post('/keygen', (req, res) => {
  let forgePrivateKey = forge.pki.privateKeyFromPem(privateKey);
  let forgePublicKey = forge.pki.setRsaPublicKey(forgePrivateKey.n, forgePrivateKey.e);
  publicKey = forge.pki.publicKeyToPem(forgePublicKey);
  fs.appendFile('./publicKey.pem', publicKey, function (err) {
    if (err) throw err;
    console.log(publicKey);
  });
  generateQRpub(publicKey);
  res.redirect('/');
});

router.post('/addTransaction', (req, res) => {

  let transaction = new Transaction(publicKey, req.body.reciever, parseInt(req.body.amount));
  let sign = crypto.createSign('RSA-SHA256')
  console.log(JSON.stringify(transaction.date))
  sign.update(transaction.sender + transaction.reciever  + transaction.amount +  JSON.stringify(transaction.date))
  let signature = sign.sign(privateKey, 'hex')

  transaction.setSignature(signature);

  sendTransaction(transaction)
  transactionTestingArray.push(transaction)
  res.redirect('/')
  //for (var url in urls){ request.post(url, transaction, (err) => { if (err) {console.error(err)}})}

});



module.exports = router;
