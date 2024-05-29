const crypto = require("./Crypto"); //crypt module (custom)

//manage start : requests token if not not yet verified
const manageStart=(msg,admins,bot)=>{
    const id = msg.chat.id; //user id
    let enterTokenMsgs = "Hola! Please enter your TOKEN below.";
    let connectedAlreadyMsgs = "We're already Connnected ,use /stop to logout .";
    if(admins[id]==undefined){bot.sendMessage(id,enterTokenMsgs)}//if user is verified
    else{bot.sendMessage(id,connectedAlreadyMsgs)}; //if user ain't verified
}

//manage /devices
const showDevices=(msg,admins,bot,devices)=>{
    const id = msg.chat.id; //user id

    //if the id in admin list
    if(admins[id]!==undefined){
        let adminUname = admins[id].uname; //admin username
        let availableClients = Object.keys(devices).filter(user=>devices[user].ref === adminUname); //available devices in devices list (available for admin)
        //if devices list is 0
        if(availableClients.length <1){
            bot.sendMessage(id,"No devices available.");
        }
        //if there are devices in devices list
        else{
            const extractDeviceNumberOnlyRegex = /^_([^@]+)/; //extracts client name only from the long client address (regex)
            let availableClientsObject = availableClients.map((device)=>{return [{text:device.match(extractDeviceNumberOnlyRegex)[1],callback_data:device}]});
            //inline keyboard menus
            const options = {
                reply_markup: JSON.stringify({
                    inline_keyboard: availableClientsObject
                })
            };
            bot.sendMessage(id,"Please select a Device : ",options);
        }
    }
}

//manage /status
const connectionStatus=(msg,admins,bot)=>{
    const id = msg.chat.id; //user id
    let connectedmsgs = "Connected!! Ready to control devices. ";
    let notConnectedMsgs ="No Connection, Please Paste your TOKEN here to Connect. ";
    
    //if user in admin list
    if(admins[id]){
        bot.sendMessage(id,connectedmsgs);
    }
    //if user is not in admin list
    else{
        bot.sendMessage(id,notConnectedMsgs);
    }
}

//manage /selected
const selectedClient=(msg,admins,bot)=>{
    id = msg.chat.id; //user id
    if(admins[id].ref){
        const extractDeviceNumberOnlyRegex = /^_([^@]+)/; //extracts client name only from the long client address (regex)
        bot.sendMessage(id,`Selected Device : ${(admins[id].ref).match(extractDeviceNumberOnlyRegex)[1]}`)
    }
    else{
        bot.sendMessage(id,`No Device were Selected. use /devices to select one .`)
    }
}

//manage callback query (manage selected client)
const onDeviceSelection=(query,admins,devices)=>{
    const id = query.message.chat.id;
    const data = query.data;
    let clientSelectionRegex = /_(\w+)@(\w+)/; //regex to check if it was a client selection
    //check if it was a client selection
    if(clientSelectionRegex.test(data)){
        if(devices[data] && devices[data].ref === admins[id].uname){
            admins[id].ref = data; //set selected client as admin ref
            const extractDeviceNumberOnlyRegex = /^_([^@]+)/;//regex to extract device name from device full name
            const device = data.match(extractDeviceNumberOnlyRegex)[1];
            bot.sendMessage(id, `Selected ${device}`);
        }else{
            bot.sendMessage(id,`Device not available or You dont have access!`)
        }
    }else{
        bot.sendMessage(id,`User not found.`)
    }
    // Answer the callback query to remove the "loading" status
    bot.answerCallbackQuery(query.id);
}


//manage /stop
const stopConnection=(msg,admins,bot)=>{
    const id = msg.chat.id; //user id
    let disconnectedMsgs ="Adios Amigo! Logged out.";
    let werentConnectedMsgs ="Connect First!!";
    
    try{
        //id user is connected
        if(admins[id]){
            delete admins[id]; //delete user from admin list
            bot.sendMessage(id,disconnectedMsgs); //send success message to user
        }else{
            bot.sendMessage(id,werentConnectedMsgs) //send werent connected message to user
        }
    }
    catch(e){
        //for any error , send error message to user
        bot.sendMessage(id,`An Error Occured While Doing that`)
    }
}

//manage message : including verif& add admin, forward message to tcp/ws client, forward to telegram bot
const manageMessage=(msg,admins,bot,key,password,devices)=>{
    id = msg.chat.id; //user id

    //if user is not in admin list
    if(admins[id]===undefined){
        let invalidTokenMsgs = "Your Token seems Invalid, Please re-check your TOKEN ."
        let connectedSuccessfullyMsgs ="Bravo! We're Connected 🥳";
        
        try{//check if user entered token or another data
            const  connectionString = JSON.parse(crypto.Decrypt(msg.text,key)); //decrypt user token
            //if user is eligible to be admin
            if(connectionString.uname && connectionString!="" && connectionString.password === password){
                admins[id]={uname:connectionString.uname,time: new Date().toLocaleTimeString(),ref:undefined}; //adding user to admin
                bot.sendMessage(id,connectedSuccessfullyMsgs); //sending random success message to user
                bot.sendMessage(id,"To avoid token from being stolen, please clear screen once connected .")
            }
            //if user is not eligible to be admin
            else{
                bot.sendMessage(id,invalidTokenMsgs); //sending random invalid token messages
            }
        }
        catch(e){
            let systemtags = ["/start","/ping","/status","/stop","/devices","/selected"]; //system reserved keywords
            //if message is not any system tags
            if(!systemtags.includes(msg.text)){
                bot.sendMessage(id,invalidTokenMsgs);//sending random invalid token messages
            }
        }
    }
    //if user is in admin list
    else{
        let systemtags = ["/start","/ping","/status","/stop","/devices","/selected"]; //system tags
        //if message is not any system tags
        if(!systemtags.includes(msg.text)){
            
            //on client selection : client format example >> _client9@xv
            let clientSelectionRegex = /_(\w+)@(\w+)/; //regex to check if user is selecting a client or not
            if(clientSelectionRegex.test(msg.text)){
                //check if client exists and if client is owned by user/admin
                if(devices[msg.text] && devices[msg.text].ref === admins[id].uname){
                    admins[id].ref = msg.text; //set selected client as admin ref
                    bot.sendMessage(id, `Selected : ${msg.text} .`); // send the selected client message to user/admin
                }
                //if client doesnt exists or client isn't owned by user/admin
                else{
                    bot.sendMessage(id, `${msg.text} is not available .`)
                }
            }
            //if it is a client sendable message
            else{
                //if user/admin selected a client
                if(admins[id].ref){
                    //if the selected device is available right now
                    if(devices[admins[id].ref]){
                        let selectedDevice = admins[id].ref; //selected device
                        let selectedSocket = devices[selectedDevice].socket; //socket of the selected device
                        try{
                            if(typeof msg.text==="string"){
                                selectedSocket.send(msg.text); //send message to socket ws method
                                bot.sendMessage(id,"👍🏻")
                            }else{
                                bot.sendMessage(id,"Only text messages are allowed")
                            }
                            
                        }catch(e){try{
                            selectedSocket.write(msg.text); //send message to socket tcp method
                            bot.sendMessage(id,"👍🏻")
                        }catch(e){
                            bot.sendMessage(id,`Couldnt send Message to device ${selectedDevice}`); 
                        }}
                    }
                    //if selected device is not available
                    else{
                        bot.sendMessage(id,`User ${admins[id].ref} is not available right now . use /devices to view available device`)
                    }
                }
                else{
                    bot.sendMessage(id,`Select a device first. use /devices to view available devices.`)
                }

            }
        }
    }
}



module.exports = {manageStart,manageMessage,showDevices,stopConnection,connectionStatus,selectedClient,onDeviceSelection};