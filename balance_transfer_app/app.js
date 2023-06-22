'use strict';

const fs = require('fs');
const path = require('path');
const { Wallets, Gateway } = require('fabric-network');

const testNetworkRoot = path.resolve(require('os').homedir(), 'fabric-samples/test-network');


const express = require('express');

const app = express ();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
  });

app.get("/status", (request, response) => {
    const status = {
       "Status": "Running",
       "ID": request.query.id,
       "Company": request.query.pass

    };
    
    response.send(status);
 });


app.get("/submitTx", async (request, response) => {
    const gateway = new Gateway();
    const wallet = await Wallets.newFileSystemWallet('./wallet');


    try {
        

        const identityLabel = request.query.identity;
        const functionName = request.query.function;
        var chaincodeArgs = [];
        if (functionName == 'transfer') { 
            var chaincodeArgs = [ request.query.from, request.query.to, request.query.amount ];
        } 

        const orgName = identityLabel.split('@')[1];
        const orgNameWithoutDomain = orgName.split('.')[0];

        let connectionProfile = JSON.parse(fs.readFileSync(
            path.join(testNetworkRoot, 
                'organizations/peerOrganizations', 
                orgName, 
                `/connection-${orgNameWithoutDomain}.json`), 'utf8')
        );

        let connectionOptions = {
            identity: identityLabel,
            wallet: wallet,
            discovery: {enabled: true, asLocalhost: true}
        };

        console.log('Connect to a Hyperledger Fabric gateway.');
        await gateway.connect(connectionProfile, connectionOptions);

        console.log('Use channel "mychannel".');
        const network = await gateway.getNetwork('mychannel');

        console.log('Use BalanceTransfer.');
        const contract = network.getContract('balance_transfer');

        console.log('Submit ' + functionName + ' transaction.');
        const res = await contract.submitTransaction(functionName, ...chaincodeArgs);
        if (`${res}` !== '') {
            console.log(`Response from ${functionName}: ${res}`);
            var json = JSON.stringify(res.toString());
            response.send(json);
        } else {
        response.send("Transaction Submitted Successfully");
        }
    } catch (error) {
        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);
        response.send("Error submitting transaction, please check inputs");
    } finally {
        console.log('Disconnect from the gateway.');
        gateway.disconnect();
    }

})