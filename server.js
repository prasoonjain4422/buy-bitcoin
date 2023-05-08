const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const bitcore = require("bitcore-lib");
const cors = require('cors');
const axios = require("axios");
const port = process.env.port || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
    res.sendFile('index.html', { root: 'buy-bitcoin/..' });
});


async function broadcast(serializedTransaction) {
    const result = await axios({ method: "POST", url: `https://rest.cryptoapis.io/blockchain-tools/bitcoin/testnet/transactions/broadcast`, data: { tx_hex: serializedTransaction }, });
    return result.data.data;
}

function sendBitcoin(senderAddr, receiverAddr, senderPrivateKey, amount) {
    axios.get(`https://blockstream.info/testnet/api/address/${senderAddr}/utxo`)
        .then(response => {

            let utxos = response.data;
            console.log(utxos);
            let transactionInputs = [];
            
            let totalAmountAvailable = 0;
            let transactionInputCount = 0;

            for (let i of utxos) {

                let utxoObject = {};
                utxoObject.satoshis = (Number(i.value));
                utxoObject.script = "76a914303d52c0488d2aa2cee51aba53747ed19525fa0d88ac";
                utxoObject.address = senderAddr;           //  sender wallet address
                utxoObject.txid = i.txid;
                utxoObject.outputIndex = 1;
                // utxoObject.outputIndex = i.vout;

                
                totalAmountAvailable += utxoObject.satoshis;
                transactionInputCount++;

                transactionInputs.push(utxoObject);
            }
            
            console.log(totalAmountAvailable);
            
            const transaction = new bitcore.Transaction();
            const satoshiToSend = Number(amount);
            let transactionOutputCount = 2;
            
            const transactionSize = transactionInputCount * 180 + transactionOutputCount * 34 + 10 - transactionInputCount;
            let fee = transactionSize * 20;      // 33 satoshi per byte
            
            if (totalAmountAvailable - satoshiToSend - fee < 0) {
                throw new Error("Insufficient funds")
            }
            
            console.log(typeof(fee));
            console.log(satoshiToSend);
            transaction.from(transactionInputs);
            transaction.to(receiverAddr, satoshiToSend);
            transaction.fee(fee);
            transaction.change(senderAddr);
            transaction.sign(senderPrivateKey);

            const serializedTransaction = transaction.uncheckedSerialize();
            
            return broadcast(serializedTransaction);
        })
        .catch(error => {
            console.log("error");
            console.log(error);
        });
}

app.post('/login', function (req, res) {

    let senderAddr = req.body.senderAddr;
    let senderPrivateKey = req.body.senderPrivateKey;
    let receiverAddr = req.body.receiverAddr;
    let amount = req.body.amount;
    // console.log(req.body.senderAddr);

    res.send(sendBitcoin(senderAddr, receiverAddr, senderPrivateKey, amount));
});


app.listen(port, function () {
    console.log(`App listening at ${port}`);
});


















