//CLIENT
const { WebhookClient } = require("discord.js");
const botClient = require("./src/structures/client");
const client = new botClient();
module.exports = client;

//PLAYER
client._loadPlayer();

//SLASH COMMANDS
client._loadSlashCommands();

//MESSAGE COMMANDS
client._loadCommands();

//EVENTS
client._loadEvents();

//CONNECT
client.connect();

//ERROR HANDLER
let channel = new WebhookClient({ url: client.config.hooks.errors.url });
let color = "RED";

process.on("unhandledRejection", async (reason, promise) => {
    console.error(reason, promise);
    
    if(channel) await channel.send({ embeds: [client.embed().setColor(color).setDescription(`\`\`\`js\n${reason}\n\n${promise}\n\`\`\``).setTitle("Unhandled Rejection").setTimestamp()] }).catch(() => {});
});

process.on("rejectionHandled", async (promise) => {
    console.error(promise);

    if(channel) await channel.send({ embeds: [client.embed().setTitle("Rejection Handled").setColor(color).setDescription(`\`\`\`js\n${promise}\n\`\`\``)] }).catch(() => {});
});

process.on("uncaughtException", async (error, origin) => {
    console.error(error.stack ? error.stack : error, origin);

    if(channel) await channel.send({ embeds: [client.embed().setTitle("Uncaught Exception").setColor(color).setDescription(`\`\`\`js\n${error.stack ? error.stack : error}\n\n${origin}\n\`\`\``)] }).catch(() => {});
});

process.on("multipleResolves", async (type, promise) => {
    console.error(type, promise);

    if(channel) await channel.send({ embeds: [client.embed().setColor(color).setTitle("Multiple Resolves").setDescription(`\`\`\`js\n${type}\n\n${promise}\n\`\`\``)] })
});

process.on("uncaughtExceptionMonitor", async (error, origin) => {
    console.error(error.stack ? error.stack : error, origin);

    if(channel) await channel.send({ embeds: [client.embed().setTitle("Uncaught Exception Monitor").setColor(color).setDescription(`\`\`\`js\n${error.stack ? error.stack : error}\n\n${origin}\n\`\`\``)] }).catch(() => {});
});

process.on("warning", async (warning) => {
    console.error(warning);

    if(channel) await channel.send({ embeds: [client.embed().setTitle("Warning").setColor(color).setDescription(`\`\`\`js\n${warning.stack ? warning.stack : warning}\n\`\`\``)] }).catch(() => {});
});

process.on("exit", (code) => {
    console.log(`Process Exited`, `Code: ${code}`);
});
