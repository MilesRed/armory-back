"use strict";

// TODO: Figure out best way for error handling.

var restify = require("restify"),
	restifyOAuth2 = require("restify-oauth2"),
	GottaValidate = require('gotta-validate'),
	axios = require('axios'),
	UsersController = require('./controllers/user'),
	CheckController = require('./controllers/check'),
	Gw2TokenController = require('./controllers/gw2-token'),
	CharacterController = require('./controllers/character'),
	AuthController = require('./controllers/auth'),
	Gw2Api = require('./services/gw2-api');	

function Server(models, config) {
	GottaValidate.addDefaultRules();
	GottaValidate
		.addRule({
			name: 'valid-gw2-token',
			func: require('./rules/valid-gw2-token'),
			dependencies: {
				axios: axios,
				models: models
			}
		}).addRule({
			name: 'unique-email',
			func: require('./rules/unique-email'),
			dependencies: {
				models: models
			}
		});

	var gw2Api = Gw2Api(axios, config);

	var users = new UsersController(models, GottaValidate, gw2Api);
	var gw2Tokens = new Gw2TokenController(models, GottaValidate, gw2Api);
	var characters = new CharacterController(models, gw2Api);
	var checks = new CheckController(GottaValidate);
	var auths = AuthController(models);

	var server = restify.createServer({
	    name: "api.armory.net.au",
	    version: config.version
	});

	server.use(restify.authorizationParser());
	server.use(restify.bodyParser());

	restifyOAuth2.ropc(server, {
		tokenEndpoint: '/token', 
	  hooks: AuthController(models, config),
	  tokenExpirationTime: 60
	});

	require('./resources')(server);

	return server;
}

module.exports = Server;