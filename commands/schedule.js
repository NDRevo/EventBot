const Discord = require('discord.js');
var moment = require('moment');
module.exports = {
	name: 'schedule',
    description: 'Schedule an event! Inputted times are to be in Eastern Standard Time.',
    args: true,
    usage: '<Event Name> <MMDDYYYY> <HHMM> <T/F Notify Users> <Description>',
	execute(message, args, result,connection) {

        let desc = " ";
        for(i = 4; i < args.length; i++){
            desc += args[i] + " ";
        }
        //if nothing or all white space
        if(desc == null || !desc.trim().length){
            desc = "None"
        }

        let date = args[1];
        let time = args[2];
        let notify = args[3];
        if(notify == undefined || notify == null){
            return message.reply("Notify Boolean is somehow undefined/null. Contact me @ Revo#9252 on Discord Please")
        }
        if(notify.toUpperCase() != "T" && notify.toUpperCase() != "F" ){
            return message.reply("Invalid boolean to notify users. Type T (true) or F (false)")
        } 
        if(date.length != 8 || isNaN(date) ){
            return message.reply('Invalid Date');
        }
        else if(isNaN(time) || time.length != 4){
            return message.reply('Invalid Time');
        }
        if(parseInt(time.substring(0,2),10) > 24 || parseInt(time.substring(2,4),10) > 59){
            return message.reply('Invalid Time');
        }
        if(!moment(date, "MMDDYYYY").isValid()){
            return message.reply('Invalid Date');
        }
        if(!moment(time,"HHmm").isValid()){
            return message.reply('Invalid Time');
        }
        if(parseInt(date.substring(4,8)) < moment().year()){
            return message.reply('Invalid Year');
        }
        if(moment(args[1] + args[2], "MMDDYYYYHHmm").diff(moment()) <= 0){
            return message.reply("Date and/or time already passed");
        }
        //Within 10 minutes or has passed
        if(moment(args[1] + args[2], "MMDDYYYYHHmm").diff(moment()) < 600000){
            return message.reply("Date and/or time is to close, must be greater than 10 minutes.");
        }
        // if( moment(args[1] + args[2], "MMDDYYYYHHmm").valueOf() - moment().valueOf() > 2147483647){
        //     return message.reply("Date is to far in advance for a timer. ")
        // }
        connection.query(`SELECT Name, Date, Time FROM \`${message.guild.id}\``, function (err, result, fields) {
            if (err) message.reply(err);
            for(i = 0; i < result.length; i++){
                if(result[i].Name.toUpperCase() == args[0].toUpperCase()){
                    return message.reply('Already a scheduled event');
                }
            }
            message.guild.createRole({
                name: "EB-" + args[0],
                color: '#ff9500',
                mentionable: true,
            })
            // WILL NOTIFY
            if(notify.toUpperCase() == "T"){
                
                connection.query(`INSERT INTO \`${message.guild.id}\` (Name, Date, Time, Notify, Description, Owner, Timestamp, ChannelID, Initiated) VALUES ('${args[0]}', '${args[1]}', '${args[2]}', '${notify.toUpperCase()}', '${desc}', ${message.author.id}, ${message.createdTimestamp}, '${message.channel.id}', 'F')`, function (err, result, fields) {
                    if (err) message.reply(err + " T Error");
                    message.channel.send("**"+args[0]+"**" + " event has been scheduled and will notify those who join!");
                });
                
            }
            //WILL NOT NOTIFY
            else{
                connection.query(`INSERT INTO \`${message.guild.id}\` (Name, Date, Time, Notify, Description, Owner, Timestamp, ChannelID, Initiated) VALUES ('${args[0]}', '${args[1]}', '${args[2]}', '${notify.toUpperCase()}', '${desc}', ${message.author.id}, ${message.createdTimestamp}, '${message.channel.id}', 'F')`, function (err, result, fields) {
                    if (err) message.reply(err + " F Error");
                    message.channel.send("**"+args[0]+"**" + " event has been scheduled!");
                    
                });

            }
            
          });
        
	},
};