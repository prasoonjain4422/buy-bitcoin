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

            const serializedTransaction = transaction.uncheckedSerialize();

            res.send(broadcast(serializedTransaction));
        })
        .catch(error => {
            console.log("Error-");
            console.log(error);
        });
        
        res.send("Something went wrong");
}

const broadcast = async (serializedTransaction) => {
    const result = await axios({ method: "POST", url: `https://rest.cryptoapis.io/blockchain-tools/bitcoin/testnet/transactions/broadcast`, data: { tx_hex: serializedTransaction }, });
    return result.data.data;
}

module.exports = {
    dashboard,
    sendBitcoin,
    broadcast
}