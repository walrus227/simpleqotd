const fs = require('fs');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { EmbedBuilder } = require('@discordjs/builders')
const { CronJob } = require('cron');
const { token, guildId, channelId } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

commandFiles.forEach(file => {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
});

client.once('ready', async () => {
    console.log(`we ready bois\nOnline as ${client.user.tag}`);

    async function post() {
        if (!fs.existsSync('./questions.json')) return;
        const questions = JSON.parse(fs.readFileSync('./questions.json'));
        const question = questions[Math.floor(Math.random()*questions.length)];
        const user = await client.users.fetch(question.user.id);
        const server = await client.guilds.fetch(guildId);
        const channel = await server.channels.fetch(channelId);

        const embed = new EmbedBuilder({
            title: 'QOTD',
            author: {
                name: user.username,
                icon_url: user.avatarURL()
            },
            description: question.question
        });
        channel.send({ embeds: [embed] });

        questions = questions.filter(e => e.id !== question.id);
        fs.writeFileSync('./questions.json', JSON.stringify(questions));
    }
    
    new CronJob('0 8 * * *', post).start();

    if (process.env.FORCEREMIND == 'true') {
		await new Promise(resolve => setTimeout(resolve, 5000));
		post();
	}
});

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        let questions = JSON.parse(fs.readFileSync('./questions.json')).qotd;
        questions = questions.filter(e => e.id != interaction.customId);
        fs.writeFileSync('./questions.json', JSON.stringify({"qotd": questions}));
        interaction.update({ content: 'Question removed.', components: [] });
    }

    if (interaction.isCommand()) {
		const command = client.commands.get(interaction.commandName);

		if (!command) return;

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.login(token)