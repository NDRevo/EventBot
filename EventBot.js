const fs = require('fs')
const Discord = require('discord.js');
const {prefix,token} = require('./config.json');

var moment = require('moment');
var special = ['\'',',','`','!','"','#','$','%','&','(',')','*','+','-','.','/',':',';','<','=','>','?','@','[',']','^','_','\\','{','|','}','~']
const EventBot = new Discord.Client();
EventBot.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));


//use npm date-and-time to get todays date
//user sets time and date 
//bot runs 24/7 and checks every 10 minutes to check date
//if event is within reminded time, begin timer
//when event happens, bot deletes event or puts it in previous events
//Bot needs a fail safe if it goes down
//      -If goes down and goes back online: Go through data base and see if any events have passed: delete passed events
//users enter in Eastern time




var mysql = require('mysql');
var connection = mysql.createConnection({
  debug: ['ComQueryPacket', 'RowDataPacket'],
  host     : 'localhost',
  user     : 'root',
  password : 'Durann31!',
  database : 'events'
});

connection.on( "error", (error) => {
	console.log( "mysql Error encountered: " + error );
});
EventBot.on( "error", (error) => {
	console.log( "Error encountered: " + error );
});
connection.connect(function(err){
    if (err) {
        console.error('error: ' + err.message);
        //Trys to reconnect
        setTimeout(() => {
            connection.connect(function(err){
                if(err){
                    console.error('error: ' + err.message);
                }
            });
          }, 120000);
        
    }
});
   


for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	EventBot.commands.set(command.name, command);
}


EventBot.on('ready', () => {
    console.log('I am ready!');
    //console.log(moment("04052020009am", "MMDDYYYYmmhha").diff(moment()))
    //console.log(moment(). format("DD/MM/YYYY, h:mm:ss a"));
    // if(moment("040520200012am", "MMDDYYYYmmhha").diff(moment()) < 36000000){
    //     console.log("less than an hr away")
    // }

    //every 5 minutes checks if any events are happening within an hour
    //if there is one happening within an hour notify or no notify and begin timer        
            
    setInterval(function() {
        //Gets all the servers the bot is in
        for(i =0; i < EventBot.guilds.array().length; i++){ 
            let servername = EventBot.guilds.array().map(guild => guild.id)[i];   
            connection.query(`SELECT * FROM \`${servername}\``, function (err, result, fields) {
                if(result == null || result == undefined){
                    return;
                }
                if (err){
                    console.log(err);
                } 
                //Gets all the events in the specific server
                for(j = 0; j < result.length; j++){

                    //IF USER !REMOVES event find solution


                    let roledis = EventBot.guilds.get(servername).roles.find(role => role.name.toUpperCase() === "EB-"+result[j].Name.toUpperCase());
                    let CID = result[j].ChannelID;
                    let EventName = result[j].Name;
                    //If the channel the event was created is deleted, then make channelID the first channel available
                    if(CID == undefined || CID == null){
                        CID = EventBot.guilds.array().map(guild => guild)[0].channels.map(channel => channel.id)[0]
                    }
                    //If the timer hasnt been initiated for the event
                    if(result[j].Initiated == 'F'){
                        //Updates the event 'initiated' from F to T 
                        connection.query(`UPDATE \`${servername}\` SET Initiated='T' WHERE Name = '${EventName}' `, function (err, result, fields) {
                            if (err) console.log(err);
                        });
                        let sdate = moment(result[j].Date + result[j].Time, "MMDDYYYYHHmm");
                        //If event is happening in less than 30mins and has not passed
                        if(sdate.diff(moment()) <= 18000000 && sdate.diff(moment()) > 0 ){
                            //If event is set to notify 
                            if(result[j].Notify.toUpperCase() == 'T'){
                                setTimeout(() => {
                                    if(EventBot.guilds.get(servername).roles.find(role => role.name.toUpperCase() === "EB-"+EventName.toUpperCase())){
                                        EventBot.channels.get(CID).send(roledis + " event is starting now! Deleting event details in 1 minute!")
                                        setTimeout(() => {
                                            connection.query(`DELETE FROM \`${servername}\` WHERE Name = '${EventName}' `, function (err, result, fields) {
                                                if (err) console.log(err);
                                            });
                
                                            EventBot.channels.get(CID).send("**"+EventName+"**" + " event has been deleted.");
                                            roledis.delete();
                                        }, 60000);
                                     }
                                     else{
                                        console.log("It got deleted");
                                        connection.query(`DELETE FROM \`${servername}\` WHERE Name = '${EventName}' `, function (err, result, fields) {
                                            if (err) console.log(err);
                                        });
                                     }
                                                    
                                }, sdate.diff(moment()));
                            }


                            if(result[j].Notify.toUpperCase() == 'F'){
                                setTimeout(() => {
                                    if(EventBot.guilds.get(servername).roles.find(role => role.name.toUpperCase() === "EB-"+EventName.toUpperCase())){
                                        EventBot.channels.get(CID).send("**"+result[j].Name+"**"+ " event is starting now! Deleting event details in 1 minute!")
                                        setTimeout(() => {
                                            connection.query(`DELETE FROM \`${servername}\` WHERE Name = '${EventName}' `, function (err, result, fields) {
                                                if (err) console.log(err);
                                            });     
                                            EventBot.channels.get(CID).send("**"+EventName+"**" + " event has been deleted.");
                                            roledis.delete();
                                        }, 60000);
                                    }
                                    else {
                                        console.log("It got deleted");
                                        connection.query(`DELETE FROM \`${servername}\` WHERE Name = '${EventName}' `, function (err, result, fields) {
                                            if (err) console.log(err);
                                        });
                                    } 
                                
                                }, sdate.diff(moment()));
                            }
                        }

                        //Bot went offline and event passed
                        else if(sdate.diff(moment()) < 0){
                            EventBot.channels.get(CID).send("ERROR: Bot restarted or went offline and event: " + EventName + " has passed. Deleting event now.");
                            connection.query(`DELETE FROM \`${servername}\` WHERE Name = '${EventName}' `, function (err, result, fields) {
                                if (err) console.log(err);
                            });
                            //IF role hasnt been deleted by user
                            if(roledis){
                                roledis.delete();
                            }  
                            EventBot.channels.get(CID).send("**"+EventName+"**" + " event has been deleted.")
                        }
                    }
                }
            });
        }
    }, 300000);
});


//Creates a Database when bot joins a new server
EventBot.on("guildCreate", guild => {
    let createEvents = `CREATE TABLE IF NOT EXISTS \`${guild.id}\` ( Name varchar(255), Date varchar(255), Time varchar(255), Notify varchar(10), Description varchar(255), Owner BIGINT, Timestamp BIGINT, ChannelID varchar(255),Initiated varchar(10));`;
    connection.query(createEvents, function(err, results, fields) {
        if(err) console.log(err.message);
        
    });

});


//Deletes database when bot leaves the server
EventBot.on("guildDelete", guild => {
    let removeEvents = `DROP TABLES \`${guild.id}\``;
    connection.query(removeEvents, function(err, results, fields) {
        if(err) {
            console.log(err.message);
        }
    });
   
});


// Create an event listener for messages
EventBot.on('message',message => {
    if(!message.content.startsWith(prefix) || message.author.bot) return;
    let args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();

    //Wrong args
    const command = EventBot.commands.get(commandName) || EventBot.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) return;
    if(command.args && !args.length){
        let reply = `You didn't provide any arguments, ${message.author}!`
        if(command.usage){
            reply += `\n**Usage**: \`${prefix}${command.name} ${command.usage}\``;
        }
        return message.channel.send(reply);
    }


    try{  
        //If command has a special character after !command
        for(i = 0; i < special.length;i++){
            if(message.content.substring(3,message.content.length).includes(special[i])){
                return message.reply("Can't use special characters. (Currently working on a fix!)")
            }
        }  

        //if the bot went offline and a user added it to their server while it was offline
        connection.query(`SELECT * FROM \`${message.guild.id}\``, function (err, result, fields) {
            if(err){
                if(err.code == 'ER_NO_SUCH_TABLE'){
                    let createEvents = `CREATE TABLE IF NOT EXISTS \`${message.guild.id}\` ( Name varchar(255), Date varchar(255), Time varchar(255), Notify varchar(10), Description varchar(255), Owner BIGINT, Timestamp BIGINT, ChannelID varchar(255), Initiated varchar(10));`;
                    connection.query(createEvents, function(err, results, fields) {
                        if(err) console.log(err.code);});
                }
                else console.log(err);
            }
            command.execute(message, args,result,connection);
          });
       
    }catch(error){
        console.error(error);
        message.reply('There was an error');
    } 

});




EventBot.login(token);