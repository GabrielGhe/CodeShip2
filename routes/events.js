var InstanceModel = require('../model/instanceModel');
var ColorMaker = require('../utils/colorMaker');

/**
 * Setting up the bayeux events
 */
exports.setup = function(bay){
	var bayeux = bay;


	/**
	 * The subscribe event
	 * Happens when a new user subscribes to a channel
	 */
	bayeux.on('subscribe', function(clientId, channel) {
		console.log('[  SUBSCRIBE] ' + clientId + ' -> ' + channel);
		//save in mongo and send new message that new user has subscribed
		InstanceModel.saveSingleUser(clientId, channel);
		var obj = {
			type: "subscribe",
			color: ColorMaker.makeRGB(clientId)
		};
		bayeux.getClient().publish(channel, JSON.stringify(obj), function(err){
			console.log( "Error ",err );
		});
	});

	/**
	 * The unsubsribe event
	 * Happens when a user unsubsribes, closes tab or loses connection
	 */
	bayeux.on('unsubscribe', function(clientId, channel) {
		console.log('[UNSUBSCRIBE] ' + clientId + ' -> ' + channel);
		//delete from mongo and send new message that user has unsubscribed
		InstanceModel.removeSingleUser(clientId, channel, function(){
			
			var obj = {
				type: "unsubscribe",
				color: ColorMaker.makeRGB(clientId)
			};

			bayeux.getClient().publish(channel, JSON.stringify(obj), function(err){
				console.log( "Error ",err );
			});
		});
	});

	/**
	 * The disconnect event
	 * Happens right after the subsribe event
	 */
	bayeux.on('disconnect', function(clientId) {
		console.log('[ DISCONNECT] ' + clientId);
	});
};

//SETUP FAYE EXTENSION
//http://faye.jcoglan.com/node/extensions.html