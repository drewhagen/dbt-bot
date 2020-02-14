require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const ms = require('ms');
const enmap = require('enmap');
const { PREFIX, MOD_LOGS, TOKEN, IMGUR_TOKEN, HELPFULNESS_IMAGE } = process.env;
const bans = JSON.parse(fs.readFileSync('./data/bans.json', 'utf8'));
const fetch = require("node-superfetch");

// Make default settings for multi-guild configuration.
client.settings = new enmap({
	name: "settings",
	fetchAll: false,
	autoFetch: true,
	cloneLevel: 'deep'
});

const defaultSettings = {
	prefix: "!",
	modLogChannel: "mod-log",
	modRole: "Moderator",
	adminRole: "Administrator",
	welcomeChannel: "welcome",
	welcomeMessage: "Say hello to {{user}}, everyone! We're so happy you could join us!",
	dbtUsage: false
}

client.on('ready', () => {
	console.log(`Ready to serve in ${client.channels.size} channels on ${client.guilds.size} servers, for a total of ${client.users.filter(member => !member.bot).size} users.`);
});

client.on("guildMemberAdd", member => {
	client.settings.ensure(member.guild.id, defaultSettings);
	fs.readFile('./data/bans.json', function (err, data){
		if (err) throw err;
		if(data.includes(member.id)){
			console.log(`${member.user.username}'s ID was found in my ban list! I am going to auto-ban user ${member.user.username}!`);
			member.ban('Auto banned by Axel Bot').then(member => {
				console.log(`The user ${member.user.username} was banned as they were found in bans.json.`);
			});
		}
	});
});

client.on('guildDelete', () => {
	client.settings.delete(guild.id);
});

client.on("message", async (message) => {
	if(!message.guild || message.author.bot) return;
	
	const guildConf = client.settings.ensure(message.guild.id, defaultSettings);
	
	// Mutli Guild Fun! Are we being used for DBT Purposes?
	if(guildConf.dbtUsage === "true"){
		if(message.content == "dbt"){
			// Find a image for the main DBT word.
		} else if(message.content == "mindfulness"){
			message.channel.send(`Hey, ${message.author}! Here's a mindfulness exercise to help you.`, { files: [{ attachment: `${HELPFULNESS_IMAGE}`}] });
		} else if(message.content == "techniques"){
			// Find a image that goes along with DBT Techniques.
		}
	}
	
	if(message.content.indexOf(guildConf.prefix) !== 0) return;
	
	const args = message.content.split(/\s+/g);
	const command = args.shift().slice(guildConf.prefix.length).toLowerCase();
	
	if(command === "setconf") {
		const adminRole = message.guild.roles.find(role => role.name === guildConf.adminRole);
		if(!adminRole) return message.reply("Guild administration role is not found.");
		
		if(!message.member.roles.has(adminRole.id)) {
			return message.reply("You're not an admin, sorry!");
		}
		
		const [prop, ...value] = args;
		
		if(!client.settings.has(message.guild.id, prop)){
			return message.reply("This setting is not found in my configuration, you may suggest it in my public Discord Server.");
		}
		
		client.settings.set(message.guild.id, value.join(" "), prop);
		message.channel.send(`Guild configuration item ${prop} has been changed to:\n\`${value.join(" ")}\``);
	}
	
	if(command === "ban"){
		const guildConf = client.settings.ensure(message.guild.id, defaultSettings);
		const modRole = message.guild.roles.find(role => role.name === guildConf.modRole);
		
		if(!modRole){
			return console.log(`The ${guildConf.modrole} does not exist.`);
		}

		if(!message.member.roles.has(modRole.id)){
			return message.reply("You can't use this command.");
		}

		if(message.mentions.members.size === 0){
			return message.reply("Please mention a user to ban");
		}

		if(!message.guild.me.hasPermission("")){
			return message.reply("");
		}

		// Get the first mention from the message
		const bUser = message.guild.member(message.mentions.users.first()) || message.guild.members.get(args[0]);
		// Get the first mention from the message (used for the embed)
		const user = message.mentions.users.first();
		
		const reason = args.join(' ').slice(22);
		if (!reason) {
			message.channel.send('[ERROR] You must supply a reason when warning a user');
			return;
		}
		
		// Log the ban globally in our JSON File.
		if (!bans[bUser.id])
		bans[bUser.id] = {
			username: user.username,
			guildName: message.guild.name,
			timeLogged: new Date().toUTCString()
		};
		
		fs.writeFile('./data/bans.json', JSON.stringify(bans, null, 4), err => {
			if (err) console.log(err);
		});

		bUser.ban(reason).then(member => {
			message.channel.send(`The user ${member.name} was banned.`);
		});
	}

	// Now let's make another command that shows the configuration items.
	if(command === "showconf"){
		let configProps = Object.keys(guildConf).map(prop => {
			return `${prop}  :  ${guildConf[prop]}\n`;
		});
		
		message.channel.send(`The following are the server's current configuration: \`\`\`${configProps}\`\`\``);
	}
});

client.login(TOKEN);