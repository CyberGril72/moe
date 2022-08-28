const { Message, Collection, Permissions, MessageActionRow } = require("discord.js");
const Client = require("../../index");
const { getPrefix, invalidArgs, oops } = require("../handlers/functions");
const db = require("../utils/schemas/setup");
let db2 = require("../utils/schemas/guilds");
const djSetup = require("../utils/schemas/dj");
const prettyMilliseconds = require("pretty-ms");
const db3 = require("../utils/schemas/users");

module.exports = {
    name: "messageCreate",

    /**
     * 
     * @param {Client} client 
     * @param {Message} message 
     */

    execute: async (client, message) => {
        if(message.author.bot || message.channel.type === "DM") return;
        if(message.partial) await message.fetch();

        const prefix = await getPrefix(message.guildId, client);
        const color = client.config.color ? client.config.color : "BLURPLE";

        let data = await db.findOne({ _id: message.guildId });
        if(data && data.channel && message.channelId === data.channel) return client.emit("setupSystem", message);

        let guildData = await db2.findOne({ _id: message.guildId });
        if(!guildData) guildData = new db2({
            _id: message.guildId,
            guildName: message.guild.name
        });

        await guildData.save();

        let userData = await db3.findOne({ _id: message.author.id });
        if(!userData) userData = new db3({
            _id: message.author.id,
            userName: message.author.username,
            userTag: message.author.tag
        });

        await userData.save();
        const mention = new RegExp(`^<@!?${client.user.id}>( |)$`);
        if (message.content.match(mention)) {
            if(message.channel.permissionsFor(client.user).has([Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS, Permissions.FLAGS.VIEW_CHANNEL])) {
                return await message.reply({ content: `Hey, my prefix for this server is \`${prefix}\` Want more info? then do \`${prefix}help\`\nStay Safe, Stay Awesome!`, components: [new MessageActionRow().addComponents(client.button().setLabel("Invite me").setStyle("LINK").setURL(client.config.links.invite))] }).catch(() => {});
            };
        };

        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
        if (!prefixRegex.test(message.content)) return;
        const [ matchedPrefix ] = message.content.match(prefixRegex);
     
        const args = message.content.slice(matchedPrefix.length).trim().split(/ +/g);
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName));

        if(!command) return;

        if(!message.guild.me.permissions.has(Permissions.FLAGS.SEND_MESSAGES)) return await message.author.dmChannel.send({ content: `I don't have **\`SEND_MESSAGES\`** permission in <#${message.channelId}> to execute this **\`${command.name}\`** command.` }).catch(() => {});

        if(!message.guild.me.permissions.has(Permissions.FLAGS.VIEW_CHANNEL)) return;

        if(!message.guild.me.permissions.has(Permissions.FLAGS.EMBED_LINKS)) return await message.channel.send({ content: `I don't have **\`EMBED_LINKS\`** permission to execute this **\`${command.name}\`** command.` }).catch(() => {});

        if(command.permissions) {
            if(command.permissions.client) {
                if(!message.guild.me.permissions.has(command.permissions.client)) return await oops(message.channel, `I don't have enough permissions to execute this command.`);
            };
            
            if(command.permissions.author && !message.member.permissions.has(command.permissions.author)) return await oops(message.channel, `You don't have enough permissions to use this command.`); 
        };
        
        if(command.dev) {
            if(client.config.dev) {
                const findDev = client.config.dev.find((x) => x === message.author.id);
                if(!findDev) return;
            };
        };

        if(command.player) {
            if(command.player.voice) {
                if(!message.member.voice.channel) return await oops(message.channel, `You must be connected to a voice channel to use this \`${command.name}\` command.`, color);

                if(!message.guild.me.permissions.has(Permissions.FLAGS.CONNECT)) return await oops(message.channel, `I don't have \`CONNECT\` permissions to execute this \`${command.name}\` command.`, color);

                if(!message.guild.me.permissions.has(Permissions.FLAGS.SPEAK)) return await oops(message.channel, `I don't have \`SPEAK\` permissions to execute this \`${command.name}\` command.`, color);

                if(message.member.voice.channel.type === "GUILD_STAGE_VOICE" && !message.guild.me.permissions.has(Permissions.FLAGS.REQUEST_TO_SPEAK)) return await oops(message.channel, `I don't have \`REQUEST TO SPEAK\` permission to execute this \`${command.name}\` command.`, color); 

                if(message.guild.me.voice.channel) {
                    if(message.guild.me.voice.channelId !== message.member.voice.channelId) return await oops(message.channel, `You are not connected to ${message.guild.me.voice.channel} to use this \`${command.name}\` command.`);
                };
            };
            
            if(command.player.active) {
                if(!client.player.get(message.guildId)) return await oops(message.channel, `Nothing is playing right now.`);
                if(!client.player.get(message.guildId).queue) return await oops(message.channel, `Nothing is playing right now.`);
                if(!client.player.get(message.guildId).queue.current) return await oops(message.channel, `Nothing is playing right now.`);
            };

            if(command.player.dj) {
                let data = await djSetup.findOne({ _id: message.guildId });
                let perm = Permissions.FLAGS.MUTE_MEMBERS;
                if(command.djPerm) perm = command.djPerm;

                if(!data) {
                    if(!message.member.permissions.has(perm)) return await oops(message.channel, `You don't have enough permissions or the dj role to use this command.`);
                } else {
                    if(data.mode) {
                        let pass = false;

                        if(data.roles.length > 0) {
                            message.member.roles.cache.forEach((x) => {
                                let role = data.roles.find((r) => r === x.id);
                                if(role) pass = true;
                            });
                        };

                        if(!pass && !message.member.permissions.has(perm)) return await oops(message.channel, `You don't have enough permissions or the dj role to use this command.`);
                    };
                };
            };
        };

        if(command.args) {
            if(!args.length) return await invalidArgs(command.name, message, "Please provide the required arguments.", client);
        };

        if(!client.cooldowns.has(command.name)) {
            client.cooldowns.set(command.name, new Collection());
        };

        const cooldown = client.cooldowns.get(command.name);
        let cooldownAmount = command.cooldown && command.cooldown > 0 ? (command.cooldown) * 1000 : 3000;

        if(cooldown.has(message.author.id)) {
            let expiretime = cooldown.get(message.author.id);
            let timeleft = cooldownAmount - (Date.now() - expiretime);

            if(timeleft > 0) return await oops(message.channel, `Take a chill pill dude, you need to wait \`[ ${prettyMilliseconds(timeleft)} ]\` to use this command again.`, color);
        } else {
            cooldown.set(message.author.id, Date.now());
        };

        setTimeout(() =>  { if(cooldown.has(message.author.id)) return cooldown.delete(message.author.id); }, cooldownAmount);

        guildData.commandsRan = `${parseInt(guildData.commandsRan) + 1}`;
        await guildData.save();

        userData.commandsRan = `${parseInt(userData.commandsRan) + 1}`;
        await userData.save();

        try {

            return await command.execute(client, message, args, prefix, color);

        } catch (error) {
            await message.channel.send({ content: "An unexpected error occured, the developers have been notified!" }).catch(() => {});
            console.error(error);
        };
    }
}