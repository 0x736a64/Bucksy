const config = require("../config.json");
const { MessageEmbed } = require("discord.js");
const MongoClient = require("mongodb").MongoClient;

const createDatabase = function() {
    let mongoURL = config.mongoDBURL + config.mongoDBName;

    MongoClient.connect(mongoURL, (err, db) => {
        if (err) throw err;
        console.info("Database created!");
        db.close();
    });
};

const createUsersCollection = function() {
    MongoClient.connect(config.mongoDBURL, (err, db) => {
        if (err) throw err;

        let dbo = db.db(config.mongoDBName);

        if (dbo.collection('shinies').find()) return;

        dbo.createCollection("users", (err, res) => {
            if (err) throw err;
            console.info("User Collection created!");
            db.close();
        });
    });
};

const createShiniesCollection = function() {
    try {
        MongoClient.connect(config.mongoDBURL, (err, db) => {
            if (err) throw err;

            let dbo = db.db(config.mongoDBName);

            if (dbo.collection('shinies').find()) return;

            dbo.createCollection("shinies", (err, res) => {
                if (err) throw err;
                console.info("Shiny Collection created!");
            });
        });
    } catch (err) {
        console.error(err);
    }
};

const addUser = function(msg, args) {
    MongoClient.connect(config.mongoDBURL, (err, db) => {
        if (err) throw err;
        let dbo = db.db(config.mongoDBName);
        let obj = { "id": msg.member.id, "points": config.startingPoints };
        let exists = false;

        dbo.collection("users").findOne({ "id": msg.member.id }, function(err, result) {
            if (err) throw err;
            if (result) {
                let existMsg = new MessageEmbed()
                    .setColor(0x660000)
                    .setTitle(`${msg.member.user.tag}, you already registered. Try checking your !balance.`);
                msg.channel.send(existMsg);
                db.close();
                exists = true;
            } else {
                dbo.collection("users").insertOne(obj, (err, res) => {
                    if (err) throw err;
                    let dbMsg = new MessageEmbed()
                        .setColor(0x007700)
                        .setTitle(`${msg.member.user.tag} Welcome to the game registry!`);

                    msg.channel.send(dbMsg);
                    db.close();
                });
            }
        });
    });
};

const addShiny = function(msg, args) {
    if (msg.channel.id === config.channels.ai && msg.member.roles.cache.some(r => config.modRoles.includes(r.name))) {
        MongoClient.connect(config.mongoDBURL, (err, db) => {
            if (err) throw err;
            let dbo = db.db(config.mongoDBName);
            let pokemon = args[0].toLowerCase();
            let obj = { "title": pokemon };
            let exists = false;

            dbo.collection("shinies").findOne({ "title": pokemon }, function(err, result) {
                if (err) throw err;
                if (result) {
                    let existMsg = new MessageEmbed()
                        .setColor(0x660000)
                        .setTitle(`${pokemon}, is already registered.`);
                    msg.channel.send(existMsg);
                    db.close();
                    exists = true;
                } else {
                    dbo.collection("shinies").insertOne(obj, (err, res) => {
                        if (err) throw err;
                        let dbMsg = new MessageEmbed()
                            .setColor(0x007700)
                            .setTitle(`${pokemon} is now registered to the shiny list!`);

                        msg.channel.send(dbMsg);
                        db.close();
                    });
                }
            });
        });
    }
};

const removeShiny = function(msg, args) {
    if (msg.channel.id === config.channels.ai && msg.member.roles.cache.some(r => config.modRoles.includes(r.name))) {
        MongoClient.connect(config.mongoDBURL, (err, db) => {
            if (err) throw err;
            let dbo = db.db(config.mongoDBName);
            let pokemon = args[0].toLowerCase();
            let obj = { "title": pokemon };
            let exists = false;

            dbo.collection("shinies").findOne({ "title": pokemon }, function(err, result) {
                if (err) throw err;
                if (result) {
                    dbo.collection("shinies").deleteOne(obj, (err, res) => {
                        if (err) throw err;
                        let dbMsg = new MessageEmbed()
                            .setColor(0x007700)
                            .setTitle(`${pokemon} is now removed from the shiny list!`);

                        msg.channel.send(dbMsg);
                        db.close();
                    });
                } else {
                    let notExistMsg = new MessageEmbed()
                        .setColor(0x660000)
                        .setTitle(`${pokemon}, is not registered in the shiny list.`);
                    msg.channel.send(notExistMsg);
                    db.close();
                    exists = true;
                }
            });
        });
    }
};

const updateBalance = function(msg, uid, score) {
    MongoClient.connect(config.mongoDBURL, (err, db) => {
        if (err) throw err;
        let dbo = db.db(config.mongoDBName);
        let query = { "id": uid };
        var updatePoints = { $inc: { points: score } };

        dbo.collection("users").findOne({ "id": uid }, function(err, result) {
            if (err) throw err;

            if (result) {
                dbo.collection("users").updateOne(query, updatePoints, function(err, res) {
                    if (err) throw err;
                    db.close();
                });
            } else {
                let dbMsg = new MessageEmbed()
                    .setColor(0x770000)
                    .setTitle(`${msg.member.user.tag} You need to register to the points registry first. Please type "!register"`);

                msg.channel.send(dbMsg);
            }
        });
    });
};

const getBalance = function(msg, args) {
    MongoClient.connect(config.mongoDBURL, (err, db) => {
        if (err) throw err;
        let dbo = db.db(config.mongoDBName);
        dbo.collection("users").findOne({ "id": msg.member.id }, function(err, result) {
            if (err) throw err;

            if (result) {
                let balMsg = new MessageEmbed()
                    .setColor(0x007700)
                    .setTitle(`${msg.member.user.tag} You currently have ${result.points} ${config.emojies.pokecoin}`);
                msg.channel.send(balMsg);
            } else {
                let regMsg = new MessageEmbed()
                    .setColor(0x007700)
                    .setTitle(`${msg.member.user.tag} You need to register to the points registry first. Please type "!register"`);

                msg.channel.send(regMsg);
            }

            db.close();
        });
    });
};

const shinyExists = async function(pokemon) {
    const db = await MongoClient.connect(config.mongoDBURL);
    const dbo = db.db(config.mongoDBName);
    const result = await dbo.collection("shinies").findOne({ "title": pokemon });

    return (result);
};

module.exports = {
    createDatabase,
    createUsersCollection,
    createShiniesCollection,
    addShiny,
    addUser,
    removeShiny,
    getBalance,
    updateBalance,
    shinyExists
};