const Discord = require('discord.js');
var moment = require('moment');
module.exports = {
	name: 'time',
	description: 'Gets current UTC time',
	args: false,
	execute(message, args, list) {
		return message.reply(moment().utc().format("MM/DD/YYYY, h:mm:ss a"));

	},
};