require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const ms = require('ms');
const enmap = require('enmap');
const { PREFIX, MOD_LOGS, TOKEN, IMGUR_TOKEN } = process.env;
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
	welcomeMessage: "Say hello to {{user}}, everyone! We're so happy you could join us!"
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
	// This stops if it's not a guild (obviously), and we ignore all bots.
	if(!message.guild || message.author.bot) return;

	// We can use ensure() to actually grab the default value for settings,
	// if the key doesn't already exist. 
	const guildConf = client.settings.ensure(message.guild.id, defaultSettings);

	// We also stop processing if the message does not start with our prefix.
	if(message.content.indexOf(guildConf.prefix) !== 0) return;

	//Then we use the config prefix to get our arguments and command:
	const args = message.content.split(/\s+/g);
	const command = args.shift().slice(guildConf.prefix.length).toLowerCase();

	// Alright. Let's make a command! This one changes the value of any key
	// in the configuration.
	if(command === "setconf") {
		// Command is admin only, let's grab the admin value: 
		const adminRole = message.guild.roles.find("name", guildConf.adminRole);
		if(!adminRole) return message.reply("Administrator Role Not Found");

		// Then we'll exit if the user is not admin
		if(!message.member.roles.has(adminRole.id)) {
		  return message.reply("You're not an admin, sorry!");
		}

		// Let's get our key and value from the arguments. 
		// This is array destructuring, by the way. 
		const [prop, ...value] = args;

		// We can check that the key exists to avoid having multiple useless, 
		// unused keys in the config:
		if(!client.settings.has(message.guild.id, prop)){
		  return message.reply("This key is not in the configuration.");
		}
		
		// Now we can finally change the value. Here we only have strings for values 
		// so we won't bother trying to make sure it's the right type and such. 
		client.settings.set(message.guild.id, value.join(" "), prop);

		// We can confirm everything's done to the client.
		message.channel.send(`Guild configuration item ${prop} has been changed to:\n\`${value.join(" ")}\``);
	}
	
	if(command === "ban"){
		const guildConf = client.settings.ensure(message.guild.id, defaultSettings);
		
		const modRole = message.guild.roles.find(role => role.name === guildConf.modRole);
		
		if (!modRole)
			return console.log(`The ${guildConf.modrole} does not exist.`);

		if (!message.member.roles.has(modRole.id))
			return message.reply("You can't use this command.");

		if (message.mentions.members.size === 0)
			return message.reply("Please mention a user to ban");

		if (!message.guild.me.hasPermission(""))
			return message.reply("");

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
			// If there are any problems whilst trying to update the warnings, log an error
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
		message.channel.send(`The following are the server's current configuration:
		\`\`\`${configProps}\`\`\``);
	}
	
	if(command === "hug"){
		const user = message.mentions.users.first() || message.author.username;
		
		message.channel.send(`_**${message.author.username}** hugs **${user}**._`);
		
		function getRandom(max){
			return Math.floor(Math.random() * Math.floor(max));
		}
		
		// Try grab an images
		const { body } = await fetch.get(`https://api.imgur.com/3/album/8rP1q`).set({ Authorization: `Client-ID ${IMGUR_TOKEN}` });
		const res = await body.data.images;
		let _gif = res[getRandom(res.length)].link;
		message.channel.send({ files: [{ attachment: `${_gif}`}] });
	}
	
	if(command === "kiss"){
		const user = message.mentions.users.first() || message.author.username;
		
		message.channel.send(`_**${message.author.username}** smooches **${user}**._`);
		
		function getRandom(max){
			return Math.floor(Math.random() * Math.floor(max));
		}
		
		// Try grab an images
		const { body } = await fetch.get(`https://api.imgur.com/3/album/FDGyD`).set({ Authorization: `Client-ID ${IMGUR_TOKEN}` });
		const res = await body.data.images;
		let _gif = res[getRandom(res.length)].link;
		message.channel.send({ files: [{ attachment: `${_gif}`}] });
	}
});

client.login(TOKEN);