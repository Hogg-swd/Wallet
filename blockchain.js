var sha256 = require('js-sha256');
var crypto = require('crypto');



class Transaction {
  constructor(sender, reciever, amount){
    this.sender = sender;
    this.reciever = reciever;
    this.amount = amount;
  }

  toString(){
    return {s : this.sender, r : this.reciever, a : this.amount}
  }
}

class Block {

  constructor(data, prevHash, blockNumber, timestamp = new Date()){
    this.data = data;
    this.hash = this.createHash();
    this.prevHash = prevHash;
    this.timestamp = timestamp;
    this.blockNumber = blockNumber;
    this.guess = 0;
  }

  createHash(){
    return JSON.stringify(sha256(JSON.stringify(this.data)
    + this.index
    + this.timestamp
    + this.prevHash
    + this.guess));
  }

   toString() {
    var ret =  {"index" : this.index, "timestamp" : this.timestamp, "prevHash" : this.prevHash, "guess" : this.guess}
    return JSON.stringify(ret);
  }

  mine(diff){
    while(!(this.hash.substring(3, 1) == "00")){
        this.guess++;
        this.hash = this.createHash();
    }
  }

}

class BlockChain {
  constructor(){
    this.publicKey = "";
    this.bc = [this.generateGenBlock()];
    this.transactions = [];
    this.blockNu = 1;
    this.diff = 2;
  }

  setRecieverKey(key){
    this.publicKey = key;
  }

  snycChain(jsonObj){
    this.bc = jsonObj.bc;
    this.transactions = [];
    this.blockNu = this.bc.length;
  }

  addTransaction(transaction){
    this.transactions.push(transaction)
  }

  addBlock(block){
    this.bc.push(block);
  }

  generateGenBlock(){
    return new Block("First Block", "0", 0);
  }

  getLatestBlock(){
    return this.bc[this.bc.length -1]
  }

  mineBlock(){
    //ADD PUBLIC KEY
    try {
      var block = new Block(this.transactions, this.getLatestBlock().hash, this.blockNu);
      block.mine(this.diff);
      this.transactions = [];
      this.transactions.push(new Transaction("System", this.publicKey, 10));

      this.bc.push(block);
      this.blockNu += 1;
    } catch (err) {
      console.log(err);
    }

  }

  //client side maybe take out of BlockChain class
  checkBalance(){
    var balance = 0;
    for(var i = 0; i < this.bc.length; i++){
      for(var j = 0; j < this.bc[i].data.length; j++){
        if(this.bc[i].data[j].reciever == this.publicKey){
          balance += this.bc[i].data[j].amount;
        } else if (this.bc[i].data[j].sender == this.publicKey) {
          balance -= this.bc[i].data[j].amount;
        }
      }

    }
    return balance;
  }

  addTransaction(reciever, amount){
    try {
      amount = parseInt(amount)
      var balance = this.checkBalance()
      if(balance >= amount){
        var transaction = new Transaction(this.publicKey, reciever, amount)
        this.transactions.push(transaction)
      }
    } catch {
      console.log("Incorrect amount")
    }
    //var balance = this.checkBalance(transaction.senderWallet);
    //if(balance >= transaction.amount){
      //  this.transactions.push(transaction);
      //}
  }

  requestChain(){
    request("http://localhost:5001/", function (err, res) {
      if(err) return console.error(err.message);
      this.bc = res.body;
    });

  }

   async update(){
    await this.requestChain();
  }

}




module.exports = BlockChain;
