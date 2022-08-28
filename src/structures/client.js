const { Client, Intents, Collection, MessageEmbed, MessageButton, MessageSelectMenu } = require("discord.js");
const botPlayerManager = require("./player");
const { readdirSync } = require("fs");
const { join } = require("path");
const { connect } = require("mongoose");

/**
 * The bot's client ;0
 * @extends {Client}
 * discord.js Client
 */

class botClient extends Client {
    constructor() {
        super({
            allowedMentions: {
                parse: ["roles", "users", "everyone"],
                repliedUser: false
            },
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES, 
                Intents.FLAGS.GUILD_MEMBERS, 
                Intents.FLAGS.GUILD_VOICE_STATES
            ],
            partials: ["CHANNEL", "GUILD_MEMBER", "MESSAGE", "USER", "REACTION"]
        });

        this.config = require("../devconfig.json");
        if(!this.token) this.token = this.config.token;

        this.commands = new Collection();
        this.slash_commands = new Collection();
        this.cooldowns = new Collection();
        this.aliases = new Collection();
        this.player;

        this._connectMongodb();
    }

    /**
     * 
     * @returns {MessageEmbed}
     */

    embed() {
        return new MessageEmbed();
    };

    /**
     * 
     * @returns {MessageButton}
     */

    button() {
        return new MessageButton();
    };

    /**
     * 
     * @returns {MessageSelectMenu}
     */

    menu() {
        return new MessageSelectMenu();
    };

    _loadPlayer() {
        this.player = new botPlayerManager(this);
        return this.player;
    };

    _loadCommands() {
        readdirSync(join(__dirname, "..", "message_commands")).forEach((folder) => {
            const commandFiles = readdirSync(join(__dirname, "..", "message_commands", `${folder}`)).filter((files) => files.endsWith(".js"));

            for (const files of commandFiles) {
                const command = require(`../message_commands/${folder}/${files}`);
                if(command.category && command.category !== folder) command.category = folder;

                this.commands.set(command.name, command);
                if(command.aliases && Array.isArray(command.aliases)) for (const i of command.aliases) this.aliases.set(i, command.name);

                console.log(`Command Loaded: ${command.name}`);
            };
        });
    };

    _loadSlashCommands() {
        const commands = [];
        readdirSync(join(__dirname, "..", "slash_commands")).forEach((folder) => {
            const slashCommandFile = readdirSync(join(__dirname, "..", "slash_commands", `${folder}`)).filter((files) => files.endsWith(".js"));

            for (const files of slashCommandFile) {
                const slash_command = require(`../slash_commands/${folder}/${files}`);

                if(!slash_command.data) throw new Error("Missing Slash Command Data: "+files.replace(".js", ""));

                if(!slash_command.data.name) throw new Error("Missing Slash Command Name: "+files.replace(".js", ""));

                if(!slash_command.data.description) throw new Error("Missing Slash Command Description: "+files.replace(".js", ""));

                commands.push(slash_command.data);
                this.slash_commands.set(slash_command.data.name, slash_command);
                console.log(`Slash Command Loaded: ${slash_command.data.name}`);
            };
        });

        this.once("ready", async () => {
            try {
                await this.application.commands.set(commands);
            } catch (e) {
                console.error(e);
                let chn = this.channels.cache.get(this.config.channels.errors);
                if(chn) await chn.send({ content: `\`\`\`js\n${e.stack ? e.stack : e}\n\`\`\`` }).catch(() => {});
            };
        });
    };
    
    _loadEvents() {
        const eventFiles = readdirSync(join(__dirname, "..", "events")).filter((files) => files.endsWith(".js"));

        for (const files of eventFiles) {
            const event = require(`../events/${files}`);

            if(event.once) {
                this.once(event.name, (...args) => event.execute(this, ...args));
            } else {
                this.on(event.name, (...args) => event.execute(this, ...args));
            };
            console.log(`Event Loaded: ${event.name}`);
        };
    };

    /**
     * @private
     */

    async _connectMongodb() {
        await connect(this.config.mongodb);
        console.log(`MongoDB Connection Established.`);
    };

    connect() {
        super.login(this.token);
    };
};

module.exports = botClient;