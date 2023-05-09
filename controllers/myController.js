const bitcore = require("bitcore-lib");
const axios = require("axios");

const dashboard = (req, res) => {
    res.sendFile('index.html', { root: 'buy-bitcoin/..' });
}

const sendBitcoin = (req, res) => {
    let senderAddr = req.body.senderAddr;
    let senderPrivateKey = req.body.senderPrivateKey;
    let receiverAddr = req.body.receiverAddr;
    let amount = req.body.amount;
    // console.log(req.body.senderAddr);

    axios.get(`https://blockstream.info/testnet/api/address/${senderAddr}/utxo`)
        .then(response => {
            
            console.log("Fetched utxos");
            console.log("");
            
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
            let fee = transactionSize * 20;    // 20 satoshi per byte

            if (totalAmountAvailable - satoshiToSend - fee < 0) {
                throw new Error("Insufficient funds")
            }

            console.log(typeof (fee));
            console.log(satoshiToSend);
            transaction.from(transactionInputs);
            transaction.to(receiverAddr, satoshiToSend);
            transaction.fee(fee);
            transaction.change(senderAddr);
            transaction.sign(senderPrivateKey);

            // res.send(broadcast(serializedTransaction));
            const serializedTransaction = transaction.uncheckedSerialize();
            broadcast(res, serializedTransaction);
        })
        .catch(error => {
            console.log("Error-");
            console.log(error);
        });

    // const serializedTransaction = "02000000011a40702711c29bbe4ab013f81ac4d05ebbea9f057fe459dbe0bc78c54d69cae1010000006a47304402200ba311f2b058bde51fbddbe5a25d9242ec0668237011a128d4dbe21ff2d75a30022041c9d37dc7e55bd31755a7acdb11ff70be10ff7e5ee1b3b949abf71dfc0b7f130121029cb2ec13ff242c1359d87f37f27130970d6eed0caabbc8f1554d7d45680c7886ffffffff0214000000000000001976a914e3bcfadc95db530d27015612189b34384686330888ac13d22500000000001976a914303d52c0488d2aa2cee51aba53747ed19525fa0d88ac00000000";
    // broadcast(res, serializedTransaction);
}

const broadcast = async (res, serializedTransaction) => {

    console.log("Broadcasting...");
    console.log("");
    console.log(serializedTransaction);

    var https = require("https");
    var options = {
        "method": "POST",
        "hostname": "rest.cryptoapis.io",
        "path": "/v2/blockchain-tools/bitcoin/testnet/transactions/broadcast",
        "qs": { "context": "yourExampleString" },
        "headers": {
            "Content-Type": "application/json",
            "X-API-Key": "1f093de5bf3a5dad6e1aa9fb2dde59f602581610"
        }
    };

    var req = https.request(options, function (res) {
        var chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            var body = Buffer.concat(chunks);
            console.log(body.toString());
        });
    });

    
    req.write(JSON.stringify({
        "data": {
            "context": "yourExampleString",
            "item": {
                "callbackSecretKey": "the-Secret",
                "callbackUrl": "https://webhook.site/da929802-813f-4409-80f7-ae4d60cc8d2e",
                "signedTransactionHex": serializedTransaction
            }
        }
    }));

    req.end();
    
    res.send("Result - see console for status");
}

module.exports = {
    dashboard,
    sendBitcoin
}