const { MessageEmbed } = require("discord.js");
const Client = require("../../../index");

module.exports = {
  name: "badge",
  description: "To show badges",
  cooldown: 0,
  dev: false,
  usage: "",
  aliases: ["profile"],
  category: "Misc",
  examples: ["badge"],
  sub_commands: [],
  args: false,
  player: { active: false, voice: false, dj: false, djPerm: null },
  permissions: {
    client: [],
    author: []
  },

  /**
   *
   * @param {Client} client
   * @param {Message} message
   * @param {Any[]} args
   * @param {String} prefix
   * @param {String} color
   */

  execute: async (client, message, args, prefix, color) => {
    
    const user = message.mentions.users.first() || client.users.cache.get(args[0]) || message.author;
    if (user.bot) {
      return message.channel.send({
        embeds: [
          new MessageEmbed()
          .setColor(color)
          .setDescription(`The user must not be a bot.`),
        ],
      });
    }
    
    try {
      
      let badges = "";

      const guild = await client.guilds.fetch("960418179094577153"); 
      const mileva = await guild.members.fetch(user.id)
    
      
      const owner = mileva.roles.cache.has("960418220978864138");
      if(owner === true) badges = badges+`\n<:owner:972056124243189830> Owner`;

      const staff = mileva.roles.cache.has("961893009295814685");
      if(staff === true) badges = badges + `\n<:staff:972056124264157195> Staff`;
      
      
      const embed = new MessageEmbed()
      .setAuthor({
      name: `Profile For ${user.username}#${user.discriminator}`
      })
      .setThumbnail(user.displayAvatarURL({dynamic: true}))
      .setColor(color)
      .addFields({
        name: `**Achievements**`,
        value: `${badges ? badges : `No Badge Available`}`
        })
      .setTimestamp();
      message.channel.send({embeds: [embed]});
    }
    catch {
      const emb = new MessageEmbed()
      .setAuthor({name: `Profile of ${user.username}#${user.discriminator}`})
      .setThumbnail(user.displayAvatarURL({dynamic: true}))
      .setColor(color)
      .addFields({
        name: `**Achievements**`,
        value: `You don't have any badge, To get badge join my Support Server`})
      .setTimestamp();
      message.channel.send({embeds: [emb]});
    }
  },
};
