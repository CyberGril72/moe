const { Manager, Structure } = require("erela.js");
const { spotify, nodes } = require("../devconfig.json");
const Spotify = require("erela.js-spotify");
const Deezer = require("erela.js-deezer");
const Facebook = require("erela.js-facebook");
const { readdirSync } = require("fs");
const { join } = require("path");
const { Client } = require("discord.js");

const plugins = [
    new Spotify({
        clientID: spotify.client_id.toString(),
        clientSecret: spotify.client_secret.toString()
    }),
    new Deezer(),
    new Facebook()
];

Structure.extend("Player", (Player) => class extends Player {
    constructor(...args) {
        super(...args);
        
        this.filters = false;
        this.speedAmount = 1;
        this.rateAmount = 1;
        this.pitchAmount = 1;
        this.nightcore = false;
        this.vaporwave = false;
        this.bassboostLevel = "";
        this._8d = false;
        this.pop = false;
        this.party = false;
        this.bass = false;
        this.radio = false;
        this.treblebass = false;
        this.soft = false;
        this.electrocic = false;
        this.rock = false;
        this.earrape = false;
        this.message;
    }

    /**
     * 
     * @param {String} channel 
     */

    changeVoiceChannel(channel) {
        this.voiceChannel = channel;
        return this;
    };

    /**
     * 
     * @param {Number} amount 
     * @returns {void}
     */

    setSpeed(amount) {
        if(!amount) return console.error("[Function Error]: Please provide a valid number.");
        if(!this.filters) this.filters = true;
        this.speedAmount = Math.max(Math.min(amount, 5), 0.05);

        this.node.send({
            op: "filters",
            guildId: this.guild,
            timescale: {
                speed: this.speedAmount,
                rate: this.rateAmount
            }
        });

        return this;
    };

    /**
     * 
     * @param {Boolean} value 
     */

    setEarrape(value) {
        if(typeof value !== "boolean") return console.error(`eeeeeee`);
        this.earrape = value;

        if(this.earrape) {
            if(!this.filters) this.filters = value;
            const bands = [
                { band: 0, gain: 0.25 },
                { band: 1, gain: 0.5 },
                { band: 2, gain: -0.5 },
                { band: 3, gain: -0.25 },
                { band: 4, gain: 0 },
                { band: 5, gain: -0.0125 },
                { band: 6, gain: -0.025 },
                { band: 7, gain: -0.0175 },
                { band: 8, gain: 0 },
                { band: 9, gain: 0 },
                { band: 10, gain: 0.0125 },
                { band: 11, gain: 0.025 },
                { band: 12, gain: 0.375 },
                { band: 13, gain: 0.125 },
                { band: 14, gain: 0.125 }
            ];

            this.setVolume(this.volume + 50);
            this.setEQ(bands);
        } else {
            this.clearEQ();
        };

        return this;
    };

    /**
     * 
     * @param {Number} amount 
     * @returns {void}
     */

    setPitch(amount) {
        if(typeof amount !== "number") return console.error("[Function Error]: Please provide a valid number.");
        if(!this.filters) this.filters = true;
        this.pitchAmount = Math.max(Math.min(amount, 5), 0.05);
        this.node.send({
            op: "filters",
            guildId: this.guild,
            timescale: {
                pitch: this.pitchAmount,
                rate: this.rateAmount
            }
        });

        return this;
    };

    /**
     * 
     * @param {Boolean} value 
     * @param {"none" | "low" | "medium" | "high"} level
     * 
     */

    setBassboost(level) {
        if(typeof level !== "string") return console.error(`eeeeeeeee`);

        this.filters = true;
        this.bassboostLevel = level;
        let gain = 0.0;
        if(level === "none") gain = 0.0;
        else if(level === "low") gain = 0.10;
        else if(level === "medium") gain = 0.15;
        else if(level === "high") gain = 0.25;

        const bands = new Array(3).fill(null).map((_, i) => ({ band: i, gain: gain }));
        this.setEQ(...bands);

        return this;
    };

    /**
     * 
     * @param {Boolean} value 
     * @returns {void | this}
     */

    setPop(value) {
        if(typeof value !== "boolean") return console.error("eeeeeeeeeeeee");
        
        this.pop = value;

        if(this.pop) {
            if(!this.filters) this.filters = value;
            const bands = [
                { band: 0, gain: -0.25 },
                { band: 1, gain: 0.48 },
                { band: 2, gain: 0.59 },
                { band: 3, gain: 0.72 },
                { band: 4, gain: 0.56 },
                { band: 5, gain: 0.15 },
                { band: 6, gain: -0.24 },
                { band: 7, gain: -0.24 },
                { band: 8, gain: -0.16 },
                { band: 9, gain: -0.16 },    
                { band: 10, gain: 0 },    
                { band: 11, gain: 0 },
                { band: 12, gain: 0 },   
                { band: 13, gain: 0 },
                { band: 14, gain: 0 }
            ];

            this.setEQ(bands);
        } else {
            this.clearEQ();
        };

        return this;
    };

    /**
     * 
     * @param {Boolean} value 
     * @returns {void | this}
     */

    setParty(value) {
        if(typeof value !== "boolean") return console.error("eeeeeeeeeeeee");
        this.party = value;

        if(this.party) {
            if(!this.filters) this.filters = true;
            const bands = [
                { band: 0, gain: -1.16 },
                { band: 1, gain: 0.28 },
                { band: 2, gain: 0.42 },
                { band: 3, gain: 0.5 },
                { band: 4, gain: 0.36 },
                { band: 5, gain: 0 },
                { band: 6, gain: -0.3 },
                { band: 7, gain: -0.21 },
                { band: 8, gain: -0.21 }
            ];

            this.setEQ(bands);
        } else {
            this.clearEQ();
        };

        return this;
    };

    /**
     * 
     * @param {Boolean} value 
     * @returns {void | this}
     */

    setBass(value) {
        if(typeof value !== "boolean") return console.log(`eeeeeeeeeeee`);
        this.bass = value;

        if(this.bass) {
            if(!this.filters) this.filters = true;
            const bands = [
                { band: 0, gain: 0.6 },
                { band: 1, gain: 0.7 },
                { band: 2, gain: 0.8 },
                { band: 3, gain: 0.55 },
                { band: 4, gain: 0.25 },
                { band: 5, gain: 0 },
                { band: 6, gain: -0.25 },
                { band: 7, gain: -0.45 },
                { band: 8, gain: -0.55 },
                { band: 9, gain: -0.7 },    
                { band: 10, gain: -0.3 },    
                { band: 11, gain: -0.25 },
                { band: 12, gain: 0 },   
                { band: 13, gain: 0 },
                { band: 14, gain: 0 }
            ];

            this.setEQ(bands);
        } else {
            this.clearEQ();
        };

        return this;
    };

    /**
     * 
     * @param {Boolean} value 
     * @returns {void | this}
     */

    setRadio(value) {
        if(typeof value !== "boolean") return console.error(`eeeeee`);
        this.radio = value;

        if(this.radio) {
            if(!this.filters) this.filters = true;
            const bands = [
                { band: 0, gain: 0.65 },
                { band: 1, gain: 0.45 },
                { band: 2, gain: -0.45 },
                { band: 3, gain: -0.65 },
                { band: 4, gain: -0.35 },
                { band: 5, gain: 0.45 },
                { band: 6, gain: 0.55 },
                { band: 7, gain: 0.6 },
                { band: 8, gain: 0.6 },
                { band: 9, gain: 0.6 },    
                { band: 10, gain: 0 },    
                { band: 11, gain: 0 },
                { band: 12, gain: 0 },   
                { band: 13, gain: 0 },
                { band: 14, gain: 0 }
            ];

            this.setEQ(bands);
        } else {
            this.clearEQ();
        };

        return this;
    };

    /**
     * 
     * @param {Boolean} value 
     * @returns {void | this}
     */

    setTreblebass(value) {
        if(typeof value !== "boolean") return console.error(`eeeeeeeeeeee`);
        this.treblebass = value;

        if(this.treblebass) {
            if(!this.filters) this.filters = true;
            const bands = [
                { band: 0, gain: 0.6 },
                { band: 1, gain: 0.67 },
                { band: 2, gain: 0.67 },
                { band: 3, gain: 0 },
                { band: 4, gain: -0.5 },
                { band: 5, gain: 0.15 },
                { band: 6, gain: -0.45 },
                { band: 7, gain: 0.23 },
                { band: 8, gain: 0.35 },
                { band: 9, gain: 0.45 },
                { band: 10, gain: 0.55 },
                { band: 11, gain: 0.6 },
                { band: 12, gain: 0.55 },
                { band: 13, gain: 0 },
                { band: 14, gain: 0 }
            ];

            this.setEQ(bands);
        } else {
            this.clearEQ();
        };

        return this;
    };

    /**
     * 
     * @param {Boolean} value 
     * @returns {void | this}
     */

    setSoft(value) {
        if(typeof value !== "boolean") return console.error(`eeee`);
        this.soft = value;

        if(this.soft) {
            if(!this.filters) this.filters = true;
            const bands = [
                { band: 0, gain: 0 },
                { band: 1, gain: 0 },
                { band: 2, gain: 0 },
                { band: 3, gain: 0 },
                { band: 4, gain: 0 },
                { band: 5, gain: 0 },
                { band: 6, gain: 0 },
                { band: 7, gain: 0 },
                { band: 8, gain: -0.25 },
                { band: 9, gain: -0.25 },    
                { band: 10, gain: -0.25 },    
                { band: 11, gain: -0.25 },
                { band: 12, gain: -0.25 },   
                { band: 13, gain: -0.25 },   
                { band: 14, gain: -0.25 } 
            ];

            this.setEQ(bands);
        } else {
            this.clearEQ();
        };

        return this;
    };

    /**
     * 
     * @param {Boolean} value 
     * @returns {void | this}
     */

    setElectronic(value) {
        if(typeof value !== "boolean") return console.error(`eeeeee`);
        this.electrocic = value;

        if(this.electrocic) {
            if(!this.filters) this.filters = true;
            const bands = [
                { band: 0, gain: 0.375 },
                { band: 1, gain: 0.350 },
                { band: 2, gain: 0.125 },
                { band: 3, gain: 0 },
                { band: 4, gain: 0 },
                { band: 5, gain: -0.125 },
                { band: 6, gain: -0.125 },
                { band: 7, gain: 0 },
                { band: 8, gain: 0.25 },
                { band: 9, gain: 0.125 },
                { band: 10, gain: 0.15 },
                { band: 11, gain: 0.2},
                { band: 12, gain: 0.250 },
                { band: 13, gain: 0.350 },
                { band: 14, gain: 0.400 }
            ];

            this.setEQ(bands);
        } else {
            this.clearEQ();
        };
    };

    /**
     * 
     * @param {Boolean} value 
     */

    setRock(value) {
        if(typeof value !== "boolean") return console.error("eeeeee");
        this.rock = value;

        if(this.rock) {
            if(!this.filters) this.filters = true;
            const bands = [
                { band: 0, gain: 0.300 },
                { band: 1, gain: 0.250 },
                { band: 2, gain: 0.200 },
                { band: 3, gain: 0.100 },
                { band: 4, gain: 0.050 },
                { band: 5, gain: -0.050 },
                { band: 6, gain: -0.150 },
                { band: 7, gain: -0.200 },
                { band: 8, gain: -0.100 },
                { band: 9, gain: -0.050 },
                { band: 10, gain: 0.050 },
                { band: 11, gain: 0.100 },
                { band: 12, gain: 0.200 },
                { band: 13, gain: 0.250 },
                { band: 14, gain: 0.300 }
            ];

            this.setEQ(bands);
        } else {
            this.clearEQ();
        };

        return this;
    };


    /**
     * 
     * @param {Boolean} value 
     */

    setNightCore(value) {
        if(typeof value !== "boolean") return console.error(`[ setNightCore Function Error ]: Please provide a valid value (true/false).`);

        if(!this.filters) this.filters = true;
        this.nightcore = value;
        if(this.vaporwave) this.vaporwave = false;

        if(this.nightcore) {
            this.speedAmount = 1.2999999523162842;
            this.pitchAmount = 1.2999999523162842;

            this.node.send({
                op: "filters",
                guildId: this.guild,
                timescale: {
                    speed: this.speedAmount,
                    pitch: this.pitchAmount,
                    rate: this.rateAmount
                }
            });
        } else {
            this.speedAmount = 1;
            this.pitchAmount = 1;
            this.node.send({
                op: "filters",
                guildId: this.guild,
                timescale: {
                    speed: this.speedAmount,
                    pitch: this.pitchAmount,
                    rate: this.rateAmount
                }
            });
        };

        return this;
    };

    /**
     * 
     * @param {Boolean} value 
     */

    setVaporwave(value) {
        if(typeof value !== "boolean") return console.error(`[ setVaporwave Function Error ]: Please provide a valid value (ture/false).`);
        
        if(!this.filters) this.filters = true;
        if(this.nightcore) this.nightcore = false;
        this.vaporwave = value;

        if(this.vaporwave) {
            this.speedAmount = 0.8500000238418579;
            this.pitchAmount = 0.800000011920929;

            this.node.send({
                op: "filters",
                guildId: this.guild,
                timescale: {
                    speed: this.speedAmount,
                    pitch: this.pitchAmount,
                    rate: this.rateAmount
                }
            });
        } else {
            this.speedAmount = 1;
            this.pitchAmount = 1;

            this.node.send({
                op: "filters",
                guildId: this.guild,
                timescale: {
                    speed: this.speedAmount,
                    pitch: this.pitchAmount,
                    rate: this.rateAmount
                }
            });
        };

        return this;
    };

    /**
     * 
     * @param {Boolean} value 
     */

    set8D(value) {
        if(typeof value !== "boolean") return console.error(`[ set8D Function Error ]: Please provide a valid value (ture/false).`);

        if(!this.filters) this.filters = true;
        this._8d = value;

        if(this._8d) {
            this.node.send({
                op: "filters",
                guildId: this.guild,
                rotation: {
                    rotationHz: 0.2
                }
            });
        } else {
            this.node.send({
                op: "filters",
                guildId: this.guild,
                rotation: {
                   rotationHz: 0.0 
                }
            });
        };

        return this;
    };

    /**
     * 
     * @param {Message} msg 
     * @returns 
     */

    async setNowplayingMessage(msg) {
        if(this.message) await this.message.delete().catch(() => {});
        return this.message = msg;
    };

    /**
     * 
     * @returns {void}
     * Clears all the filters
     */

    clearFilters() {
        this.clearEQ();
        this.speedAmount = 1;
        this.pitchAmount = 1;
        this.rateAmount = 1;
        this.bassboostLevel = "";
        if(this.nightcore) this.nightcore = false;
        if(this.vaporwave) this.vaporwave = false;
        if(this.pop) this.pop = false;
        if(this._8d) this._8d = false;
        if(this.filters) this.filters = false;
        if(this.bass) this.bass = false;
        if(this.party) this.party = false;
        if(this.radio) this.radio = false;
        if(this.soft) this.soft = false;
        if(this.electrocic) this.electrocic = false;
        if(this.rock) this.rock = false;
        if(this.earrape) this.earrape = false;

        this.node.send({
            op: "filters",
            guildId: this.guild
        });

        return this;
    };
});

class botPlayerManager extends Manager {

    /**
     * 
     * @param {Client} client 
     */

    constructor(client) {
        super({
            nodes: nodes,
            plugins: plugins,
            autoPlay: true,
            send: (id, payload) => this._sendPayload(id, payload)
        });

        this.client = client;
        this._loadEvents();
    }

    /**
     * 
     * @param {String} id 
     * @param {import("erela.js").Payload} payload 
     * @private
     * @returns {void}
     */

     _sendPayload(id, payload) {
        const guild = this.client.guilds.cache.get(id);
        if(guild) return guild.shard.send(payload);
    };

    /**
     * @private
     */

    _loadEvents() {
        const eventFiles = readdirSync(join(__dirname, "..", "events", "player")).filter((files) => files.endsWith(".js"));

        for (const file of eventFiles) {
            const event = require(`../events/player/${file}`);

            this.on(event.name, (...paras) => event.execute(this.client, ...paras));
            console.log(`Lavalink Event Loaded: ${event.name}`);
        };
    };
};

module.exports = botPlayerManager;